"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  MapPin,
  User,
  AlertTriangle,
  Receipt,
  FileCheck2,
} from "lucide-react";
import { approveBudgetAndCreateProjectAction } from "./actions";
import { calculateBudgetTotals, formatBudgetAmount, type BudgetLineInput } from "@/lib/budget-utils";

export interface BudgetApprovalClientData {
  id: string;
  name: string;
  nif?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface BudgetApprovalItemData {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
}

interface BudgetApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId: string;
  projectName: string;
  workAddress: string;
  notes: string | null;
  client: BudgetApprovalClientData;
  items: BudgetApprovalItemData[];
  revisionNumber: number;
  updatedAtIso: string;
  suggestedCode?: string;
  onSuccess?: (projectId: string) => void;
}

export default function BudgetApprovalDialog({
  open,
  onOpenChange,
  budgetId,
  projectName: initialProjectName,
  workAddress: initialWorkAddress,
  notes,
  client,
  items,
  revisionNumber,
  updatedAtIso,
  suggestedCode,
  onSuccess,
}: BudgetApprovalDialogProps) {
  const router = useRouter();
  const [confirmedProjectName, setConfirmedProjectName] = useState(initialProjectName);
  const [confirmedAddress, setConfirmedAddress] = useState(initialWorkAddress);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRevisionMismatch, setIsRevisionMismatch] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Calcular totais usando rigorosamente as regras financeiras existentes
  const budgetLines: BudgetLineInput[] = items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
    vatRate: item.vatRate,
  }));
  const totals = calculateBudgetTotals(budgetLines);

  function handleConfirm() {
    setError(null);
    setIsRevisionMismatch(false);

    if (!locationConfirmed) {
      setError("Tem de marcar a caixa a confirmar que a morada indicada corresponde à localização correta do estaleiro.");
      return;
    }

    if (!confirmedAddress.trim() || confirmedAddress.trim().length < 3) {
      setError("A localização do estaleiro tem de ter pelo menos 3 caracteres.");
      return;
    }

    if (!confirmedProjectName.trim() || confirmedProjectName.trim().length < 2) {
      setError("O nome da obra tem de ter pelo menos 2 caracteres.");
      return;
    }

    startTransition(async () => {
      const result = await approveBudgetAndCreateProjectAction({
        budgetId,
        expectedRevisionNumber: revisionNumber,
        expectedUpdatedAt: updatedAtIso,
        confirmedProjectName: confirmedProjectName.trim(),
        confirmedAddress: confirmedAddress.trim(),
        locationConfirmed: true,
      });

      if ("error" in result && result.error) {
        setError(result.error);
        if ("code" in result && result.code === "REVISION_MISMATCH") {
          setIsRevisionMismatch(true);
        }
      } else if ("success" in result && result.success) {
        onOpenChange(false);
        if (onSuccess && result.projectId) {
          onSuccess(result.projectId);
        } else {
          router.push("/dashboard/obras");
          router.refresh();
        }
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2 dark:text-white">
            <FileCheck2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span>Pré-visualização e Aprovação de Orçamento</span>
          </DialogTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reveja os detalhes comerciais e confirme a localização do estaleiro antes de criar a obra associada.
          </p>
        </DialogHeader>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5 dark:text-rose-400" />
              <div className="space-y-1">
                <p className="font-semibold">{error}</p>
                {isRevisionMismatch && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      router.refresh();
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
                  >
                    Recarregar Dados Atualizados
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-5 text-xs">
          {/* 1. Dados do Cliente (Apenas Informativos) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-400 text-[10px] mb-2">
              <User className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>Dados do Cliente (Registo Comercial)</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 text-slate-700 dark:text-slate-300">
              <div>
                <span className="text-slate-400 block text-[10px]">Nome / Razão Social:</span>
                <span className="font-bold text-slate-900 text-sm dark:text-white">{client.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">NIF:</span>
                <span className="font-medium">{client.nif || "Não especificado"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Morada Fiscal / Sede:</span>
                <span className="font-medium truncate block" title={client.address || ""}>
                  {client.address || "Não especificada"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Contacto:</span>
                <span className="font-medium">
                  {[client.email, client.phone].filter(Boolean).join(" • ") || "Sem contactos diretos"}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Identificação da Futura Obra */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Nome da Futura Obra *
              </label>
              {suggestedCode && (
                <span className="font-mono text-[10px] text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded font-semibold dark:text-blue-300 dark:bg-blue-950/40">
                  Código Previsto: {suggestedCode}
                </span>
              )}
            </div>
            <input
              type="text"
              value={confirmedProjectName}
              onChange={(e) => setConfirmedProjectName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:text-white"
              placeholder="Ex.: Reabilitação de Telhado e Alvenarias"
            />
            {notes && (
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200/80 text-[11px] text-slate-600 dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400">
                <span className="font-bold text-slate-700 block mb-0.5 dark:text-slate-300">Notas do Orçamento:</span>
                <p className="whitespace-pre-line">{notes}</p>
              </div>
            )}
          </div>

          {/* 3. Localização da Obra / Estaleiro (Confirmação Explícita Obrigatória) */}
          <div className="rounded-xl border border-amber-200/90 bg-amber-50/50 p-4 space-y-3 dark:bg-amber-950/40">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs dark:text-amber-300">
              <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Localização Efetiva da Obra / Estaleiro *</span>
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              A morada da obra corresponde à frente de trabalho real e pode ser diferente da morada fiscal do cliente.
              Confirme ou corrija o endereço abaixo.
            </p>

            <input
              type="text"
              value={confirmedAddress}
              onChange={(e) => setConfirmedAddress(e.target.value)}
              className="w-full rounded-lg border border-amber-300 bg-white p-2.5 text-xs text-slate-900 focus:border-amber-600 focus:outline-none dark:border-amber-900/60 dark:bg-slate-900 dark:text-white"
              placeholder="Ex.: Rua das Flores 12, Lisboa"
            />

            <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={locationConfirmed}
                onChange={(e) => setLocationConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 dark:text-amber-400"
              />
              <span className="text-xs font-bold text-amber-950">
                Confirmo que esta é a localização correta da obra.
              </span>
            </label>
          </div>

          {/* 4. Linhas Comerciais do Orçamento */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-slate-400" />
                <span>Trabalhos & Artigos Orçamentados ({items.length})</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">Valores unitários e IVA</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-[11px] divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-3 py-2">Descrição dos Trabalhos</th>
                    <th className="px-2 py-2 text-right">Qtd</th>
                    <th className="px-2 py-2 text-center">Un.</th>
                    <th className="px-3 py-2 text-right">Preço Unit.</th>
                    <th className="px-2 py-2 text-right">IVA</th>
                    <th className="px-3 py-2 text-right">Total c/ IVA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800 dark:text-slate-300">
                  {items.map((line, index) => {
                    const lineNet = line.quantity * line.unitPrice;
                    const lineVat = lineNet * (line.vatRate / 100);
                    const lineGross = lineNet + lineVat;

                    return (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-medium text-slate-900 max-w-xs truncate dark:text-white" title={line.description}>
                          {line.description}
                        </td>
                        <td className="px-2 py-2 text-right font-mono">{line.quantity}</td>
                        <td className="px-2 py-2 text-center text-slate-500 dark:text-slate-400">{line.unit}</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {formatBudgetAmount(Math.round(line.unitPrice * 100))}
                        </td>
                        <td className="px-2 py-2 text-right text-slate-500 font-mono dark:text-slate-400">{line.vatRate}%</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatBudgetAmount(Math.round(lineGross * 100))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Resumo Financeiro Rigoroso */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5 text-xs dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Total sem IVA:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">{formatBudgetAmount(totals.netCents)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>IVA Total:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">{formatBudgetAmount(totals.vatCents)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm dark:border-slate-800">
              <span className="font-black text-slate-900 dark:text-white">Valor Total da Empreitada (com IVA):</span>
              <span className="font-mono text-base font-black text-emerald-700 dark:text-emerald-300">
                {formatBudgetAmount(totals.grossCents)}
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal: Cancelar / Confirmar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <DialogClose asChild>
            <button
              type="button"
              disabled={isPending}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
          </DialogClose>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || !locationConfirmed}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {isPending ? (
              <span>A aprovar e criar obra...</span>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirmar e criar obra</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
