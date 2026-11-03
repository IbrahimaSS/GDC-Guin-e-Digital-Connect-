import { LogIn } from "lucide-react";
import { LinkButton } from "@/components/ui";
import { formaterNumero } from "@/lib/session";

/** Numéro repris de la connexion (« 620123456 ») affiché « 620 12 34 56 » ; rien s'il n'est pas valide. */
export const numeroPrerempli = (n: string | null | undefined) => (n && /^6\d{8}$/.test(n) ? formaterNumero(n) : "");

/** Inscription avec un numéro qui a déjà un compte : aucun code envoyé, on propose la connexion. */
export default function DejaInscrit({ telephone, redirect }: { telephone: string; redirect?: string | null }) {
  return (
    <div className="space-y-3 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100">
      <p className="text-sm text-slate-700">
        <strong className="text-slate-900">Le +224 {telephone} a déjà un compte GDC.</strong> Aucun code ne vous a été envoyé : connectez-vous
        avec ce numéro.
      </p>
      <LinkButton href={redirect ? `/connexion?redirect=${encodeURIComponent(redirect)}` : "/connexion"} size="sm" className="w-full sm:w-auto">
        <LogIn className="size-4" /> Se connecter
      </LinkButton>
    </div>
  );
}
