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
    <html
      lang="pt-PT"
      className="h-full antialiased scroll-smooth"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Script Anti-FOUC para prevenir flash de tema incorreto */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('medido-theme');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
