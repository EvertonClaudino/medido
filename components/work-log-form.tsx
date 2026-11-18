"use client";

import { useState } from "react";
import { ArrowRightIcon, PlusCircleIcon, TrashIcon } from "@/components/icons";

interface ProjectOption {
  id: string;
  name: string;
}

interface MeasurementItem {
  id: string;
  description: string;
  quantity: string;
  unit: "M" | "M2" | "M3" | "UN" | "KG";
}

const MEASURE_UNITS = [
  { value: "M", label: "Metro linear (m)" },
  { value: "M2", label: "Metro quadrado (m²)" },
  { value: "M3", label: "Metro cúbico (m³)" },
  { value: "UN", label: "Unidade (un)" },
  { value: "KG", label: "Quilograma (kg)" },
];

export function WorkLogForm({
  projects,
  defaultProjectId,
  onSubmitAction,
}: {
  projects: ProjectOption[];
  defaultProjectId?: string;
  onSubmitAction: (formData: FormData) => Promise<{ error?: string; success?: boolean } | void>;
}) {
  const [projectId, setProjectId] = useState(defaultProjectId || "");
  const [workDate, setWorkDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [hours, setHours] = useState("8");
  const [description, setDescription] = useState("");
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addMeasurement() {
    if (measurements.length >= 20) {
      setErrorMsg("O limite máximo é de 20 medições por registo.");
      return;
    }
    setMeasurements((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        description: "",
        quantity: "",
        unit: "M2",
      },
    ]);
  }

  function removeMeasurement(id: string) {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  }

  function updateMeasurement(id: string, field: keyof MeasurementItem, value: string) {
    setMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

    const hasHours = hours.trim() !== "" && Number(hours) > 0;
    const hasMeasurements = measurements.length > 0;

    if (!hasHours && !hasMeasurements) {
      setErrorMsg("Tem de preencher as horas trabalhadas ou adicionar pelo menos uma medição.");
      return;
    }

    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("workDate", workDate);
    if (hasHours) {
      formData.set("hours", hours);
    }
    if (description.trim()) {
      formData.set("description", description.trim());
    }

    measurements.forEach((m, idx) => {
      formData.set(`measurement_${idx}_description`, m.description);
      formData.set(`measurement_${idx}_quantity`, m.quantity);
      formData.set(`measurement_${idx}_unit`, m.unit);
    });

    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(formData);
      if (result && "error" in result && result.error) {
        setErrorMsg(result.error);
        setIsSubmitting(false);
      }
    } catch {
      setErrorMsg("Ocorreu um erro ao submeter o registo.");
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5 text-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {errorMsg && (
        <div className="rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60">
          {errorMsg}
        </div>
      )}

      {/* Obra */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Obra / Empreitada *
        </label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          required
          className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-slate-900 focus:border-amber-500 focus:outline-hidden bg-white text-base dark:border-slate-700 dark:text-white dark:bg-slate-900"
        >
          <option value="">Selecione a obra</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Data e Horas em Linha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Data do Trabalho *
          </label>
          <input
            type="date"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            required
            className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-slate-900 focus:border-amber-500 focus:outline-hidden text-base dark:border-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Horas de Trabalho (opcional)
          </label>
          <input
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Ex.: 8"
            className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-slate-900 focus:border-amber-500 focus:outline-hidden font-mono text-base dark:border-slate-700 dark:text-white"
          />
          <p className="mt-1 text-[11px] text-slate-400">Passos de 0,25h (ex: 7,5 ou 8)</p>
        </div>
      </div>

      {/* Descrição geral */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Descrição dos Trabalhos (opcional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Ex.: Aplicação de betonilha e preparação de armaduras para betonagem."
          className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-slate-900 focus:border-amber-500 focus:outline-hidden text-base dark:border-slate-700 dark:text-white"
        />
      </div>

      {/* Secção de Medições de Obra */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Medições Executadas ({measurements.length}/20)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Adicione quantidades métricas concluídas no dia.
            </p>
          </div>
          <button
            type="button"
            onClick={addMeasurement}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition active:scale-95 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/40"
          >
            <PlusCircleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Adicionar Medição
          </button>
        </div>

        {measurements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-800">
            Nenhuma medição adicionada. Pode registar apenas horas ou acrescentar medições aqui.
          </div>
        ) : (
          <div className="space-y-3">
            {measurements.map((m, idx) => (
              <div
                key={m.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Medição #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMeasurement(m.id)}
                    className="text-slate-400 hover:text-red-600 transition p-1"
                    title="Remover medição"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    placeholder="Descrição do serviço (ex: Alvenaria de tijolo 15cm)"
                    value={m.description}
                    onChange={(e) => updateMeasurement(m.id, "description", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 bg-white focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:text-white dark:bg-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      max="999999.999"
                      required
                      placeholder="Qtd (ex: 24.500)"
                      value={m.quantity}
                      onChange={(e) => updateMeasurement(m.id, "quantity", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2.5 font-mono text-xs text-slate-900 bg-white focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:text-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <select
                      value={m.unit}
                      onChange={(e) =>
                        updateMeasurement(
                          m.id,
                          "unit",
                          e.target.value as MeasurementItem["unit"]
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 bg-white focus:border-amber-500 focus:outline-hidden dark:border-slate-700 dark:text-white dark:bg-slate-900"
                    >
                      {MEASURE_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 p-3.5 text-base font-bold text-white shadow-md active:scale-95 transition hover:bg-amber-500 disabled:opacity-50"
      >
        {isSubmitting ? "A guardar..." : "Submeter Registo"}
        <ArrowRightIcon className="h-5 w-5" />
      </button>
    </form>
  );
}

