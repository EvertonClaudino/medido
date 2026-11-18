"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2,
  HardHat,
  Shield,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  UserCheck,
  UserX,
  Pencil,
  Check,
  X,
  ClipboardList,
} from "lucide-react";
import { updateUserSpecialtyAction } from "../actions";

export interface TeamMemberDetails {
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

interface MemberDetailsDialogProps {
  member: TeamMemberDetails | null;
  isOpen: boolean;
  onClose: () => void;
  isSelf: boolean;
  onToggleStatus: (memberId: string, currentStatus: UserStatus) => Promise<void>;
  isToggling: boolean;
  onSpecialtyUpdated?: (memberId: string, newSpecialty: string) => void;
}

export function MemberDetailsDialog({
  member,
  isOpen,
  onClose,
  isSelf,
  onToggleStatus,
  isToggling,
  onSpecialtyUpdated,
}: MemberDetailsDialogProps) {
  const [isEditingSpecialty, setIsEditingSpecialty] = useState(false);
  const [specialtyValue, setSpecialtyValue] = useState("");
  const [isSavingSpecialty, startSpecialtyTransition] = useTransition();
  const [specialtyFeedback, setSpecialtyFeedback] = useState<string | null>(null);

  if (!member) return null;

  const isOwner = member.role === "OWNER";
  const isForeman = member.role === "FOREMAN";

  // Gera as iniciais do nome (ex: "Rui Oliveira" -> "RO")
  const parts = member.name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length === 0
      ? "U"
      : parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();

  const avatarBg = isOwner
    ? "bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-900/60"
    : isForeman
    ? "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-900/60"
    : "bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-900/60";

  function handleStartEditSpecialty() {
    setSpecialtyValue(member?.specialty || "");
    setIsEditingSpecialty(true);
    setSpecialtyFeedback(null);
  }

  function handleSaveSpecialty(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return;

    startSpecialtyTransition(async () => {
      const res = await updateUserSpecialtyAction(member.id, specialtyValue);
      if (res?.error) {
        setSpecialtyFeedback(res.error);
        return;
      }
      if (res?.success) {
        setIsEditingSpecialty(false);
        setSpecialtyFeedback(null);
        if (onSpecialtyUpdated) {
          onSpecialtyUpdated(member.id, specialtyValue.trim());
        }
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-start gap-3.5">
            {/* Avatar em Destaque */}
            <div
              className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 font-bold text-base tracking-wider ${avatarBg}`}
            >
              {initials}
              <span
                className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[11px] shadow-xs ${
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
                  <Shield className="h-3.5 w-3.5" />
                ) : isForeman ? (
                  <HardHat className="h-3.5 w-3.5" />
                ) : (
                  <Briefcase className="h-3.5 w-3.5" />
                )}
              </span>
            </div>

            {/* Nome, Email e Badges */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-bold text-slate-900 truncate dark:text-white">
                  {member.name}
                </DialogTitle>
                {isSelf && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Sessão Atual
                  </span>
                )}
              </div>

              <DialogDescription className="text-xs text-slate-500 font-mono mt-0.5 truncate dark:text-slate-400">
                {member.email}
              </DialogDescription>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
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

                {member.status === "ACTIVE" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Conta Ativa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    Conta Inativa
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Corpo do Diálogo com Informação Detalhada */}
        <div className="space-y-4 py-2 text-xs">
          {/* 1. Especialidade / Cargo com Suporte a Edição */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wider text-slate-600 text-[10px] flex items-center gap-1.5 dark:text-slate-400">
                <Briefcase className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                Cargo / Especialidade Técnica
              </span>

              {!isEditingSpecialty && (
                <button
                  type="button"
                  onClick={handleStartEditSpecialty}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <Pencil className="h-3 w-3" />
                  Editar
                </button>
              )}
            </div>

            {isEditingSpecialty ? (
              <form onSubmit={handleSaveSpecialty} className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={specialtyValue}
                    onChange={(e) => setSpecialtyValue(e.target.value)}
                    placeholder="Ex.: Pedreiro de 1.ª, Eletricista, Encarregado..."
                    className="h-8 text-xs bg-white dark:bg-slate-900"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingSpecialty}
                    className="h-8 bg-slate-900 text-white hover:bg-slate-800 text-xs px-2.5 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingSpecialty(false)}
                    disabled={isSavingSpecialty}
                    className="h-8 text-xs px-2"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {specialtyFeedback && (
                  <p className="text-[11px] text-red-600 dark:text-red-400">{specialtyFeedback}</p>
                )}
              </form>
            ) : (
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {member.specialty ||
                  (isOwner
                    ? "Gerência / Administração"
                    : isForeman
                    ? "Encarregado de Obra"
                    : "Operacional")}
              </div>
            )}
          </div>

          {/* 2. Informações de Acesso e Histórico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1 dark:text-slate-400">
                <Calendar className="h-3 w-3" />
                Data de Admissão
              </span>
              <div className="font-medium text-slate-800 dark:text-slate-100">
                {new Date(member.createdAt).toLocaleDateString("pt-PT", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1 dark:text-slate-400">
                <Clock className="h-3 w-3" />
                Primeiro Acesso
              </span>
              <div>
                {member.mustChangePassword ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    <AlertCircle className="h-3 w-3" />
                    Pendente de primeiro login
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Palavra-passe pessoal ativa
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Indicadores de Atividade Operacional */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium dark:text-slate-400">
                <span>Apontamentos</span>
                <Clock className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                {member.workLogsCount ?? 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Registos de trabalho no Medido
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium dark:text-slate-400">
                <span>Tarefas</span>
                <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                {member.assignedTasksCount ?? 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Tarefas atribuídas
              </div>
            </div>
          </div>

          {/* 4. Lista Completa de Obras Atribuídas */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2.5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs dark:text-white">
                <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                Obras Atribuídas ({isOwner ? "Todas" : member.assignments.length})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {isOwner ? "Âmbito Global" : `${member.assignments.length} ativas`}
              </span>
            </div>

            {isOwner ? (
              <div className="rounded-lg bg-purple-50 p-3 text-purple-900 text-xs dark:bg-purple-950/40 dark:text-purple-300">
                <div className="font-semibold">Acesso de Gestão Global</div>
                <p className="mt-0.5 text-[11px] text-purple-700 dark:text-purple-300">
                  Como Dono da empresa, tem supervisão e permissões de gestão em todas as obras,
                  orçamentos e registos operacionais.
                </p>
              </div>
            ) : member.assignments.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-3 text-center text-slate-500 text-xs dark:bg-slate-800/50 dark:text-slate-400">
                Este colaborador não se encontra alocado a nenhuma obra ativa de momento.
                <div className="mt-1">
                  <Link
                    href="/dashboard/obras"
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-900 hover:underline dark:text-white"
                  >
                    Ir para as Obras para alocar equipa
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {member.assignments.map((assignment) => (
                  <div
                    key={assignment.project.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 hover:bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {assignment.project.code && (
                          <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-200/80 px-1 py-0.2 rounded dark:text-slate-400">
                            {assignment.project.code}
                          </span>
                        )}
                        <span className="font-bold text-slate-900 truncate dark:text-white">
                          {assignment.project.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 dark:text-slate-400">
                        Função na obra:{" "}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {assignment.isLead ? "Encarregado Geral" : "Colaborador de Equipa"}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          assignment.isLead
                            ? "bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-900/60"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {assignment.isLead ? "Responsável" : "Equipa"}
                      </span>

                      <Link
                        href={`/dashboard/obras/${assignment.project.id}/equipa`}
                        onClick={onClose}
                        title="Gerir equipa desta obra"
                        className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé do Diálogo */}
        <DialogFooter className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 dark:border-slate-800">
          <div>
            {!isOwner && !isSelf && (
              <Button
                variant={member.status === "ACTIVE" ? "outline" : "default"}
                size="sm"
                onClick={() => onToggleStatus(member.id, member.status)}
                disabled={isToggling}
                className={`h-10 min-h-[44px] text-xs font-semibold px-4 w-full sm:w-auto ${
                  member.status === "ACTIVE"
                    ? "border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                    : "bg-emerald-700 text-white hover:bg-emerald-800"
                }`}
              >
                {isToggling ? (
                  "A processar..."
                ) : member.status === "ACTIVE" ? (
                  <>
                    <UserX className="h-4 w-4 mr-1.5" />
                    Desativar Colaborador
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-1.5" />
                    Reativar Colaborador
                  </>
                )}
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 min-h-[44px] text-xs font-semibold px-5 w-full sm:w-auto"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
