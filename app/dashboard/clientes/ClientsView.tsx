"use client";

import { useState, useTransition, useRef } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createClientAction,
  updateClientAction,
  deleteClientAction,
} from "@/app/dashboard/actions";

interface ClientData {
  id: string;
  name: string;
  nif: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  _count: { projects: number; visitRequests: number; budgets: number };
}

interface ClientsViewProps {
  clients: ClientData[];
}

export default function ClientsView({ clients }: ClientsViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createClientAction(formData);
      if ("error" in result) {
        setError(result.error ?? null);
      } else {
        setShowCreateModal(false);
        formRef.current?.reset();
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
        setDeletingClient(null);
      }
    });
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Clientes</h1>
          <p className="text-xs text-slate-500">
            {clients.length === 0
              ? "Sem clientes registados"
              : `${clients.length} cliente${clients.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo Cliente
        </button>
      </div>

      {/* Grelha de Clientes */}
      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mb-3 h-10 w-10 text-slate-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="text-sm font-semibold text-slate-700">Sem clientes registados</p>
          <p className="mt-1 text-xs text-slate-400">
            Comece por adicionar o primeiro cliente da empresa.
          </p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setShowCreateModal(true);
            }}
            className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-500"
          >
            Novo Cliente
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-900">{client.name}</h2>
                  {client.nif && (
                    <p className="text-xs text-slate-500">NIF: {client.nif}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {client._count.projects} obra{client._count.projects !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="mt-3 space-y-1">
                {client.email && (
                  <p className="flex items-center gap-1.5 text-xs text-slate-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 shrink-0 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                      />
                    </svg>
                    <span className="truncate">{client.email}</span>
                  </p>
                )}
                {client.phone && (
                  <p className="flex items-center gap-1.5 text-xs text-slate-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 shrink-0 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                      />
                    </svg>
                    {client.phone}
                  </p>
                )}
                {client.address && (
                  <p className="flex items-start gap-1.5 text-xs text-slate-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                    <span className="line-clamp-2">{client.address}</span>
                  </p>
                )}
              </div>

              {/* Acções */}
              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setEditingClient(client);
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Editar
                </button>
                {client._count.projects === 0 &&
                  client._count.visitRequests === 0 &&
                  client._count.budgets === 0 && (
                  <button
                    type="button"
                    onClick={() => setDeletingClient(client)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
        <DialogContent
          className="gap-0 rounded-2xl bg-white p-0 text-slate-900 shadow-2xl ring-0 sm:max-w-lg"
          showCloseButton={false}
        >
          <DialogHeader className="-mx-0 -mt-0 flex-row items-center justify-between gap-0 border-b border-slate-100 px-6 py-4">
            <DialogTitle className="text-sm font-bold text-slate-900">
              Novo Cliente
            </DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fechar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </DialogClose>
          </DialogHeader>
          <form ref={formRef} action={handleCreate} className="px-6 py-4">
            <ClientFormFields error={error} />
            <div className="-mx-2 mt-4 flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setError(null);
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:opacity-60"
              >
                {isPending ? "A guardar…" : "Guardar Cliente"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Cliente */}
      <Dialog
        open={!!editingClient}
        onOpenChange={(open) => {
          if (!open) {
            setEditingClient(null);
            setError(null);
          }
        }}
      >
        {editingClient && (
          <DialogContent
            className="gap-0 rounded-2xl bg-white p-0 text-slate-900 shadow-2xl ring-0 sm:max-w-lg"
            showCloseButton={false}
          >
            <DialogHeader className="-mx-0 -mt-0 flex-row items-center justify-between gap-0 border-b border-slate-100 px-6 py-4">
              <DialogTitle className="text-sm font-bold text-slate-900">
                Editar Cliente
              </DialogTitle>
              <DialogClose asChild>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Fechar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </DialogClose>
            </DialogHeader>
            <form action={handleEdit} className="px-6 py-4">
              <ClientFormFields defaultValues={editingClient} error={error} />
              <div className="-mx-2 mt-4 flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingClient(null);
                    setError(null);
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:opacity-60"
                >
                  {isPending ? "A guardar…" : "Guardar Alterações"}
                </button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal: Confirmar Eliminação */}
      <Dialog
        open={!!deletingClient}
        onOpenChange={(open) => {
          if (!open) setDeletingClient(null);
        }}
      >
        {deletingClient && (
          <DialogContent
            className="gap-0 rounded-2xl bg-white p-0 text-slate-900 shadow-2xl ring-0 sm:max-w-sm"
            showCloseButton={false}
          >
            <DialogHeader className="-mx-0 -mt-0 flex-row items-center justify-between gap-0 border-b border-slate-100 px-6 py-4">
              <DialogTitle className="text-sm font-bold text-slate-900">
                Eliminar Cliente
              </DialogTitle>
              <DialogClose asChild>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Fechar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </DialogClose>
            </DialogHeader>
            <div className="px-6 py-4">
              <p className="text-sm text-slate-700">
                Tem a certeza que pretende eliminar o cliente{" "}
                <span className="font-bold">{deletingClient.name}</span>? Esta ação é permanente.
              </p>
              {error && (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>
              )}
              <div className="-mx-2 mt-4 flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setDeletingClient(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
                >
                  {isPending ? "A eliminar…" : "Eliminar"}
                </button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

// ─── Campos reutilizáveis do formulário de cliente ───────────────────────────

interface ClientFormFieldsProps {
  defaultValues?: Partial<ClientData>;
  error: string | null;
}

function ClientFormFields({ defaultValues, error }: ClientFormFieldsProps) {
  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>
      )}

      <div>
        <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-slate-700">
          Nome <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name ?? ""}
          placeholder="Ex: Construções Silva, Lda."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="nif" className="mb-1.5 block text-xs font-semibold text-slate-700">
            NIF
          </label>
          <input
            id="nif"
            name="nif"
            type="text"
            defaultValue={defaultValues?.nif ?? ""}
            placeholder="Ex: 500123456"
            maxLength={20}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-xs font-semibold text-slate-700">
            Telefone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={defaultValues?.phone ?? ""}
            placeholder="Ex: 912 345 678"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-700">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultValues?.email ?? ""}
          placeholder="Ex: geral@empresa.pt"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div>
        <label htmlFor="address" className="mb-1.5 block text-xs font-semibold text-slate-700">
          Morada
        </label>
        <input
          id="address"
          name="address"
          type="text"
          defaultValue={defaultValues?.address ?? ""}
          placeholder="Ex: Rua das Flores, 123, Lisboa"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-xs font-semibold text-slate-700">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
          placeholder="Observações internas sobre este cliente…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
        />
      </div>
    </div>
  );
}
