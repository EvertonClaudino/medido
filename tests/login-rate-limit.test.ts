import assert from "node:assert";
import { prisma } from "@/lib/prisma";
import {
  LOGIN_WINDOW_MS,
  MAX_FAILURES_PER_EMAIL,
  getClientIp,
  getLoginBlockMinutes,
  registerLoginFailure,
  resetLoginFailures,
} from "@/lib/login-rate-limit";

/**
 * Rate limiting persistente de início de sessão (tabela login_attempts).
 * Usa chaves únicas por execução e remove-as no fim.
 */
async function run() {
  const suffix = Date.now();
  const emailKey = `email:rate-limit-${suffix}@teste.pt`;
  const otherKey = `ip:203.0.113.${suffix % 250}`;

  try {
    // 1. Abaixo do limite não há bloqueio
    for (let i = 0; i < MAX_FAILURES_PER_EMAIL - 1; i++) {
      await registerLoginFailure(emailKey, MAX_FAILURES_PER_EMAIL);
    }
    assert.strictEqual(await getLoginBlockMinutes([emailKey]), null);
    console.log("✔ Abaixo do limite: sem bloqueio");

    // 2. Ao atingir o limite fica bloqueado ~15 minutos (e o bloqueio vale para qualquer chave da lista)
    await registerLoginFailure(emailKey, MAX_FAILURES_PER_EMAIL);
    const minutes = await getLoginBlockMinutes([otherKey, emailKey]);
    assert.ok(minutes !== null && minutes >= 14 && minutes <= 15, `Bloqueio inesperado: ${minutes}`);
    console.log("✔ Limite atingido: bloqueio de 15 minutos");

    // 3. O bloqueio expira com o tempo
    const later = new Date(Date.now() + 16 * 60 * 1000);
    assert.strictEqual(await getLoginBlockMinutes([emailKey], later), null);
    console.log("✔ Bloqueio expira ao fim de 15 minutos");

    // 4. Falhas fora da janela recomeçam a contagem
    await resetLoginFailures(emailKey);
    await registerLoginFailure(emailKey, MAX_FAILURES_PER_EMAIL);
    await registerLoginFailure(emailKey, MAX_FAILURES_PER_EMAIL, new Date(Date.now() + LOGIN_WINDOW_MS + 1000));
    const row = await prisma.loginAttempt.findUnique({ where: { key: emailKey } });
    assert.strictEqual(row?.attempts, 1);
    console.log("✔ Janela expirada recomeça a contagem");

    // 5. Sucesso limpa as falhas
    await resetLoginFailures(emailKey);
    assert.strictEqual(await prisma.loginAttempt.count({ where: { key: emailKey } }), 0);
    console.log("✔ Reset após início de sessão bem-sucedido");

    // 6. Extração do IP do cliente
    const request = new Request("http://localhost", { headers: { "x-forwarded-for": "198.51.100.7, 10.0.0.1" } });
    assert.strictEqual(getClientIp(request), "198.51.100.7");
    assert.strictEqual(getClientIp(undefined), null);
    console.log("✔ IP do cliente lido do primeiro valor de x-forwarded-for");

    console.log("\n🎉 Rate limiting de início de sessão verificado.");
  } finally {
    await prisma.loginAttempt.deleteMany({ where: { key: { in: [emailKey, otherKey] } } });
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error("Falha nos testes:", error);
  process.exit(1);
});
