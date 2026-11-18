"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, FilePlus2, MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteClientAction } from "@/app/dashboard/actions";
import { createVisitRequestAction } from "@/app/dashboard/visitas/actions";
import { createClientActivityAction } from "../actions";
import { ClientFormDialog, type ClientFormValues } from "../ClientFormDialog";
import { VisitSchedulingFields, type VisitAssigneeOption } from "@/components/clients/visit-scheduling-fields";
import { texts } from "@/lib/texts";
import { cn } from "@/lib/utils";

const labels = texts.dashboard.clientRecord;

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500";
const labelClass = "block text-xs font-semibold text-slate-700 dark:text-slate-300";
const primaryButton =
  "h-10 min-h-[44px] bg-slate-900 text-white hover:bg-slate-800 text-xs dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400";

type OpenDialog = "visit" | "activity" | "edit" | "delete" | null;

export function ClientRecordActions({
  client,
  canDelete,
  assignees,
  todayKey,
}: {
  client: ClientFormValues;
  canDelete: boolean;
  assignees: VisitAssigneeOption[];
  todayKey: string;
}) {
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [visitAddress, setVisitAddress] = useState("");

  function open(dialog: OpenDialog) {
    setError(null);
    setOpenDialog(dialog);
    if (dialog === "visit") setVisitAddress("");
  }

  function close() {
    setOpenDialog(null);
    setError(null);
  }

  function submitVisit(formData: FormData) {
    formData.set("clientId", client.id);
    startTransition(async () => {
      const result = await createVisitRequestAction(formData);
      if ("error" in result) return setError(result.error ?? null);
      close();
      router.refresh();
    });
  }

  function submitActivity(formData: FormData) {
    startTransition(async () => {
      const result = await createClientActivityAction(client.id, formData);
      if ("error" in result) return setError(result.error ?? null);
      close();
      router.refresh();
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteClientAction(client.id);
      if ("error" in result) return setError(result.error ?? null);
      router.push("/dashboard/clientes");
    });
  }

  const actionButton =
    "inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => open("visit")} className={cn(actionButton, "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 hover:border-slate-800 dark:border-amber-500 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400")}>
          <CalendarPlus className="h-4 w-4" />
          {labels.actions.scheduleVisit}
        </button>
        <button type="button" onClick={() => open("activity")} className={actionButton}>
          <MessageSquarePlus className="h-4 w-4" />
          {labels.actions.logActivity}
        </button>
        <Link href={`/dashboard/orcamentos/novo?cliente=${client.id}`} className={actionButton}>
          <FilePlus2 className="h-4 w-4" />
          {labels.actions.createBudget}
        </Link>
        <button type="button" onClick={() => open("edit")} className={actionButton} aria-label={labels.actions.edit}>
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">{labels.actions.edit}</span>
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={() => open("delete")}
            className={cn(actionButton, "text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300")}
            aria-label={labels.actions.delete}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Marcar visita */}
      <Dialog open={openDialog === "visit"} onOpenChange={(next) => !next && close()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">{labels.visitForm.title}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">{labels.visitForm.description}</DialogDescription>
          </DialogHeader>
          <ErrorBox error={error} />
          <form action={submitVisit} className="min-w-0 space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="visit-address" className={labelClass}>{labels.visitForm.address} *</label>
                {client.address && (
                  <button
                    type="button"
                    onClick={() => setVisitAddress(client.address ?? "")}
                    className="text-[11px] font-semibold text-amber-700 hover:underline dark:text-amber-400"
                  >
                    {labels.visitForm.useClientAddress}
                  </button>
                )}
              </div>
              <input
                id="visit-address"
                name="requestedAddress"
                required
                minLength={3}
                maxLength={300}
                value={visitAddress}
                onChange={(event) => setVisitAddress(event.target.value)}
                className={inputClass}
              />
            </div>
            <VisitSchedulingFields assignees={assignees} todayKey={todayKey} />
            <div>
              <label htmlFor="visit-notes" className={labelClass}>{labels.visitForm.notes}</label>
              <textarea id="visit-notes" name="notes" rows={2} maxLength={2000} className={inputClass} />
            </div>
            <DialogFooter onCancel={close} isPending={isPending} submitLabel={isPending ? labels.visitForm.saving : labels.visitForm.save} />
          </form>
        </DialogContent>
      </Dialog>

      {/* Registar interação */}
      <Dialog open={openDialog === "activity"} onOpenChange={(next) => !next && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">{labels.activityForm.title}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">{labels.activityForm.description}</DialogDescription>
          </DialogHeader>
          <ErrorBox error={error} />
          <form action={submitActivity} className="min-w-0 space-y-3">
            <fieldset>
              <legend className={labelClass}>{labels.activityForm.type}</legend>
              <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["CALL", "EMAIL", "MEETING", "NOTE"] as const).map((type, index) => (
                  <label
                    key={type}
                    className="flex min-h-[40px] cursor-pointer items-center justify-center rounded-lg border border-slate-200 px-2 text-center text-[11px] font-semibold text-slate-700 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50 has-[:checked]:text-amber-900 dark:border-slate-700 dark:text-slate-300 dark:has-[:checked]:bg-amber-950/40 dark:has-[:checked]:text-amber-300"
                  >
                    <input type="radio" name="type" value={type} defaultChecked={index === 0} className="sr-only" />
                    {labels.timeline.activityTitles[type]}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="activity-occurred" className={labelClass}>{labels.activityForm.occurredAt}</label>
              <input id="activity-occurred" name="occurredAt" type="datetime-local" className={inputClass} />
            </div>
            <div>
              <label htmlFor="activity-text" className={labelClass}>{labels.activityForm.text} *</label>
              <textarea
                id="activity-text"
                name="description"
                required
                minLength={2}
                maxLength={2000}
                rows={3}
                placeholder={labels.activityForm.textPlaceholder}
                className={inputClass}
              />
            </div>
            <DialogFooter onCancel={close} isPending={isPending} submitLabel={isPending ? labels.activityForm.saving : labels.activityForm.save} />
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar cliente */}
      <ClientFormDialog
        open={openDialog === "edit"}
        onOpenChange={(next) => !next && close()}
        client={client}
        onSaved={() => {
          close();
          router.refresh();
        }}
      />

      {/* Eliminar cliente */}
      <Dialog open={openDialog === "delete"} onOpenChange={(next) => !next && close()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">{labels.deleteConfirm.title}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              {labels.deleteConfirm.description(client.name)}
            </DialogDescription>
          </DialogHeader>
          <ErrorBox error={error} />
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" disabled={isPending} onClick={close} className="h-10 min-h-[44px] text-xs">
              {labels.deleteConfirm.cancel}
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={confirmDelete}
              className="h-10 min-h-[44px] bg-red-600 text-white hover:bg-red-700 text-xs font-semibold"
            >
              {isPending ? labels.deleteConfirm.deleting : labels.deleteConfirm.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
      {error}
    </div>
  );
}

function DialogFooter({ onCancel, isPending, submitLabel }: { onCancel: () => void; isPending: boolean; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline" disabled={isPending} onClick={onCancel} className="h-10 min-h-[44px] text-xs">
        {labels.deleteConfirm.cancel}
      </Button>
      <Button type="submit" disabled={isPending} className={primaryButton}>
        {submitLabel}
      </Button>
    </div>
  );
}
