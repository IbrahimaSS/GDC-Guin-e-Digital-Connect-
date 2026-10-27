import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { GuineeFlag, Logo } from "@/components/ui";

const COLONNES = [
  {
    titre: "Plateforme",
    liens: [
      ["Trouver un technicien", "/recherche"],
      ["Publier une demande", "/publier-une-demande"],
      ["Devenir technicien", "/devenir-technicien"],
      ["Créer un compte client", "/inscription/client"],
      ["Se connecter", "/connexion"],
    ],
  },
  {
    titre: "Espaces",
    liens: [
      ["Espace client", "/client"],
      ["Espace technicien", "/technicien"],
      ["Back-office", "/admin"],
    ],
  },
  {
    titre: "GDC",
    liens: [
      ["À propos", "/a-propos"],
      ["Niveaux de vérification", "/a-propos#verification"],
    ],
  },
];

export default function PublicFooter() {
  return (
    <footer className="bg-brand-950 text-brand-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-6">
        <div>
          <Logo light className="h-16" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-100/70">
            Les compétences au service des opportunités. Des professionnels de confiance, près de chez vous.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-brand-100/80">
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-accent-500" /> Kaloum, Conakry – Guinée
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-accent-500" /> +224 620 00 00 00
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-accent-500" /> contact@gdc.gn
            </li>
          </ul>
        </div>
        {COLONNES.map((c) => (
          <div key={c.titre}>
            <p className="mb-4 text-sm font-bold text-white">{c.titre}</p>
            <ul className="space-y-2.5 text-sm">
              {c.liens.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-brand-100/70 transition hover:text-accent-400">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm md:flex-row md:items-center md:justify-between md:px-6">
          <p>
            <span className="font-bold text-white">GDC – Guinée Digital Connect</span>
            <span className="mx-2 text-white/30">|</span>
            Trouvez. Évaluez. Connectez. Suivez.
          </p>
          <p className="flex items-center gap-3 italic">
            Ensemble pour un meilleur service en Guinée <GuineeFlag />
          </p>
        </div>
      </div>
    </footer>
  );
}
