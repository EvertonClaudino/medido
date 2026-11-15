import assert from "node:assert";
import { Role } from "@prisma/client";
import { __setMockUser } from "../lib/auth";
import AlertasPage from "../app/dashboard/alertas/page";

const createdAt = new Date("2026-01-01T00:00:00Z");
const company = {
  id: "company-test",
  name: "Empresa de teste",
  nif: null,
  address: null,
  phone: null,
  createdAt,
  updatedAt: createdAt,
};

async function assertRoleCannotOpenAlerts(role: Role) {
  __setMockUser({
    id: `user-${role.toLowerCase()}`,
    name: "Utilizador de teste",
    email: `${role.toLowerCase()}@example.test`,
    role,
    status: "ACTIVE",
    mustChangePassword: false,
    companyId: company.id,
    createdAt,
    updatedAt: createdAt,
    company,
  });

  await assert.rejects(
    () => AlertasPage({ searchParams: Promise.resolve({}) }),
    (error: unknown) =>
      String(error).includes("unauthorized") || String(error).includes("NEXT_REDIRECT")
  );
}

async function runAuthorizationTests() {
  await assertRoleCannotOpenAlerts(Role.FOREMAN);
  await assertRoleCannotOpenAlerts(Role.WORKER);
  __setMockUser(null);
  console.log("✔ Autorização: FOREMAN e WORKER são redirecionados de /dashboard/alertas.");
}

runAuthorizationTests().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
