import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasActiveSession } from "@/lib/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Criar conta | Medido",
  description: "Crie a conta da sua empresa de construção no Medido.",
};

export default async function RegisterPage() {
  if (await hasActiveSession()) redirect("/dashboard");

  return (
    <AuthShell>
      <RegisterForm />
    </AuthShell>
  );
}
