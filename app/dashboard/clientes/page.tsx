import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import ClientsView from "./ClientsView";

export const metadata = { title: "Clientes — Medido" };

export default async function ClientesPage() {
  const user = await requireRole([Role.OWNER]);

  const clients = await prisma.client.findMany({
    where: { companyId: user.companyId },
    select: {
      id: true,
      name: true,
      nif: true,
      email: true,
      phone: true,
      address: true,
      notes: true,
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

  return <ClientsView clients={clients} />;
}

