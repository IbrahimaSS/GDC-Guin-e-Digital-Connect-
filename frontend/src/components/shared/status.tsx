import { Badge, type Tone } from "@/components/ui";
import {
  STATUTS_DEMANDE,
  STATUTS_VERIFICATION,
  type StatutDemande,
  type StatutSignalement,
  type StatutVerification,
  type Utilisateur,
} from "@/lib/data";

const DEMANDE_TONES: Record<StatutDemande, Tone> = {
  envoyee: "amber",
  acceptee: "blue",
  en_cours: "orange",
  terminee: "green",
  annulee: "slate",
};

export function StatutDemandeBadge({ statut }: { statut: StatutDemande }) {
  return (
    <Badge tone={DEMANDE_TONES[statut]} dot>
      {STATUTS_DEMANDE[statut]}
    </Badge>
  );
}

const VERIF_TONES: Record<StatutVerification, Tone> = {
  en_attente: "amber",
  en_cours: "blue",
  approuvee: "green",
  refusee: "red",
};

export function StatutVerificationBadge({ statut }: { statut: StatutVerification }) {
  return (
    <Badge tone={VERIF_TONES[statut]} dot>
      {STATUTS_VERIFICATION[statut]}
    </Badge>
  );
}

const COMPTE: Record<Utilisateur["statut"], [Tone, string]> = {
  actif: ["green", "Actif"],
  suspendu: ["red", "Suspendu"],
  en_attente: ["amber", "En attente"],
};

export function StatutCompteBadge({ statut }: { statut: Utilisateur["statut"] }) {
  const [tone, label] = COMPTE[statut];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}

const SIGNALEMENT: Record<StatutSignalement, [Tone, string]> = {
  ouvert: ["red", "Ouvert"],
  en_cours: ["blue", "En cours"],
  resolu: ["green", "Résolu"],
};

export function StatutSignalementBadge({ statut }: { statut: StatutSignalement }) {
  const [tone, label] = SIGNALEMENT[statut];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}
