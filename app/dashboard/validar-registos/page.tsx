import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { reviewWorkLogAction } from "../actions";
import { ValidationList } from "@/components/validation-list";

export default async function ValidarRegistosPage() {
  const user = await requireRole([Role.FOREMAN, Role.OWNER]);

  let projectIds: string[] = [];

  if (user.role === Role.FOREMAN) {
    const assignments = await prisma.projectAssignment.findMany({
      where: { userId: user.id, isLead: true },
      select: { projectId: true },
    });
    projectIds = assignments.map((a) => a.projectId);
  } else {
    // Se for Dono, pode validar todas as obras da sua empresa
    const projects = await prisma.project.findMany({
      where: { companyId: user.companyId },
      select: { id: true },
    });
    projectIds = projects.map((p) => p.id);
  }

  const logs = await prisma.workLog.findMany({
    where: {
      projectId: { in: projectIds },
      companyId: user.companyId,
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      measurements: true,
    },
  });

  async function handleReview(
    logId: string,
    status: "VALIDATED" | "REJECTED",
    rejectionReason?: string
  ) {
    "use server";
    return await reviewWorkLogAction(logId, status, rejectionReason);
  }

  const serializedLogs = logs.map((log) => ({
    id: log.id,
    workDate: log.workDate.toISOString(),
    hours: log.hours ? Number(log.hours) : null,
    description: log.description,
    status: log.status,
    rejectionReason: log.rejectionReason,
    author: { id: log.author.id, name: log.author.name },
    project: { id: log.project.id, name: log.project.name },
    measurements: log.measurements.map((m) => ({
      id: m.id,
      description: m.description,
      quantity: Number(m.quantity),
      unit: m.unit,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Validação de Registos de Obra
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Valide ou rejeite os apontamentos de horas e medições submetidos pelos
          colaboradores nas obras sob a sua responsabilidade.
        </p>
      </div>

      <ValidationList logs={serializedLogs} onReviewAction={handleReview} />
    </div>
  );
}
