"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteClientAction } from "@/app/dashboard/actions";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
} from "lucide-react";
import type { ClientStage } from "@/lib/client-record";
import { texts } from "@/lib/texts";
import { ClientFormDialog } from "./ClientFormDialog";

export interface ClientProject {
  id: string;
  name: string;
  code: string | null;
  status: string;
}

export interface ClientFullData {
  id: string;
  name: string;
  nif: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  stage: ClientStage;
  projects: ClientProject[];
  _count: { projects: number; visitRequests: number; budgets: number };
}

interface ClientsViewProps {
  clients: ClientFullData[];
}

export default function ClientsView({ clients }: ClientsViewProps) {
  const router = useRouter();
  const clientList = clients;
  const [searchQuery, setSearchQuery] = useState("");

  // Diálogo de criar/editar (formClient = null significa criação)
  const [formOpen, setFormOpen] = useState(false);
  const [formClient, setFormClient] = useState<ClientFullData | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientFullData | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtragem de clientes
  const filteredClients = clientList.filter((client) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchName = client.name.toLowerCase().includes(q);
    const matchNif = client.nif?.toLowerCase().includes(q) ?? false;
    const matchEmail = client.email?.toLowerCase().includes(q) ?? false;
    const matchPhone = client.phone?.toLowerCase().includes(q) ?? false;
    const matchProject = client.projects.some(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q))
    );
    return matchName || matchNif || matchEmail || matchPhone || matchProject;
  });

  // Métricas
  const totalClients = clientList.length;
  const clientsWithActiveProjects = clientList.filter((c) =>
    c.projects.some((p) => p.status === "ACTIVE")
  ).length;
  const totalProjectsHistory = clientList.reduce(
    (acc, c) => acc + c.projects.length,
    0
  );
  const totalBudgets = clientList.reduce(
    (acc, c) => acc + (c._count?.budgets ?? 0),
    0
  );

  function openClient(clientId: string) {
    router.push(`/dashboard/clientes/${clientId}`);
  }

  function openCreate() {
    setFormClient(null);
    setFormOpen(true);
  }

  function handleDelete() {
    if (!deletingClient) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteClientAction(deletingClient.id);
      if ("error" in result) {
        setError(result.error ?? "Erro desconhecido.");
      } else {
        setDeletingClient(null);
        router.refresh();
      }
    });
  }

  // Gera as iniciais do nome do cliente
  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "C";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Gestão de Clientes
          </h1>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            Ficha de clientes, dados fiscais, contactos e histórico de obras executadas.
          </p>
        </div>

        <Button
          onClick={() => {
            openCreate();
          }}
          className="h-11 min-h-[44px] gap-2 bg-slate-900 text-white hover:bg-slate-800 px-5 text-sm font-semibold shadow-xs dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Cartões de Métricas Resumidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total de Clientes
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{totalClients}</div>
          <div className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">Registados na empresa</div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-500">
            Com Obras em Curso
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-400">
            {clientsWithActiveProjects}
          </div>
          <div className="mt-0.5 text-[11px] text-emerald-700/80 dark:text-emerald-500/80">Obras ativas no momento</div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-500">
            Histórico de Obras
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-400">
            {totalProjectsHistory}
          </div>
          <div className="mt-0.5 text-[11px] text-amber-700/80 dark:text-amber-500/80">Empreitadas totais</div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Orçamentos
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-300">{totalBudgets}</div>
          <div className="mt-0.5 text-[11px] text-blue-700/80 dark:text-blue-400/80">Propostas comerciais</div>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Pesquisar por nome do cliente, NIF, email, telefone ou obra..."
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
      </div>

      {/* Dica para o utilizador */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 dark:text-slate-400">
        <span>A mostrar {filteredClients.length} de {clientList.length} clientes</span>
        <span className="hidden sm:inline text-slate-400">Clique num cartão para abrir a ficha do cliente</span>
      </div>

      {/* Grelha de Cards de Clientes (Estilo Colaboradores) */}
      {filteredClients.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhum cliente encontrado</h3>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {searchQuery
              ? "Tente ajustar o termo de pesquisa."
              : "Comece por registar o primeiro cliente da empresa."}
          </p>
          {searchQuery ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="mt-3 text-xs"
            >
              Limpar pesquisa
            </Button>
          ) : (
            <Button
              onClick={() => {
                openCreate();
              }}
              className="mt-3 bg-slate-900 text-white hover:bg-slate-800 text-xs dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Novo Cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
            const initials = getInitials(client.name);
            const activeProjectsCount = client.projects.filter(
              (p) => p.status === "ACTIVE"
            ).length;

            return (
              <div
                key={client.id}
                role="button"
                tabIndex={0}
                onClick={() => openClient(client.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openClient(client.id);
                  }
                }}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 text-left"
              >
                <div>
                  {/* Topo do Card: Avatar + Nome + NIF */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Avatar com Iniciais */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold text-sm tracking-wider shadow-2xs dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-bold text-slate-900 text-sm group-hover:text-amber-800 transition-colors dark:text-white">
                          {client.name}
                        </h2>

                        {client.nif ? (
                          <div className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            NIF: <span className="font-semibold text-slate-700 dark:text-slate-300">{client.nif}</span>
                          </div>
                        ) : (
                          <div className="mt-0.5 text-[11px] text-slate-400 italic">
                            Sem NIF indicado
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Etapa comercial + Badge de Obras */}
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                        {texts.dashboard.clientRecord.stages[client.stage]}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-800">
                        {client.projects.length} {client.projects.length === 1 ? "Obra" : "Obras"}
                      </span>
                    </div>
                  </div>

                  {/* Informações de Contacto e Morada */}
                  <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                    {client.phone && (
                      <div className="flex items-center gap-1.5 text-slate-600 truncate dark:text-slate-400">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="font-medium">{client.phone}</span>
                      </div>
                    )}

                    {client.email && (
                      <div className="flex items-center gap-1.5 text-slate-600 truncate dark:text-slate-400">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}

                    {client.address && (
                      <div className="flex items-start gap-1.5 text-slate-500 text-[11px] line-clamp-1 dark:text-slate-400">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                        <span className="truncate">{client.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Secção de Histórico de Obras do Cliente */}
                  <div className="mt-3 rounded-lg bg-slate-50 p-2.5 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 flex items-center gap-1 dark:text-slate-300">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        Histórico de Obras
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {activeProjectsCount > 0 ? (
                          <span className="text-emerald-700 dark:text-emerald-300">{activeProjectsCount} em curso</span>
                        ) : (
                          "Concluídas / Arquivadas"
                        )}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1.5">
                      {client.projects.length === 0 ? (
                        <div className="text-[11px] text-slate-400 italic">
                          Nenhuma obra associada a este cliente
                        </div>
                      ) : (
                        client.projects.slice(0, 3).map((project) => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between gap-2 text-xs rounded bg-white px-2 py-1 border border-slate-200/80 shadow-2xs dark:bg-slate-900 dark:border-slate-800"
                          >
                            <span className="truncate font-medium text-slate-800 text-[11px] dark:text-slate-100">
                              {project.code && (
                                <span className="font-mono text-[10px] text-slate-500 mr-1 dark:text-slate-400">
                                  [{project.code}]
                                </span>
                              )}
                              {project.name}
                            </span>
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                project.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : project.status === "COMPLETED"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {project.status === "ACTIVE"
                                ? "Em curso"
                                : project.status === "COMPLETED"
                                ? "Concluída"
                                : "Arquivada"}
                            </span>
                          </div>
                        ))
                      )}

                      {client.projects.length > 3 && (
                        <div className="text-[10px] text-slate-500 font-medium text-right pt-0.5 dark:text-slate-400">
                          + {client.projects.length - 3} outra{client.projects.length - 3 !== 1 ? "s" : ""} obra{client.projects.length - 3 !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card: Ações com Touch Target de 44px */}
                <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between dark:border-slate-800">
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 group-hover:text-amber-800 transition-colors dark:text-slate-400">
                    <span>Abrir ficha</span>
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setError(null);
                        setFormClient(client);
                        setFormOpen(true);
                      }}
                      className="h-9 min-h-[36px] sm:min-h-[44px] text-xs font-semibold px-2.5 text-slate-600 hover:text-slate-900 z-10 dark:text-slate-400 dark:hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Editar
                    </Button>

                    {client._count.projects === 0 &&
                      client._count.visitRequests === 0 &&
                      client._count.budgets === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setError(null);
                            setDeletingClient(client);
                          }}
                          className="h-9 min-h-[36px] sm:min-h-[44px] text-xs font-semibold px-2 text-red-600 hover:text-red-700 hover:bg-red-50 z-10 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Diálogo de criar/editar cliente (após criar, abre a ficha para marcar visita) */}
      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        client={formClient}
        onSaved={(clientId) => {
          setFormOpen(false);
          if (formClient) {
            router.refresh();
          } else {
            openClient(clientId);
          }
        }}
      />

      {/* Modal: Confirmar Eliminação */}
      <Dialog
        open={Boolean(deletingClient)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingClient(null);
            setError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              Eliminar Cliente
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Tem a certeza de que deseja eliminar o cliente{" "}
              <strong className="text-slate-800 dark:text-slate-100">{deletingClient?.name}</strong>? Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setDeletingClient(null)}
              className="h-10 min-h-[44px] text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="h-10 min-h-[44px] bg-red-600 text-white hover:bg-red-700 text-xs font-semibold"
            >
              {isPending ? "A eliminar..." : "Eliminar Cliente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
