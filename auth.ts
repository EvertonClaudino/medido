import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { prisma } from "./lib/prisma";

const loginSchema = z.object({
  email: z.string().email("Endereço de email inválido."),
  password: z
    .string()
    .min(8, "A palavra-passe tem de ter pelo menos 8 carateres.")
    .regex(/[A-Z]/, "A palavra-passe tem de conter pelo menos uma letra maiúscula.")
    .regex(/[0-9]/, "A palavra-passe tem de conter pelo menos um algarismo."),
});

// Rate limiting de autenticação em memória por IP/Email
// Regra: Máximo de 5 tentativas falhadas por janela de 15 minutos
interface LoginAttempt {
  attempts: number;
  blockedUntil?: number;
}
const loginRateLimitMap = new Map<string, LoginAttempt>();

function checkRateLimit(key: string): { allowed: boolean; waitMinutes?: number } {
  const now = Date.now();
  const entry = loginRateLimitMap.get(key);

  if (!entry) return { allowed: true };

  if (entry.blockedUntil && entry.blockedUntil > now) {
    const waitMinutes = Math.ceil((entry.blockedUntil - now) / 60000);
    return { allowed: false, waitMinutes };
  }

  // Se o bloqueio expirou, limpa
  if (entry.blockedUntil && entry.blockedUntil <= now) {
    loginRateLimitMap.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

function registerFailedAttempt(key: string) {
  const now = Date.now();
  const entry = loginRateLimitMap.get(key) || { attempts: 0 };
  entry.attempts += 1;

  if (entry.attempts >= 5) {
    entry.blockedUntil = now + 15 * 60 * 1000; // bloqueado 15 minutos
  }

  loginRateLimitMap.set(key, entry);
}

function resetRateLimit(key: string) {
  loginRateLimitMap.delete(key);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) {
            console.error("Validação de credenciais falhou:", parsed.error);
            return null;
          }

          const { email, password } = parsed.data;
          const rateLimitKey = email.toLowerCase().trim();

          const rateLimit = checkRateLimit(rateLimitKey);
          if (!rateLimit.allowed) {
            console.warn(`Tentativas excessivas de login para ${rateLimitKey}. Bloqueado por ${rateLimit.waitMinutes}m.`);
            throw new Error(`Demasiadas tentativas de início de sessão. Aguarde ${rateLimit.waitMinutes} minutos.`);
          }

          const user = await prisma.user.findUnique({
            where: { email: rateLimitKey },
            include: { company: true },
          });

          if (!user || user.status !== "ACTIVE") {
            registerFailedAttempt(rateLimitKey);
            console.error("Utilizador não encontrado ou inativo:", email);
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (!passwordsMatch) {
            registerFailedAttempt(rateLimitKey);
            console.error("Palavra-passe incorreta para:", email);
            return null;
          }

          // Sucesso: limpar contador de falhas
          resetRateLimit(rateLimitKey);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
          };
        } catch (error) {
          console.error("Erro no authorize:", error);
          throw error;
        }
      },
    }),
  ],
});
