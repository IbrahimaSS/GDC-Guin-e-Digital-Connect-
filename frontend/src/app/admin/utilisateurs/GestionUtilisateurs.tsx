"use client";

import { Ban, CheckCircle2, Download, Eye, UserPlus } from "lucide-react";
import { useState } from "react";
import Reveal from "@/components/motion/Reveal";
import { toast } from "@/components/motion/Toaster";
import { StatutCompteBadge } from "@/components/shared/status";
import { Avatar, Badge, Button, Card, Field, Input, PageHeader, Select, type Tone } from "@/components/ui";
import { Drawer, Tabs } from "@/components/ui/interactive";
import { Pagination, SearchBox, Table, TableToolbar, Td, Th } from "@/components/ui/table";
import { UTILISATEURS, ZONES, type Role, type Utilisateur } from "@/lib/data";
import { dateFichier, telechargerCsv } from "@/lib/telechargement";

const ROLES: Record<Role, [Tone, string]> = {
  client: ["blue", "Client"],
  technicien: ["orange", "Technicien"],
  admin: ["violet", "Admin"],
};

type Filtre = "tous" | Role;

export default function GestionUtilisateurs() {
  const [users, setUsers] = useState(UTILISATEURS);
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [q, setQ] = useState("");
  const [selection, setSelection] = useState<Utilisateur | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [ajout, setAjout] = useState(false);

  const liste = users.filter((u) => (filtre === "tous" || u.role === filtre) && (u.nom + u.telephone).toLowerCase().includes(q.toLowerCase()));
  const count = (r: Role) => users.filter((u) => u.role === r).length;

  const basculer = (u: Utilisateur) => {
    const statut = u.statut === "suspendu" ? "actif" : "suspendu";
    setUsers(users.map((x) => (x.id === u.id ? { ...x, statut } : x)));
    setSelection((s) => (s?.id === u.id ? { ...s, statut } : s));
    toast(statut === "suspendu" ? `${u.nom} a été suspendu` : `${u.nom} a été réactivé`, statut === "suspendu" ? "info" : "success");
  };

  return (
    <>
      <PageHeader
        title="Gestion des utilisateurs"
        subtitle={`${users.length} comptes · ${users.filter((u) => u.statut === "actif").length} actifs`}
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
              { id: "tous", label: "Tous", count: users.length },
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
          <Reveal as="tbody" deps={[filtre, q]} y={10} stagger={0.03}>
            {liste.map((u) => (
              <tr key={u.id} className="transition hover:bg-slate-50/80">
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar nom={u.nom} className="size-9 text-[11px]" />
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
                        setSelection(u);
                        setOuvert(true);
                      }} className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-600" aria-label="Voir">
                      <Eye className="size-4" />
                    </button>
                    <button
                      onClick={() => basculer(u)}
                      className={u.statut === "suspendu" ? "rounded-lg p-2 text-emerald-600 hover:bg-emerald-50" : "rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-500"}
                      aria-label={u.statut === "suspendu" ? "Réactiver" : "Suspendre"}
                    >
                      {u.statut === "suspendu" ? <CheckCircle2 className="size-4" /> : <Ban className="size-4" />}
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </Reveal>
        </Table>
        <Pagination total={liste.length} label="utilisateurs" />
      </Card>

      <Drawer
        open={ouvert}
        onClose={() => setOuvert(false)}
        title="Fiche utilisateur"
        footer={
          selection && (
            <>
              <Button variant={selection.statut === "suspendu" ? "secondary" : "danger"} className="flex-1" onClick={() => basculer(selection)}>
                {selection.statut === "suspendu" ? "Réactiver le compte" : "Suspendre le compte"}
              </Button>
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
              <Avatar nom={selection.nom} className="size-16 text-lg" />
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
                ["Demandes", String(selection.demandes)],
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
                <li>• Dernière connexion : aujourd&apos;hui, 09h12</li>
                <li>• Numéro vérifié par SMS</li>
                <li>• Aucun signalement</li>
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
          <Button
            className="flex-1"
            onClick={() => {
              setAjout(false);
              toast("Invitation envoyée par SMS");
            }}
          >
            Envoyer l&apos;invitation
          </Button>
        }
      >
        <Field label="Nom complet">
          <Input placeholder="Prénom Nom" />
        </Field>
        <Field label="Téléphone">
          <Input placeholder="620 12 34 56" />
        </Field>
        <Field label="Rôle">
          <Select defaultValue="client">
            <option value="client">Client</option>
            <option value="technicien">Technicien</option>
            <option value="admin">Administrateur</option>
          </Select>
        </Field>
        <Field label="Zone">
          <Select>
            {ZONES.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </Select>
        </Field>
      </Drawer>
    </>
  );
}
