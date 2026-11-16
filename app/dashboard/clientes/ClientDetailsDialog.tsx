"use client";

import Link from "next/link";
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
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  ExternalLink,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Archive,
} from "lucide-react";

export interface ClientProject {
  id: string;
  name: string;
  code: string | null;
  status: string;
  serviceType: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface ClientFullData {
  id: string;
  name: string;
  nif: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  projects: ClientProject[];
  _count: { projects: number; visitRequests: number; budgets: number };
}

interface ClientDetailsDialogProps {
  client: ClientFullData | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: ClientFullData) => void;
  onDelete: (client: ClientFullData) => void;
}

export function ClientDetailsDialog({
  client,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: ClientDetailsDialogProps) {
  if (!client) return null;

  // Iniciais do nome do cliente
  const parts = client.name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length === 0
      ? "C"
      : parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();

  const canDelete =
    client._count.projects === 0 &&
    client._count.visitRequests === 0 &&
    client._count.budgets === 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3.5">
            {/* Avatar em Destaque */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-emerald-200 bg-emerald-50 text-emerald-800 font-bold text-base tracking-wider shadow-xs">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-bold text-slate-900 truncate">
                  {client.name}
                </DialogTitle>
              </div>

              {client.nif ? (
                <DialogDescription className="text-xs text-slate-600 font-mono mt-0.5">
                  NIF: <span className="font-semibold text-slate-900">{client.nif}</span>
                </DialogDescription>
              ) : (
                <DialogDescription className="text-xs text-slate-400 italic mt-0.5">
                  Sem NIF registado
                </DialogDescription>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold">
                  {client.projects.length} Obra{client.projects.length !== 1 ? "s" : ""}
                </Badge>
                {client._count.budgets > 0 && (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 font-semibold">
                    {client._count.budgets} Orçamento{client._count.budgets !== 1 ? "s" : ""}
                  </Badge>
                )}
                {client._count.visitRequests > 0 && (
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800 font-semibold">
                    {client._count.visitRequests} Visita{client._count.visitRequests !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Informações de Contacto e Morada */}
        <div className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Email */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email
              </span>
              {client.email ? (
                <a
                  href={`mailto:${client.email}`}
                  className="font-medium text-slate-900 hover:text-amber-700 hover:underline truncate block"
                >
                  {client.email}
                </a>
              ) : (
                <span className="text-slate-400 italic">Não indicado</span>
              )}
            </div>

            {/* Telefone */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Telefone / Telemóvel
              </span>
              {client.phone ? (
                <a
                  href={`tel:${client.phone}`}
                  className="font-medium text-slate-900 hover:text-amber-700 hover:underline block"
                >
                  {client.phone}
                </a>
              ) : (
                <span className="text-slate-400 italic">Não indicado</span>
              )}
            </div>
          </div>

          {/* Morada */}
          {client.address && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Morada Fiscal / Instalações
              </span>
              <p className="text-slate-800 leading-relaxed font-medium">{client.address}</p>
            </div>
          )}

          {/* Notas */}
          {client.notes && (
            <div className="rounded-lg border border-slate-200 bg-amber-50/40 p-3 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Observações & Notas Internas
              </span>
              <p className="text-slate-700 leading-relaxed italic">{client.notes}</p>
            </div>
          )}

          {/* Secção de Histórico de Obras Realizadas e em Curso */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Histórico de Obras Realizadas & Em Curso
              </div>
              <span className="font-mono text-[11px] font-semibold text-slate-500">
                {client.projects.length} {client.projects.length === 1 ? "obra" : "obras"}
              </span>
            </div>

            {client.projects.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-4 text-center text-slate-500">
                <p>Nenhuma obra registada para este cliente até ao momento.</p>
                <div className="mt-2">
                  <Link
                    href="/dashboard/obras"
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline"
                  >
                    Registar nova obra para este cliente
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {client.projects.map((project) => {
                  const isActive = project.status === "ACTIVE";
                  const isCompleted = project.status === "COMPLETED";

                  return (
                    <div
                      key={project.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {project.code && (
                            <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-200 px-1 py-0.2 rounded">
                              {project.code}
                            </span>
                          )}
                          <span className="font-bold text-slate-900 truncate">
                            {project.name}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          {project.serviceType && (
                            <span className="rounded bg-slate-200/70 px-1.5 py-0.2 font-medium text-slate-700">
                              {project.serviceType}
                            </span>
                          )}

                          {(project.startDate || project.endDate) && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {project.startDate &&
                                new Date(project.startDate).toLocaleDateString("pt-PT")}
                              {project.startDate && project.endDate && " → "}
                              {project.endDate &&
                                new Date(project.endDate).toLocaleDateString("pt-PT")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : isCompleted
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Clock className="h-3 w-3" />
                              Em Curso
                            </>
                          ) : isCompleted ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Concluída
                            </>
                          ) : (
                            <>
                              <Archive className="h-3 w-3" />
                              Arquivada
                            </>
                          )}
                        </span>

                        <Link
                          href="/dashboard/obras"
                          onClick={onClose}
                          title="Ver nas Obras"
                          className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com Ações */}
        <DialogFooter className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(client);
              }}
              className="h-10 min-h-[44px] text-xs font-semibold px-4 gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar Cliente
            </Button>

            {canDelete && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onDelete(client);
                }}
                className="h-10 min-h-[44px] text-xs font-semibold px-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
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

