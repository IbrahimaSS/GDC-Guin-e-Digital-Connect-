import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Paramètres de la plateforme modifiables dans le back-office, avec leur valeur par défaut. */
export const PARAMETRES = {
  // Général
  nomPlateforme: 'GDC – Guinée Digital Connect',
  slogan: 'Les compétences au service des opportunités.',
  messageAccueil:
    'Bienvenue sur GDC ! Trouvez le bon professionnel près de chez vous.',
  telephoneSupport: '+224 620 00 00 00',
  emailSupport: 'support@gdc.gn',
  logoUrl: null as string | null,
  /** Les nouveaux comptes peuvent être créés */
  inscriptionsOuvertes: true,
  /** Un bandeau d'information est affiché aux visiteurs */
  maintenance: false,
  // Paiements
  commission: 0.05,
  fraisDeplacementDefaut: 50000,
  moyensPaiement: { orange: true, mtn: true, especes: true },
  abonnementPro: 50000,
  offreEntreprises: 'devis' as 'devis' | 'forfait',
  // Vérification et avis
  missionsNiveau3: 20,
  noteNiveau3: 4.5,
  validiteVerificationMois: 24,
  /** Les avis de 1 et 2 étoiles attendent une validation avant publication */
  modererAvisNegatifs: true,
  /** Jours laissés au client pour donner son avis après la mission */
  delaiAvisJours: 14,
  // Notifications
  canaux: { sms: true, whatsapp: true, email: false },
  expediteurSms: 'GDC',
};

export type Parametres = typeof PARAMETRES;
export type CleParametre = keyof Parametres;

/** Paramètres lisibles sans être connecté (en-tête du site, inscription, paiement…). */
const PUBLICS: CleParametre[] = [
  'nomPlateforme',
  'slogan',
  'messageAccueil',
  'logoUrl',
  'telephoneSupport',
  'emailSupport',
  'inscriptionsOuvertes',
  'maintenance',
  'moyensPaiement',
  'fraisDeplacementDefaut',
];

type Regle = (v: unknown) => string | null;
const texte =
  (min: number, max: number): Regle =>
  (v) =>
    typeof v === 'string' && v.trim().length >= min && v.trim().length <= max
      ? null
      : `texte de ${min} à ${max} caractères attendu`;
const nombre =
  (min: number, max: number, entier = false): Regle =>
  (v) =>
    typeof v === 'number' &&
    Number.isFinite(v) &&
    v >= min &&
    v <= max &&
    (!entier || Number.isInteger(v))
      ? null
      : `${entier ? 'nombre entier' : 'nombre'} entre ${min} et ${max} attendu`;
const booleen: Regle = (v) =>
  typeof v === 'boolean' ? null : 'oui / non attendu';
const drapeaux =
  (cles: string[]): Regle =>
  (v) =>
    v &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    Object.keys(v).every((k) => cles.includes(k)) &&
    Object.values(v).every((x) => typeof x === 'boolean')
      ? null
      : `choix attendus : ${cles.join(', ')}`;

/** Règle de validation de chaque paramètre. */
const REGLES: Record<CleParametre, Regle> = {
  nomPlateforme: texte(2, 80),
  slogan: texte(0, 120),
  messageAccueil: texte(0, 300),
  telephoneSupport: texte(6, 30),
  emailSupport: (v) =>
    typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      ? null
      : 'adresse e-mail attendue',
  logoUrl: (v) =>
    v === null || (typeof v === 'string' && /^https?:\/\/\S+$/.test(v))
      ? null
      : 'adresse web ou vide attendue',
  inscriptionsOuvertes: booleen,
  maintenance: booleen,
  commission: nombre(0, 0.3),
  fraisDeplacementDefaut: nombre(0, 10_000_000, true),
  moyensPaiement: drapeaux(['orange', 'mtn', 'especes']),
  abonnementPro: nombre(0, 100_000_000, true),
  offreEntreprises: (v) =>
    v === 'devis' || v === 'forfait'
      ? null
      : '« devis » ou « forfait » attendu',
  missionsNiveau3: nombre(0, 1000, true),
  noteNiveau3: nombre(0, 5),
  validiteVerificationMois: nombre(1, 120, true),
  modererAvisNegatifs: booleen,
  delaiAvisJours: nombre(1, 365, true),
  canaux: drapeaux(['sms', 'whatsapp', 'email']),
  expediteurSms: texte(2, 11),
};

@Injectable()
export class ParametresService {
  constructor(private readonly prisma: PrismaService) {}

  /** Valeur d'un paramètre (les objets sont complétés par les valeurs par défaut). */
  async get<K extends CleParametre>(cle: K): Promise<Parametres[K]> {
    const p = await this.prisma.parametre.findUnique({ where: { cle } });
    const defaut = PARAMETRES[cle];
    if (p && defaut && typeof defaut === 'object')
      return { ...defaut, ...(p.valeur as object) } as Parametres[K];
    return (p?.valeur ?? defaut) as Parametres[K];
  }

  async tous(publics = false) {
    const enBase = await this.prisma.parametre.findMany();
    const valeurs: Record<string, unknown> = { ...PARAMETRES };
    for (const p of enBase) {
      if (!(p.cle in PARAMETRES)) continue;
      const defaut = PARAMETRES[p.cle as CleParametre];
      valeurs[p.cle] =
        defaut && typeof defaut === 'object'
          ? { ...defaut, ...(p.valeur as object) }
          : p.valeur;
    }
    return publics
      ? Object.fromEntries(PUBLICS.map((c) => [c, valeurs[c]]))
      : valeurs;
  }

  /** Enregistre les paramètres envoyés, après validation de chacun (rien n'est enregistré en cas d'erreur). */
  async modifier(valeurs: Partial<Record<string, unknown>>) {
    const erreurs = Object.entries(valeurs).flatMap(([cle, valeur]) => {
      if (!(cle in PARAMETRES)) return [`${cle} : paramètre inconnu`];
      const erreur = REGLES[cle as CleParametre](valeur);
      return erreur ? [`${cle} : ${erreur}`] : [];
    });
    if (erreurs.length) throw new BadRequestException(erreurs);
    await this.prisma.$transaction(
      Object.entries(valeurs).map(([cle, valeur]) => {
        // « null » (logo retiré) s'enregistre avec la valeur JSON nulle de Prisma.
        const json =
          valeur === null
            ? Prisma.JsonNull
            : ((typeof valeur === 'string'
                ? valeur.trim()
                : valeur) as Prisma.InputJsonValue);
        return this.prisma.parametre.upsert({
          where: { cle },
          create: { cle, valeur: json },
          update: { valeur: json },
        });
      }),
    );
    return this.tous();
  }
}
