import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { type Canal, SmsService } from '../sms/sms.service.js';

// Événements de la plateforme et messages envoyés au destinataire (mêmes textes que le frontend).
export type Evenement =
  | 'demande_publiee'
  | 'demande_acceptee'
  | 'technicien_en_route'
  | 'intervention_demarree'
  | 'mission_terminee'
  | 'devis_envoye'
  | 'devis_accepte'
  | 'paiement_recu'
  | 'nouveau_message'
  | 'verification_decidee';

interface Modele {
  libelle: string;
  canaux: Canal[];
  type: 'demande' | 'mission' | 'avis' | 'verification' | 'systeme';
  titre: string;
  /** Variables : {client} {technicien} {mission} {montant} {code} {resultat} */
  texte: string;
}

export const MODELES: Record<Evenement, Modele> = {
  demande_publiee: {
    libelle: 'Demande publiée',
    canaux: ['sms'],
    type: 'demande',
    titre: 'Demande publiée',
    texte:
      'GDC : votre demande « {mission} » est publiée. Les professionnels de votre zone sont prévenus.',
  },
  demande_acceptee: {
    libelle: 'Demande acceptée',
    canaux: ['sms', 'whatsapp'],
    type: 'demande',
    titre: 'Demande acceptée',
    texte:
      "GDC : {technicien} a accepté votre demande « {mission} ». Code d'intervention : {code}.",
  },
  technicien_en_route: {
    libelle: 'Technicien en route',
    canaux: ['whatsapp'],
    type: 'mission',
    titre: 'Technicien en route',
    texte:
      "GDC : {technicien} est en route vers vous. Suivez son trajet dans l'application.",
  },
  intervention_demarree: {
    libelle: 'Intervention démarrée',
    canaux: ['sms'],
    type: 'mission',
    titre: 'Intervention démarrée',
    texte: "GDC : l'intervention « {mission} » a commencé avec {technicien}.",
  },
  mission_terminee: {
    libelle: 'Mission terminée',
    canaux: ['sms', 'whatsapp'],
    type: 'avis',
    titre: 'Mission terminée',
    texte:
      'GDC : « {mission} » est terminée. Donnez votre avis sur {technicien} en 1 minute.',
  },
  devis_envoye: {
    libelle: 'Devis envoyé',
    canaux: ['sms', 'whatsapp'],
    type: 'demande',
    titre: 'Nouveau devis',
    texte:
      'GDC : {technicien} vous a envoyé un devis de {montant} pour « {mission} ».',
  },
  devis_accepte: {
    libelle: 'Devis accepté',
    canaux: ['sms'],
    type: 'mission',
    titre: 'Devis accepté',
    texte:
      'GDC : {client} a accepté votre devis de {montant} pour « {mission} ».',
  },
  paiement_recu: {
    libelle: 'Paiement reçu',
    canaux: ['sms', 'whatsapp'],
    type: 'mission',
    titre: 'Paiement reçu',
    texte:
      'GDC : paiement de {montant} reçu pour « {mission} ». Versement à la fin de la mission.',
  },
  nouveau_message: {
    libelle: 'Nouveau message',
    canaux: ['whatsapp'],
    type: 'demande',
    titre: 'Nouveau message',
    texte: 'GDC : nouveau message au sujet de « {mission} ».',
  },
  verification_decidee: {
    libelle: 'Vérification',
    canaux: ['sms'],
    type: 'verification',
    titre: 'Vérification',
    texte: 'GDC : votre demande de vérification a été {resultat}.',
  },
};

export type Variables = Partial<
  Record<
    'client' | 'technicien' | 'mission' | 'montant' | 'code' | 'resultat',
    string
  >
>;

const remplir = (texte: string, vars: Variables) =>
  texte.replace(/\{(\w+)\}/g, (_, k: keyof Variables) => vars[k] ?? '');

@Injectable()
export class NotificationsService {
  private readonly log = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
  ) {}

  /** Modèle effectif : texte et canaux personnalisés dans le back-office, sinon valeurs par défaut. */
  async modele(evenement: Evenement): Promise<Modele> {
    const perso = await this.prisma.modeleNotification.findUnique({
      where: { evenement },
    });
    const base = MODELES[evenement];
    return perso
      ? { ...base, canaux: perso.canaux as Canal[], texte: perso.texte }
      : base;
  }

  /**
   * Prévient un utilisateur : notification dans l'application, puis SMS / WhatsApp selon le modèle.
   * Un échec d'envoi est consigné mais ne bloque jamais l'action métier.
   */
  async notifier(
    evenement: Evenement,
    destinataireId: string,
    vars: Variables,
    lien?: string,
  ) {
    const modele = await this.modele(evenement);
    const texte = remplir(modele.texte, vars);
    const user = await this.prisma.user.findUnique({
      where: { id: destinataireId },
      select: { telephone: true },
    });
    if (!user) return;

    await this.prisma.notification.create({
      data: {
        userId: destinataireId,
        type: modele.type,
        titre: modele.titre,
        texte: texte.replace(/^GDC : /, ''),
        lien,
      },
    });

    for (const canal of modele.canaux) {
      let statut = 'envoye';
      let erreur: string | undefined;
      try {
        await this.sms.envoyer({ canal, numero: user.telephone, texte });
      } catch (e) {
        statut = 'echec';
        erreur = (e as Error).message;
        this.log.error(`Échec ${canal} vers ${user.telephone} : ${erreur}`);
      }
      await this.prisma.envoiNotification.create({
        data: {
          evenement,
          canal,
          numero: user.telephone,
          texte,
          statut,
          erreur,
        },
      });
    }
  }

  liste(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async marquerLue(userId: string, id: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { lu: true },
    });
    if (!count) throw new NotFoundException('Notification introuvable.');
  }

  async toutLire(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, lu: false },
      data: { lu: true },
    });
  }

  async supprimer(userId: string, id: string) {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
  }

  // ----------------------------------------------------------- Back-office

  async modeles() {
    const persos = await this.prisma.modeleNotification.findMany();
    return (Object.keys(MODELES) as Evenement[]).map((evenement) => {
      const p = persos.find((x) => x.evenement === evenement);
      return {
        evenement,
        ...MODELES[evenement],
        ...(p && { canaux: p.canaux, texte: p.texte }),
        personnalise: Boolean(p),
      };
    });
  }

  async modifierModele(evenement: Evenement, canaux: Canal[], texte: string) {
    if (!MODELES[evenement]) throw new NotFoundException('Événement inconnu.');
    return this.prisma.modeleNotification.upsert({
      where: { evenement },
      create: { evenement, canaux, texte },
      update: { canaux, texte },
    });
  }

  async reinitialiserModele(evenement: Evenement) {
    await this.prisma.modeleNotification.deleteMany({ where: { evenement } });
  }

  journal() {
    return this.prisma.envoiNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
