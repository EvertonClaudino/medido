import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { EquipaView, TeamMember } from "./EquipaView";

export default async function EquipaPage() {
  const user = await requireRole([Role.OWNER]);

  const rawTeam = await prisma.user.findMany({
    where: { companyId: user.companyId },
    orderBy: [
      { role: "asc" }, // OWNER primeiro, depois FOREMAN, depois WORKER
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      specialty: true,
      createdAt: true,
      mustChangePassword: true,
      _count: {
        select: {
          workLogs: true,
          assignedTasks: true,
        },
      },
      assignments: {
        where: {
          project: {
            companyId: user.companyId,
            status: "ACTIVE",
          },
        },
        select: {
          isLead: true,
          project: {
            select: {
              id: true,
              name: true,
              code: true,
              status: true,
            },
          },
        },
      },
    },
  });

  const team: TeamMember[] = rawTeam.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    status: member.status,
    specialty: member.specialty,
    createdAt: member.createdAt,
    mustChangePassword: member.mustChangePassword,
    workLogsCount: member._count.workLogs,
    assignedTasksCount: member._count.assignedTasks,
    assignments: member.assignments.map((a) => ({
      isLead: a.isLead,
      project: {
        id: a.project.id,
        name: a.project.name,
        code: a.project.code,
        status: a.project.status,
      },
    })),
  }));

  return <EquipaView initialTeam={team} currentUserId={user.id} />;
}
