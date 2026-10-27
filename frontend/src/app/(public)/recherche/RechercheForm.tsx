"use client";

import { BadgeCheck, MapPin, Search, Send, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Reveal from "@/components/motion/Reveal";
import { Button, Card, Field, Select } from "@/components/ui";
import { Toggle } from "@/components/ui/interactive";
import { METIERS, NIVEAUX, ZONES, type MetierId } from "@/lib/data";

const SPECIALITES: Partial<Record<MetierId, string[]>> = {
  electricite: ["Installation", "Dépannage", "Maintenance", "Solaire"],
  plomberie: ["Fuites", "Sanitaires", "Chauffe-eau"],
  maconnerie: ["Construction", "Carrelage", "Rénovation"],
  menuiserie: ["Meubles sur mesure", "Placards", "Portes", "Charpente"],
  mecanique: ["Freinage", "Moteur", "Soudure", "Ferronnerie"],
  informatique: ["Réseaux", "Réparation PC", "Logiciels"],
  climatisation: ["Installation", "Entretien", "Recharge gaz"],
};

const GARANTIES = [
  { icon: BadgeCheck, titre: "Profils vérifiés", texte: "Identité, compétences et recommandations contrôlées." },
  { icon: MapPin, titre: "Près de chez vous", texte: "Recherche par commune et quartier de Conakry." },
  { icon: Wrench, titre: "Tous les métiers", texte: "Du dépannage urgent aux chantiers complets." },
];

/** Carte de recherche détaillée, posée à cheval sur le bandeau d'en-tête. */
export default function RechercheForm() {
  const router = useRouter();
  const [metier, setMetier] = useState<MetierId | "">("");
  const [specialite, setSpecialite] = useState("");
  const [zone, setZone] = useState("");
  const [niveau, setNiveau] = useState("");
  const [disponible, setDisponible] = useState(true);

  function rechercher(e: FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (metier) p.set("metier", metier);
    if (specialite) p.set("specialite", specialite);
    if (zone) p.set("zone", zone);
    if (niveau) p.set("niveau", niveau);
    if (disponible) p.set("disponible", "1");
    router.push(`/resultats?${p}`);
  }

  const specialites = metier ? (SPECIALITES[metier] ?? []) : [];

  return (
    <Reveal stagger={0.12}>
      <Card className="p-5 shadow-xl shadow-brand-950/10 md:p-7">
        <form onSubmit={rechercher}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Métier">
              <Select
                value={metier}
                onChange={(e) => {
                  setMetier(e.target.value as MetierId | "");
                  setSpecialite("");
                }}
              >
                <option value="">Tous les métiers</option>
                {METIERS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Spécialité">
              <Select value={specialite} onChange={(e) => setSpecialite(e.target.value)} disabled={!specialites.length}>
                <option value="">{specialites.length ? "Toutes les spécialités" : "Choisissez un métier"}</option>
                {specialites.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="Zone">
              <Select value={zone} onChange={(e) => setZone(e.target.value)}>
                <option value="">Toutes les zones</option>
                {ZONES.map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </Select>
            </Field>
            <Field label="Vérification minimum">
              <Select value={niveau} onChange={(e) => setNiveau(e.target.value)}>
                <option value="">Tous les niveaux</option>
                {Object.entries(NIVEAUX).map(([n, v]) => (
                  <option key={n} value={n}>
                    Niveau {n} – {v.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="sm:w-80">
              <Toggle checked={disponible} onChange={setDisponible} label="Disponibles uniquement" description="Masquer les professionnels occupés." />
            </div>
            <Button type="submit" size="lg" className="sm:min-w-56">
              <Search className="size-4" /> Rechercher
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        {GARANTIES.map(({ icon: Icon, titre, texte }) => (
          <div key={titre} className="flex items-start gap-3 rounded-2xl px-2 py-1">
            <span className="rounded-xl bg-brand-50 p-2 text-brand-600">
              <Icon className="size-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{titre}</p>
              <p className="text-xs text-slate-500">{texte}</p>
            </div>
          </div>
        ))}
        <Link
          href="/publier-une-demande"
          className="flex items-center gap-2 self-center rounded-xl bg-accent-50 px-4 py-2.5 text-sm font-semibold text-accent-600 transition hover:bg-accent-100"
        >
          <Send className="size-4" /> Ou publiez votre demande
        </Link>
      </div>
    </Reveal>
  );
}
