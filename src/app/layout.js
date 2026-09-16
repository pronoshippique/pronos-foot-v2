import { Anton, Archivo, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

// Polices de l'ancienne version, auto-hébergées par Next.js (plus de <link> Google Fonts).
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "Pronos Foot — Coupe du Monde 2026",
  description:
    "Matchs, tendances et analyses d'avant-match propulsées par l'IA — Mondial 2026 et grands championnats européens, mis à jour en continu.",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#0a0f0c",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${anton.variable} ${archivo.variable} ${notoArabic.variable}`}>
      <body>{children}</body>
    </html>
  );
}
