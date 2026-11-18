import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { computeClientStage } from "@/lib/client-record";
import ClientsView from "./ClientsView";

export const metadata = { title: "Clientes — Medido" };

export default async function ClientesPage() {
  const user = await requireRole([Role.OWNER]);

  const rawClients = await prisma.client.findMany({
    where: { companyId: user.companyId },
    select: {
      id: true,
      name: true,
      nif: true,
      email: true,
      phone: true,
      address: true,
      notes: true,
      projects: {
        where: { companyId: user.companyId },
        select: { id: true, name: true, code: true, status: true },
        orderBy: { createdAt: "desc" },
      },
      visitRequests: { where: { companyId: user.companyId }, select: { status: true } },
      budgets: { where: { companyId: user.companyId }, select: { status: true } },
      _count: {
        select: {
          projects: true,
          visitRequests: true,
          budgets: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const clients = rawClients.map(({ visitRequests, budgets, ...client }) => ({
    ...client,
    stage: computeClientStage({ visits: visitRequests, budgets, projects: client.projects }),
  }));

  return <ClientsView clients={clients} />;
}
