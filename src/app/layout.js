import { Analytics } from "@vercel/analytics/next";
import { Anton, Archivo, Noto_Sans_Arabic } from "next/font/google";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";
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
  title: "Pronos Foot — Analyses IA du football",
  description:
    "Matchs, tendances et analyses d'avant-match propulsées par l'IA — Ligue 1, Premier League, Liga, Serie A, Bundesliga et grands championnats européens, mis à jour en continu.",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  // PWA installable : le manifest lui-même vient de app/manifest.js (lié
  // automatiquement dans le <head> par convention Next.js). appleWebApp
  // couvre en plus ce que le manifest ne gère pas bien sur iOS/Safari
  // (mode plein écran sans barre d'adresse à l'ouverture depuis l'écran
  // d'accueil).
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pronos Foot",
  },
};

export const viewport = {
  themeColor: "#0a0f0c",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${anton.variable} ${archivo.variable} ${notoArabic.variable}`}>
      <body>
        {children}
        <Analytics />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
