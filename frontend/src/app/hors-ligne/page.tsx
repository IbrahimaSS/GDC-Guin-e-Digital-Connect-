import { WifiOff } from "lucide-react";
import type { Metadata } from "next";
import { LinkButton, Logo } from "@/components/ui";

export const metadata: Metadata = { title: "Hors connexion" };

/** Page affichée par le service worker quand une page jamais visitée est demandée sans connexion. */
export default function HorsLignePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Logo className="h-20" />
      <span className="mt-10 rounded-3xl bg-brand-50 p-5 text-brand-600">
        <WifiOff className="size-10" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold text-brand-950">Vous êtes hors connexion</h1>
      <p className="mt-2 max-w-sm text-slate-500">
        Cette page n&apos;a pas encore été enregistrée sur votre appareil. Les pages déjà consultées restent disponibles ; reconnectez-vous pour voir le reste.
      </p>
      <div className="mt-6 flex gap-2">
        <LinkButton href="/">Accueil</LinkButton>
        <LinkButton href="/client/demandes" variant="outline">
          Mes demandes
        </LinkButton>
      </div>
    </div>
  );
}
