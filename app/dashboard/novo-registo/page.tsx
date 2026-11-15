import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { createWorkLogAction } from "../actions";
import { redirect } from "next/navigation";
import { WorkLogForm } from "@/components/work-log-form";

export default async function NovoRegistoPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const user = await requireUser();
  const { projectId } = await searchParams;

  // Buscar obras onde o trabalhador está atribuído ou todas as obras ativas da empresa
  let projects;
  if (user.role === "WORKER") {
    const assignments = await prisma.projectAssignment.findMany({
      where: { userId: user.id },
      include: { project: true },
    });
    projects = assignments
      .map((a) => a.project)
      .filter((p) => p.status === "ACTIVE");
  } else {
    projects = await prisma.project.findMany({
      where: { companyId: user.companyId, status: "ACTIVE" },
      orderBy: { name: "asc" },
    });
  }

  async function handleCreate(formData: FormData) {
    "use server";
    const res = await createWorkLogAction(formData);
    if (res?.error) {
      return { error: res.error };
    }
    redirect("/dashboard/os-meus-registos");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Novo Registo Diário
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Otimizado para utilização rápida em estaleiro no telemóvel.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          Voltar
        </Link>
      </div>

      <WorkLogForm
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        defaultProjectId={projectId}
        onSubmitAction={handleCreate}
      />
    </div>
  );
}
