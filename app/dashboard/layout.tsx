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
      ? "bg-purple-100 text-purple-800 border-purple-200"
      : user.role === "FOREMAN"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-blue-100 text-blue-800 border-blue-200";

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
    <div className="flex min-h-screen bg-slate-50 text-slate-900 pb-16 md:pb-0">
      {/* Sidebar Lateral para Desktop */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-slate-900">
              Medido
            </span>
            <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
              PRO
            </span>
          </Link>
        </div>

        <div className="border-b border-slate-100 p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Empresa
          </div>
          <div className="mt-0.5 truncate text-sm font-bold text-slate-800">
            {user.company.name}
          </div>
          {user.company.nif && (
            <div className="text-[11px] text-slate-500">
              NIF: {user.company.nif}
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-4 p-4 text-xs font-medium text-slate-600">
          {sidebarGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <div className="pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-slate-500" />
                      <span>{item.name}</span>
                    </div>
                    {item.alertCounts ? (
                      (item.alertCounts.critical > 0 || item.alertCounts.warning > 0) && (
                        <span
                          className="inline-flex items-center gap-1.5"
                          aria-label={texts.dashboard.navigation.alertCounts(
                            item.alertCounts.critical,
                            item.alertCounts.warning
                          )}
                        >
                          {item.alertCounts.critical > 0 && (
                            <span className="rounded-full bg-red-700 px-2 py-0.5 text-[10px] font-bold text-white">
                              {texts.dashboard.navigation.criticalAlerts(item.alertCounts.critical)}
                            </span>
                          )}
                          {item.alertCounts.warning > 0 && (
                            <span className="rounded-full bg-amber-700 px-2 py-0.5 text-[10px] font-bold text-white">
                              {texts.dashboard.navigation.warningAlerts(item.alertCounts.warning)}
                            </span>
                          )}
                        </span>
                      )
                    ) : item.badgeCount !== undefined && item.badgeCount > 0 ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
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

        <div className="border-t border-slate-200 p-4">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-left"
            >
              Terminar Sessão
            </button>
          </form>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Barra Superior */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900">
              {user.name}
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${roleBadgeColor}`}
            >
              {roleLabel}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-500">
              {user.company.name}
            </span>
            {/* Botão de Terminar Sessão Mobile */}
            <form action={logoutAction} className="md:hidden">
              <button
                type="submit"
                className="rounded-sm border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600"
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        {/* Ecrã Específico */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>

      {/* Barra de Navegação Inferior Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white px-2 md:hidden shadow-lg">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          if (item.mobileHighlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center rounded-md text-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-white shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[9px] font-bold mt-0.5 text-amber-700">
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center rounded-md text-slate-700 hover:text-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
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
