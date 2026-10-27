import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import type { UtilisateurConnecte } from '../common/auth.js';
import { DemandesService } from '../demandes/demandes.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { EnvoyerMessageDto } from './messages.dto.js';

export const salon = (demandeId: string) => `demande:${demandeId}`;

/** Diffusion temps réel, branchée par la passerelle Socket.IO (absente en tests unitaires). */
export interface Diffuseur {
  diffuser(salon: string, evenement: string, donnees: unknown): void;
}

@Injectable()
export class MessagesService {
  diffuseur?: Diffuseur;

  constructor(
    private readonly prisma: PrismaService,
    private readonly demandes: DemandesService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Seuls le client et le technicien retenu échangent ; l'admin peut lire (litiges). */
  private async conversation(demandeId: string, u: UtilisateurConnecte) {
    const d = await this.demandes.charger(demandeId, u);
    if (!d.technicien)
      throw new ConflictException(
        "La conversation s'ouvre quand un technicien accepte la demande.",
      );
    return d;
  }

  async verifierAcces(demandeId: string, u: UtilisateurConnecte) {
    await this.conversation(demandeId, u);
  }

  async liste(demandeId: string, u: UtilisateurConnecte) {
    await this.conversation(demandeId, u);
    return this.prisma.message.findMany({
      where: { demandeId },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
  }

  async envoyer(
    demandeId: string,
    u: UtilisateurConnecte,
    dto: EnvoyerMessageDto,
  ) {
    const d = await this.conversation(demandeId, u);
    if (u.role === 'ADMIN')
      throw new BadRequestException(
        "L'équipe GDC consulte la conversation sans y écrire.",
      );
    if (!dto.texte?.trim() && !dto.photoUrl)
      throw new BadRequestException('Message vide.');
    if (d.statut === 'ANNULEE')
      throw new ConflictException('Cette demande est annulée.');

    const destinataire =
      d.clientId === u.id ? d.technicien!.userId : d.clientId;
    // Une seule alerte WhatsApp tant que le destinataire n'a pas lu les messages précédents.
    const dejaNonLu = await this.prisma.message.count({
      where: { demandeId, auteurId: u.id, lu: false },
    });

    const message = await this.prisma.message.create({
      data: {
        demandeId,
        auteurId: u.id,
        texte: dto.texte?.trim(),
        photoUrl: dto.photoUrl,
      },
    });
    this.diffuseur?.diffuser(salon(demandeId), 'message', message);
    if (!dejaNonLu) {
      const lien =
        destinataire === d.clientId
          ? `/client/messages/${demandeId}`
          : `/technicien/messages/${demandeId}`;
      await this.notifications.notifier(
        'nouveau_message',
        destinataire,
        { mission: d.titre },
        lien,
      );
    }
    return message;
  }

  /** Marque comme lus les messages reçus dans la conversation. */
  async marquerLus(demandeId: string, u: UtilisateurConnecte) {
    await this.conversation(demandeId, u);
    const { count } = await this.prisma.message.updateMany({
      where: { demandeId, lu: false, NOT: { auteurId: u.id } },
      data: { lu: true },
    });
    if (count)
      this.diffuseur?.diffuser(salon(demandeId), 'lu', {
        demandeId,
        lecteurId: u.id,
      });
    return { lus: count };
  }

  /** Liste des conversations avec le dernier message et le nombre de non-lus. */
  async conversations(u: UtilisateurConnecte) {
    const demandes = await this.prisma.demande.findMany({
      where: {
        technicienId: { not: null },
        statut: { not: 'ANNULEE' },
        ...(u.role === 'TECHNICIEN'
          ? { technicien: { userId: u.id } }
          : { clientId: u.id }),
      },
      include: {
        client: { select: { prenom: true, nom: true, photoUrl: true } },
        technicien: {
          include: {
            user: { select: { prenom: true, nom: true, photoUrl: true } },
          },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: {
          select: {
            messages: { where: { lu: false, NOT: { auteurId: u.id } } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return demandes.map((d) => {
      const autre = u.role === 'TECHNICIEN' ? d.client : d.technicien!.user;
      return {
        demandeId: d.id,
        numero: d.numero,
        titre: d.titre,
        statut: d.statut,
        interlocuteur: {
          nom: `${autre.prenom} ${autre.nom}`,
          photoUrl: autre.photoUrl,
        },
        dernierMessage: d.messages[0] ?? null,
        nonLus: d._count.messages,
      };
    });
  }
}
