import { LoginForm } from "./login-form";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Iniciar Sessão | Medido",
  description: "Aceda ao dashboard da sua empresa no Medido.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();

  // Se o utilizador já tem sessão válida e existe ativo na BD, reencaminha para o dashboard
  if (session?.user?.id && !params?.error) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, status: true },
    });
    if (user && user.status === "ACTIVE") {
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <LoginForm initialError={params?.error} />
    </div>
  );
}

