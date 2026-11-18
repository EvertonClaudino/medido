"use client";

import { useState, useTransition } from "react";
import { VisitStatus } from "@prisma/client";
import { CalendarClock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateVisitStatusAction } from "@/app/dashboard/visitas/actions";
import { VisitSchedulingFields, type VisitAssigneeOption } from "./visit-scheduling-fields";
import { texts } from "@/lib/texts";

export interface VisitScheduleState {
  assignedToId: string | null;
  durationMinutes: number;
  /** Data e hora atuais em Lisboa (YYYY-MM-DD / HH:mm), quando agendada */
  date: string;
  time: string;
}

export default function VisitStatusControls({
  visitRequestId,
  status,
  schedule,
  assignees,
  todayKey,
}: {
  visitRequestId: string;
  status: VisitStatus;
  schedule: VisitScheduleState;
  assignees: VisitAssigneeOption[];
  todayKey: string;
}) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const labels = texts.dashboard.visits;

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateVisitStatusAction(visitRequestId, formData);
      if ("error" in result) {
        setError(result.error ?? labels.error);
        return;
      }
      setConfirmingCancel(false);
      setScheduling(false);
    });
  }

  function changeStatus(nextStatus: VisitStatus) {
    const formData = new FormData();
    formData.set("status", nextStatus);
    submit(formData);
  }

  if (status === VisitStatus.CANCELLED || status === VisitStatus.COMPLETED) return null;

  const buttonBase =
    "inline-flex min-h-[36px] items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold transition disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setError(null);
            setScheduling(true);
          }}
          className={`${buttonBase} ${
            status === VisitStatus.REQUESTED
              ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              : "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          {status === VisitStatus.REQUESTED ? labels.schedule : labels.reschedule}
        </button>
        {status === VisitStatus.SCHEDULED && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => changeStatus(VisitStatus.COMPLETED)}
            className={`${buttonBase} bg-emerald-600 text-white hover:bg-emerald-700`}
          >
            {labels.complete}
          </button>
        )}
        {confirmingCancel ? (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => changeStatus(VisitStatus.CANCELLED)}
              className={`${buttonBase} bg-red-600 text-white hover:bg-red-700`}
            >
              {labels.cancelConfirmation}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirmingCancel(false)}
              className={`${buttonBase} border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800`}
            >
              {texts.dashboard.clientRecord.deleteConfirm.cancel}
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirmingCancel(true)}
            className={`${buttonBase} border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40`}
          >
            {labels.cancel}
          </button>
        )}
      </div>
      {error && !scheduling && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      <Dialog open={scheduling} onOpenChange={(open) => !open && setScheduling(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              {status === VisitStatus.REQUESTED ? labels.schedule : labels.reschedule}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">{labels.agendaHint}</DialogDescription>
          </DialogHeader>
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}
          <form action={submit} className="min-w-0 space-y-3">
            <input type="hidden" name="status" value={VisitStatus.SCHEDULED} />
            <VisitSchedulingFields
              assignees={assignees}
              todayKey={todayKey}
              defaultAssigneeId={schedule.assignedToId}
              defaultDurationMinutes={schedule.durationMinutes}
              defaultDate={schedule.date}
              defaultTime={schedule.time}
              ignoreVisitId={visitRequestId}
              dateRequired
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" disabled={isPending} onClick={() => setScheduling(false)} className="h-10 min-h-[44px] text-xs">
                {texts.dashboard.clientRecord.deleteConfirm.cancel}
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="h-10 min-h-[44px] bg-slate-900 text-white hover:bg-slate-800 text-xs dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                {isPending ? labels.saving : status === VisitStatus.REQUESTED ? labels.schedule : labels.reschedule}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
