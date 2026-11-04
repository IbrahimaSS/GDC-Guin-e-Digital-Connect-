"use client";

import { Ban, CheckCircle2, Download, Eye, UserPlus } from "lucide-react";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { StatutCompteBadge } from "@/components/shared/status";
import { Avatar, Badge, Button, Card, Field, Input, PageHeader, Select, type Tone } from "@/components/ui";
import { Drawer, Tabs } from "@/components/ui/interactive";
import { Pagination, SearchBox, Table, TableToolbar, Td, Th } from "@/components/ui/table";
import { dateCourte, ilYa, useStatsAdmin, type Page, type UtilisateurAdmin } from "@/lib/admin";
import { api, apiActive, texteErreur } from "@/lib/api";
import { useZonesApi } from "@/lib/auth";
import { UTILISATEURS, ZONES, type Role, type Utilisateur } from "@/lib/data";
import { useMetiers } from "@/lib/plateforme";
import { useSession } from "@/lib/session";
import { dateFichier, telechargerCsv } from "@/lib/telechargement";
import { useApi } from "@/lib/useApi";

const ROLES: Record<Role, [Tone, string]> = {
  client: ["blue", "Client"],
  technicien: ["orange", "Technicien"],
  admin: ["violet", "Admin"],
};

type Filtre = "tous" | Role;

/** Ligne du tableau (démonstration ou API). */
type Ligne = Utilisateur & { photo?: string; derniereConnexion?: string | null; nbSignalements?: number };

const versLigne = (u: UtilisateurAdmin): Ligne => ({
  id: u.id,
  nom: u.nomComplet,
  role: u.role.toLowerCase() as Role,
  telephone: u.telephone,
  zone: u.zone?.nom ?? "—",
  statut: u.statut.toLowerCase() as Utilisateur["statut"],
  inscrit: dateCourte(u.inscritLe),
  demandes: u.nbDemandes,
  photo: u.photoUrl ?? undefined,
  derniereConnexion: u.derniereConnexion,
  nbSignalements: u.nbSignalements,
});

const VIDE = { prenom: "", nom: "", telephone: "", role: "CLIENT", zone: "", metier: "electricite" };

export default function GestionUtilisateurs() {
  const metiers = useMetiers();
  const session = useSession();
  const stats = useStatsAdmin().donnees;
  const [locaux, setLocaux] = useState<Ligne[]>(UTILISATEURS);
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [q, setQ] = useState("");
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [ajout, setAjout] = useState(false);
  const [nouveau, setNouveau] = useState(VIDE);
  const [envoi, setEnvoi] = useState(false);
  const zones = useZonesApi(apiActive);

  // Avec l'API : filtre et recherche côté serveur.
  const params = new URLSearchParams({ parPage: "100" });
  if (filtre !== "tous") params.set("role", filtre.toUpperCase());
  if (q.trim()) params.set("q", q.trim());
  const distants = useApi<Page<UtilisateurAdmin>>(apiActive ? `/admin/utilisateurs?${params}` : null);
  const detail = useApi<UtilisateurAdmin>(apiActive && selectionId ? `/admin/utilisateurs/${selectionId}` : null);

  const users: Ligne[] = apiActive ? (distants.donnees?.resultats ?? []).map(versLigne) : locaux;
  const liste = apiActive ? users : users.filter((u) => (filtre === "tous" || u.role === filtre) && (u.nom + u.telephone).toLowerCase().includes(q.toLowerCase()));
  const selection: Ligne | null = apiActive ? (detail.donnees ? versLigne(detail.donnees) : (users.find((u) => u.id === selectionId) ?? null)) : (locaux.find((u) => u.id === selectionId) ?? null);
  const count = (r: Role) =>
    apiActive ? (stats ? { client: stats.utilisateurs.clients, technicien: stats.utilisateurs.techniciens, admin: stats.utilisateurs.admins }[r] : 0) : users.filter((u) => u.role === r).length;
  const total = apiActive ? (stats ? stats.utilisateurs.clients + stats.utilisateurs.techniciens + stats.utilisateurs.admins : 0) : users.length;

  async function basculer(u: Ligne) {
    const statut = u.statut === "suspendu" ? "actif" : "suspendu";
    if (apiActive) {
      if (u.id === session?.utilisateur.id) return toast("Vous ne pouvez pas suspendre votre propre compte.", "error");
      try {
        await api(`/admin/utilisateurs/${u.id}/statut`, { methode: "PATCH", corps: { statut: statut.toUpperCase() } });
        distants.recharger();
        detail.recharger();
      } catch (e) {
        return toast(texteErreur(e), "error");
      }
    } else {
      setLocaux(locaux.map((x) => (x.id === u.id ? { ...x, statut } : x)));
    }
    toast(statut === "suspendu" ? `${u.nom} a été suspendu : ses sessions sont fermées` : `${u.nom} a été réactivé`, statut === "suspendu" ? "info" : "success");
  }

  async function creer() {
    if (!apiActive) {
      setAjout(false);
      return toast("Invitation envoyée par SMS");
    }
    if (!nouveau.prenom.trim() || !nouveau.nom.trim() || !nouveau.telephone.trim()) return toast("Prénom, nom et téléphone sont obligatoires.", "error");
    setEnvoi(true);
    try {
      await api("/admin/utilisateurs", {
        methode: "POST",
        corps: {
          prenom: nouveau.prenom.trim(),
          nom: nouveau.nom.trim(),
          telephone: nouveau.telephone,
          role: nouveau.role,
          zoneId: zones.find((z) => z.nom === nouveau.zone)?.id,
          metierId: nouveau.role === "TECHNICIEN" ? nouveau.metier : undefined,
        },
      });
      setAjout(false);
      setNouveau(VIDE);
      distants.recharger();
      toast(`Compte créé : ${nouveau.prenom} est invité par SMS à se connecter`);
    } catch (e) {
      toast(texteErreur(e), "error");
    } finally {
      setEnvoi(false);
    }
  }

  const journal = selection
    ? apiActive
      ? [
          selection.derniereConnexion ? `Dernière connexion : ${ilYa(selection.derniereConnexion).toLowerCase()}` : "Jamais connecté",
          "Numéro vérifié par SMS à chaque connexion",
          selection.nbSignalements ? `${selection.nbSignalements} signalement${selection.nbSignalements > 1 ? "s" : ""} le concernant` : "Aucun signalement",
        ]
      : ["Dernière connexion : aujourd'hui, 09h12", "Numéro vérifié par SMS", "Aucun signalement"]
    : [];

  return (
    <>
      <PageHeader
        title="Gestion des utilisateurs"
        subtitle={apiActive ? `${total} comptes · ${stats?.utilisateurs.suspendus ?? 0} suspendus` : `${users.length} comptes · ${users.filter((u) => u.statut === "actif").length} actifs`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                telechargerCsv(
                  `gdc-utilisateurs-${dateFichier()}.csv`,
                  ["Nom", "Rôle", "Téléphone", "Zone", "Inscription", "Demandes / missions", "Statut"],
                  liste.map((u) => [u.nom, ROLES[u.role][1], u.telephone, u.zone, u.inscrit, u.demandes, { actif: "Actif", suspendu: "Suspendu", en_attente: "En attente" }[u.statut]]),
                );
                toast(`${liste.length} utilisateurs exportés`);
              }}
            >
              <Download className="size-4" /> Exporter
            </Button>
            <Button onClick={() => setAjout(true)}>
              <UserPlus className="size-4" /> Ajouter
            </Button>
          </>
        }
      />
      <Card>
        <TableToolbar>
          <Tabs<Filtre>
            value={filtre}
            onChange={setFiltre}
            variant="pill"
            tabs={[
              { id: "tous", label: "Tous", count: total },
              { id: "client", label: "Clients", count: count("client") },
              { id: "technicien", label: "Techniciens", count: count("technicien") },
              { id: "admin", label: "Admins", count: count("admin") },
            ]}
          />
          <SearchBox value={q} onChange={setQ} placeholder="Nom ou téléphone…" />
        </TableToolbar>
        <Table>
          <thead>
            <tr>
              <Th>Utilisateur</Th>
              <Th>Rôle</Th>
              <Th>Zone</Th>
              <Th>Inscription</Th>
              <Th>Demandes / missions</Th>
              <Th>Statut</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <Reveal as="tbody" deps={[filtre, q, liste.length]} y={10} stagger={0.03}>
            {liste.map((u) => (
              <tr key={u.id} className="transition hover:bg-slate-50/80">
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar nom={u.nom} photo={u.photo} className="size-9 text-[11px]" />
                    <div>
                      <p className="font-semibold text-slate-900">{u.nom}</p>
                      <p className="text-xs text-slate-500">{u.telephone}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <Badge tone={ROLES[u.role][0]}>{ROLES[u.role][1]}</Badge>
                </Td>
                <Td className="text-slate-600">{u.zone}</Td>
                <Td className="text-slate-600">{u.inscrit}</Td>
                <Td className="font-semibold text-slate-900">{u.demandes}</Td>
                <Td>
                  <StatutCompteBadge statut={u.statut} />
                </Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => {
                        setSelectionId(u.id);
                        setOuvert(true);
                      }}
                      className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-600"
                      aria-label="Voir"
                    >
                      <Eye className="size-4" />
                    </button>
                    {u.id !== session?.utilisateur.id && (
                      <button
                        onClick={() => basculer(u)}
                        className={u.statut === "suspendu" ? "rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" : "rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-500"}
                        aria-label={u.statut === "suspendu" ? "Réactiver" : "Suspendre"}
                      >
                        {u.statut === "suspendu" ? <CheckCircle2 className="size-4" /> : <Ban className="size-4" />}
                      </button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Reveal>
        </Table>
        {apiActive && !distants.chargement && liste.length === 0 && <p className="p-6 text-center text-sm text-slate-400">Aucun compte ne correspond à cette recherche.</p>}
        <Pagination total={apiActive ? (distants.donnees?.total ?? 0) : liste.length} label="utilisateurs" />
      </Card>

      <Drawer
        open={ouvert}
        onClose={() => setOuvert(false)}
        title="Fiche utilisateur"
        footer={
          selection && (
            <>
              {selection.id !== session?.utilisateur.id && (
                <Button variant={selection.statut === "suspendu" ? "secondary" : "danger"} className="flex-1" onClick={() => basculer(selection)}>
                  {selection.statut === "suspendu" ? "Réactiver le compte" : "Suspendre le compte"}
                </Button>
              )}
              <Button variant="ghost" onClick={() => setOuvert(false)}>
                Fermer
              </Button>
            </>
          )
        }
      >
        {selection && (
          <>
            <div className="flex items-center gap-4">
              <Avatar nom={selection.nom} photo={selection.photo} className="size-16 text-lg" />
              <div>
                <p className="text-lg font-bold text-slate-900">{selection.nom}</p>
                <div className="mt-1 flex gap-2">
                  <Badge tone={ROLES[selection.role][0]}>{ROLES[selection.role][1]}</Badge>
                  <StatutCompteBadge statut={selection.statut} />
                </div>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Téléphone", selection.telephone],
                ["Zone", selection.zone],
                ["Inscrit le", selection.inscrit],
                [selection.role === "technicien" ? "Missions réalisées" : "Demandes", String(selection.demandes)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="font-semibold text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
            <div>
              <p className="mb-2 text-sm font-bold text-slate-900">Journal</p>
              <ul className="space-y-2 text-sm text-slate-600">
                {journal.map((l) => (
                  <li key={l}>• {l}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </Drawer>

      <Drawer
        open={ajout}
        onClose={() => setAjout(false)}
        title="Ajouter un utilisateur"
        footer={
          <Button className="flex-1" onClick={creer} disabled={envoi}>
            {envoi ? "Création…" : "Créer le compte et envoyer l'invitation"}
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom">
            <Input value={nouveau.prenom} onChange={(e) => setNouveau({ ...nouveau, prenom: e.target.value })} placeholder="Aïssatou" />
          </Field>
          <Field label="Nom">
            <Input value={nouveau.nom} onChange={(e) => setNouveau({ ...nouveau, nom: e.target.value })} placeholder="Barry" />
          </Field>
        </div>
        <Field label="Téléphone" hint="La personne se connecte avec ce numéro et reçoit un SMS d'invitation.">
          <Input value={nouveau.telephone} onChange={(e) => setNouveau({ ...nouveau, telephone: e.target.value })} placeholder="620 12 34 56" inputMode="tel" />
        </Field>
        <Field label="Rôle">
          <Select value={nouveau.role} onChange={(e) => setNouveau({ ...nouveau, role: e.target.value })}>
            <option value="CLIENT">Client</option>
            <option value="TECHNICIEN">Technicien</option>
            <option value="ADMIN">Administrateur</option>
          </Select>
        </Field>
        {nouveau.role === "TECHNICIEN" && (
          <Field label="Métier" hint="Le technicien devra ensuite faire vérifier son identité pour être visible.">
            <Select value={nouveau.metier} onChange={(e) => setNouveau({ ...nouveau, metier: e.target.value })}>
              {metiers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Zone">
          <Select value={nouveau.zone} onChange={(e) => setNouveau({ ...nouveau, zone: e.target.value })}>
            <option value="">Non précisée</option>
            {(apiActive ? zones.map((z) => z.nom) : ZONES).map((z) => (
              <option key={z}>{z}</option>
            ))}
          </Select>
        </Field>
      </Drawer>
    </>
  );
}
