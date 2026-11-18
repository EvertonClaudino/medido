"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClientAction, updateClientAction } from "@/app/dashboard/actions";

export interface ClientFormValues {
  id: string;
  name: string;
  nif: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
}

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sem cliente = criação; com cliente = edição */
  client?: ClientFormValues | null;
  onSaved: (clientId: string) => void;
}

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500";
const labelClass = "block text-xs font-semibold text-slate-700 dark:text-slate-300";

export function ClientFormDialog({ open, onOpenChange, client, onSaved }: ClientFormDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(client);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      if (client) {
        const result = await updateClientAction(client.id, formData);
        if ("error" in result) return setError(result.error ?? null);
        onSaved(client.id);
      } else {
        const result = await createClientAction(formData);
        if ("error" in result) return setError(result.error ?? null);
        onSaved(result.clientId);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
            {isEdit ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {isEdit
              ? "Atualize as informações fiscais e os contactos do cliente."
              : "Registe uma nova entidade ou cliente particular. A seguir pode marcar a visita na ficha do cliente."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <form key={client?.id ?? "new"} action={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="client-name" className={labelClass}>Nome do cliente ou empresa *</label>
            <input
              id="client-name"
              type="text"
              name="name"
              required
              maxLength={150}
              defaultValue={client?.name ?? ""}
              placeholder="Ex.: Imobiliária Nova Luz, Lda."
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="client-nif" className={labelClass}>NIF</label>
              <input
                id="client-nif"
                type="text"
                name="nif"
                maxLength={20}
                defaultValue={client?.nif ?? ""}
                placeholder="501 234 567"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="client-phone" className={labelClass}>Telefone</label>
              <input
                id="client-phone"
                type="tel"
                name="phone"
                maxLength={30}
                defaultValue={client?.phone ?? ""}
                placeholder="+351 912 345 678"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="client-email" className={labelClass}>Email</label>
            <input
              id="client-email"
              type="email"
              name="email"
              maxLength={254}
              defaultValue={client?.email ?? ""}
              placeholder="contacto@novaluz.pt"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="client-address" className={labelClass}>Morada Fiscal</label>
            <input
              id="client-address"
              type="text"
              name="address"
              maxLength={300}
              defaultValue={client?.address ?? ""}
              placeholder="Av. da Liberdade, 100, Lisboa"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="client-notes" className={labelClass}>Observações</label>
            <textarea
              id="client-notes"
              name="notes"
              maxLength={2000}
              rows={2}
              defaultValue={client?.notes ?? ""}
              placeholder="Detalhes adicionais, pessoa de contacto preferencial..."
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className="h-10 min-h-[44px] text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-10 min-h-[44px] bg-slate-900 text-white hover:bg-slate-800 text-xs dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
            >
              {isPending ? "A guardar..." : isEdit ? "Guardar Alterações" : "Registar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
