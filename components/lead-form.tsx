"use client";

import { useState, type FormEvent } from "react";
import { CheckCircleIcon, AlertCircleIcon, ArrowRightIcon } from "./icons";

interface FormState {
  status: "idle" | "submitting" | "success" | "error";
  message: string;
}

export function LeadForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Antispam
  const [state, setState] = useState<FormState>({
    status: "idle",
    message: "",
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Se o honeypot estiver preenchido, é um bot
    if (honeypot.trim() !== "") {
      setState({
        status: "success",
        message: "Obrigado! O seu pedido de acesso antecipado foi recebido.",
      });
      return;
    }

    if (!fullName.trim() || !email.trim() || !company.trim()) {
      setState({
        status: "error",
        message: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setState({
        status: "error",
        message: "Por favor, introduza um endereço de email válido.",
      });
      return;
    }

    setState({ status: "submitting", message: "" });

    // Demonstração local sem base de dados ativa por agora
    setTimeout(() => {
      setState({
        status: "success",
        message:
          "Obrigado pelo seu interesse! O seu registo para acesso antecipado foi gravado com sucesso. Entraremos em contacto brevemente.",
      });
      setFullName("");
      setEmail("");
      setCompany("");
    }, 600);
  };

  return (
    <div
      id="acesso-antecipado"
      className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-100"
    >
      <div className="mb-6 text-center">
        <span className="inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700">
          Vagas Limitadas
        </span>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Garantir Acesso Antecipado
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Junte-se à lista restrita de empresas que vão testar o Medido em primeira mão.
        </p>
      </div>

      {state.status === "success" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircleIcon className="mx-auto h-10 w-10 text-emerald-600" />
          <h4 className="mt-3 text-lg font-semibold text-emerald-900">
            Registo Confirmado
          </h4>
          <p className="mt-1 text-sm text-emerald-800">{state.message}</p>
          <button
            type="button"
            onClick={() => setState({ status: "idle", message: "" })}
            className="mt-5 inline-flex items-center rounded-lg border border-emerald-300 bg-white px-4 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
          >
            Submeter outro contacto
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot hidden input */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-medium uppercase tracking-wider text-slate-700"
            >
              Nome Completo *
            </label>
            <input
              type="text"
              id="fullName"
              required
              placeholder="Ex.: António Ferreira"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-wider text-slate-700"
            >
              Email Profissional *
            </label>
            <input
              type="email"
              id="email"
              required
              placeholder="antonio@construcoes.pt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="company"
              className="block text-xs font-medium uppercase tracking-wider text-slate-700"
            >
              Nome da Empresa / Construtora *
            </label>
            <input
              type="text"
              id="company"
              required
              placeholder="Ex.: Ferreira & Filhos Engenharia"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {state.status === "error" && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-600" />
              <span>{state.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={state.status === "submitting"}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-600/30 disabled:opacity-70"
          >
            {state.status === "submitting" ? (
              "A registar..."
            ) : (
              <>
                Garantir acesso antecipado
                <ArrowRightIcon className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-500">
            Sem compromisso ou fidelização. Os seus dados são tratados com total confidencialidade.
          </p>
        </form>
      )}
    </div>
  );
}

