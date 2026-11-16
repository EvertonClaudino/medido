import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
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
      createdAt: true,
      projects: {
        where: { companyId: user.companyId },
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          serviceType: true,
          startDate: true,
          endDate: true,
        },
        orderBy: { createdAt: "desc" },
      },
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

  const clients = rawClients.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    projects: c.projects.map((p) => ({
      ...p,
      startDate: p.startDate ? p.startDate.toISOString() : null,
      endDate: p.endDate ? p.endDate.toISOString() : null,
    })),
  }));

  return <ClientsView clients={clients} />;
}
