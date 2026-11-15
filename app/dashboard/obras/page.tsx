import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectStatus, Role } from "@prisma/client";
import { getLisbonStartOfDay } from "@/lib/dashboard-utils";
import ObrasView, { type ProjectItemData } from "./ObrasView";

export const metadata = {
  title: "Gestão de Obras & Empreitadas — Medido",
};

export default async function ObrasPage() {
  const user = await requireRole([Role.OWNER]);
  const companyId = user.companyId;
  const now = new Date();
  const startOfToday = getLisbonStartOfDay(now);

  const [rawProjects, foremen, clients] = await Promise.all([
    prisma.project.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        code: true,
        serviceType: true,
        clientName: true,
        clientId: true,
        address: true,
        budget: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        client: {
          select: { id: true, name: true, nif: true, address: true, phone: true, email: true },
        },
        assignments: {
          select: {
            isLead: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
          },
          orderBy: { dueDate: "asc" },
        },
        _count: {
          select: {
            workLogs: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        companyId,
        role: Role.FOREMAN,
        status: "ACTIVE",
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const projects: ProjectItemData[] = rawProjects.map((p) => {
    // 1. Obra Atrasada: status ACTIVE, endDate !== null e endDate < startOfToday (Lisboa)
    const isDelayed =
      p.status === ProjectStatus.ACTIVE &&
      p.endDate !== null &&
      new Date(p.endDate) < startOfToday;

    // 2. Tarefas da Obra: totais, concluídas, pendentes e atrasadas
    const totalTasksCount = p.tasks.length;
    const completedTasksCount = p.tasks.filter((t) => t.status === "COMPLETED").length;
    const pendingTasksCount = p.tasks.filter((t) => t.status === "PENDING").length;
    const delayedTasksCount = p.tasks.filter(
      (t) => t.status === "PENDING" && t.dueDate !== null && new Date(t.dueDate) < startOfToday
    ).length;

    // Percentagem de conclusão baseada em tarefas
    const progressPercentage =
      totalTasksCount > 0
        ? Math.round((completedTasksCount / totalTasksCount) * 100)
        : p.status === ProjectStatus.COMPLETED
        ? 100
        : 0;

    // Encarregados atribuídos à obra
    const foremenList = p.assignments
      .filter((a) => a.user.role === Role.FOREMAN || a.isLead)
      .map((a) => ({
        id: a.user.id,
        name: a.user.name,
      }));

    // Trabalhadores de campo alocados
    const workers = p.assignments
      .filter((a) => a.user.role === Role.WORKER)
      .map((a) => ({
        id: a.user.id,
        name: a.user.name,
        email: a.user.email,
      }));
    const workersCount = workers.length;

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      serviceType: p.serviceType,
      clientName: p.clientName,
      clientId: p.clientId,
      address: p.address,
      budget: p.budget,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      createdAt: p.createdAt,
      client: p.client,
      foremen: foremenList,
      workers,
      workersCount,
      tasks: p.tasks,
      workLogsCount: p._count.workLogs,
      isDelayed,
      totalTasksCount,
      completedTasksCount,
      pendingTasksCount,
      delayedTasksCount,
      progressPercentage,
    };
  });

  const total = projects.length;
  const active = projects.filter((p) => p.status === ProjectStatus.ACTIVE).length;
  const completed = projects.filter(
    (p) => p.status === ProjectStatus.COMPLETED || p.status === ProjectStatus.ARCHIVED
  ).length;
  const delayed = projects.filter((p) => p.isDelayed).length;

  const currentYear = now.getFullYear();
  const nextCodeSuggestion = `OBR-${currentYear}-${String(total + 1).padStart(3, "0")}`;

  return (
    <ObrasView
      projects={projects}
      foremen={foremen}
      clients={clients}
      metrics={{ total, active, completed, delayed }}
      nextCodeSuggestion={nextCodeSuggestion}
    />
  );
}
