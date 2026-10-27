// Données de démonstration, reprises de la maquette (branche Frontend, src/lib/data.ts) : `npm run seed`.
// ATTENTION : vide toutes les tables avant de les remplir. Réservé au développement.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { randomInt } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  type StatutCompte,
  type StatutDemande,
} from '../src/generated/prisma/client.js';

if (process.env.NODE_ENV === 'production')
  throw new Error(
    'Le seed de démonstration ne doit pas être lancé en production.',
  );

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

interface Seed {
  metiers: {
    id: string;
    label: string;
    actif: boolean;
    specialites: string[];
  }[];
  zones: {
    nom: string;
    ville: string;
    actif: boolean;
    lat: number;
    lng: number;
  }[];
  techniciens: {
    id: string;
    nom: string;
    photo: string;
    metier: string;
    specialites: string[];
    zone: string;
    zonesIntervention: string[];
    note: number;
    nbAvis: number;
    niveau: number;
    disponible: boolean;
    experience: number;
    missions: number;
    telephone: string;
    bio: string;
    disponibilites: string;
    realisations: { titre: string; categorie: string; image: string }[];
    avis: { auteur: string; note: number; commentaire: string; date: string }[];
    inscrit: string;
    statut: string;
  }[];
  utilisateurs: {
    nom: string;
    role: string;
    telephone: string;
    zone: string;
    statut: string;
    inscrit: string;
  }[];
  client: { email: string };
  demandes: {
    id: string;
    titre: string;
    metier: string;
    description: string;
    client: string;
    clientTel?: string;
    technicienId?: string;
    zone: string;
    adresse: string;
    urgence: string;
    statut: string;
    date: string;
    creneau?: string;
    budget?: number;
    dates: (string | null)[];
  }[];
}

const seed = JSON.parse(
  readFileSync(new URL('./seed-data.json', import.meta.url), 'utf8'),
) as Seed;

// ------------------------------------------------------------- Utilitaires

const MOIS: Record<string, number> = {
  'janv.': 0,
  'févr.': 1,
  mars: 2,
  'avr.': 3,
  mai: 4,
  juin: 5,
  'juil.': 6,
  août: 7,
  'sept.': 8,
  'oct.': 9,
  'nov.': 10,
  'déc.': 11,
};

/** « 20 oct. 2026 », « 20 oct. · 10h24 », « 21 oct. 2026 · 10h00 » → Date (année 2026 par défaut). */
function date(texte?: string | null): Date | undefined {
  const m =
    texte &&
    /^(\d{1,2}) (\S+)(?: (\d{4}))?(?: · (\d{1,2})h(\d{2}))?/.exec(texte);
  if (!m || MOIS[m[2]] === undefined) return undefined;
  return new Date(
    Number(m[3] ?? 2026),
    MOIS[m[2]],
    Number(m[1]),
    Number(m[4] ?? 9),
    Number(m[5] ?? 0),
  );
}

const telephone = (t: string) => t.replace(/\s/g, '');
const decouper = (nomComplet: string) => {
  const [prenom, ...reste] = nomComplet.split(' ');
  return { prenom, nom: reste.join(' ') };
};
const statutCompte = (s: string) => s.toUpperCase() as StatutCompte;

// ------------------------------------------------------------------- Seed

async function vider() {
  // Ordre inverse des dépendances.
  await prisma.$transaction([
    prisma.envoiNotification.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.signalement.deleteMany(),
    prisma.avis.deleteMany(),
    prisma.message.deleteMany(),
    prisma.paiement.deleteMany(),
    prisma.ligneDevis.deleteMany(),
    prisma.devis.deleteMany(),
    prisma.demande.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.realisation.deleteMany(),
    prisma.profilTechnicien.deleteMany(),
    prisma.session.deleteMany(),
    prisma.codeOtp.deleteMany(),
    prisma.user.deleteMany(),
    prisma.zone.deleteMany(),
    prisma.metier.deleteMany(),
    prisma.modeleNotification.deleteMany(),
    prisma.parametre.deleteMany(),
  ]);
}

async function main() {
  await vider();

  await prisma.metier.createMany({ data: seed.metiers });
  const zones = new Map<string, string>();
  for (const z of seed.zones)
    zones.set(z.nom, (await prisma.zone.create({ data: z })).id);

  // Clients et administrateur
  const users = new Map<string, string>();
  for (const u of seed.utilisateurs) {
    const cree = await prisma.user.create({
      data: {
        ...decouper(u.nom),
        telephone: telephone(u.telephone),
        role: u.role === 'admin' ? 'ADMIN' : 'CLIENT',
        statut: statutCompte(u.statut),
        typeClient: u.role === 'client' ? 'PARTICULIER' : undefined,
        email: u.nom === 'Mohamed Camara' ? seed.client.email : undefined,
        zoneId: zones.get(u.zone),
        createdAt: date(u.inscrit),
      },
    });
    users.set(u.nom, cree.id);
  }

  // Techniciens. Moussa Kouyaté attend la vérification de son identité : niveau 0, compte en attente.
  const techniciens = new Map<string, { id: string; userId: string }>();
  for (const t of seed.techniciens) {
    const enAttente = t.statut === 'en_attente';
    const user = await prisma.user.create({
      data: {
        ...decouper(t.nom),
        telephone: telephone(t.telephone),
        role: 'TECHNICIEN',
        statut: statutCompte(t.statut),
        photoUrl: t.photo,
        zoneId: zones.get(t.zone),
        createdAt: date(t.inscrit),
        technicien: {
          create: {
            id: t.id,
            metierId: t.metier,
            specialites: t.specialites,
            experience: t.experience,
            bio: t.bio,
            niveau: enAttente ? 0 : t.niveau,
            disponible: t.disponible,
            disponibilites: t.disponibilites,
            note: t.note,
            nbAvis: t.nbAvis,
            nbMissions: t.missions,
            zones: {
              connect: t.zonesIntervention
                .filter((z) => zones.has(z))
                .map((z) => ({ id: zones.get(z)! })),
            },
            realisations: {
              create: t.realisations.map((r) => ({
                titre: r.titre,
                categorie: r.categorie,
                imageUrl: r.image,
              })),
            },
          },
        },
      },
    });
    techniciens.set(t.id, { id: t.id, userId: user.id });
    if (enAttente) {
      await prisma.verification.create({
        data: {
          technicienId: t.id,
          niveau: 1,
          pieces: [{ type: 'piece_identite', url: '/images/chantier.jpg' }],
          message: "Pièce d'identité et attestation de résidence.",
        },
      });
    }
  }
  await prisma.verification.create({
    data: {
      technicienId: 'ibrahima-camara',
      niveau: 3,
      pieces: [{ type: 'attestation', url: '/images/electricien-tableau.jpg' }],
      message: 'Demande de passage au niveau Recommandé après 31 missions.',
    },
  });

  // Demandes : les clients absents de la liste des utilisateurs sont créés au passage.
  let numeroLibre = 30;
  for (const d of seed.demandes) {
    if (!users.has(d.client)) {
      const cree = await prisma.user.create({
        data: {
          ...decouper(d.client),
          telephone: d.clientTel
            ? telephone(d.clientTel)
            : `+2246200001${numeroLibre++}`,
          role: 'CLIENT',
          typeClient: 'PARTICULIER',
          zoneId: zones.get(d.zone),
        },
      });
      users.set(d.client, cree.id);
    }
    const zone = seed.zones.find((z) => z.nom === d.zone);
    const [creee, acceptee, demarree, terminee] = d.dates.map(date);
    const statut = d.statut.toUpperCase() as StatutDemande;
    await prisma.demande.create({
      data: {
        id: d.id,
        numero: Number(d.id.replace(/\D/g, '')),
        clientId: users.get(d.client)!,
        technicienId: d.technicienId || undefined,
        metierId: d.metier,
        titre: d.titre,
        description: d.description,
        zoneId: zones.get(d.zone)!,
        adresse: d.adresse,
        lat: zone?.lat,
        lng: zone?.lng,
        urgente: d.urgence === 'urgente',
        dateSouhaitee: date(d.creneau),
        creneau: d.creneau,
        budget: d.budget,
        statut,
        codeIntervention: String(randomInt(1000, 10000)),
        createdAt: creee ?? date(d.date),
        accepteeLe: acceptee,
        demarreeLe: demarree,
        termineeLe: statut === 'TERMINEE' ? terminee : undefined,
        annuleeLe:
          statut === 'ANNULEE'
            ? (d.dates.filter(Boolean).map(date).pop() ?? date(d.date))
            : undefined,
      },
    });
  }
  // Les numéros ont été fixés à la main : la séquence reprend après le plus grand.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Demande"', 'numero'), (SELECT MAX(numero) FROM "Demande"))`,
  );

  // Devis de la maquette (src/lib/devis.ts)
  await prisma.devis.create({
    data: {
      demandeId: 'd-1023',
      statut: 'PAYE',
      deplacement: 50000,
      envoyeLe: date('20 oct. · 11h20'),
      lignes: {
        create: [
          {
            libelle: 'Diagnostic du climatiseur',
            quantite: 1,
            prix: 50000,
            ordre: 0,
          },
          {
            libelle: 'Recharge en gaz R410A',
            quantite: 1,
            prix: 180000,
            ordre: 1,
          },
          {
            libelle: 'Nettoyage des filtres',
            quantite: 1,
            prix: 70000,
            ordre: 2,
          },
        ],
      },
      paiement: {
        create: {
          moyen: 'ORANGE',
          numero: '+224621112233',
          montant: 350000,
          commission: 17500,
          reference: 'OM-260420-8841',
          statut: 'CONFIRME',
          confirmeLe: date('20 oct. · 12h05'),
        },
      },
    },
  });
  await prisma.devis.create({
    data: {
      demandeId: 'd-1019',
      statut: 'ENVOYE',
      deplacement: 50000,
      note: "Matériel fourni, garantie 6 mois sur l'installation.",
      envoyeLe: date('18 oct. · 15h10'),
      lignes: {
        create: [
          {
            libelle: 'Prise électrique encastrée',
            quantite: 6,
            prix: 75000,
            ordre: 0,
          },
          {
            libelle: 'Point lumineux complet',
            quantite: 4,
            prix: 60000,
            ordre: 1,
          },
          {
            libelle: 'Câble et gaines (forfait)',
            quantite: 1,
            prix: 90000,
            ordre: 2,
          },
        ],
      },
    },
  });

  // Conversations (src/lib/messages.ts)
  const client = users.get('Mohamed Camara')!;
  const mamadou = techniciens.get('mamadou-diallo')!.userId;
  const messages: [string, string, string, string, string?][] = [
    [
      'd-1023',
      client,
      'Bonjour, le climatiseur du salon ne refroidit plus du tout depuis deux jours.',
      '20 oct. · 10h30',
    ],
    [
      'd-1023',
      mamadou,
      "Bonjour M. Camara, c'est noté. Pouvez-vous m'envoyer une photo de l'étiquette de l'appareil ?",
      '20 oct. · 10h42',
    ],
    [
      'd-1023',
      client,
      "Voici l'étiquette.",
      '20 oct. · 10h45',
      '/images/electricien-tableau.jpg',
    ],
    [
      'd-1023',
      mamadou,
      "Merci. Il s'agit probablement d'un manque de gaz. Je passe demain à 10h, je vous envoie le devis.",
      '20 oct. · 11h05',
    ],
    [
      'd-1023',
      mamadou,
      "Je suis en route, j'arrive dans une quinzaine de minutes.",
      '21 oct. · 09h55',
    ],
    [
      'd-1019',
      mamadou,
      "Bonjour, j'ai bien reçu votre demande pour l'extension. Le devis est dans l'application.",
      '18 oct. · 15h12',
    ],
    ['d-1019', client, 'Merci, je regarde ça ce soir.', '18 oct. · 16h03'],
  ];
  await prisma.message.createMany({
    data: messages.map(([demandeId, auteurId, texte, quand, photoUrl]) => ({
      demandeId,
      auteurId,
      texte,
      photoUrl,
      lu: true,
      createdAt: date(quand),
    })),
  });

  // Avis vérifiés sur les missions terminées
  for (const d of seed.demandes.filter(
    (x) => x.statut === 'terminee' && x.technicienId,
  )) {
    const avis = seed.techniciens.find((t) => t.id === d.technicienId)?.avis[0];
    await prisma.avis.create({
      data: {
        demandeId: d.id,
        auteurId: users.get(d.client)!,
        technicienId: d.technicienId!,
        note: avis?.note ?? 5,
        commentaire: avis?.commentaire,
        tags: ['Ponctuel', 'Travail soigné'],
        recommande: true,
        createdAt: date(d.dates[3]) ?? date(d.date),
      },
    });
  }

  await prisma.signalement.create({
    data: {
      type: 'technicien',
      cible: 'lansana-traore',
      motif: 'Absent au rendez-vous à deux reprises sans prévenir.',
      priorite: 'haute',
      auteurId: users.get('Hawa Bangoura'),
    },
  });

  const compte = await prisma.$transaction([
    prisma.user.count(),
    prisma.profilTechnicien.count(),
    prisma.demande.count(),
  ]);
  console.log(
    `Seed terminé : ${compte[0]} utilisateurs, ${compte[1]} techniciens, ${compte[2]} demandes.`,
  );
  console.log(
    'Connexion admin : +224 629 00 11 22 · client : +224 621 11 22 33 · technicien : +224 620 00 00 01 (code affiché dans la console de l’API).',
  );
}

await main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
