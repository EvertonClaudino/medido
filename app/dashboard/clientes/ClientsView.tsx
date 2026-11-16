"use client";

import { useState, useTransition, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createClientAction,
  updateClientAction,
  deleteClientAction,
} from "@/app/dashboard/actions";
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
import {
  ClientDetailsDialog,
  ClientFullData,
} from "./ClientDetailsDialog";

interface ClientsViewProps {
  clients: ClientFullData[];
}

export default function ClientsView({ clients }: ClientsViewProps) {
  const [clientList, setClientList] = useState<ClientFullData[]>(clients);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientFullData | null>(null);

  // Estados dos modais de criar/editar/eliminar
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientFullData | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientFullData | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

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

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createClientAction(formData);
      if ("error" in result) {
        setError(result.error ?? null);
      } else {
        setShowCreateModal(false);
        formRef.current?.reset();
        // Recarregar cliente ou adicionar na lista
        const name = formData.get("name") as string;
        const nif = (formData.get("nif") as string) || null;
        const email = (formData.get("email") as string) || null;
        const phone = (formData.get("phone") as string) || null;
        const address = (formData.get("address") as string) || null;
        const notes = (formData.get("notes") as string) || null;

        const newClient: ClientFullData = {
          id: `temp-${Date.now()}`,
          name,
          nif,
          email,
          phone,
          address,
          notes,
          createdAt: new Date().toISOString(),
          projects: [],
          _count: { projects: 0, visitRequests: 0, budgets: 0 },
        };
        setClientList((prev) => [newClient, ...prev]);
      }
    });
  }

  function handleEdit(formData: FormData) {
    if (!editingClient) return;
    setError(null);
    startTransition(async () => {
      const result = await updateClientAction(editingClient.id, formData);
      if ("error" in result) {
        setError(result.error ?? null);
      } else {
        const name = (formData.get("name") as string) || editingClient.name;
        const nif = (formData.get("nif") as string) || null;
        const email = (formData.get("email") as string) || null;
        const phone = (formData.get("phone") as string) || null;
        const address = (formData.get("address") as string) || null;
        const notes = (formData.get("notes") as string) || null;

        setClientList((prev) =>
          prev.map((c) =>
            c.id === editingClient.id
              ? {
                  ...c,
                  name,
                  nif,
                  email,
                  phone,
                  address,
                  notes,
                }
              : c
          )
        );
        if (selectedClient && selectedClient.id === editingClient.id) {
          setSelectedClient((prev) =>
            prev
              ? {
                  ...prev,
                  name,
                  nif,
                  email,
                  phone,
                  address,
                  notes,
                }
              : null
          );
        }
        setEditingClient(null);
      }
    });
  }

  function handleDelete() {
    if (!deletingClient) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteClientAction(deletingClient.id);
      if ("error" in result) {
        setError(result.error ?? "Erro desconhecido.");
      } else {
        setClientList((prev) => prev.filter((c) => c.id !== deletingClient.id));
        if (selectedClient && selectedClient.id === deletingClient.id) {
          setSelectedClient(null);
        }
        setDeletingClient(null);
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestão de Clientes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ficha de clientes, dados fiscais, contactos e histórico de obras executadas.
          </p>
        </div>

        <Button
          onClick={() => {
            setError(null);
            setShowCreateModal(true);
          }}
          className="h-11 min-h-[44px] gap-2 bg-slate-900 text-white hover:bg-slate-800 px-5 text-sm font-semibold shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Cartões de Métricas Resumidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Total de Clientes
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{totalClients}</div>
          <div className="mt-0.5 text-[11px] text-slate-400">Registados na empresa</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-700">
            Com Obras em Curso
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-900">
            {clientsWithActiveProjects}
          </div>
          <div className="mt-0.5 text-[11px] text-emerald-700/80">Obras ativas no momento</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-amber-700">
            Histórico de Obras
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-900">
            {totalProjectsHistory}
          </div>
          <div className="mt-0.5 text-[11px] text-amber-700/80">Empreitadas totais</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-blue-700">
            Orçamentos
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-900">{totalBudgets}</div>
          <div className="mt-0.5 text-[11px] text-blue-700/80">Propostas comerciais</div>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
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
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>A mostrar {filteredClients.length} de {clientList.length} clientes</span>
        <span className="hidden sm:inline text-slate-400">Clique num cartão para abrir o histórico e detalhes completos</span>
      </div>

      {/* Grelha de Cards de Clientes (Estilo Colaboradores) */}
      {filteredClients.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-300" />
          <h3 className="mt-2 text-sm font-semibold text-slate-700">Nenhum cliente encontrado</h3>
          <p className="mt-1 text-xs text-slate-400">
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
                setError(null);
                setShowCreateModal(true);
              }}
              className="mt-3 bg-slate-900 text-white hover:bg-slate-800 text-xs"
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
                onClick={() => setSelectedClient(client)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedClient(client);
                  }
                }}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 text-left"
              >
                <div>
                  {/* Topo do Card: Avatar + Nome + NIF */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Avatar com Iniciais */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold text-sm tracking-wider shadow-2xs">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-bold text-slate-900 text-sm group-hover:text-amber-800 transition-colors">
                          {client.name}
                        </h2>

                        {client.nif ? (
                          <div className="mt-0.5 font-mono text-[11px] text-slate-500">
                            NIF: <span className="font-semibold text-slate-700">{client.nif}</span>
                          </div>
                        ) : (
                          <div className="mt-0.5 text-[11px] text-slate-400 italic">
                            Sem NIF indicado
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Badge de Obras */}
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                      {client.projects.length} {client.projects.length === 1 ? "Obra" : "Obras"}
                    </span>
                  </div>

                  {/* Informações de Contacto e Morada */}
                  <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                    {client.phone && (
                      <div className="flex items-center gap-1.5 text-slate-600 truncate">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="font-medium">{client.phone}</span>
                      </div>
                    )}

                    {client.email && (
                      <div className="flex items-center gap-1.5 text-slate-600 truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}

                    {client.address && (
                      <div className="flex items-start gap-1.5 text-slate-500 text-[11px] line-clamp-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                        <span className="truncate">{client.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Secção de Histórico de Obras do Cliente */}
                  <div className="mt-3 rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        Histórico de Obras
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {activeProjectsCount > 0 ? (
                          <span className="text-emerald-700">{activeProjectsCount} em curso</span>
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
                            className="flex items-center justify-between gap-2 text-xs rounded bg-white px-2 py-1 border border-slate-200/80 shadow-2xs"
                          >
                            <span className="truncate font-medium text-slate-800 text-[11px]">
                              {project.code && (
                                <span className="font-mono text-[10px] text-slate-500 mr-1">
                                  [{project.code}]
                                </span>
                              )}
                              {project.name}
                            </span>
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                project.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : project.status === "COMPLETED"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-600"
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
                        <div className="text-[10px] text-slate-500 font-medium text-right pt-0.5">
                          + {client.projects.length - 3} outra{client.projects.length - 3 !== 1 ? "s" : ""} obra{client.projects.length - 3 !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card: Ações com Touch Target de 44px */}
                <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 group-hover:text-amber-800 transition-colors">
                    <span>Ver detalhes</span>
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setError(null);
                        setEditingClient(client);
                      }}
                      className="h-9 min-h-[36px] sm:min-h-[44px] text-xs font-semibold px-2.5 text-slate-600 hover:text-slate-900 z-10"
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
                          className="h-9 min-h-[36px] sm:min-h-[44px] text-xs font-semibold px-2 text-red-600 hover:text-red-700 hover:bg-red-50 z-10"
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

      {/* Diálogo Modal de Detalhes do Cliente e Histórico Completo */}
      <ClientDetailsDialog
        client={selectedClient}
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        onEdit={(c) => {
          setError(null);
          setEditingClient(c);
        }}
        onDelete={(c) => {
          setError(null);
          setDeletingClient(c);
        }}
      />

      {/* Modal: Novo Cliente */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Novo Cliente
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Registe uma nova entidade ou cliente particular para emissão de orçamentos e obras.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <form ref={formRef} action={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Nome do cliente ou empresa *
              </label>
              <input
                type="text"
                name="name"
                required
                maxLength={100}
                placeholder="Ex.: Imobiliária Nova Luz, Lda."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">NIF</label>
                <input
                  type="text"
                  name="nif"
                  maxLength={20}
                  placeholder="501 234 567"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Telefone</label>
                <input
                  type="text"
                  name="phone"
                  maxLength={30}
                  placeholder="+351 912 345 678"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Email</label>
              <input
                type="email"
                name="email"
                maxLength={254}
                placeholder="contacto@novaluz.pt"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Morada Fiscal
              </label>
              <input
                type="text"
                name="address"
                maxLength={300}
                placeholder="Av. da Liberdade, 100, Lisboa"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Observações
              </label>
              <textarea
                name="notes"
                maxLength={1000}
                rows={2}
                placeholder="Detalhes adicionais, pessoa de contacto preferencial..."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setShowCreateModal(false)}
                className="h-10 min-h-[44px] text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="h-10 min-h-[44px] bg-slate-900 text-white hover:bg-slate-800 text-xs"
              >
                {isPending ? "A registar..." : "Registar Cliente"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Cliente */}
      <Dialog
        open={Boolean(editingClient)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingClient(null);
            setError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Editar Cliente
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Atualize as informações fiscais e os contactos do cliente.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {editingClient && (
            <form action={handleEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Nome do cliente ou empresa *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  maxLength={100}
                  defaultValue={editingClient.name}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">NIF</label>
                  <input
                    type="text"
                    name="nif"
                    maxLength={20}
                    defaultValue={editingClient.nif ?? ""}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Telefone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    maxLength={30}
                    defaultValue={editingClient.phone ?? ""}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  name="email"
                  maxLength={254}
                  defaultValue={editingClient.email ?? ""}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Morada Fiscal
                </label>
                <input
                  type="text"
                  name="address"
                  maxLength={300}
                  defaultValue={editingClient.address ?? ""}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Observações
                </label>
                <textarea
                  name="notes"
                  maxLength={1000}
                  rows={2}
                  defaultValue={editingClient.notes ?? ""}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setEditingClient(null)}
                  className="h-10 min-h-[44px] text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-10 min-h-[44px] bg-slate-900 text-white hover:bg-slate-800 text-xs"
                >
                  {isPending ? "A guardar..." : "Guardar Alterações"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
            <DialogTitle className="text-base font-bold text-slate-900">
              Eliminar Cliente
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tem a certeza de que deseja eliminar o cliente{" "}
              <strong className="text-slate-800">{deletingClient?.name}</strong>? Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
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
