import { LeadForm } from "@/components/lead-form";
import {
  BuildingIcon,
  HardHatIcon,
  UserCheckIcon,
  ClipboardListIcon,
  ShieldAlertIcon,
  TrendingUpIcon,
  ArrowRightIcon,
} from "@/components/icons";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Medido
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              Obras & Medições
            </span>
          </div>

          <nav className="hidden items-center gap-8 md:flex text-sm font-medium text-slate-600">
            <a href="#problema" className="transition hover:text-slate-900">
              Desafios
            </a>
            <a href="#perfis" className="transition hover:text-slate-900">
              Perfis
            </a>
            <a href="#como-funciona" className="transition hover:text-slate-900">
              Como Funciona
            </a>
            <a href="#faq" className="transition hover:text-slate-900">
              Perguntas Frequentes
            </a>
          </nav>

          <a
            href="#acesso-antecipado"
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            Acesso Antecipado
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-linear-to-b from-slate-50 to-white py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-medium text-amber-900">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
              SaaS B2B para Construção Civil em Portugal
            </div>

            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Controlo total da obra e da equipa,{" "}
              <span className="text-amber-600">do estaleiro ao escritório.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 md:text-xl">
              Elimine as folhas soltas de papel e as mensagens perdidas em grupos de
              chat. O Medido centraliza o registo de trabalhos, tarefas diárias e medições
              com ecrãs dedicados ao Dono, Encarregado e Funcionário.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#acesso-antecipado"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-amber-600/20 transition hover:bg-amber-500"
              >
                Garantir acesso antecipado
                <ArrowRightIcon className="h-5 w-5" />
              </a>
              <a
                href="#perfis"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Ver como funciona por perfil
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Multi-empresa com dados totalmente isolados
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Interface otimizada para telemóvel e obra
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Adaptado à realidade fiscal e empresarial de Portugal
              </div>
            </div>
          </div>
        </section>

        {/* Problema Section */}
        <section id="problema" className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                O Desafio Diário
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                A sua empresa perde margem quando a informação não chega a tempo.
              </p>
              <p className="mt-4 text-base text-slate-600">
                Na construção civil, a distância entre o que acontece no terreno e o que
                o escritório sabe gera retrabalho, desvios e atrasos orçamentais.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8">
                <div className="inline-flex rounded-xl bg-red-100 p-3 text-red-700">
                  <ShieldAlertIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Informação Dispersa
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Apontamentos em papel, fotografias espalhadas por conversas de
                  telemóvel e medições anotadas à mão que acabam por se perder ou ser
                  esquecidas.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8">
                <div className="inline-flex rounded-xl bg-amber-100 p-3 text-amber-700">
                  <TrendingUpIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Desvios Descobertos Tarde
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  A administração só descobre que uma etapa derrapou no orçamento no fim
                  do mês, quando as faturas já chegaram e os prazos já foram
                  ultrapassados.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8">
                <div className="inline-flex rounded-xl bg-blue-100 p-3 text-blue-700">
                  <ClipboardListIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Encarregados Sobrecarregados
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Dezenas de telefonemas diários para esclarecer quem está onde, quais são
                  as tarefas prioritárias e se os materiais já foram aplicados.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Perfis Section */}
        <section id="perfis" className="border-t border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Solução à Medida
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Uma única plataforma. Vistas específicas para cada responsabilidade.
              </p>
              <p className="mt-4 text-base text-slate-600">
                Cada elemento da empresa vê estritamente o que precisa para ser rápido e
                produtivo, sem ecrãs complexos ou confusos.
              </p>
            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {/* Dono */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <BuildingIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-xs font-semibold uppercase text-slate-500">
                        Perfil 1
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">
                        Dono da Empresa
                      </h3>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">
                    Acesso completo e estratégico a todas as obras, orçamentos, equipas e
                    configurações da organização.
                  </p>
                  <ul className="mt-6 space-y-3 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                      Visão macro de todas as empreitadas ativas
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                      Acompanhamento de custos e rentabilidade
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                      Gestão de utilizadores e autorizações
                    </li>
                  </ul>
                </div>
                <div className="mt-8 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
                  Ideal para: Gerentes, Sócios e Diretores Gerais
                </div>
              </div>

              {/* Encarregado */}
              <div className="flex flex-col justify-between rounded-2xl border-2 border-amber-600/40 bg-white p-8 shadow-md relative">
                <div className="absolute -top-3 right-6 rounded-full bg-amber-600 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                  Chave em Obra
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white">
                      <HardHatIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-xs font-semibold uppercase text-amber-700">
                        Perfil 2
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">
                        Encarregado de Obra
                      </h3>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">
                    Gestão diária no terreno. Organização da equipa atribuída, validação
                    de tarefas executadas e registo de medições.
                  </p>
                  <ul className="mt-6 space-y-3 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                      Alocação de tarefas diárias aos colaboradores
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                      Aprovação e registo ágil de medições no telemóvel
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                      Comunicação direta com o escritório central
                    </li>
                  </ul>
                </div>
                <div className="mt-8 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
                  Ideal para: Encarregados Gerais e Chefes de Equipa
                </div>
              </div>

              {/* Funcionário */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                      <UserCheckIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-xs font-semibold uppercase text-slate-500">
                        Perfil 3
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">
                        Funcionário / Operacional
                      </h3>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">
                    Sem menus desnecessários. Consulta direta das tarefas atribuídas para
                    o dia e registo simples do trabalho realizado.
                  </p>
                  <ul className="mt-6 space-y-3 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                      Lista clara de tarefas a realizar no dia
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                      Registo rápido de conclusão com fotos
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                      Interface leve pensada para telemóveis comuns
                    </li>
                  </ul>
                </div>
                <div className="mt-8 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
                  Ideal para: Oficiais, Ajudantes e Técnicos Especializados
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Como Funciona Section */}
        <section id="como-funciona" className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Passo a Passo
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Simples de implementar. Rápido de ver retorno.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700">
                  1
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  Crie a sua empresa e obras
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Registe as obras ativas, prazos previstos e objetivos principais em
                  menos de 5 minutos.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700">
                  2
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  Atribua encarregados e equipas
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Convide os seus encarregados e colaboradores com acessos estritamente
                  definidos para as suas funções.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700">
                  3
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  Acompanhe e meça em tempo real
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  As medições e o avanço diário ficam imediatamente visíveis para tomada
                  de decisões com rigor técnico.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Formulário de Conversão */}
        <section className="border-t border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <LeadForm />
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Esclarecimentos
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Perguntas Frequentes
              </p>
            </div>

            <div className="mt-12 space-y-6">
              <div className="rounded-xl border border-slate-200 p-6">
                <h3 className="text-base font-bold text-slate-900">
                  O que é o Medido?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  O Medido é um software de gestão (SaaS) concebido especificamente para
                  empresas de construção civil e obras, unificando a comunicação entre
                  quem está no terreno e quem gere o negócio.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-6">
                <h3 className="text-base font-bold text-slate-900">
                  Os dados da minha empresa estão seguros e separados de outras empresas?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Sim. A arquitetura do Medido é estritamente multi-tenant: cada empresa
                  possui isolamento completo dos seus registos, garantindo máxima
                  privacidade e segurança sobre as suas medições e colaboradores.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-6">
                <h3 className="text-base font-bold text-slate-900">
                  É fácil de utilizar por quem está no estaleiro em obra?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Sim, essa é a nossa principal prioridade. A interface para encarregados
                  e funcionários foi concebida para uso direto no ecrã do telemóvel, com
                  botões grandes, navegação direta e sem complexidade desnecessária.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-6">
                <h3 className="text-base font-bold text-slate-900">
                  Quando poderei começar a usar o Medido?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Estamos a abrir vagas limitadas para o programa de acesso antecipado. Ao
                  preencher o formulário acima, garante prioridade na entrada e
                  acompanhamento dedicado da nossa equipa.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black tracking-tight text-white">
              Medido
            </span>
            <span className="text-slate-500">|</span>
            <span>Software de Gestão para Construção Civil</span>
          </div>

          <div className="flex gap-6">
            <a href="#problema" className="hover:text-white transition">
              Desafios
            </a>
            <a href="#perfis" className="hover:text-white transition">
              Perfis
            </a>
            <a href="#como-funciona" className="hover:text-white transition">
              Como Funciona
            </a>
            <a href="#faq" className="hover:text-white transition">
              FAQ
            </a>
          </div>

          <div>
            Desenvolvido para empresas em Portugal • © {new Date().getFullYear()} Medido.
            Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
