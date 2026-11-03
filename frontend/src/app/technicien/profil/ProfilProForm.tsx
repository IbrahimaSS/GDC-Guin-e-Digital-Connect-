"use client";

import { Eye, Plus, X } from "lucide-react";
import { useState } from "react";
import { ProgressBar } from "@/components/motion/Charts";
import Reveal from "@/components/motion/Reveal";
import PhotoUpload from "@/components/ui/PhotoUpload";
import { toast } from "@/components/motion/Toaster";
import { Button, Card, cn, Field, Input, LinkButton, PageHeader, Rating, Select, Textarea, VerificationBadge } from "@/components/ui";
import { api, apiActive, texteErreur } from "@/lib/api";
import { idZone, useZonesApi } from "@/lib/auth";
import { METIERS, TECHNICIEN_CONNECTE as moi, ZONES, type Niveau } from "@/lib/data";
import { modifierMonProfil, useMonProfil, type MonProfilApi } from "@/lib/monProfil";
import { mettreAJourUtilisateur, useSession, type UtilisateurApi } from "@/lib/session";

const TARIFS_INIT = [
  { prestation: "Déplacement + diagnostic", prix: "50 000" },
  { prestation: "Installation d'une prise", prix: "75 000" },
  { prestation: "Tableau électrique complet", prix: "1 200 000" },
];

export default function ProfilProForm() {
  return apiActive ? <ProfilApi /> : <ProfilDemo />;
}

// ------------------------------------------------------------ Avec l'API

function ProfilApi() {
  const session = useSession();
  const profil = useMonProfil();
  if (!session || !profil.donnees) return <div className="h-96 animate-pulse rounded-2xl bg-slate-100" aria-busy="true" />;
  return <FormulairePro profil={profil.donnees} utilisateur={session.utilisateur} />;
}

function FormulairePro({ profil, utilisateur: u }: { profil: MonProfilApi; utilisateur: UtilisateurApi }) {
  const zonesApi = useZonesApi(true);
  const [infos, setInfos] = useState({ metierId: profil.metierId, experience: profil.experience, entreprise: u.entreprise ?? "", bio: profil.bio });
  const [specialites, setSpecialites] = useState(profil.specialites);
  const [nouvelle, setNouvelle] = useState("");
  const [zones, setZones] = useState(profil.zones.map((z) => z.nom));
  // Identifiant local de chaque ligne de tarif (affichage et suppression).
  const [tarifs, setTarifs] = useState(profil.tarifs.map((t, i) => ({ ...t, cle: i })));
  const [envoi, setEnvoi] = useState(false);

  const etapes = [
    { fait: Boolean(u.photoUrl), label: "Photo de profil" },
    { fait: infos.bio.trim().length >= 40, label: "Description (40 caractères minimum)" },
    { fait: specialites.length > 0 && zones.length > 0, label: "Spécialités et zones" },
    { fait: tarifs.length > 0, label: "Au moins un tarif indicatif" },
    { fait: profil.realisations.length >= 4, label: "4 photos au portfolio" },
  ];
  const complet = Math.round((etapes.filter((e) => e.fait).length / etapes.length) * 100);
  const metier = METIERS.find((m) => m.id === profil.metierId)?.label ?? profil.metier.label;

  async function enregistrer() {
    if (tarifs.some((t) => !t.prestation.trim())) return toast("Indiquez le nom de chaque prestation, ou supprimez la ligne.", "error");
    setEnvoi(true);
    try {
      await modifierMonProfil({
        metierId: infos.metierId,
        experience: Number(infos.experience) || 0,
        bio: infos.bio.trim(),
        specialites,
        zones: zones.map((z) => idZone(zonesApi, z)).filter(Boolean),
        tarifs: tarifs.map(({ prestation, prix }) => ({ prestation: prestation.trim(), prix: Math.max(0, Math.round(prix) || 0) })),
      });
      // Le nom commercial est porté par le compte (comme l'entreprise d'un client).
      mettreAJourUtilisateur(await api<UtilisateurApi>("/moi", { methode: "PATCH", corps: { entreprise: infos.entreprise.trim() || undefined } }));
      toast("Profil professionnel enregistré");
    } catch (e) {
      toast(texteErreur(e), "error");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Mon profil professionnel"
        subtitle="Un profil complet inspire davantage confiance aux clients."
        actions={
          profil.niveau >= 1 && (
            <LinkButton href={`/techniciens/${profil.id}`} variant="outline">
              <Eye className="size-4" /> Voir mon profil public
            </LinkButton>
          )
        }
      />
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Reveal className="space-y-6">
          <Card className="overflow-hidden text-center">
            <div className="h-20 bg-gradient-to-r from-brand-700 to-sky-brand" />
            <div className="-mt-12 px-6 pb-6">
              <PhotoUpload nom={u.nomComplet} photo={u.photoUrl} className="size-24 text-2xl" anneau="ring-4 ring-white" />
              <p className="mt-3 text-lg font-bold">{u.nomComplet}</p>
              <p className="text-sm text-slate-500">
                {metier}
                {u.zone && ` · ${u.zone.nom}`}
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Rating note={profil.note} nbAvis={profil.nbAvis} />
              </div>
              {profil.niveau >= 1 && (
                <div className="mt-2 flex justify-center">
                  <VerificationBadge niveau={Math.min(3, profil.niveau) as Niveau} />
                </div>
              )}
              <div className="mt-5 text-left">
                <div className="mb-1.5 flex justify-between text-xs font-semibold">
                  <span>Complétude du profil</span>
                  <span className="text-brand-600">{complet} %</span>
                </div>
                <ProgressBar value={complet} color="bg-gradient-to-r from-brand-600 to-sky-brand" />
                <ul className="mt-3 space-y-1 text-xs">
                  {etapes.map((e) => (
                    <li key={e.label} className={e.fait ? "text-slate-500" : "text-accent-600"}>
                      {e.fait ? "✓" : "○"} {e.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </Reveal>

        <Reveal className="space-y-6" delay={0.1}>
          <Card className="p-6">
            <h2 className="mb-5 font-bold text-slate-900">Informations professionnelles</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Métier principal">
                <Select value={infos.metierId} onChange={(e) => setInfos({ ...infos, metierId: e.target.value })}>
                  {METIERS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Années d'expérience">
                <Input type="number" min={0} max={60} value={infos.experience} onChange={(e) => setInfos({ ...infos, experience: Number(e.target.value) })} />
              </Field>
              <Field label="Nom commercial (optionnel)">
                <Input maxLength={120} value={infos.entreprise} onChange={(e) => setInfos({ ...infos, entreprise: e.target.value })} placeholder="Diallo Électricité" />
              </Field>
              <Field label="Téléphone" hint="Votre numéro de connexion, visible par vos clients une fois la mission acceptée.">
                <Input value={u.telephone} disabled />
              </Field>
            </div>
            <Field label="Description" className="mt-4" hint="Présentez votre parcours, vos points forts et vos garanties.">
              <Textarea maxLength={1000} value={infos.bio} onChange={(e) => setInfos({ ...infos, bio: e.target.value })} />
            </Field>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">Spécialités</h2>
            <div className="flex flex-wrap gap-2">
              {specialites.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 py-1.5 pl-3 pr-2 text-sm font-medium text-white">
                  {s}
                  <button onClick={() => setSpecialites(specialites.filter((x) => x !== s))} className="rounded-full p-0.5 hover:bg-white/20" aria-label={`Retirer ${s}`}>
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
              {specialites.length < 10 && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const s = nouvelle.trim();
                    if (s && !specialites.includes(s)) setSpecialites([...specialites, s]);
                    setNouvelle("");
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 pl-3 pr-1"
                >
                  <input value={nouvelle} onChange={(e) => setNouvelle(e.target.value)} maxLength={40} placeholder="Ajouter…" className="w-24 bg-transparent py-1.5 text-sm outline-none" />
                  <button type="submit" className="rounded-full bg-slate-100 p-1 text-slate-600 hover:bg-brand-50 hover:text-brand-600" aria-label="Ajouter">
                    <Plus className="size-3.5" />
                  </button>
                </form>
              )}
            </div>

            <h2 className="mb-4 mt-8 font-bold text-slate-900">Zones d&apos;intervention</h2>
            <div className="flex flex-wrap gap-2">
              {zonesApi.map(({ nom: z }) => (
                <button
                  key={z}
                  onClick={() => setZones(zones.includes(z) ? zones.filter((x) => x !== z) : [...zones, z])}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                    zones.includes(z) ? "border-accent-500 bg-accent-50 text-accent-600" : "border-slate-300 text-slate-600 hover:border-accent-400",
                  )}
                >
                  {z}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Tarifs indicatifs</h2>
                <p className="text-xs text-slate-500">Affichés sur votre profil public. Le prix final est celui de votre devis.</p>
              </div>
              <Button variant="outline" size="sm" disabled={tarifs.length >= 20} onClick={() => setTarifs([...tarifs, { prestation: "", prix: 0, cle: Date.now() }])}>
                <Plus className="size-4" /> Ajouter
              </Button>
            </div>
            {tarifs.length === 0 && <p className="text-sm text-slate-400">Aucun tarif pour l&apos;instant.</p>}
            <Reveal className="space-y-2" deps={[tarifs.length]} y={8}>
              {tarifs.map((t) => (
                <div key={t.cle} className="grid grid-cols-[1fr_150px_auto] gap-2">
                  <Input
                    value={t.prestation}
                    maxLength={80}
                    onChange={(e) => setTarifs(tarifs.map((x) => (x.cle === t.cle ? { ...x, prestation: e.target.value } : x)))}
                    placeholder="Prestation"
                  />
                  <Input
                    type="number"
                    min={0}
                    step={5000}
                    value={t.prix}
                    onChange={(e) => setTarifs(tarifs.map((x) => (x.cle === t.cle ? { ...x, prix: Number(e.target.value) } : x)))}
                    placeholder="Prix (GNF)"
                    aria-label="Prix (GNF)"
                  />
                  <button onClick={() => setTarifs(tarifs.filter((x) => x.cle !== t.cle))} className="rounded-lg px-2 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="Supprimer">
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </Reveal>
          </Card>

          <div className="flex justify-end gap-2">
            <Button size="lg" onClick={enregistrer} disabled={envoi}>
              {envoi ? "Enregistrement…" : "Enregistrer le profil"}
            </Button>
          </div>
        </Reveal>
      </div>
    </>
  );
}

// ------------------------------------------------------------ Démonstration

function ProfilDemo() {
  const [specialites, setSpecialites] = useState(moi.specialites);
  const [nouvelle, setNouvelle] = useState("");
  const [zones, setZones] = useState(moi.zonesIntervention);
  const [tarifs, setTarifs] = useState(TARIFS_INIT);

  return (
    <>
      <PageHeader
        title="Mon profil professionnel"
        subtitle="Un profil complet reçoit jusqu'à 3 fois plus de demandes."
        actions={
          <LinkButton href={`/techniciens/${moi.id}`} variant="outline">
            <Eye className="size-4" /> Voir mon profil public
          </LinkButton>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Reveal className="space-y-6">
          <Card className="overflow-hidden text-center">
            <div className="h-20 bg-gradient-to-r from-brand-700 to-sky-brand" />
            <div className="-mt-12 px-6 pb-6">
              <PhotoUpload nom={moi.nom} className="size-24 text-2xl" anneau="ring-4 ring-white" />
              <p className="mt-3 text-lg font-bold">{moi.nom}</p>
              <p className="text-sm text-slate-500">Électricien · {moi.zone}</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Rating note={moi.note} nbAvis={moi.nbAvis} />
              </div>
              <div className="mt-2 flex justify-center">
                <VerificationBadge niveau={moi.niveau} />
              </div>
              <div className="mt-5 text-left">
                <div className="mb-1.5 flex justify-between text-xs font-semibold">
                  <span>Complétude du profil</span>
                  <span className="text-brand-600">85 %</span>
                </div>
                <ProgressBar value={85} color="bg-gradient-to-r from-brand-600 to-sky-brand" />
                <ul className="mt-3 space-y-1 text-xs text-slate-500">
                  <li>✓ Photo et description</li>
                  <li>✓ Spécialités et zones</li>
                  <li className="text-accent-600">○ Ajoutez 4 photos au portfolio</li>
                </ul>
              </div>
            </div>
          </Card>
        </Reveal>

        <Reveal className="space-y-6" delay={0.1}>
          <Card className="p-6">
            <h2 className="mb-5 font-bold text-slate-900">Informations professionnelles</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Métier principal">
                <Select defaultValue={moi.metier}>
                  {METIERS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Années d'expérience">
                <Input type="number" defaultValue={moi.experience} />
              </Field>
              <Field label="Nom commercial (optionnel)">
                <Input placeholder="Diallo Électricité" />
              </Field>
              <Field label="Téléphone professionnel">
                <Input defaultValue={moi.telephone} />
              </Field>
            </div>
            <Field label="Description" className="mt-4" hint="Présentez votre parcours, vos points forts et vos garanties.">
              <Textarea defaultValue={moi.bio} />
            </Field>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 font-bold text-slate-900">Spécialités</h2>
            <div className="flex flex-wrap gap-2">
              {specialites.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 py-1.5 pl-3 pr-2 text-sm font-medium text-white">
                  {s}
                  <button onClick={() => setSpecialites(specialites.filter((x) => x !== s))} className="rounded-full p-0.5 hover:bg-white/20" aria-label={`Retirer ${s}`}>
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (nouvelle.trim()) setSpecialites([...specialites, nouvelle.trim()]);
                  setNouvelle("");
                }}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 pl-3 pr-1"
              >
                <input value={nouvelle} onChange={(e) => setNouvelle(e.target.value)} placeholder="Ajouter…" className="w-24 bg-transparent py-1.5 text-sm outline-none" />
                <button type="submit" className="rounded-full bg-slate-100 p-1 text-slate-600 hover:bg-brand-50 hover:text-brand-600" aria-label="Ajouter">
                  <Plus className="size-3.5" />
                </button>
              </form>
            </div>

            <h2 className="mb-4 mt-8 font-bold text-slate-900">Zones d&apos;intervention</h2>
            <div className="flex flex-wrap gap-2">
              {ZONES.map((z) => (
                <button
                  key={z}
                  onClick={() => setZones(zones.includes(z) ? zones.filter((x) => x !== z) : [...zones, z])}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                    zones.includes(z) ? "border-accent-500 bg-accent-50 text-accent-600" : "border-slate-300 text-slate-600 hover:border-accent-400",
                  )}
                >
                  {z}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Tarifs indicatifs</h2>
              <Button variant="outline" size="sm" onClick={() => setTarifs([...tarifs, { prestation: "", prix: "" }])}>
                <Plus className="size-4" /> Ajouter
              </Button>
            </div>
            <Reveal className="space-y-2" deps={[tarifs.length]} y={8}>
              {tarifs.map((t, i) => (
                <div key={i} className="grid grid-cols-[1fr_150px_auto] gap-2">
                  <Input defaultValue={t.prestation} placeholder="Prestation" />
                  <Input defaultValue={t.prix} placeholder="Prix (GNF)" />
                  <button onClick={() => setTarifs(tarifs.filter((_, k) => k !== i))} className="rounded-lg px-2 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="Supprimer">
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </Reveal>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="ghost">Annuler</Button>
            <Button size="lg" onClick={() => toast("Profil professionnel enregistré")}>
              Enregistrer le profil
            </Button>
          </div>
        </Reveal>
      </div>
    </>
  );
}
