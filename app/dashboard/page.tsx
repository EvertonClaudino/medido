import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  HardHatIcon,
  ClockIcon,
  PlusCircleIcon,
} from "@/components/icons";
import OwnerDashboard from "./owner-dashboard";
import {
  getLisbonMonthKey,
  getLisbonStartOfDay,
  isDashboardDateKey,
  isDashboardMonthKey,
} from "@/lib/dashboard-utils";
import { VisitStatus } from "@prisma/client";
import { texts } from "@/lib/texts";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ mes?: string; dia?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  // 1. VISÃO DO DONO
  if (user.role === "OWNER") {
    const monthKey = isDashboardMonthKey(params?.mes)
      ? params.mes
      : getLisbonMonthKey();
    const selectedDateKey =
      isDashboardDateKey(params?.dia) && params.dia.startsWith(`${monthKey}-`)
        ? params.dia
        : undefined;

    return (
      <OwnerDashboard
        monthKey={monthKey}
        selectedDateKey={selectedDateKey}
      />
    );
  }

  // 2. VISÃO DO ENCARREGADO
  if (user.role === "FOREMAN") {
    // Buscar as obras atribuídas ao encarregado
    const [assignments, myVisits] = await Promise.all([
      prisma.projectAssignment.findMany({
        where: { userId: user.id, project: { companyId: user.companyId } },
        select: {
          project: {
            select: {
              id: true,
              name: true,
              code: true,
              address: true,
              _count: { select: { assignments: true, workLogs: { where: { status: "PENDING" } } } },
            },
          },
        },
      }),
      // Visitas agendadas atribuídas ao encarregado (a partir de hoje, Lisboa)
      prisma.visitRequest.findMany({
        where: {
          companyId: user.companyId,
          assignedToId: user.id,
          status: VisitStatus.SCHEDULED,
          scheduledAt: { gte: getLisbonStartOfDay(new Date()) },
        },
        orderBy: { scheduledAt: "asc" },
        take: 10,
        select: {
          id: true,
          scheduledAt: true,
          durationMinutes: true,
          requestedAddress: true,
          notes: true,
          client: { select: { name: true, phone: true } },
        },
      }),
    ]);

    const myProjects = assignments.map((a) => a.project);
    const pendingReviewCount = myProjects.reduce(
      (acc, p) => acc + p._count.workLogs,
      0
    );
    const visitDateFormatter = new Intl.DateTimeFormat("pt-PT", {
      timeZone: "Europe/Lisbon",
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Painel do Encarregado
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Resumo e controlo das frentes de obra sob a sua responsabilidade direta.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold uppercase">
                Obras Sob Minha Gestão
              </span>
              <HardHatIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
              {myProjects.length}
            </div>
            <Link
              href="/dashboard/as-minhas-obras"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline dark:text-amber-300"
            >
              Ver detalhe das obras →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold uppercase">
                Registos a Validar
              </span>
              <ClockIcon className="h-5 w-5 text-amber-500" />
            </div>
            <div className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
              {pendingReviewCount}
            </div>
            <Link
              href="/dashboard/validar-registos"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline dark:text-amber-300"
            >
              Validar registos da equipa →
            </Link>
          </div>
        </div>

        {/* Visitas técnicas atribuídas pelo Dono */}
        <section
          aria-labelledby="my-visits-heading"
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6"
        >
          <h2 id="my-visits-heading" className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            {texts.dashboard.visits.myVisitsTitle}
          </h2>
          {myVisits.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">{texts.dashboard.visits.myVisitsEmpty}</p>
          ) : (
            <ul className="space-y-2">
              {myVisits.map((visit) => (
                <li
                  key={visit.id}
                  className="flex flex-col gap-1 rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-xs sm:flex-row sm:items-start sm:justify-between dark:border-blue-900/50 dark:bg-blue-950/30"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white">{visit.client.name}</p>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-300">{visit.requestedAddress}</p>
                    {visit.notes && (
                      <p className="mt-1 whitespace-pre-wrap text-[11px] text-slate-500 dark:text-slate-400">{visit.notes}</p>
                    )}
                  </div>
                  <div className="shrink-0 sm:text-right">
                    <p className="font-mono font-bold capitalize text-blue-700 dark:text-blue-300">
                      {visitDateFormatter.format(visit.scheduledAt!)}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {texts.dashboard.visits.durationOption(visit.durationMinutes)}
                    </p>
                    {visit.client.phone && (
                      <a
                        href={`tel:${visit.client.phone}`}
                        className="mt-1 inline-flex min-h-[32px] items-center font-semibold text-amber-700 hover:underline dark:text-amber-400"
                      >
                        {visit.client.phone}
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Lista rápida de obras atribuídas */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            As Suas Obras Ativas
          </h2>
          {myProjects.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ainda não tem obras atribuídas pelo Dono da empresa.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {myProjects.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:border-slate-300 dark:hover:border-slate-600 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {p.name}
                      </h3>
                      {p.code && (
                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                          {p.code}
                        </span>
                      )}
                    </div>
                    <span className="rounded-sm bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-400">
                      Ativa
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
                    {p.address || "Sem morada especificada"}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-3 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {p._count.assignments} colaboradores alocados
                    </span>
                    <Link
                      href={`/dashboard/as-minhas-obras`}
                      className="font-semibold text-amber-700 hover:underline dark:text-amber-300"
                    >
                      Ver equipa →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. VISÃO DO FUNCIONÁRIO (MOBILE-FIRST)
  const [workerAssignments, myRecentLogs] = await Promise.all([
    prisma.projectAssignment.findMany({
      where: { userId: user.id },
      include: { project: true },
    }),
    prisma.workLog.findMany({
      where: { authorId: user.id },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { project: true, measurements: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Boas-vindas */}
      <div className="rounded-2xl bg-amber-600 p-6 text-white shadow-md">
        <h1 className="text-xl font-bold">Olá, {user.name}</h1>
        <p className="mt-1 text-xs text-amber-100">
          Registe o seu trabalho diário e medições de forma rápida no estaleiro.
        </p>

        <div className="mt-5">
          <Link
            href="/dashboard/novo-registo"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-amber-900 shadow-xs transition active:scale-95 hover:bg-amber-50 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-amber-950/40"
          >
            <PlusCircleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Fazer Novo Registo de Obra
          </Link>
        </div>
      </div>

      {/* Obras Onde Está Alocado */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Obras Onde Está Atribuído
        </h2>
        {workerAssignments.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Ainda não se encontra associado a nenhuma obra. Fale com o seu
            encarregado.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {workerAssignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {a.project.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {a.project.address || "Localização a definir"}
                  </div>
                </div>
                <Link
                  href={`/dashboard/novo-registo?projectId=${a.projectId}`}
                  className="rounded-sm bg-amber-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-xs"
                >
                  Registar trabalho
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Últimos Registos do Funcionário */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Os Seus Últimos Registos
          </h2>
          <Link
            href="/dashboard/os-meus-registos"
            className="text-xs font-semibold text-amber-700 hover:underline dark:text-amber-300"
          >
            Ver todos
          </Link>
        </div>

        {myRecentLogs.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ainda não submeteu nenhum registo de trabalho.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {myRecentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800 dark:text-white">
                    {log.project.name}
                  </div>
                  {log.description && (
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {log.description}
                    </div>
                  )}
                  {log.measurements.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {log.measurements.map((m) => (
                        <span
                          key={m.id}
                          className="rounded-sm bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300"
                        >
                          {m.description}: {Number(m.quantity)} {m.unit}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {log.hours ? (
                    <div className="font-bold font-mono text-slate-900 dark:text-white">
                      {Number(log.hours)}h
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400">Medições</div>
                  )}
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold mt-1 ${
                      log.status === "VALIDATED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : log.status === "REJECTED"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                    }`}
                  >
                    {log.status === "VALIDATED"
                      ? "Validado"
                      : log.status === "REJECTED"
                      ? "Rejeitado"
                      : "Pendente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
