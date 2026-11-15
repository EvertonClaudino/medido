"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

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

