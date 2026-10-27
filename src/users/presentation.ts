import { formaterTelephone } from '../common/telephone.js';
import type { Prisma } from '../generated/prisma/client.js';

/** Champs chargés pour présenter un utilisateur. */
export const INCLURE_UTILISATEUR = {
  zone: { select: { id: true, nom: true } },
  technicien: {
    include: {
      metier: { select: { id: true, label: true } },
      zones: { select: { id: true, nom: true } },
    },
  },
} satisfies Prisma.UserInclude;

type UserComplet = Prisma.UserGetPayload<{
  include: typeof INCLURE_UTILISATEUR;
}>;

/** Représentation renvoyée au frontend (jamais de données internes : sessions, identifiants Google…). */
export function presenterUtilisateur(u: UserComplet) {
  return {
    id: u.id,
    nom: u.nom,
    prenom: u.prenom,
    nomComplet: `${u.prenom} ${u.nom}`,
    telephone: formaterTelephone(u.telephone),
    email: u.email,
    role: u.role,
    statut: u.statut,
    photoUrl: u.photoUrl,
    typeClient: u.typeClient,
    entreprise: u.entreprise,
    zone: u.zone,
    googleLie: Boolean(u.googleId),
    technicien: u.technicien && {
      id: u.technicien.id,
      metier: u.technicien.metier,
      specialites: u.technicien.specialites,
      experience: u.technicien.experience,
      bio: u.technicien.bio,
      niveau: u.technicien.niveau,
      disponible: u.technicien.disponible,
      disponibilites: u.technicien.disponibilites,
      note: u.technicien.note,
      nbAvis: u.technicien.nbAvis,
      nbMissions: u.technicien.nbMissions,
      zones: u.technicien.zones,
    },
    inscritLe: u.createdAt,
  };
}
