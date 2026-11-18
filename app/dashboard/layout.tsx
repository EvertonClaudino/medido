import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/app/(auth)/actions";
import Link from "next/link";
import {
  getSidebarNavigation,
  getMobileNavigation,
} from "@/lib/navigation";
import { getCompanyAlertsData } from "@/lib/alert-data";
import { getAlertSeverityCounts } from "@/lib/alerts";
import { texts } from "@/lib/texts";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser({ allowMustChangePassword: true });

  // Contadores específicos por perfil
  let foremanPendingCount = 0;
  let workerRejectedCount = 0;
  let criticalAlertsCount = 0;
  let warningAlertsCount = 0;

  if (user.role === "OWNER" && !user.mustChangePassword) {
    const { alerts } = await getCompanyAlertsData(user.companyId);
    const counts = getAlertSeverityCounts(alerts);
    criticalAlertsCount = counts.CRITICAL;
    warningAlertsCount = counts.WARNING;
  }

  // Contador de tarefas em atraso ou a vencer hoje (fuso Europe/Lisbon)
  // Final do dia de hoje (23:59:59.999)
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let tasksOverdueOrDueTodayCount = 0;
  if (user.role === "OWNER") {
    // Para OWNER: todas as tarefas pendentes da empresa com dueDate <= hoje
    tasksOverdueOrDueTodayCount = await prisma.task.count({
      where: {
        companyId: user.companyId,
        status: "PENDING",
        dueDate: {
          not: null,
          lte: endOfToday,
        },
      },
    });
  } else {
    // Para FOREMAN e WORKER: apenas as tarefas atribuídas ao próprio utilizador com dueDate <= hoje
    tasksOverdueOrDueTodayCount = await prisma.task.count({
      where: {
        companyId: user.companyId,
        assignedToId: user.id,
        status: "PENDING",
        dueDate: {
          not: null,
          lte: endOfToday,
        },
      },
    });
  }

  if (user.role === "FOREMAN") {
    // Registos pendentes apenas das obras onde é isLead
    foremanPendingCount = await prisma.workLog.count({
      where: {
        companyId: user.companyId,
        status: "PENDING",
        authorId: { not: user.id },
        project: {
          assignments: {
            some: {
              userId: user.id,
              isLead: true,
            },
          },
        },
      },
    });
  } else if (user.role === "WORKER") {
    // Registos rejeitados do próprio funcionário
    workerRejectedCount = await prisma.workLog.count({
      where: {
        authorId: user.id,
        status: "REJECTED",
      },
    });
  }

  const roleLabel =
    user.role === "OWNER"
      ? "Dono da Empresa"
      : user.role === "FOREMAN"
      ? "Encarregado de Obra"
      : "Funcionário / Operacional";

  const roleBadgeColor =
    user.role === "OWNER"
      ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-900/60"
      : user.role === "FOREMAN"
      ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-900/60"
      : "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-900/60";

  const sidebarGroups = getSidebarNavigation(user.role, {
    foremanPendingLogsCount: foremanPendingCount,
    workerRejectedLogsCount: workerRejectedCount,
    tasksOverdueOrDueTodayCount,
    criticalAlertsCount,
    warningAlertsCount,
  });

  const mobileNavItems = getMobileNavigation(user.role, {
    foremanPendingLogsCount: foremanPendingCount,
    workerRejectedLogsCount: workerRejectedCount,
    tasksOverdueOrDueTodayCount,
    criticalAlertsCount,
    warningAlertsCount,
  });

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 lg:pb-0 transition-colors duration-200">
      {/* Sidebar Lateral para Desktop (oculto até 768x1024, visível e compacto em ecrãs >= 1024px) */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 lg:flex">
        <div className="flex h-16 items-center border-b border-slate-200 dark:border-slate-800 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Medido
            </span>
            <span className="rounded-sm bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-400">
              PRO
            </span>
          </Link>
        </div>

        <div className="border-b border-slate-100 dark:border-slate-800/80 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Empresa
          </div>
          <div className="mt-0.5 truncate text-xs font-bold text-slate-800 dark:text-slate-200" title={user.company.name}>
            {user.company.name}
          </div>
          {user.company.nif && (
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              NIF: {user.company.nif}
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-3 p-3 text-xs font-medium text-slate-600 dark:text-slate-300">
          {sidebarGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <div className="pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                {group.label}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.alertCounts ? (
                      (item.alertCounts.critical > 0 || item.alertCounts.warning > 0) && (
                        <span
                          className="inline-flex items-center gap-1 shrink-0"
                          aria-label={texts.dashboard.navigation.alertCounts(
                            item.alertCounts.critical,
                            item.alertCounts.warning
                          )}
                        >
                          {item.alertCounts.critical > 0 && (
                            <span className="rounded-full bg-red-700 px-1.5 py-0.2 text-[9px] font-bold text-white">
                              {texts.dashboard.navigation.criticalAlerts(item.alertCounts.critical)}
                            </span>
                          )}
                          {item.alertCounts.warning > 0 && (
                            <span className="rounded-full bg-amber-700 px-1.5 py-0.2 text-[9px] font-bold text-white">
                              {texts.dashboard.navigation.warningAlerts(item.alertCounts.warning)}
                            </span>
                          )}
                        </span>
                      )
                    ) : item.badgeCount !== undefined && item.badgeCount > 0 ? (
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold shrink-0 ${
                          item.badgeVariant === "danger"
                            ? "bg-red-600 text-white"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        {item.badgeCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 dark:border-slate-800 p-3">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 transition hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 text-left"
            >
              Terminar Sessão
            </button>
          </form>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Barra Superior */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {user.name}
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${roleBadgeColor}`}
            >
              {roleLabel}
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">
              {user.company.name}
            </span>
            {/* Dark Mode Toggle no Dashboard */}
            <ThemeToggle />
            {/* Botão de Terminar Sessão Mobile / Tablet (até 768x1024) */}
            <form action={logoutAction} className="lg:hidden">
              <button
                type="submit"
                className="rounded-sm border border-slate-200 dark:border-slate-800 px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        {/* Ecrã Específico com largura otimizada */}
        <main className="flex-1 p-4 sm:p-6 lg:p-6 overflow-y-auto min-w-0">{children}</main>
      </div>

      {/* Barra de Navegação Inferior Mobile e Tablet (visível até 768x1024 / < 1024px) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 lg:hidden shadow-lg transition-colors duration-200">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          if (item.mobileHighlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center rounded-md text-amber-700 dark:text-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-white shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[9px] font-bold mt-0.5 text-amber-700 dark:text-amber-400">
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center rounded-md text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
            >
              <Icon className="h-5 w-5" />
              {item.badgeCount !== undefined && item.badgeCount > 0 && (
                <span
                  className={`absolute -top-1 right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ${
                    item.badgeVariant === "danger" ? "bg-red-600" : "bg-amber-500"
                  }`}
                >
                  {item.badgeCount}
                </span>
              )}
              <span className="text-[10px] mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
