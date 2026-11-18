import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasActiveSession } from "@/lib/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sessão | Medido",
  description: "Aceda à conta da sua empresa no Medido.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  // Com sessão válida e utilizador ativo, segue diretamente para o dashboard
  if (!params?.error && (await hasActiveSession())) redirect("/dashboard");

  return (
    <AuthShell mode="login">
      <LoginForm initialError={params?.error} />
    </AuthShell>
  );
}
