import Link from "next/link";
import AuthVisual from "@/components/layout/AuthVisual";
import PageTransition from "@/components/motion/PageTransition";
import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Accueil GDC">
            <Logo />
          </Link>
          <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-brand-600">
            ← Retour au site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <PageTransition className="w-full max-w-xl">{children}</PageTransition>
        </div>
        <p className="text-center text-xs text-slate-400">© 2026 GDC – Guinée Digital Connect · Données protégées</p>
      </div>
      <AuthVisual />
    </div>
  );
}
