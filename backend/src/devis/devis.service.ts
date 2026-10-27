import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UtilisateurConnecte } from '../common/auth.js';
import type { Prisma } from '../generated/prisma/client.js';
import {
  DemandesService,
  type DemandeComplete,
} from '../demandes/demandes.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ParametresService } from '../parametres/parametres.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { EnregistrerDevisDto } from './devis.dto.js';

type DevisAvecLignes = Prisma.DevisGetPayload<{
  include: { lignes: true; paiement: true };
}>;

export const totalDevis = (d: {
  lignes: { quantite: number; prix: number }[];
  deplacement: number;
}) => d.lignes.reduce((s, l) => s + l.quantite * l.prix, 0) + d.deplacement;

/** 1500000 → « 1 500 000 GNF » */
export const formaterMontant = (gnf: number) =>
  `${gnf.toLocaleString('fr-FR').replace(/\s/g, ' ')} GNF`;

const nomTechnicien = (d: DemandeComplete) =>
  d.technicien ? `${d.technicien.user.prenom} ${d.technicien.user.nom}` : '';

@Injectable()
export class DevisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly demandes: DemandesService,
    private readonly notifications: NotificationsService,
    private readonly parametres: ParametresService,
  ) {}

  async presenter(devis: DevisAvecLignes) {
    const sousTotal = devis.lignes.reduce((s, l) => s + l.quantite * l.prix, 0);
    const total = sousTotal + devis.deplacement;
    const taux = await this.parametres.get('commission');
    return {
      ...devis,
      lignes: [...devis.lignes].sort((a, b) => a.ordre - b.ordre),
      sousTotal,
      total,
      commission: Math.round(total * taux),
      tauxCommission: taux,
    };
  }

  async consulter(demandeId: string, u: UtilisateurConnecte) {
    const d = await this.demandes.charger(demandeId, u);
    const estTechnicien = d.technicien?.userId === u.id;
    // Le client ne voit pas le brouillon en cours de rédaction.
    if (!d.devis || (!estTechnicien && d.devis.statut === 'BROUILLON'))
      return null;
    return this.presenter(d.devis);
  }

  private async demandeDuTechnicien(demandeId: string, u: UtilisateurConnecte) {
    const d = await this.demandes.charger(demandeId, u);
    if (d.technicien?.userId !== u.id)
      throw new ForbiddenException(
        'Seul le technicien retenu rédige le devis.',
      );
    if (!['ACCEPTEE', 'EN_COURS'].includes(d.statut))
      throw new ConflictException(
        'Le devis ne peut plus être modifié pour cette demande.',
      );
    return d;
  }

  /** Enregistre le brouillon (remplace toutes les lignes). Un devis refusé peut être corrigé puis renvoyé. */
  async enregistrer(
    demandeId: string,
    u: UtilisateurConnecte,
    dto: EnregistrerDevisDto,
  ) {
    const d = await this.demandeDuTechnicien(demandeId, u);
    if (d.devis && !['BROUILLON', 'REFUSE'].includes(d.devis.statut))
      throw new ConflictException('Ce devis a déjà été envoyé au client.');
    const lignes = dto.lignes.map((l, ordre) => ({ ...l, ordre }));
    const devis = await this.prisma.devis.upsert({
      where: { demandeId },
      create: {
        demandeId,
        deplacement: dto.deplacement,
        note: dto.note,
        lignes: { create: lignes },
      },
      update: {
        statut: 'BROUILLON',
        deplacement: dto.deplacement,
        note: dto.note,
        envoyeLe: null,
        lignes: { deleteMany: {}, create: lignes },
      },
      include: { lignes: true, paiement: true },
    });
    return this.presenter(devis);
  }

  async envoyer(demandeId: string, u: UtilisateurConnecte) {
    const d = await this.demandeDuTechnicien(demandeId, u);
    if (!d.devis || d.devis.statut !== 'BROUILLON')
      throw new ConflictException('Aucun brouillon de devis à envoyer.');
    if (!d.devis.lignes.length)
      throw new BadRequestException('Ajoutez au moins une ligne au devis.');
    const devis = await this.prisma.devis.update({
      where: { id: d.devis.id },
      data: { statut: 'ENVOYE', envoyeLe: new Date() },
      include: { lignes: true, paiement: true },
    });
    await this.notifications.notifier(
      'devis_envoye',
      d.clientId,
      {
        technicien: nomTechnicien(d),
        montant: formaterMontant(totalDevis(devis)),
        mission: d.titre,
      },
      `/client/demandes/${d.id}/devis`,
    );
    return this.presenter(devis);
  }

  private async decider(
    demandeId: string,
    u: UtilisateurConnecte,
    statut: 'ACCEPTE' | 'REFUSE',
  ) {
    const d = await this.demandes.charger(demandeId, u);
    if (d.clientId !== u.id)
      throw new ForbiddenException('Seul le client peut répondre au devis.');
    if (!d.devis)
      throw new NotFoundException('Aucun devis pour cette demande.');
    const { count } = await this.prisma.devis.updateMany({
      where: { id: d.devis.id, statut: 'ENVOYE' },
      data: { statut },
    });
    if (!count)
      throw new ConflictException("Ce devis n'attend pas de réponse.");
    const devis = await this.prisma.devis.findUniqueOrThrow({
      where: { id: d.devis.id },
      include: { lignes: true, paiement: true },
    });
    if (statut === 'ACCEPTE' && d.technicien) {
      await this.notifications.notifier(
        'devis_accepte',
        d.technicien.userId,
        {
          client: `${d.client.prenom} ${d.client.nom}`,
          montant: formaterMontant(totalDevis(devis)),
          mission: d.titre,
        },
        `/technicien/missions/${d.id}`,
      );
    }
    return this.presenter(devis);
  }

  accepter(demandeId: string, u: UtilisateurConnecte) {
    return this.decider(demandeId, u, 'ACCEPTE');
  }

  refuser(demandeId: string, u: UtilisateurConnecte) {
    return this.decider(demandeId, u, 'REFUSE');
  }
}
