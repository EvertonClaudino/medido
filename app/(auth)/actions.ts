"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { AuthError, CredentialsSignin } from "next-auth";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, getLoginBlockMinutes, registerLoginFailure } from "@/lib/login-rate-limit";
import { texts } from "@/lib/texts";

export async function loginAction(prevState: string | undefined, formData: FormData) {
  try {
    const email = formData.get("email");
    const password = formData.get("password");

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          if (error instanceof CredentialsSignin && error.code === "rate_limited") {
            return "Demasiadas tentativas de início de sessão. Aguarde 15 minutos e tente novamente.";
          }
          return "Email ou palavra-passe incorretos.";
        default:
          return "Ocorreu um erro ao iniciar sessão. Tente novamente.";
      }
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

const labels = texts.auth.register;

const registerSchema = z
  .object({
    companyName: z.string().trim().min(2, labels.errors.companyName).max(150),
    nif: z
      .string()
      .transform((value) => value.replace(/\s+/g, ""))
      .refine((value) => value === "" || /^\d{9}$/.test(value), labels.errors.nif),
    ownerName: z.string().trim().min(2, labels.errors.ownerName).max(100),
    email: z.string().trim().toLowerCase().email(labels.errors.email).max(254),
    password: z
      .string()
      .min(8, labels.errors.passwordLength)
      .regex(/[A-Z]/, labels.errors.passwordUppercase)
      .regex(/[0-9]/, labels.errors.passwordDigit),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: labels.errors.passwordMismatch,
    path: ["confirmPassword"],
  });

export interface RegisterState {
  error?: string;
  field?: string;
  values?: { companyName: string; nif: string; ownerName: string; email: string };
}

// 5 contas por IP a cada 15 minutos (reutiliza a tabela de limites de início de sessão)
const MAX_SIGNUPS_PER_IP = 5;

/** Cria a empresa e o respetivo Dono e inicia sessão. */
export async function registerCompanyAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const raw = {
    companyName: String(formData.get("companyName") ?? ""),
    nif: String(formData.get("nif") ?? ""),
    ownerName: String(formData.get("ownerName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  const values = { companyName: raw.companyName, nif: raw.nif, ownerName: raw.ownerName, email: raw.email };

  const ip = getClientIp({ headers: await headers() });
  const rateKey = ip ? `signup:${ip.slice(0, 64)}` : null;
  if (rateKey && (await getLoginBlockMinutes([rateKey])) !== null) {
    return { error: labels.errors.rateLimited, values };
  }

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message ?? labels.errors.generic, field: String(issue?.path[0] ?? ""), values };
  }
  const { companyName, nif, ownerName, email, password } = parsed.data;

  if (rateKey) await registerLoginFailure(rateKey, MAX_SIGNUPS_PER_IP);

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: companyName, nif: nif || null },
        select: { id: true },
      });
      await tx.user.create({
        data: {
          companyId: company.id,
          name: ownerName,
          email,
          password: passwordHash,
          role: Role.OWNER,
          mustChangePassword: false,
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = String(error.meta?.target ?? "");
      if (target.includes("nif")) return { error: labels.errors.nifTaken, field: "nif", values };
      return { error: labels.errors.emailTaken, field: "email", values };
    }
    throw error;
  }

  // Redireciona para o dashboard já com sessão iniciada (lança NEXT_REDIRECT)
  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  return {};
}
