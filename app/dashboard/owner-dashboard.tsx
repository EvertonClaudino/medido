import { Suspense } from "react";
import { ProjectStatus, Role, TaskStatus, VisitStatus, WorkLogStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyAlertsData } from "@/lib/alert-data";
import { getDashboardNotifications } from "@/lib/dashboard-notifications";
import {
  getAdjacentMonthKey,
  getLisbonDateKey,
  getLisbonMonthKey,
  getLisbonStartOfDay,
  getMonthCalendarDays,
} from "@/lib/dashboard-utils";
import { calculateProjectProgress } from "@/lib/project-utils";

import { OwnerHeroBanner } from "@/components/dashboard/owner-hero-banner";
import { OwnerKpiRow } from "@/components/dashboard/owner-kpi-row";
import { BudgetOverviewChart } from "@/components/dashboard/budget-overview-chart";
import { TimelineProgressChart } from "@/components/dashboard/timeline-progress-chart";
import { SitePerformanceList } from "@/components/dashboard/site-performance-list";
import { QuickLinksBar } from "@/components/dashboard/quick-links-bar";
import {
  OperationalGrid,
  type ProjectUpdateItem,
  type CriticalAlertItem,
  type UpcomingDeadlineItem,
} from "@/components/dashboard/operational-grid";
import {
  OwnerSidebarColumn,
  type SidebarTaskItem,
  type SidebarNotificationItem,
  type SidebarCalendarCell,
  type SidebarAgendaVisit,
} from "@/components/dashboard/owner-sidebar-column";

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="A carregar painel executivo...">
      <div className="h-44 w-full rounded-2xl bg-slate-200/80" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-200/80" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_21rem]">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-64 rounded-xl bg-slate-200/80" />
            <div className="h-64 rounded-xl bg-slate-200/80" />
            <div className="h-64 rounded-xl bg-slate-200/80" />
          </div>
          <div className="h-20 rounded-xl bg-slate-200/80" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-56 rounded-xl bg-slate-200/80" />
            <div className="h-56 rounded-xl bg-slate-200/80" />
            <div className="h-56 rounded-xl bg-slate-200/80" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-64 rounded-xl bg-slate-200/80" />
          <div className="h-52 rounded-xl bg-slate-200/80" />
          <div className="h-52 rounded-xl bg-slate-200/80" />
        </div>
      </div>
    </div>
  );
}

export default async function OwnerDashboard({
  monthKey = getLisbonMonthKey(),
  selectedDateKey,
}: {
  monthKey?: string;
  selectedDateKey?: string;
}) {
  const user = await requireRole([Role.OWNER]);
  const companyId = user.companyId;
  const now = new Date();
  const startOfToday = getLisbonStartOfDay(now);
  const todayKey = getLisbonDateKey(now);
  const currentMonthKey = todayKey.slice(0, 7);

  // workDate e endDate são datas civis guardadas a 00:00 UTC
  const todayCivilDate = new Date(`${todayKey}T00:00:00.000Z`);
  const todayWeekdayOffset = (todayCivilDate.getUTCDay() + 6) % 7;
  const weekStartCivilDate = new Date(todayCivilDate.getTime() - todayWeekdayOffset * 86_400_000);
  const startOfCurrentMonth = getLisbonStartOfDay(new Date(`${currentMonthKey}-01T12:00:00.000Z`));

  // Diferença em dias civis de Lisboa (negativo = já passou)
  const getCivilDaysUntil = (date: Date) =>
    Math.round(
      (new Date(`${getLisbonDateKey(date)}T00:00:00.000Z`).getTime() - todayCivilDate.getTime()) / 86_400_000
    );

  const nextMonthKey = getAdjacentMonthKey(monthKey, 1);
  const calendarCivilStart = new Date(`${monthKey}-01T00:00:00.000Z`);
  const calendarCivilEnd = new Date(`${nextMonthKey}-01T00:00:00.000Z`);
  const calendarStart = getLisbonStartOfDay(new Date(`${monthKey}-01T12:00:00.000Z`));
  const calendarEnd = getLisbonStartOfDay(new Date(`${nextMonthKey}-01T12:00:00.000Z`));

  // Consultas agregadas e eficientes em paralelo
  const [
    activeProjectsCount,
    completedProjectsCount,
    overdueProjectsCount,
    ongoingActivitiesCount,
    pendingWorkLogsCount,
    totalWorkersCount,
    projectsWithBudget,
    recentWorkLogs,
    alertsData,
    upcomingTasks,
    rawNotifications,
    activeBudgetAggregate,
    projectsCreatedThisMonth,
    workLogsThisWeek,
    workersWithLogToday,
    calendarTasks,
    calendarProjectDeadlines,
    calendarVisits,
  ] = await Promise.all([
    // 1. Obras Ativas
    prisma.project.count({
      where: { companyId, status: ProjectStatus.ACTIVE },
    }),
    // 2. Obras Concluídas
    prisma.project.count({
      where: { companyId, status: ProjectStatus.COMPLETED },
    }),
    // 3. Obras em Atraso (ativas cujo prazo já passou)
    prisma.project.count({
      where: {
        companyId,
        status: ProjectStatus.ACTIVE,
        endDate: { lt: startOfToday },
      },
    }),
    // 4. Apontamentos/Trabalhos Totais
    prisma.workLog.count({
      where: { companyId },
    }),
    // 5. Aprovações Pendentes
    prisma.workLog.count({
      where: { companyId, status: WorkLogStatus.PENDING },
    }),
    // 6. Colaboradores Ativos
    prisma.user.count({
      where: { companyId, role: Role.WORKER, status: "ACTIVE" },
    }),
    // 7. Obras para cálculo de Orçamento e Desempenho
    prisma.project.findMany({
      where: { companyId, status: ProjectStatus.ACTIVE },
      select: {
        id: true,
        name: true,
        address: true,
        status: true,
        tasks: {
          where: { status: { not: TaskStatus.CANCELLED } },
          select: { status: true },
        },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    // 8. Últimos Registos de Trabalho
    prisma.workLog.findMany({
      where: { companyId },
      take: 5,
      orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        workDate: true,
        hours: true,
        description: true,
        status: true,
        author: { select: { name: true } },
        project: { select: { name: true } },
      },
    }),
    // 9. Alertas da Empresa
    getCompanyAlertsData(companyId),
    // 10. Próximas Tarefas e Prazos
    prisma.task.findMany({
      where: { companyId, status: TaskStatus.PENDING },
      take: 6,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        project: { select: { name: true } },
        assignedTo: { select: { name: true } },
      },
    }),
    // 11. Notificações Recentes
    getDashboardNotifications(companyId, { limit: 5 }),
    // 12. Orçamento total das obras ativas
    prisma.project.aggregate({
      where: { companyId, status: ProjectStatus.ACTIVE },
      _sum: { budget: true },
    }),
    // 13. Obras criadas no mês corrente
    prisma.project.count({
      where: { companyId, createdAt: { gte: startOfCurrentMonth } },
    }),
    // 14. Apontamentos da semana corrente (segunda a domingo)
    prisma.workLog.count({
      where: { companyId, workDate: { gte: weekStartCivilDate } },
    }),
    // 15. Funcionários ativos com registo hoje
    prisma.workLog.findMany({
      where: {
        companyId,
        workDate: todayCivilDate,
        author: { role: Role.WORKER, status: "ACTIVE" },
      },
      distinct: ["authorId"],
      select: { authorId: true },
    }),
    // 16. Tarefas pendentes com prazo no mês do calendário
    prisma.task.findMany({
      where: {
        companyId,
        status: TaskStatus.PENDING,
        dueDate: { gte: calendarStart, lt: calendarEnd },
      },
      select: { dueDate: true },
    }),
    // 17. Obras ativas com data de conclusão no mês do calendário
    prisma.project.findMany({
      where: {
        companyId,
        status: ProjectStatus.ACTIVE,
        endDate: { gte: calendarCivilStart, lt: calendarCivilEnd },
      },
      select: { endDate: true },
    }),
    // 18. Visitas agendadas no mês do calendário
    prisma.visitRequest.findMany({
      where: {
        companyId,
        status: VisitStatus.SCHEDULED,
        scheduledAt: { gte: calendarStart, lt: calendarEnd },
      },
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        scheduledAt: true,
        requestedAddress: true,
        client: { select: { id: true, name: true } },
        assignedTo: { select: { name: true } },
      },
    }),
  ]);

  // Só o orçamento total existe na BD; executado, comprometido e saldo
  // ficam indisponíveis até haver registo de custos.
  const totalBudget = activeBudgetAggregate._sum.budget?.toNumber() ?? 0;

  const sitePerformance = projectsWithBudget.map((p) => {
    const completedTasks = p.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    return {
      id: p.id,
      name: p.name,
      address: p.address,
      progressPercent: calculateProjectProgress(p.tasks.length, completedTasks, p.status),
    };
  });

  const calendarDays = getMonthCalendarDays(monthKey, todayKey);
  const taskDateKeys = new Set(
    calendarTasks.flatMap((t) => (t.dueDate ? [getLisbonDateKey(t.dueDate)] : []))
  );
  const deadlineDateKeys = new Set(
    calendarProjectDeadlines.flatMap((p) => (p.endDate ? [p.endDate.toISOString().slice(0, 10)] : []))
  );
  const visitDateKeys = new Set(
    calendarVisits.flatMap((v) => (v.scheduledAt ? [getLisbonDateKey(v.scheduledAt)] : []))
  );
  const calendarCells: SidebarCalendarCell[] = calendarDays.map((day) => ({
    ...day,
    hasTask: taskDateKeys.has(day.dateKey),
    hasDeadline: deadlineDateKeys.has(day.dateKey),
    hasVisit: visitDateKeys.has(day.dateKey),
  }));

  // Agenda do dia selecionado (por defeito, hoje se estiver no mês apresentado)
  const agendaDateKey = selectedDateKey ?? (todayKey.startsWith(monthKey) ? todayKey : undefined);
  const agendaTimeFormatter = new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
  });
  const agendaVisits: SidebarAgendaVisit[] = agendaDateKey
    ? calendarVisits
        .filter((v) => v.scheduledAt && getLisbonDateKey(v.scheduledAt) === agendaDateKey)
        .map((v) => ({
          id: v.id,
          time: agendaTimeFormatter.format(v.scheduledAt!),
          clientId: v.client.id,
          clientName: v.client.name,
          address: v.requestedAddress,
          assigneeName: v.assignedTo?.name ?? null,
        }))
    : [];
  const agendaLabel = agendaDateKey
    ? new Intl.DateTimeFormat("pt-PT", { timeZone: "Europe/Lisbon", weekday: "long", day: "numeric", month: "long" })
        .format(new Date(`${agendaDateKey}T12:00:00.000Z`))
        .replace(/^\w/, (c) => c.toUpperCase())
    : null;

  // Mapeamento de Atualizações Recentes (Recent Project Updates)
  const recentUpdates: ProjectUpdateItem[] = recentWorkLogs.map((log) => {
    const formattedDate = new Intl.DateTimeFormat("pt-PT", {
      timeZone: "Europe/Lisbon",
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    }).format(log.workDate);

    return {
      id: log.id,
      projectName: log.project.name,
      description: log.description || `Registo de ${log.hours ? `${Number(log.hours)}h` : "trabalhos"}`,
      authorName: log.author.name,
      timeAgo: formattedDate,
      statusType: log.status === WorkLogStatus.VALIDATED ? "success" : log.status === WorkLogStatus.PENDING ? "warning" : "info",
    };
  });

  // Mapeamento de Alertas Críticos (Critical Issue Alerts)
  const criticalAlerts: CriticalAlertItem[] = alertsData.alerts.slice(0, 4).map((alert) => ({
    id: alert.id,
    title: alert.title,
    projectName: alert.project?.name,
    severity: alert.severity === "CRITICAL" ? "high" : "medium",
    dateFormatted: new Intl.DateTimeFormat("pt-PT", { timeZone: "Europe/Lisbon", dateStyle: "short" }).format(alert.date),
  }));

  // Mapeamento de Próximos Prazos (Upcoming Deadlines)
  const upcomingDeadlines: UpcomingDeadlineItem[] = upcomingTasks
    .filter((t) => t.dueDate !== null)
    .map((task) => {
      const due = new Date(task.dueDate!);
      const daysLeft = getCivilDaysUntil(due);

      return {
        id: task.id,
        title: task.title,
        projectName: task.project?.name || "Geral / Obra",
        dueDateFormatted: new Intl.DateTimeFormat("pt-PT", {
          timeZone: "Europe/Lisbon",
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(due),
        daysLeft,
      };
    });

  // Mapeamento de Tarefas para a Sidebar
  // Prioridade derivada do prazo: atrasada ou até amanhã = Alta; até 7 dias = Média
  const sidebarTasks: SidebarTaskItem[] = upcomingTasks.slice(0, 4).map((task) => {
    const daysLeft = task.dueDate ? getCivilDaysUntil(task.dueDate) : null;
    return {
      id: task.id,
      title: task.title,
      projectName: task.project?.name,
      priority: daysLeft === null ? "low" : daysLeft <= 1 ? "high" : daysLeft <= 7 ? "medium" : "low",
      completed: task.status === TaskStatus.COMPLETED,
    };
  });

  // Mapeamento de Notificações para a Sidebar
  const sidebarNotifications: SidebarNotificationItem[] = rawNotifications.slice(0, 4).map((n) => {
    const timeFormatted = new Intl.DateTimeFormat("pt-PT", {
      timeZone: "Europe/Lisbon",
      hour: "2-digit",
      minute: "2-digit",
    }).format(n.occurredAt);

    return {
      id: n.id,
      title: n.title,
      timeAgo: timeFormatted,
      type: n.type === "workLog" ? "success" : n.type === "budget" ? "info" : "warning",
    };
  });

  const monthLabel = monthKey
    ? new Intl.DateTimeFormat("pt-PT", {
        timeZone: "Europe/Lisbon",
        month: "long",
        year: "numeric",
      })
        .format(new Date(`${monthKey}-01T12:00:00Z`))
        .replace(/^\w/, (c) => c.toUpperCase())
    : new Intl.DateTimeFormat("pt-PT", {
        timeZone: "Europe/Lisbon",
        month: "long",
        year: "numeric",
      })
        .format(now)
        .replace(/^\w/, (c) => c.toUpperCase());

  // Assiduidade: funcionários ativos com registo de trabalho hoje
  const workersPresentToday = workersWithLogToday.length;
  const laborAttendanceRate =
    totalWorkersCount > 0 ? Math.round((workersPresentToday / totalWorkersCount) * 100) : null;

  return (
    <Suspense fallback={<DashboardLoadingSkeleton />}>
      <div className="space-y-5 lg:space-y-6">
        {/* 1. Banner de Boas-Vindas Operacional com Cards de Saldo Livre e Orçamento Total */}
        <OwnerHeroBanner userName={user.name} totalBudget={totalBudget} balanceBudget={null} />

        {/* 2. Grelha de 6 Cartões KPI Compactos Multi-Cor */}
        <OwnerKpiRow
          activeProjects={activeProjectsCount}
          completedProjects={completedProjectsCount}
          delayedProjects={overdueProjectsCount}
          ongoingActivities={ongoingActivitiesCount}
          pendingApprovals={pendingWorkLogsCount}
          projectsCreatedThisMonth={projectsCreatedThisMonth}
          workLogsThisWeek={workLogsThisWeek}
          laborAttendanceRate={laborAttendanceRate}
          workersPresentToday={workersPresentToday}
          totalWorkers={totalWorkersCount}
        />

        {/* 3. Estrutura Principal: Canvas 2/3 à Esquerda + Coluna 1/3 à Direita */}
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_21rem] lg:gap-6">
          {/* Coluna Principal da Esquerda */}
          <div className="space-y-5 lg:space-y-6 min-w-0">
            {/* Linha Central: Execução Orçamental + Cronograma + Desempenho por Obra */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <BudgetOverviewChart
                totalBudget={totalBudget}
                utilizedBudget={null}
                committedBudget={null}
                balanceBudget={null}
              />
              <TimelineProgressChart currentMonthKey={currentMonthKey} />
              <SitePerformanceList projects={sitePerformance} />
            </div>

            {/* Barra de Acessos Rápidos (Quick Links) */}
            <QuickLinksBar />

            {/* Linha Inferior: Atualizações de Obra + Alertas Críticos + Próximos Prazos */}
            <OperationalGrid
              recentUpdates={recentUpdates}
              criticalAlerts={criticalAlerts}
              upcomingDeadlines={upcomingDeadlines}
            />
          </div>

          {/* Coluna da Direita: Calendário + As Minhas Tarefas + Notificações */}
          <div className="w-full min-w-0">
            <OwnerSidebarColumn
              tasks={sidebarTasks}
              notifications={sidebarNotifications}
              monthLabel={monthLabel}
              monthKey={monthKey}
              selectedDate={selectedDateKey}
              calendarCells={calendarCells}
              agendaLabel={agendaLabel}
              agendaVisits={agendaVisits}
            />
          </div>
        </div>
      </div>
    </Suspense>
  );
}
