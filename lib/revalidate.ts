import { revalidatePath } from "next/cache";

/** revalidatePath que não falha fora de um pedido Next.js (ex.: testes que invocam Server Actions). */
export function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Sem contexto de pedido: nada a revalidar
  }
}
