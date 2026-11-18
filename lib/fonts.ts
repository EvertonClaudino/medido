import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

/**
 * Tipografia das páginas públicas (landing, iniciar sessão, criar conta).
 * Archivo (variável, com eixo de largura) para títulos de grande escala;
 * IBM Plex para texto corrido e rótulos técnicos. O dashboard mantém a fonte do sistema.
 */
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

/** Classes a aplicar no elemento raiz de cada página pública. */
export const publicFontClasses = `${archivo.variable} ${plexSans.variable} ${plexMono.variable} ${plexSans.className}`;
