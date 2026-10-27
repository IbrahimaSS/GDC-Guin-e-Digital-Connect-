import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import FaviconLogo from "@/components/layout/FaviconLogo";
import PwaManager from "@/components/layout/PwaManager";
import Toaster from "@/components/motion/Toaster";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GDC – Guinée Digital Connect",
    template: "%s · GDC",
  },
  description:
    "Trouvez le bon technicien ou artisan en Guinée. GDC vous connecte avec des professionnels vérifiés pour tous vos travaux et dépannages.",
};

export const viewport: Viewport = {
  themeColor: "#0066CC",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" data-theme="light" className={`${jakarta.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Applique le thème mémorisé (ou celui du système) avant le premier affichage, sans flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("gdc-theme");if(!t&&matchMedia("(prefers-color-scheme: dark)").matches)t="dark";if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full">
        <noscript>
          <style>{"[data-page-transition]{opacity:1!important}"}</style>
        </noscript>
        {children}
        <Toaster />
        <PwaManager />
        <FaviconLogo />
      </body>
    </html>
  );
}
