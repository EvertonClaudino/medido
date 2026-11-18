"use client";

import { useState, useTransition } from "react";
import { Role, UserStatus } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  inviteUserAction,
  toggleUserStatusAction,
} from "../actions";
import {
  UserPlus,
  Search,
  HardHat,
  Briefcase,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Shield,
  UserCheck,
  UserX,
  ChevronRight,
} from "lucide-react";
import { MemberDetailsDialog } from "./MemberDetailsDialog";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  specialty: string | null;
  createdAt: string | Date;
  mustChangePassword?: boolean;
  workLogsCount?: number;
  assignedTasksCount?: number;
  assignments: {
    isLead: boolean;
    project: {
      id: string;
      name: string;
      code: string | null;
      status: string;
    };
  }[];
}

interface EquipaViewProps {
  initialTeam: TeamMember[];
  currentUserId: string;
}

const COMMON_SPECIALTIES = [
  "Encarregado Geral",
  "Diretor de Obra",
  "Pedreiro de 1.ª",
  "Pedreiro de 2.ª",
  "Carpinteiro de Cofragem",
  "Carpinteiro de Limpos",
  "Eletricista",
  "Pintor de Construção Civil",
  "Ladrilhador / Calceteiro",
  "Canalizador",
  "Técnico de AVAC",
  "Serralheiro Civil",
  "Manobrador de Máquinas",
  "Servente de Obra",
];

export function EquipaView({ initialTeam, currentUserId }: EquipaViewProps) {
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Colaborador selecionado para ver perfil detalhado
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Estado do Diálogo de Convite
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [createdMemberName, setCreatedMemberName] = useState<string>("");
  const [hasCopiedPassword, setHasCopiedPassword] = useState(false);

  // Campos do formulário
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"WORKER" | "FOREMAN">("WORKER");
  const [specialty, setSpecialty] = useState("");
  const [customPassword, setCustomPassword] = useState("");

  // Estado de alternância de status
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  // Filtragem dos membros
  const filteredTeam = team.filter((member) => {
    // Filtro por texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = member.name.toLowerCase().includes(q);
      const matchEmail = member.email.toLowerCase().includes(q);
      const matchSpecialty = member.specialty?.toLowerCase().includes(q) ?? false;
      const matchProject = member.assignments.some(
        (a) =>
          a.project.name.toLowerCase().includes(q) ||
          (a.project.code && a.project.code.toLowerCase().includes(q))
      );
      if (!matchName && !matchEmail && !matchSpecialty && !matchProject) {
        return false;
      }
    }

    // Filtro por perfil
    if (roleFilter !== "ALL" && member.role !== roleFilter) {
      return false;
    }

    // Filtro por estado
    if (statusFilter !== "ALL" && member.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Métricas
  const totalCount = team.length;
  const activeCount = team.filter((m) => m.status === "ACTIVE").length;
  const inactiveCount = totalCount - activeCount;
  const foremanCount = team.filter((m) => m.role === "FOREMAN").length;
  const workerCount = team.filter((m) => m.role === "WORKER").length;

  function resetInviteForm() {
    setName("");
    setEmail("");
    setRole("WORKER");
    setSpecialty("");
    setCustomPassword("");
    setInviteError(null);
    setCreatedPassword(null);
    setCreatedMemberName("");
    setHasCopiedPassword(false);
  }

  function handleOpenInvite() {
    resetInviteForm();
    setIsInviteOpen(true);
  }

  async function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("email", email);
    formData.set("role", role);
    if (specialty.trim()) formData.set("specialty", specialty.trim());
    if (customPassword.trim()) formData.set("temporaryPassword", customPassword.trim());

    startTransition(async () => {
      const res = await inviteUserAction(formData);
      if (res?.error) {
        setInviteError(res.error);
        return;
      }

      if (res?.success) {
        setCreatedMemberName(name);
        setCreatedPassword(res.temporaryPassword || customPassword || "Definida manualmente");
        // Adicionar localmente à lista com placeholder de assignments vazios
        const newMember: TeamMember = {
          id: `temp-${Date.now()}`,
          name,
          email: email.toLowerCase().trim(),
          role: role as Role,
          status: "ACTIVE" as UserStatus,
          specialty: specialty.trim() || null,
          createdAt: new Date(),
          mustChangePassword: true,
          workLogsCount: 0,
          assignedTasksCount: 0,
          assignments: [],
        };
        setTeam((prev) => [...prev, newMember]);
      }
    });
  }

  async function handleToggleStatus(memberId: string, currentStatus: UserStatus) {
    setToggleError(null);
    setTogglingId(memberId);

    const res = await toggleUserStatusAction(memberId);
    setTogglingId(null);

    if (res?.error) {
      setToggleError(res.error);
      return;
    }

    const nextStatus = currentStatus === "ACTIVE" ? ("INACTIVE" as UserStatus) : ("ACTIVE" as UserStatus);

    // Atualizar estado na lista
    setTeam((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              status: nextStatus,
            }
          : m
      )
    );

    // Atualizar no modal caso esteja aberto
    setSelectedMember((prev) =>
      prev && prev.id === memberId
        ? {
            ...prev,
            status: nextStatus,
          }
        : prev
    );
  }

  function copyPasswordToClipboard() {
    if (!createdPassword) return;
    navigator.clipboard.writeText(createdPassword);
    setHasCopiedPassword(true);
    setTimeout(() => setHasCopiedPassword(false), 2500);
  }

  // Gera as iniciais do nome (ex: "Rui Oliveira" -> "RO")
  function getInitials(fullName: string) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Equipa & Colaboradores
          </h1>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            Gestão de encarregados, colaboradores operacionais, especialidades e alocações a obras.
          </p>
        </div>

        <Button
          onClick={handleOpenInvite}
          className="h-11 min-h-[44px] gap-2 bg-slate-900 text-white hover:bg-slate-800 px-5 text-sm font-semibold shadow-xs dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
        >
          <UserPlus className="h-4 w-4" />
          Convidar Colaborador
        </Button>
      </div>

      {/* Cards de Métricas Resumidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total da Equipa
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</div>
          <div className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
            {activeCount} ativos • {inactiveCount} inativos
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-500">
            Encarregados
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-400">{foremanCount}</div>
          <div className="mt-0.5 text-[11px] text-amber-700/80 dark:text-amber-500/80">Gestão e validação em obra</div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Funcionários
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-300">{workerCount}</div>
          <div className="mt-0.5 text-[11px] text-blue-700/80 dark:text-blue-400/80">Trabalho de campo</div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-500">
            Em Atividade
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-400">{activeCount}</div>
          <div className="mt-0.5 text-[11px] text-emerald-700/80 dark:text-emerald-500/80">Com acesso ao sistema</div>
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs space-y-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Campo de Pesquisa */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Pesquisar por nome, email, especialidade ou obra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Filtros em Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro Perfil */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setRoleFilter("ALL")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  roleFilter === "ALL"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("FOREMAN")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  roleFilter === "FOREMAN"
                    ? "bg-white dark:bg-slate-700 text-amber-800 dark:text-amber-400 shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Encarregados
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("WORKER")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  roleFilter === "WORKER"
                    ? "bg-white dark:bg-slate-700 text-blue-800 dark:text-blue-400 shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Funcionários
              </button>
            </div>

            {/* Filtro Estado */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`rounded-md px-2 py-1 font-medium transition-colors ${
                  statusFilter === "ALL"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ACTIVE")}
                className={`rounded-md px-2 py-1 font-medium transition-colors ${
                  statusFilter === "ACTIVE"
                    ? "bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-400 shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Ativos
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("INACTIVE")}
                className={`rounded-md px-2 py-1 font-medium transition-colors ${
                  statusFilter === "INACTIVE"
                    ? "bg-white dark:bg-slate-700 text-red-800 dark:text-red-400 shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Inativos
              </button>
            </div>
          </div>
        </div>

        {toggleError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-2.5 text-xs font-medium text-red-700 dark:text-red-400">
            {toggleError}
          </div>
        )}
      </div>

      {/* Dica para o utilizador */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 dark:text-slate-400">
        <span>A mostrar {filteredTeam.length} de {team.length} colaboradores</span>
        <span className="hidden sm:inline text-slate-400">Clique num cartão para ver os detalhes completos do colaborador</span>
      </div>

      {/* Grelha de Cards de Colaboradores */}
      {filteredTeam.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
          <Briefcase className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
            Nenhum colaborador encontrado
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Não foram encontrados membros da equipa com os filtros selecionados.
          </p>
          {(searchQuery || roleFilter !== "ALL" || statusFilter !== "ALL") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="mt-3 text-xs"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeam.map((member) => {
            const isOwner = member.role === "OWNER";
            const isForeman = member.role === "FOREMAN";
            const isSelf = member.id === currentUserId;
            const initials = getInitials(member.name);

            // Paleta de cores para o avatar por perfil
            const avatarBg = isOwner
              ? "bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-900/60"
              : isForeman
              ? "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-900/60"
              : "bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-900/60";

            return (
              <div
                key={member.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedMember(member)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedMember(member);
                  }
                }}
                className={`group relative flex flex-col justify-between rounded-xl border bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 text-left ${
                  member.status === "INACTIVE"
                    ? "border-slate-200 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-900/60 opacity-80"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                {/* Topo do Card: Avatar + Info + Badges */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Avatar com Iniciais */}
                      <div
                        className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-bold text-sm tracking-wider ${avatarBg}`}
                      >
                        {initials}
                        {/* Ícone Indicador de Papel */}
                        <span
                          className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-white text-[10px] shadow-xs ${
                            isOwner
                              ? "bg-purple-600 text-white"
                              : isForeman
                              ? "bg-amber-600 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                          title={
                            isOwner
                              ? "Dono da Empresa"
                              : isForeman
                              ? "Encarregado"
                              : "Funcionário"
                          }
                        >
                          {isOwner ? (
                            <Shield className="h-3 w-3" />
                          ) : isForeman ? (
                            <HardHat className="h-3 w-3" />
                          ) : (
                            <Briefcase className="h-3 w-3" />
                          )}
                        </span>
                      </div>

                      {/* Nome, Especialidade e Email */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h2 className="truncate font-bold text-slate-900 dark:text-white text-sm group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
                            {member.name}
                          </h2>
                          {isSelf && (
                            <span className="rounded bg-slate-100 px-1 py-0.2 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Você
                            </span>
                          )}
                        </div>

                        {/* Especialidade / Cargo */}
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300">
                          <Briefcase className="h-3 w-3 shrink-0 text-slate-400" />
                          <span className="truncate font-medium">
                            {member.specialty ||
                              (isOwner
                                ? "Gerência / Administração"
                                : isForeman
                                ? "Encarregado de Obra"
                                : "Operacional")}
                          </span>
                        </div>

                        {/* Email */}
                        <div className="mt-0.5 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {member.email}
                        </div>
                      </div>
                    </div>

                    {/* Badge de Estado (Ativo/Inativo) */}
                    <div className="shrink-0">
                      {member.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          Inativo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informação do Perfil (Dono, Encarregado, Funcionário) */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-3 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Função no Sistema</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isOwner
                          ? "border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300"
                          : isForeman
                          ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
                          : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                      }`}
                    >
                      {isOwner
                        ? "Dono da Empresa"
                        : isForeman
                        ? "Encarregado"
                        : "Funcionário"}
                    </Badge>
                  </div>

                  {/* Secção de Obras Alocadas */}
                  <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        Obras Atribuídas
                      </span>
                      <span className="font-bold text-slate-500 dark:text-slate-400">
                        {isOwner ? "Global" : member.assignments.length}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      {isOwner ? (
                        <div className="text-[11px] text-purple-700 dark:text-purple-400 font-medium">
                          Acesso global a todas as obras da empresa
                        </div>
                      ) : member.assignments.length === 0 ? (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                          Nenhuma obra ativa atribuída no momento
                        </div>
                      ) : (
                        member.assignments.map((assignment) => (
                          <div
                            key={assignment.project.id}
                            className="flex items-center justify-between gap-2 text-xs rounded bg-white dark:bg-slate-800 px-2 py-1 border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                          >
                            <span className="truncate font-medium text-slate-800 dark:text-slate-200 text-[11px]">
                              {assignment.project.code && (
                                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 mr-1">
                                  [{assignment.project.code}]
                                </span>
                              )}
                              {assignment.project.name}
                            </span>
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                assignment.isLead
                                  ? "bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-900/60"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {assignment.isLead ? "Responsável" : "Equipa"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card: Ações com alvo de toque acessível (44px) */}
                <div className="mt-4 border-t border-slate-100 dark:border-slate-700/60 pt-3 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
                    <span>Ver detalhes</span>
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {!isOwner && !isSelf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(member.id, member.status);
                      }}
                      disabled={togglingId === member.id}
                      className={`h-9 min-h-[36px] sm:min-h-[44px] text-xs font-semibold px-3 z-10 ${
                        member.status === "ACTIVE"
                          ? "text-slate-600 hover:text-red-700 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-300 dark:hover:bg-red-950/40"
                          : "text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/40"
                      }`}
                    >
                      {togglingId === member.id ? (
                        "A processar..."
                      ) : member.status === "ACTIVE" ? (
                        <>
                          <UserX className="h-3.5 w-3.5 mr-1" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3.5 w-3.5 mr-1" />
                          Ativar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Diálogo Modal de Perfil e Detalhes do Colaborador */}
      <MemberDetailsDialog
        member={selectedMember}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        isSelf={selectedMember?.id === currentUserId}
        onToggleStatus={handleToggleStatus}
        isToggling={togglingId === selectedMember?.id}
        onSpecialtyUpdated={(memberId, newSpecialty) => {
          setTeam((prev) =>
            prev.map((m) => (m.id === memberId ? { ...m, specialty: newSpecialty } : m))
          );
          setSelectedMember((prev) =>
            prev && prev.id === memberId ? { ...prev, specialty: newSpecialty } : prev
          );
        }}
      />

      {/* Diálogo Modal de Convidar Novo Colaborador */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md">
          {createdPassword ? (
            /* Ecrã de Sucesso com Palavra-passe Temporária */
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Colaborador Criado com Sucesso!
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                    {createdMemberName} foi adicionado à equipa da sua empresa.
                  </DialogDescription>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2 dark:border-amber-900/60 dark:bg-amber-950/40">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Palavra-passe Temporária
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-white p-2.5 border border-amber-200 dark:bg-slate-900 dark:border-amber-900/60">
                  <span className="font-mono text-sm font-bold text-slate-900 tracking-wide dark:text-white">
                    {createdPassword}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyPasswordToClipboard}
                    className="h-8 gap-1.5 text-xs font-semibold"
                  >
                    {hasCopiedPassword ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        Copiada!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed dark:text-amber-300">
                  Entregue esta palavra-passe ao colaborador. No primeiro acesso, o sistema exigirá
                  obrigatoriamente que defina uma nova palavra-passe pessoal.
                </p>
              </div>

              <DialogFooter className="sm:justify-end">
                <Button
                  onClick={() => setIsInviteOpen(false)}
                  className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 h-10 min-h-[44px] dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                >
                  Concluir
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Formulário de Registo / Convite */
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                  Convidar Novo Colaborador
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Preencha os dados do encarregado ou funcionário para atribuir credenciais de acesso.
                </DialogDescription>
              </DialogHeader>

              {inviteError && (
                <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {inviteError}
                </div>
              )}

              <div className="space-y-4 text-xs">
                {/* 1. Nome Completo */}
                <div>
                  <Label htmlFor="member-name" className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                    Nome Completo *
                  </Label>
                  <Input
                    id="member-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Rui Manuel Oliveira"
                    className="mt-1 h-9 text-xs"
                  />
                </div>

                {/* 2. Email */}
                <div>
                  <Label htmlFor="member-email" className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                    Email de Acesso *
                  </Label>
                  <Input
                    id="member-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rui@construtora.pt"
                    className="mt-1 h-9 text-xs"
                  />
                </div>

                {/* 3. Seleção de Perfil de Acesso Visual (Radio Cards) */}
                <div>
                  <Label className="text-xs font-semibold uppercase text-slate-700 block mb-1.5 dark:text-slate-300">
                    Perfil de Acesso *
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Opção Funcionário */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setRole("WORKER")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setRole("WORKER");
                        }
                      }}
                      className={`relative flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                        role === "WORKER"
                          ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 dark:bg-blue-950/40"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          role === "WORKER"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 dark:text-white">
                          Funcionário
                          {role === "WORKER" && (
                            <Check className="h-3.5 w-3.5 text-blue-600 ml-auto dark:text-blue-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug dark:text-slate-400">
                          Registo diário de medições e tarefas em obra.
                        </p>
                      </div>
                    </div>

                    {/* Opção Encarregado */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setRole("FOREMAN")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setRole("FOREMAN");
                        }
                      }}
                      className={`relative flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                        role === "FOREMAN"
                          ? "border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20 dark:bg-amber-950/40"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          role === "FOREMAN"
                            ? "bg-amber-600 text-white"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <HardHat className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 dark:text-white">
                          Encarregado
                          {role === "FOREMAN" && (
                            <Check className="h-3.5 w-3.5 text-amber-600 ml-auto dark:text-amber-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug dark:text-slate-400">
                          Gestão de equipas e validação de registos.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Especialidade / Cargo com Pills Rápidas */}
                <div>
                  <Label htmlFor="member-specialty" className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                    Cargo / Especialidade Técnica
                  </Label>
                  <Input
                    id="member-specialty"
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ex.: Pedreiro de 1.ª, Eletricista, Pintor..."
                    className="mt-1 h-9 text-xs bg-white dark:bg-slate-900"
                  />

                  {/* Pills de seleção rápida */}
                  <div className="mt-2">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                      Sugestões rápidas de ofício:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_SPECIALTIES.slice(0, 10).map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setSpecialty(item)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                            specialty === item
                              ? "bg-slate-900 text-white font-semibold"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. Palavra-passe Temporária (Opcional) */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="member-password" className="text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                      Palavra-passe Inicial
                    </Label>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-900/60">
                      Automática
                    </span>
                  </div>
                  <Input
                    id="member-password"
                    type="text"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Deixe em branco para gerar senha temporária segura"
                    className="h-8 font-mono text-xs bg-white dark:bg-slate-900"
                  />
                  <p className="text-[11px] text-slate-500 leading-tight dark:text-slate-400">
                    Se deixar em branco, o Medido gera automaticamente uma senha segura e exibe-a
                    após a criação para copiar e entregar ao colaborador.
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteOpen(false)}
                  disabled={isPending}
                  className="h-10 min-h-[44px] text-xs font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-10 min-h-[44px] bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                >
                  {isPending ? "A convidar..." : "Convidar Colaborador"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
