import { prisma } from "@/lib/prisma";

/**
 * Rate limiting de início de sessão persistido em Postgres (tabela login_attempts),
 * partilhado por todas as instâncias serverless.
 *
 * Regras: por email, 5 falhas em 15 minutos; por IP, 20 falhas em 15 minutos.
 * Atingido o limite, a chave fica bloqueada durante 15 minutos.
 */
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_BLOCK_MS = 15 * 60 * 1000;
export const MAX_FAILURES_PER_EMAIL = 5;
export const MAX_FAILURES_PER_IP = 20;
const STALE_ROW_MS = 24 * 60 * 60 * 1000;

export function emailRateLimitKey(email: string): string {
  return `email:${email.trim().toLowerCase().slice(0, 254)}`;
}

export function ipRateLimitKey(ip: string): string {
  return `ip:${ip.slice(0, 64)}`;
}

/** Primeiro IP de x-forwarded-for (definido pela Vercel) ou x-real-ip. Aceita um Request ou só os cabeçalhos. */
export function getClientIp(request: { headers: Headers } | undefined): string | null {
  const forwarded = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request?.headers.get("x-real-ip")?.trim() || null;
}

/** Devolve os minutos de bloqueio restantes se alguma das chaves estiver bloqueada. */
export async function getLoginBlockMinutes(keys: string[], now = new Date()): Promise<number | null> {
  const blocked = await prisma.loginAttempt.findMany({
    where: { key: { in: keys }, blockedUntil: { gt: now } },
    select: { blockedUntil: true },
  });
  if (blocked.length === 0) return null;

  const latest = Math.max(...blocked.map((entry) => entry.blockedUntil!.getTime()));
  return Math.max(1, Math.ceil((latest - now.getTime()) / 60_000));
}

export async function registerLoginFailure(key: string, maxFailures: number, now = new Date()): Promise<void> {
  const windowCutoff = new Date(now.getTime() - LOGIN_WINDOW_MS);
  const existing = await prisma.loginAttempt.findUnique({
    where: { key },
    select: { windowStart: true },
  });

  // Janela expirada (ou chave nova): recomeça a contagem
  const entry =
    !existing || existing.windowStart < windowCutoff
      ? await prisma.loginAttempt.upsert({
          where: { key },
          create: { key, attempts: 1, windowStart: now },
          update: { attempts: 1, windowStart: now, blockedUntil: null },
          select: { attempts: true },
        })
      : await prisma.loginAttempt.update({
          where: { key },
          data: { attempts: { increment: 1 } },
          select: { attempts: true },
        });

  if (entry.attempts >= maxFailures) {
    await prisma.loginAttempt.update({
      where: { key },
      data: { blockedUntil: new Date(now.getTime() + LOGIN_BLOCK_MS) },
    });
  }

  // Limpeza oportunista de registos antigos (sem tarefa agendada dedicada)
  if (Math.random() < 0.02) {
    await prisma.loginAttempt.deleteMany({
      where: { updatedAt: { lt: new Date(now.getTime() - STALE_ROW_MS) } },
    });
  }
}

export async function resetLoginFailures(key: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { key } });
}
