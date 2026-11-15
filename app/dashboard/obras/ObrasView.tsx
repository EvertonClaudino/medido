"use client";

import { useState, useTransition, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  PlusCircle,
  ClockAlert,
  CheckCircle2,
  PlayCircle,
  Filter,
  Search,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createProjectAction } from "@/app/dashboard/actions";
import { getLisbonDateKey } from "@/lib/dashboard-utils";
import ProjectDetailsDialog from "./ProjectDetailsDialog";

export interface ProjectTaskItem {
  id: string;
  title: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  dueDate: Date | null;
}

export interface ProjectWorkerItem {
  id: string;
  name: string;
  email: string;
}

export interface ProjectItemData {
  id: string;
  name: string;
  code: string | null;
  serviceType: string | null;
  clientName: string | null;
  clientId: string | null;
  address: string | null;
  budget: number | null;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  client?: {
    id: string;
    name: string;
    nif?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  foremen: { id: string; name: string }[];
  workers?: ProjectWorkerItem[];
  workersCount: number;
  tasks?: ProjectTaskItem[];
  workLogsCount: number;
  isDelayed: boolean;
  totalTasksCount: number;
  completedTasksCount: number;
  pendingTasksCount: number;
  delayedTasksCount: number;
  progressPercentage: number;
}

export interface ForemanOption {
  id: string;
  name: string;
  email: string;
}

export interface ClientOption {
  id: string;
  name: string;
}

export interface ObrasMetrics {
  total: number;
  active: number;
  completed: number;
  delayed: number;
}

interface ObrasViewProps {
  projects: ProjectItemData[];
  foremen: ForemanOption[];
  clients: ClientOption[];
  metrics: ObrasMetrics;
  nextCodeSuggestion: string;
}

const SERVICE_TYPE_SUGGESTIONS = [
  "Construção de Raiz / Nova",
  "Reabilitação & Remodelação",
  "Estruturas & Betão Armado",
  "Alvenarias & Acabamentos",
  "Instalações & Redes Técnicas (MEP)",
  "Pinturas & Isolamentos",
  "Coberturas & Impermeabilizações",
  "Demolições & Movimentação de Terras",
  "Carpintarias & Caixilharias",
  "Manutenção & Outros",
];

type StatusFilterType = "ALL" | "ACTIVE" | "COMPLETED" | "DELAYED";
type DeadlineFilterType = "ALL" | "THIS_MONTH" | "NEXT_MONTH" | "NO_DATE";
type SortOptionType = "NEWEST" | "DEADLINE" | "NAME_ASC" | "DELAYED_TASKS" | "PENDING_TASKS";

export default function ObrasView({
  projects,
  foremen,
  clients,
  metrics,
  nextCodeSuggestion,
}: ObrasViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<ProjectItemData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [foremanFilter, setForemanFilter] = useState<string>("ALL");
  const [clientFilter, setClientFilter] = useState<string>("ALL");
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilterType>("ALL");
  const [sortBy, setSortBy] = useState<SortOptionType>("NEWEST");

  // Modal de Criação
  const [customServiceType, setCustomServiceType] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Mês atual e próximo mês no fuso Europe/Lisbon para o filtro de prazo
  const { currentMonthKey, nextMonthKey } = useMemo(() => {
    const now = new Date();
    const currentKey = getLisbonDateKey(now).slice(0, 7); // YYYY-MM
    const [cYear, cMonth] = currentKey.split("-").map(Number);
    const nextDate = new Date(Date.UTC(cYear, cMonth, 1));
    const nextKey = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}`;
    return { currentMonthKey: currentKey, nextMonthKey: nextKey };
  }, []);

  // Filtragem e Ordenação em memória com dados reais
  const filteredAndSortedProjects = useMemo(() => {
    return projects
      .filter((project) => {
        // 1. Filtro por Estado
        if (statusFilter === "ACTIVE" && project.status !== "ACTIVE") return false;
        if (statusFilter === "COMPLETED" && (project.status !== "COMPLETED" && project.status !== "ARCHIVED")) return false;
        if (statusFilter === "DELAYED" && !project.isDelayed) return false;

        // 2. Filtro por Encarregado
        if (foremanFilter !== "ALL") {
          const hasForeman = project.foremen.some((f) => f.id === foremanFilter);
          if (!hasForeman) return false;
        }

        // 3. Filtro por Cliente
        if (clientFilter !== "ALL") {
          const matchClient = project.clientId === clientFilter || project.client?.id === clientFilter;
          if (!matchClient) return false;
        }

        // 4. Filtro por Prazo
        if (deadlineFilter === "NO_DATE" && project.endDate !== null) return false;
        if (deadlineFilter === "THIS_MONTH") {
          if (!project.endDate) return false;
          const endMonthKey = getLisbonDateKey(new Date(project.endDate)).slice(0, 7);
          if (endMonthKey !== currentMonthKey) return false;
        }
        if (deadlineFilter === "NEXT_MONTH") {
          if (!project.endDate) return false;
          const endMonthKey = getLisbonDateKey(new Date(project.endDate)).slice(0, 7);
          if (endMonthKey !== nextMonthKey) return false;
        }

        // 5. Pesquisa Textual
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const nameMatch = project.name.toLowerCase().includes(q);
        const codeMatch = project.code?.toLowerCase().includes(q);
        const clientMatch = (project.client?.name || project.clientName || "").toLowerCase().includes(q);
        const serviceMatch = project.serviceType?.toLowerCase().includes(q);
        const addressMatch = project.address?.toLowerCase().includes(q);

        return Boolean(nameMatch || codeMatch || clientMatch || serviceMatch || addressMatch);
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "DEADLINE": {
            if (!a.endDate && !b.endDate) return 0;
            if (!a.endDate) return 1;
            if (!b.endDate) return -1;
            return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
          }
          case "NAME_ASC":
            return a.name.localeCompare(b.name, "pt-PT", { sensitivity: "base" });
          case "DELAYED_TASKS":
            return b.delayedTasksCount - a.delayedTasksCount;
          case "PENDING_TASKS":
            return b.pendingTasksCount - a.pendingTasksCount;
          case "NEWEST":
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [
    projects,
    statusFilter,
    foremanFilter,
    clientFilter,
    deadlineFilter,
    searchQuery,
    sortBy,
    currentMonthKey,
    nextMonthKey,
  ]);

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createProjectAction(formData);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setShowCreateModal(false);
        formRef.current?.reset();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. Cabeçalho Principal com Botão de Ação */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Gestão de Obras & Empreitadas
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Acompanhe o estado de execução, prazos, tarefas e equipas de cada obra da empresa.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Registar Nova Obra</span>
        </button>
      </div>

      {/* 2. Fileira de 4 Cartões de Resumo KPI com Cores Específicas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        {/* Total de Obras: Neutro (slate) -> #475569 | Fundo ícone #F1F5F9 | Subtítulo #64748B */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 border-l-4 border-l-[#475569] bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Total de Obras
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#475569]">
              <Building2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
              {metrics.total}
            </span>
            <span className="text-[11px] font-medium text-[#64748B]">
              registadas
            </span>
          </div>
        </div>

        {/* Obras Ativas: Azul -> #2563EB | Fundo ícone #EFF6FF | Subtítulo #1D4ED8 */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 border-l-4 border-l-[#2563EB] bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D4ED8]">
              Obras Ativas
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
              <PlayCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
              {metrics.active}
            </span>
            <span className="text-[11px] font-semibold text-[#1D4ED8]">
              em execução
            </span>
          </div>
        </div>

        {/* Obras Terminadas: Verde -> #16A34A | Fundo ícone #F0FDF4 | Subtítulo #15803D */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 border-l-4 border-l-[#16A34A] bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#15803D]">
              Obras Terminadas
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0FDF4] text-[#16A34A]">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
              {metrics.completed}
            </span>
            <span className="text-[11px] font-semibold text-[#15803D]">
              concluídas
            </span>
          </div>
        </div>

        {/* Obras em Atraso: Vermelho -> #DC2626 | Fundo ícone #FEF2F2 | Subtítulo #B91C1C */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 border-l-4 border-l-[#DC2626] bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B91C1C]">
              Obras em Atraso
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FEF2F2] text-[#DC2626]">
              <ClockAlert className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
              {metrics.delayed}
            </span>
            <span className="text-[11px] font-semibold text-[#B91C1C]">
              prazo ultrapassado
            </span>
          </div>
        </div>
      </div>

      {/* 3. Painel de Controlo: Pesquisa, Filtros Avançados e Ordenação */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        {/* Linha Superior: Pesquisa e Pílulas de Estado */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Campo de Pesquisa Textual */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome, código, cliente, tipo de serviço ou morada..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Pílulas de Filtro de Estado */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="hidden items-center gap-1 text-[11px] font-semibold text-slate-400 sm:inline-flex pr-1">
              <Filter className="h-3 w-3" />
              <span>Estado:</span>
            </span>

            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todas ({metrics.total})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === "ACTIVE"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              Ativas ({metrics.active})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("COMPLETED")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === "COMPLETED"
                  ? "bg-purple-700 text-white shadow-2xs"
                  : "bg-purple-50 text-purple-800 hover:bg-purple-100"
              }`}
            >
              Terminadas ({metrics.completed})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("DELAYED")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === "DELAYED"
                  ? "bg-rose-700 text-white shadow-2xs"
                  : "bg-rose-50 text-rose-800 hover:bg-rose-100"
              }`}
            >
              Em Atraso ({metrics.delayed})
            </button>
          </div>
        </div>

        {/* Linha Inferior: Filtros de Encarregado, Cliente, Prazo e Ordenação */}
        <div className="grid grid-cols-1 gap-2.5 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Filtro por Encarregado */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Encarregado
            </label>
            <select
              value={foremanFilter}
              onChange={(e) => setForemanFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-1.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              <option value="ALL">Todos os encarregados</option>
              {foremen.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Cliente */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Cliente
            </label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-1.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              <option value="ALL">Todos os clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Prazo */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Prazo de Conclusão
            </label>
            <select
              value={deadlineFilter}
              onChange={(e) => setDeadlineFilter(e.target.value as DeadlineFilterType)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-1.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              <option value="ALL">Todos os prazos</option>
              <option value="THIS_MONTH">Entrega este mês</option>
              <option value="NEXT_MONTH">Entrega no próximo mês</option>
              <option value="NO_DATE">Sem data limite</option>
            </select>
          </div>

          {/* Ordenação */}
          <div>
            <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <ArrowUpDown className="h-2.5 w-2.5" />
              <span>Ordenar Por</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOptionType)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              <option value="NEWEST">Mais recentes (criação)</option>
              <option value="DEADLINE">Prazo mais próximo</option>
              <option value="NAME_ASC">Nome da obra (A → Z)</option>
              <option value="DELAYED_TASKS">Mais tarefas em atraso</option>
              <option value="PENDING_TASKS">Mais tarefas pendentes</option>
            </select>
          </div>
        </div>

        {/* Resumo de resultados quando há filtros ativos */}
        {(searchQuery || statusFilter !== "ALL" || foremanFilter !== "ALL" || clientFilter !== "ALL" || deadlineFilter !== "ALL") && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
            <span>
              A apresentar <strong className="text-slate-800">{filteredAndSortedProjects.length}</strong> de {projects.length} obras.
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
                setForemanFilter("ALL");
                setClientFilter("ALL");
                setDeadlineFilter("ALL");
              }}
              className="font-semibold text-blue-600 hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* 4. Grelha de Cards Operacionais (Inspirada no Layout da Referência) */}
      {filteredAndSortedProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
          <Building2 className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 text-sm font-bold text-slate-800">
            Nenhuma obra encontrada
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "ALL" || foremanFilter !== "ALL" || clientFilter !== "ALL" || deadlineFilter !== "ALL"
              ? "Não foram encontradas obras com a combinação de filtros selecionada."
              : "Comece por registar a primeira empreitada da sua construtora para começar a atribuir equipas e registos."}
          </p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setShowCreateModal(true);
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Registar Nova Obra</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedProjects.map((project) => {
            const hasForeman = project.foremen.length > 0;
            const foremanName = hasForeman ? project.foremen[0].name : "Por atribuir";
            const clientDisplayName = project.client?.name || project.clientName || "Cliente Geral";

            // Avatar com iniciais do encarregado
            const foremanInitials = hasForeman
              ? foremanName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              : "—";

            // Cores semânticas para distinguir as obras:
            // 1. Em Atraso: Vermelho (#DC2626)
            // 2. Concluída / Arquivada: Verde (#16A34A)
            // 3. Em Curso: Azul (#2563EB)
            let cardBorder = "border-blue-200/80";
            let iconBg = "bg-[#EFF6FF] text-[#2563EB]";
            let statusBadge = "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]";
            let statusLabel = "Em Curso";
            let progressBarColor = "bg-[#2563EB]";
            let titleHoverColor = "group-hover:text-[#2563EB]";

            if (project.isDelayed) {
              cardBorder = "border-red-200/90";
              iconBg = "bg-[#FEF2F2] text-[#DC2626]";
              statusBadge = "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]";
              statusLabel = "Em Atraso";
              progressBarColor = "bg-[#DC2626]";
              titleHoverColor = "group-hover:text-[#DC2626]";
            } else if (project.status === "COMPLETED" || project.status === "ARCHIVED") {
              cardBorder = "border-emerald-200/80";
              iconBg = "bg-[#F0FDF4] text-[#16A34A]";
              statusBadge = "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]";
              statusLabel = project.status === "COMPLETED" ? "Concluída" : "Arquivada";
              progressBarColor = "bg-[#16A34A]";
              titleHoverColor = "group-hover:text-[#16A34A]";
            }

            return (
              <div
                key={project.id}
                className={`group relative flex flex-col justify-between rounded-2xl border ${cardBorder} bg-white p-5 shadow-xs transition hover:shadow-md`}
              >
                <div>
                  {/* Linha 1: Ícone Circular Temático + Título da Obra + Badge de Estado Suave */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setSelectedProjectForDetails(project)}
                          className={`font-bold text-slate-900 ${titleHoverColor} transition line-clamp-1 text-[14px] text-left w-full`}
                          title={project.name}
                        >
                          {project.name}
                        </button>
                        {project.code && (
                          <span className="font-mono text-[10px] font-semibold text-slate-400 block mt-0.5">
                            {project.code}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badge de Estado no canto superior direito */}
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
                      {statusLabel}
                    </span>
                  </div>

                  {/* Linha 2: Grelha Bipartida (PIC / Encarregado e Departamento / Cliente & Tipo) */}
                  <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
                    {/* PIC / Encarregado Responsável */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        PIC:
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 border border-slate-200">
                          {foremanInitials}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 text-xs truncate block" title={foremanName}>
                            {foremanName}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {hasForeman ? "Encarregado" : "Não atribuído"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Departamento / Cliente e Tipo de Serviço */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Cliente / Tipo:
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-xs truncate block" title={clientDisplayName}>
                          {clientDisplayName}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block mt-0.5" title={project.serviceType || "Geral"}>
                          {project.serviceType || "Construção Civil"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Linha 3: Tarefas Concluídas (Completed Tasks) e Prazo Limite (Deadline) */}
                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                    {/* Completed Tasks */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Tarefas Concluídas:
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-extrabold text-slate-900">
                          {project.completedTasksCount}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          / {project.totalTasksCount}
                        </span>
                        {project.delayedTasksCount > 0 && (
                          <span className="ml-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1 py-0.2 rounded">
                            {project.delayedTasksCount} atrasadas
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Deadline */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Data Limite:
                      </span>
                      <span
                        className={`text-xs font-bold block ${
                          project.isDelayed ? "text-rose-600" : project.endDate ? "text-slate-800" : "text-slate-400 font-normal"
                        }`}
                      >
                        {project.endDate
                          ? new Intl.DateTimeFormat("pt-PT", {
                              timeZone: "Europe/Lisbon",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }).format(new Date(project.endDate))
                          : "Sem prazo definido"}
                      </span>
                    </div>
                  </div>

                  {/* Linha 4: Barra de Progresso Real das Tarefas */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Progresso:
                      </span>
                      <span className="text-xs font-extrabold text-slate-800">
                        {project.totalTasksCount > 0 || project.status === "COMPLETED"
                          ? `${project.progressPercentage}%`
                          : "Sem tarefas"}
                      </span>
                    </div>

                    {/* Barra Visual com fundo suave */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`}
                        style={{ width: `${project.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Linha 5 (Rodapé): 3 Botões de Ação */}
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedProjectForDetails(project)}
                    className="flex items-center justify-center rounded-xl border border-slate-200/90 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    Ver Detalhes
                  </button>

                  <Link
                    href={`/dashboard/obras/${project.id}/equipa`}
                    className="flex items-center justify-center rounded-xl border border-slate-200/90 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    Gerir Equipa
                  </Link>

                  <Link
                    href={`/dashboard/obras/${project.id}/editar`}
                    className="flex items-center justify-center rounded-xl border border-slate-200/90 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    Editar Obra
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modal / Dialog para Registar Nova Obra */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900">
                  Registar Nova Obra
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Introduza os dados da empreitada para iniciar o acompanhamento operacional.
                </p>
              </div>
            </div>
          </DialogHeader>

          {error && (
            <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form ref={formRef} action={handleCreate} className="p-6 space-y-6 text-sm">
            {/* Secção 1: Identificação Principal */}
            <div className="space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                1. Identificação da Obra
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Nome da Obra / Empreitada *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ex.: Reabilitação Edifício Chiado"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Código Interno */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Código Interno
                    </label>
                    <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                      <Sparkles className="h-2.5 w-2.5" />
                      Automático
                    </span>
                  </div>
                  <input
                    type="text"
                    name="code"
                    defaultValue={nextCodeSuggestion}
                    placeholder="Ex.: OBR-2026-001"
                    className="mt-1.5 w-full rounded-xl border border-blue-200 bg-blue-50/30 px-3.5 py-2.5 font-mono text-xs font-bold text-blue-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Sugerido pelo sistema. Pode personalizar.
                  </p>
                </div>

                {/* Tipo de Serviço */}
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Tipo de Serviço *
                  </label>
                  {!customServiceType ? (
                    <div className="mt-1.5">
                      <select
                        name="serviceType"
                        onChange={(e) => {
                          if (e.target.value === "OUTRO") {
                            setCustomServiceType(true);
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                      >
                        <option value="">Selecione o tipo de trabalho...</option>
                        {SERVICE_TYPE_SUGGESTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                        <option value="OUTRO">+ Outro (escrever manualmente)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="text"
                        name="serviceType"
                        placeholder="Ex.: Isolamento Acústico"
                        autoFocus
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setCustomServiceType(false)}
                        className="shrink-0 text-xs font-bold text-blue-600 hover:underline px-1"
                      >
                        Lista
                      </button>
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-slate-400">
                    Especialidade ou natureza da intervenção.
                  </p>
                </div>
              </div>
            </div>

            {/* Secção 2: Cliente & Localização */}
            <div className="space-y-4 border-t border-slate-100 pt-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                2. Cliente & Localização
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Cliente Registado
                  </label>
                  <select
                    name="clientId"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  >
                    <option value="">Nenhum / Não associado</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Nome do Cliente / Entidade
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    placeholder={selectedClientId ? "Associado ao cliente selecionado" : "Ex.: Pedro Silva ou Empresa XYZ"}
                    disabled={Boolean(selectedClientId)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 disabled:bg-slate-50 disabled:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Morada / Localização do Estaleiro
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Ex.: Rua das Flores 12, Lisboa"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Secção 3: Equipa, Prazo & Orçamento */}
            <div className="space-y-4 border-t border-slate-100 pt-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                3. Equipa, Prazos & Orçamento
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Encarregado Responsável
                  </label>
                  <select
                    name="foremanId"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  >
                    <option value="">Por atribuir mais tarde</option>
                    {foremen.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Orçamento Previsto (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="budget"
                    placeholder="Ex.: 145000"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Data Limite / Conclusão
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
              <DialogClose asChild>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
              </DialogClose>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs disabled:opacity-50 transition"
              >
                {isPending ? "A gravar obra..." : "Criar Obra"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes da Obra */}
      <ProjectDetailsDialog
        project={selectedProjectForDetails}
        open={selectedProjectForDetails !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedProjectForDetails(null);
        }}
      />
    </div>
  );
}

