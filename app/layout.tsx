import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medido | Software de Gestão para Obras e Construção Civil",
  description:
    "Controlo total da obra e da equipa, do estaleiro ao escritório. Solução desenhada para empresas de construção civil em Portugal.",
  openGraph: {
    title: "Medido | Software de Gestão para Obras e Construção Civil",
    description:
      "Controlo total da obra e da equipa, do estaleiro ao escritório. Plataforma desenhada para empresas em Portugal.",
    locale: "pt_PT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" className="h-full antialiased scroll-smooth" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-white text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
