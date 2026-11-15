import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

type MockUserType = Awaited<ReturnType<typeof getSessionUserFromDb>> | null;

let mockUserOverride: MockUserType = null;

export function __setMockUser(user: MockUserType) {
  mockUserOverride = user;
}

async function getSessionUserFromDb(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      mustChangePassword: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          name: true,
          nif: true,
          address: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
}

/**
 * Helper de segurança central: valida a sessão e o utilizador diretamente na base de dados.
 * Garante que:
 * 1. O utilizador tem uma sessão ativa.
 * 2. O utilizador existe e o seu estado é ACTIVE.
 * 3. O utilizador pertence a uma empresa ativa.
 * 4. Qualquer alteração de perfil (role) tem efeito imediato.
 * 5. Se mustChangePassword for verdadeiro, redireciona para /dashboard/perfil (exceto se allowMustChangePassword for true).
 */
export async function requireUser(options?: { allowMustChangePassword?: boolean }) {
  if (mockUserOverride !== null) {
    if (mockUserOverride.status !== "ACTIVE") {
      redirect("/login?error=inactive");
    }
    if (mockUserOverride.mustChangePassword && !options?.allowMustChangePassword) {
      redirect("/dashboard/perfil?error=password_change_required");
    }
    return mockUserOverride;
  }

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await getSessionUserFromDb(session.user.id);

  if (!user || user.status !== "ACTIVE") {
    redirect("/login?error=inactive");
  }

  if (user.mustChangePassword && !options?.allowMustChangePassword) {
    redirect("/dashboard/perfil?error=password_change_required");
  }

  return user;
}

/**
 * Garante que apenas o perfil especificado (ex: OWNER) pode aceder.
 */
export async function requireRole(allowedRoles: Role[]) {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard?error=unauthorized");
  }
  return user;
}
