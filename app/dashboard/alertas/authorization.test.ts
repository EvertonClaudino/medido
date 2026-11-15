import assert from "node:assert/strict";
import test from "node:test";
import { Role } from "@prisma/client";
import { __setMockUser } from "@/lib/auth";
import AlertasPage from "./page";

function mockUser(role: Role) {
  const timestamp = new Date();
  return {
    id: `test-${role.toLowerCase()}`,
    name: "Utilizador de teste",
    email: `${role.toLowerCase()}@example.test`,
    role,
    status: "ACTIVE" as const,
    mustChangePassword: false,
    companyId: "company-test",
    createdAt: timestamp,
    updatedAt: timestamp,
    company: {
      id: "company-test",
      name: "Empresa de teste",
      nif: null,
      address: null,
      phone: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };
}

test("FOREMAN e WORKER são redirecionados ao tentar abrir alertas", async () => {
  for (const role of [Role.FOREMAN, Role.WORKER]) {
    __setMockUser(mockUser(role));
    await assert.rejects(
      AlertasPage({ searchParams: Promise.resolve({}) }),
      (error: unknown) => error instanceof Error && error.message.includes("NEXT_REDIRECT")
    );
  }
});
