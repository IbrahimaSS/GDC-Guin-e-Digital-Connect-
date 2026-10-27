import { Compass } from "lucide-react";
import { LinkButton, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Logo className="h-20" />
      <Compass className="mt-10 size-14 text-accent-500" />
      <h1 className="mt-4 text-3xl font-extrabold text-brand-950">Page introuvable</h1>
      <p className="mt-2 max-w-sm text-slate-500">La page que vous cherchez n&apos;existe pas ou a été déplacée.</p>
      <div className="mt-6 flex gap-2">
        <LinkButton href="/">Retour à l&apos;accueil</LinkButton>
        <LinkButton href="/recherche" variant="outline">
          Rechercher un professionnel
        </LinkButton>
      </div>
    </div>
  );
}
