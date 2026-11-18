import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { prisma } from "./lib/prisma";
import {
  MAX_FAILURES_PER_EMAIL,
  MAX_FAILURES_PER_IP,
  emailRateLimitKey,
  getClientIp,
  getLoginBlockMinutes,
  ipRateLimitKey,
  registerLoginFailure,
  resetLoginFailures,
} from "./lib/login-rate-limit";

/** Erro devolvido ao formulário quando o email ou o IP estão temporariamente bloqueados. */
export class LoginRateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

// Hash usado quando o utilizador não existe, para que o tempo de resposta não revele se o email existe
let dummyHashPromise: Promise<string> | null = null;
function getDummyHash() {
  dummyHashPromise ??= bcrypt.hash("medido-dummy-password", 10);
  return dummyHashPromise;
}

const loginSchema = z.object({
  email: z.string().email("Endereço de email inválido."),
  password: z
    .string()
    .min(8, "A palavra-passe tem de ter pelo menos 8 carateres.")
    .regex(/[A-Z]/, "A palavra-passe tem de conter pelo menos uma letra maiúscula.")
    .regex(/[0-9]/, "A palavra-passe tem de conter pelo menos um algarismo."),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      // Os logs nunca incluem email nem IP (dados pessoais / RGPD)
      async authorize(credentials, request) {
        const rawEmail = typeof credentials?.email === "string" ? credentials.email : "";
        const emailKey = rawEmail ? emailRateLimitKey(rawEmail) : null;
        const ip = getClientIp(request);
        const ipKey = ip ? ipRateLimitKey(ip) : null;
        const keys = [emailKey, ipKey].filter((key): key is string => key !== null);

        const registerFailure = async (includeEmail: boolean) => {
          if (ipKey) await registerLoginFailure(ipKey, MAX_FAILURES_PER_IP);
          if (includeEmail && emailKey) await registerLoginFailure(emailKey, MAX_FAILURES_PER_EMAIL);
        };

        if (keys.length > 0 && (await getLoginBlockMinutes(keys)) !== null) {
          console.warn("Início de sessão recusado: limite de tentativas atingido.");
          throw new LoginRateLimitedError();
        }

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          await registerFailure(false);
          return null;
        }

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          select: { id: true, name: true, email: true, role: true, companyId: true, status: true, password: true },
        });

        const passwordsMatch = await bcrypt.compare(password, user?.password ?? (await getDummyHash()));
        if (!user || user.status !== "ACTIVE" || !passwordsMatch) {
          await registerFailure(true);
          console.warn("Início de sessão recusado: credenciais inválidas ou utilizador inativo.");
          return null;
        }

        if (emailKey) await resetLoginFailures(emailKey);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
        };
      },
    }),
  ],
});
