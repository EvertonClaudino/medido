import { notFound, redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Endereço antigo (orçamento a partir da visita): reencaminha para /dashboard/orcamentos/novo
export default async function LegacyNewBudgetPage({ params }: { params: Promise<{ visitId: string }> }) {
  const { visitId } = await params;
  const user = await requireRole([Role.OWNER]);
  const visit = await prisma.visitRequest.findFirst({
    where: { id: visitId, companyId: user.companyId },
    select: { id: true, clientId: true },
  });
  if (!visit) notFound();
  redirect(`/dashboard/orcamentos/novo?cliente=${visit.clientId}&visita=${visit.id}`);
}
