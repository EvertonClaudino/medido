"use server";

import { ClientActivityType, Role } from "@prisma/client";
import { safeRevalidatePath } from "@/lib/revalidate";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { parseLisbonDateTime } from "@/lib/budget-utils";
import { prisma } from "@/lib/prisma";

const activitySchema = z.object({
  type: z.nativeEnum(ClientActivityType, { errorMap: () => ({ message: "Selecione o tipo de interação." }) }),
  description: z.string().trim().min(2, "Escreva um resumo da interação.").max(2000),
  occurredAt: z.string().trim(),
});

export async function createClientActivityAction(clientId: string, formData: FormData) {
  const user = await requireRole([Role.OWNER]);

  const parsed = activitySchema.safeParse({
    type: formData.get("type"),
    description: formData.get("description") ?? "",
    occurredAt: formData.get("occurredAt") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  // Data/hora de parede em Europe/Lisbon; vazio = agora
  let occurredAt = new Date();
  if (parsed.data.occurredAt) {
    const parsedDate = parseLisbonDateTime(parsed.data.occurredAt.slice(0, 16));
    if (!parsedDate) return { error: "Indique uma data e hora válida." };
    if (parsedDate.getTime() > Date.now() + 5 * 60 * 1000) {
      return { error: "A interação não pode ter data futura." };
    }
    occurredAt = parsedDate;
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, companyId: user.companyId },
    select: { id: true },
  });
  if (!client) return { error: "Cliente não encontrado ou inacessível." };

  await prisma.clientActivity.create({
    data: {
      companyId: user.companyId,
      clientId: client.id,
      authorId: user.id,
      type: parsed.data.type,
      description: parsed.data.description,
      occurredAt,
    },
  });

  safeRevalidatePath(`/dashboard/clientes/${client.id}`);
  return { success: true };
}
