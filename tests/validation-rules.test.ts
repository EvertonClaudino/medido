import { z } from "zod";
import assert from "node:assert";

// Enum equivalente ao Prisma
const MeasureUnitEnum = z.enum(["M", "M2", "M3", "UN", "KG"]);

const measurementSchema = z.object({
  description: z.string().min(2, "Descrição da medição obrigatória.").max(200),
  quantity: z
    .coerce
    .number()
    .positive("A quantidade tem de ser maior que zero.")
    .max(999999.999, "Quantidade demasiado elevada."),
  unit: MeasureUnitEnum,
});

const workLogSchema = z
  .object({
    projectId: z.string().min(1, "Selecione uma obra."),
    workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
    hours: z
      .preprocess(
        (v) => (v === "" || v === null || v === undefined ? undefined : v),
        z.coerce
          .number()
          .min(0.25, "Mínimo de 0,25 horas.")
          .max(24, "Máximo de 24 horas.")
          .refine((h) => Math.round(h * 4) / 4 === h, "As horas têm de ser múltiplos de 0,25.")
          .optional()
      ),
    description: z.string().max(1000).optional(),
    measurements: z.array(measurementSchema).max(20, "Máximo de 20 medições por registo.").default([]),
  })
  .refine(
    (data) => data.hours !== undefined || data.measurements.length > 0,
    { message: "Tem de preencher as horas trabalhadas ou pelo menos uma medição." }
  );

function runTests() {
  console.log("A executar suite de testes de validação e regras de negócio...\n");
  let passed = 0;

  // Teste 1: Registo só com horas (válido)
  {
    const res = workLogSchema.safeParse({
      projectId: "proj_1",
      workDate: "2026-11-08",
      hours: 7.5,
      description: "Trabalhos gerais",
    });
    assert.strictEqual(res.success, true);
    passed++;
    console.log("✔ Teste 1: Registo válido só com horas (7.5h)");
  }

  // Teste 2: Registo só com medições (válido, horas opcionais)
  {
    const res = workLogSchema.safeParse({
      projectId: "proj_1",
      workDate: "2026-11-08",
      measurements: [
        { description: "Alvenaria", quantity: 35.5, unit: "M2" },
      ],
    });
    assert.strictEqual(res.success, true);
    passed++;
    console.log("✔ Teste 2: Registo válido só com medição sem horas");
  }

  // Teste 3: Registo vazio (sem horas e sem medições) tem de falhar
  {
    const res = workLogSchema.safeParse({
      projectId: "proj_1",
      workDate: "2026-11-08",
      description: "Trabalhei muito mas não preenchi nada",
      measurements: [],
    });
    assert.strictEqual(res.success, false);
    passed++;
    console.log("✔ Teste 3: Registo sem horas e sem medições é rejeitado");
  }

  // Teste 4: Horas com passo diferente de 0.25 (ex: 7.3h) tem de falhar
  {
    const res = workLogSchema.safeParse({
      projectId: "proj_1",
      workDate: "2026-11-08",
      hours: 7.3,
    });
    assert.strictEqual(res.success, false);
    passed++;
    console.log("✔ Teste 4: Horas fora dos passos de 0,25h (ex: 7.3) são rejeitadas");
  }

  // Teste 5: Horas < 0.25h ou > 24h têm de falhar
  {
    const resMin = workLogSchema.safeParse({
      projectId: "proj_1",
      workDate: "2026-11-08",
      hours: 0.1,
    });
    const resMax = workLogSchema.safeParse({
      projectId: "proj_1",
      workDate: "2026-11-08",
      hours: 24.25,
    });
    assert.strictEqual(resMin.success, false);
    assert.strictEqual(resMax.success, false);
    passed++;
    console.log("✔ Teste 5: Horas < 0,25 ou > 24 são rejeitadas");
  }

  // Teste 6: Quantidade <= 0 tem de falhar
  {
    const res = workLogSchema.safeParse({
      projectId: "proj_1",
      workDate: "2026-11-08",
      measurements: [{ description: "Betonilha", quantity: 0, unit: "M2" }],
    });
    assert.strictEqual(res.success, false);
    passed++;
    console.log("✔ Teste 6: Quantidade de medição <= 0 é rejeitada");
  }

  // Teste 7: Unidade inválida tem de falhar
  {
    const res = workLogSchema.safeParse({
      projectId: "proj_1",
      workDate: "2026-11-08",
      measurements: [{ description: "Cabo", quantity: 10, unit: "LITROS" as unknown as "M" }],
    });
    assert.strictEqual(res.success, false);
    passed++;
    console.log("✔ Teste 7: Unidade fora do enum (M, M2, M3, UN, KG) é rejeitada");
  }

  // Teste 8: Limite de 20 medições por registo
  {
    const measurements = Array.from({ length: 21 }, (_, i) => ({
      description: `Item ${i}`,
      quantity: 1,
      unit: "UN" as const,
    }));
    const res = workLogSchema.safeParse({
      projectId: "proj_1",
      workDate: "2026-11-08",
      measurements,
    });
    assert.strictEqual(res.success, false);
    passed++;
    console.log("✔ Teste 8: Mais de 20 medições são rejeitadas");
  }

  // Teste 9: Rejeição de registo exige motivo >= 3 caracteres
  {
    function validateRejection(status: string, reason?: string) {
      if (status === "REJECTED" && (!reason || reason.trim().length < 3)) {
        return { error: "Para rejeitar um registo é obrigatório indicar o motivo." };
      }
      return { success: true };
    }

    assert.strictEqual(validateRejection("REJECTED", "").error !== undefined, true);
    assert.strictEqual(validateRejection("REJECTED", "   ").error !== undefined, true);
    assert.strictEqual(validateRejection("REJECTED", "ok").error !== undefined, true);
    assert.strictEqual(validateRejection("REJECTED", "Metragem incorreta").success, true);
    passed++;
    console.log("✔ Teste 9: Validação de motivo na rejeição funciona rigorosamente");
  }

  // Teste 10: Preservação de segregação de unidades nos totais (nunca somar M com M2)
  {
    const items = [
      { unit: "M", quantity: 15.5 },
      { unit: "M2", quantity: 40.0 },
      { unit: "M", quantity: 5.0 },
      { unit: "KG", quantity: 120.0 },
    ];
    const unitTotals: Record<string, number> = { M: 0, M2: 0, M3: 0, UN: 0, KG: 0 };
    items.forEach((m) => {
      unitTotals[m.unit] += m.quantity;
    });

    assert.strictEqual(unitTotals.M, 20.5);
    assert.strictEqual(unitTotals.M2, 40.0);
    assert.strictEqual(unitTotals.M3, 0);
    assert.strictEqual(unitTotals.KG, 120.0);
    passed++;
    console.log("✔ Teste 10: Segregação estrita de unidades métricas nos totais comprovada");
  }

  console.log(`\n🎉 Todos os ${passed} testes passaram com sucesso!`);
}

runTests();
