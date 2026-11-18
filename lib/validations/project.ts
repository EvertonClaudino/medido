import { z } from "zod";

export const projectSchema = z
  .object({
    name: z.string().min(2, "O nome da obra é obrigatório.").max(120),
    code: z.string().max(30).optional(),
    serviceType: z.string().max(80).optional(),
    clientId: z.string().optional(),
    clientName: z.string().max(120).optional(),
    address: z.string().max(200).optional(),
    budget: z.coerce
      .number()
      .positive("O orçamento tem de ser maior que zero.")
      .max(999_999_999_999.99, "Orçamento demasiado elevado.")
      .refine((value) => Math.abs(Math.round(value * 100) - value * 100) < 1e-6, "O orçamento só pode ter até 2 casas decimais.")
      .optional(),
    foremanId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "A data de conclusão não pode ser anterior à data de início.",
      path: ["endDate"],
    }
  );

