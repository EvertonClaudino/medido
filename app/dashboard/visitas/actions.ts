"use server";

import { VisitStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canTransitionVisitStatus, parseLisbonDateTime } from "@/lib/budget-utils";
import { texts } from "@/lib/texts";

function formText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

const visitRequestSchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().trim().max(150),
  clientPhone: z.string().trim().max(30),
  clientAddress: z.string().trim().max(300),
  requestedAddress: z.string().trim().min(3, "Indique a morada da visita.").max(300),
  notes: z.string().trim().max(2000),
}).superRefine((data, context) => {
  if (!data.clientId && !data.clientName) {
    context.addIssue({ code: "custom", path: ["clientName"], message: "O nome do cliente é obrigatório." });
  }
  if (!data.clientId && !data.clientPhone) {
    context.addIssue({ code: "custom", path: ["clientPhone"], message: "O telemóvel do cliente é obrigatório." });
  }
  if (!data.clientId && !data.clientAddress) {
    context.addIssue({ code: "custom", path: ["clientAddress"], message: "A morada do cliente é obrigatória." });
  }
});

export async function createVisitRequestAction(formData: FormData) {
  const user = await requireRole([Role.OWNER]);
  const parsed = visitRequestSchema.safeParse({
    clientId: formText(formData, "clientId") || undefined,
    clientName: formText(formData, "clientName"),
    clientPhone: formText(formData, "clientPhone"),
    clientAddress: formText(formData, "clientAddress"),
    requestedAddress: formText(formData, "requestedAddress"),
    notes: formText(formData, "notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? texts.dashboard.visits.error };
  }

  const { clientId, clientName, clientPhone, clientAddress, requestedAddress, notes } = parsed.data;
  const visitRequest = await prisma.$transaction(async (transaction) => {
    let resolvedClientId = clientId;

    if (clientId) {
      const client = await transaction.client.findFirst({
        where: { id: clientId, companyId: user.companyId },
        select: { id: true },
      });
      if (!client) return null;
      resolvedClientId = client.id;
    } else {
      const client = await transaction.client.create({
        data: {
          companyId: user.companyId,
          name: clientName,
          phone: clientPhone,
          address: clientAddress,
        },
        select: { id: true },
      });
      resolvedClientId = client.id;
    }

    return transaction.visitRequest.create({
      data: {
        companyId: user.companyId,
        clientId: resolvedClientId,
        requestedAddress,
        notes: notes || null,
        createdById: user.id,
      },
      select: { id: true },
    });
  });

  if (!visitRequest) return { error: "O cliente selecionado não pertence à sua empresa." };

  revalidatePath("/dashboard/visitas");
  revalidatePath("/dashboard/clientes");
  return { success: true };
}

const visitStatusSchema = z.object({
  status: z.nativeEnum(VisitStatus),
  scheduledAt: z.string(),
});

export async function updateVisitStatusAction(visitRequestId: string, formData: FormData) {
  const user = await requireRole([Role.OWNER]);
  const parsed = visitStatusSchema.safeParse({
    status: formText(formData, "status"),
    scheduledAt: formText(formData, "scheduledAt"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? texts.dashboard.visits.error };
  }

  const visit = await prisma.visitRequest.findFirst({
    where: { id: visitRequestId, companyId: user.companyId },
    select: { id: true, status: true },
  });
  if (!visit) return { error: "Pedido de visita não encontrado." };
  if (!canTransitionVisitStatus(visit.status, parsed.data.status)) {
    return { error: "Esta alteração de estado não é permitida." };
  }

  let scheduledAt: Date | undefined;
  if (parsed.data.status === VisitStatus.SCHEDULED) {
    const date = parseLisbonDateTime(parsed.data.scheduledAt);
    if (!date) return { error: "Indique uma data e hora válida em Europe/Lisbon." };
    scheduledAt = date;
  }

  const result = await prisma.visitRequest.updateMany({
    where: {
      id: visit.id,
      companyId: user.companyId,
      status: visit.status,
    },
    data: {
      status: parsed.data.status,
      ...(scheduledAt ? { scheduledAt } : {}),
    },
  });
  if (result.count !== 1) return { error: "O pedido foi alterado entretanto. Atualize a página." };

  revalidatePath("/dashboard/visitas");
  revalidatePath("/dashboard/orcamentos");
  return { success: true };
}
