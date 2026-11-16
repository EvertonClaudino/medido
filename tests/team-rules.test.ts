import assert from "node:assert/strict";
import test from "node:test";
import { Role } from "@prisma/client";
import { __setMockUser } from "@/lib/auth";
import EquipaPage from "@/app/dashboard/equipa/page";
import { inviteUserAction, toggleUserStatusAction } from "@/app/dashboard/actions";
import { prisma } from "@/lib/prisma";

function mockUser(role: Role) {
  const timestamp = new Date();
  return {
    id: `test-user-${role.toLowerCase()}`,
    name: `Utilizador ${role}`,
    email: `${role.toLowerCase()}@construtora.test`,
    role,
    status: "ACTIVE" as const,
    mustChangePassword: false,
    companyId: "company-test-team-123",
    createdAt: timestamp,
    updatedAt: timestamp,
    company: {
      id: "company-test-team-123",
      name: "Construtora Teste, Lda.",
      nif: "501234567",
      address: "Rua Central, Lisboa",
      phone: "+351 912345678",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };
}

test("1. Autorização: Apenas OWNER acede a EquipaPage; FOREMAN e WORKER são redirecionados", async () => {
  for (const role of [Role.FOREMAN, Role.WORKER]) {
    __setMockUser(mockUser(role));
    await assert.rejects(
      async () => {
        await EquipaPage();
      },
      (error: unknown) => {
        const isRedirect =
          error instanceof Error && error.message.includes("NEXT_REDIRECT");
        return isRedirect;
      },
      `Utilizador com papel ${role} deveria ser redirecionado de EquipaPage`
    );
  }
});

test("2. Regra de convite: inviteUserAction rejeita perfil OWNER (apenas FOREMAN e WORKER)", async () => {
  __setMockUser(mockUser(Role.OWNER));

  const formData = new FormData();
  formData.set("name", "Tentativa de Criar Dono");
  formData.set("email", "dono.falso@construtora.test");
  formData.set("role", "OWNER");

  const result = await inviteUserAction(formData);
  assert.ok(result?.error, "Deveria retornar erro ao tentar convidar como OWNER");
});

test("3. Regra de convite: inviteUserAction aceita campo specialty opcional", async () => {
  const originalCreate = prisma.user.create;
  let createdSpecialty: string | null | undefined = undefined;

  try {
    prisma.user.create = (async (args: { data: Record<string, unknown> }) => {
      createdSpecialty = args.data.specialty as string | null | undefined;
      return { id: "created-user-123", ...args.data };
    }) as unknown as typeof prisma.user.create;

    __setMockUser(mockUser(Role.OWNER));

    const formData = new FormData();
    formData.set("name", "António Silva");
    formData.set("email", "antonio.silva@construtora.test");
    formData.set("role", "WORKER");
    formData.set("specialty", "Pedreiro de 1.ª");

    const result = await inviteUserAction(formData);
    assert.strictEqual(result?.success, true);
    assert.ok(result?.temporaryPassword, "Deve devolver palavra-passe temporária");
    assert.strictEqual(createdSpecialty, "Pedreiro de 1.ª");
  } finally {
    prisma.user.create = originalCreate;
  }
});

test("4. Regra de segurança: Dono não pode desativar o seu próprio perfil em toggleUserStatusAction", async () => {
  const owner = mockUser(Role.OWNER);
  __setMockUser(owner);

  const result = await toggleUserStatusAction(owner.id, "ACTIVE");
  assert.ok(result?.error, "Deve retornar erro ao tentar desativar o próprio utilizador");
  assert.strictEqual(result?.error, "Não pode desativar o seu próprio perfil.");
});
