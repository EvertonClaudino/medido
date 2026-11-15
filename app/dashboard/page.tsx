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
  isDashboardDateKey,
  isDashboardMonthKey,
} from "@/lib/dashboard-utils";

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
    const assignments = await prisma.projectAssignment.findMany({
      where: { userId: user.id },
      include: {
        project: {
          include: {
            assignments: { include: { user: true } },
            workLogs: { where: { status: "PENDING" } },
          },
        },
      },
    });

    const myProjects = assignments.map((a) => a.project);
    const pendingReviewCount = myProjects.reduce(
      (acc, p) => acc + p.workLogs.length,
      0
    );

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Painel do Encarregado
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Resumo e controlo das frentes de obra sob a sua responsabilidade direta.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase">
                Obras Sob Minha Gestão
              </span>
              <HardHatIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div className="mt-3 text-3xl font-black text-slate-900">
              {myProjects.length}
            </div>
            <Link
              href="/dashboard/as-minhas-obras"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline"
            >
              Ver detalhe das obras →
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase">
                Registos a Validar
              </span>
              <ClockIcon className="h-5 w-5 text-amber-500" />
            </div>
            <div className="mt-3 text-3xl font-black text-slate-900">
              {pendingReviewCount}
            </div>
            <Link
              href="/dashboard/validar-registos"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline"
            >
              Validar registos da equipa →
            </Link>
          </div>
        </div>

        {/* Lista rápida de obras atribuídas */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4">
            As Suas Obras Ativas
          </h2>
          {myProjects.length === 0 ? (
            <p className="text-xs text-slate-500">
              Ainda não tem obras atribuídas pelo Dono da empresa.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {myProjects.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {p.name}
                      </h3>
                      {p.code && (
                        <span className="font-mono text-[10px] text-slate-500">
                          {p.code}
                        </span>
                      )}
                    </div>
                    <span className="rounded-sm bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Ativa
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 truncate">
                    {p.address || "Sem morada especificada"}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="text-slate-500">
                      {p.assignments.length} colaboradores alocados
                    </span>
                    <Link
                      href={`/dashboard/as-minhas-obras`}
                      className="font-semibold text-amber-700 hover:underline"
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
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-amber-900 shadow-xs transition active:scale-95 hover:bg-amber-50"
          >
            <PlusCircleIcon className="h-5 w-5 text-amber-600" />
            Fazer Novo Registo de Obra
          </Link>
        </div>
      </div>

      {/* Obras Onde Está Alocado */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900">
          Obras Onde Está Atribuído
        </h2>
        {workerAssignments.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            Ainda não se encontra associado a nenhuma obra. Fale com o seu
            encarregado.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {workerAssignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {a.project.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
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
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900">
            Os Seus Últimos Registos
          </h2>
          <Link
            href="/dashboard/os-meus-registos"
            className="text-xs font-semibold text-amber-700 hover:underline"
          >
            Ver todos
          </Link>
        </div>

        {myRecentLogs.length === 0 ? (
          <p className="text-xs text-slate-500">
            Ainda não submeteu nenhum registo de trabalho.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {myRecentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">
                    {log.project.name}
                  </div>
                  {log.description && (
                    <div className="text-slate-500 text-[11px]">
                      {log.description}
                    </div>
                  )}
                  {log.measurements.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {log.measurements.map((m) => (
                        <span
                          key={m.id}
                          className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700"
                        >
                          {m.description}: {Number(m.quantity)} {m.unit}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {log.hours ? (
                    <div className="font-bold font-mono text-slate-900">
                      {Number(log.hours)}h
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400">Medições</div>
                  )}
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold mt-1 ${
                      log.status === "VALIDATED"
                        ? "bg-emerald-100 text-emerald-800"
                        : log.status === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
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
