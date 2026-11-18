import { redirect } from "next/navigation";

// As visitas são geridas na ficha de cada cliente (decisão 022)
export default function VisitsPage() {
  redirect("/dashboard/clientes");
}
