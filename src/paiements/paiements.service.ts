import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { UtilisateurConnecte } from '../common/auth.js';
import { normaliserTelephone } from '../common/telephone.js';
import { DemandesService } from '../demandes/demandes.service.js';
import { formaterMontant, totalDevis } from '../devis/devis.service.js';
import type { MoyenPaiement } from '../generated/prisma/client.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ParametresService } from '../parametres/parametres.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PayerDto } from '../devis/devis.dto.js';

/**
 * Fournisseur de paiement mobile. En développement, le paiement est accepté immédiatement.
 * TODO : brancher les API marchandes Orange Money et MTN MoMo (demande de paiement + webhook de confirmation).
 */
class FournisseurSimule {
  private readonly log = new Logger('Paiement');
  async debiter(
    moyen: MoyenPaiement,
    numero: string,
    montant: number,
    reference: string,
  ) {
    this.log.log(
      `[${moyen}] ${formaterMontant(montant)} débité de ${numero} (réf. ${reference})`,
    );
    return { confirme: true };
  }
}

const PREFIXES: Record<MoyenPaiement, string> = {
  ORANGE: 'OM',
  MTN: 'MOMO',
  ESPECES: 'ESP',
};

@Injectable()
export class PaiementsService {
  private readonly fournisseur = new FournisseurSimule();

  constructor(
    private readonly prisma: PrismaService,
    private readonly demandes: DemandesService,
    private readonly notifications: NotificationsService,
    private readonly parametres: ParametresService,
  ) {}

  private reference(moyen: MoyenPaiement) {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    return `${PREFIXES[moyen]}-${date}-${Math.floor(1000 + Math.random() * 9000)}${Date.now().toString().slice(-3)}`;
  }

  /** Le client paie un devis accepté. GDC conserve l'argent jusqu'à la fin de la mission. */
  async payer(demandeId: string, u: UtilisateurConnecte, dto: PayerDto) {
    const d = await this.demandes.charger(demandeId, u);
    if (d.clientId !== u.id)
      throw new ForbiddenException('Seul le client peut payer ce devis.');
    const devis = d.devis;
    if (!devis || devis.statut !== 'ACCEPTE')
      throw new ConflictException('Acceptez le devis avant de payer.');
    if (devis.paiement && devis.paiement.statut !== 'ECHOUE')
      throw new ConflictException(
        'Un paiement est déjà enregistré pour ce devis.',
      );
    if (dto.moyen !== 'ESPECES' && !dto.numero)
      throw new BadRequestException(
        'Indiquez le numéro du compte mobile money.',
      );

    const montant = totalDevis(devis);
    const commission = Math.round(
      montant * (await this.parametres.get('commission')),
    );
    const numero = dto.numero ? normaliserTelephone(dto.numero) : null;
    const donnees = {
      moyen: dto.moyen,
      numero,
      montant,
      commission,
      reference: this.reference(dto.moyen),
      statut: 'EN_ATTENTE' as const,
      confirmeLe: null,
    };
    let paiement = await this.prisma.paiement.upsert({
      where: { devisId: devis.id },
      create: { devisId: devis.id, ...donnees },
      update: donnees,
    });

    if (dto.moyen !== 'ESPECES') {
      const { confirme } = await this.fournisseur.debiter(
        dto.moyen,
        numero!,
        montant,
        paiement.reference,
      );
      paiement = confirme
        ? await this.confirmer(paiement.id)
        : await this.prisma.paiement.update({
            where: { id: paiement.id },
            data: { statut: 'ECHOUE' },
          });
    }
    return paiement;
  }

  /** Paiement en espèces : le technicien confirme avoir reçu l'argent en main propre. */
  async confirmerEspeces(demandeId: string, u: UtilisateurConnecte) {
    const d = await this.demandes.charger(demandeId, u);
    if (d.technicien?.userId !== u.id)
      throw new ForbiddenException(
        'Seul le technicien retenu confirme un paiement en espèces.',
      );
    const p = d.devis?.paiement;
    if (!p || p.moyen !== 'ESPECES' || p.statut !== 'EN_ATTENTE')
      throw new NotFoundException('Aucun paiement en espèces à confirmer.');
    return this.confirmer(p.id);
  }

  private async confirmer(paiementId: string) {
    const p = await this.prisma.paiement.update({
      where: { id: paiementId },
      data: {
        statut: 'CONFIRME',
        confirmeLe: new Date(),
        devis: { update: { statut: 'PAYE' } },
      },
      include: {
        devis: { include: { demande: { include: { technicien: true } } } },
      },
    });
    const demande = p.devis.demande;
    if (demande.technicien) {
      await this.notifications.notifier(
        'paiement_recu',
        demande.technicien.userId,
        { montant: formaterMontant(p.montant), mission: demande.titre },
        `/technicien/missions/${demande.id}`,
      );
    }
    const { devis: _devis, ...paiement } = p;
    return paiement;
  }

  /** Historique des paiements de l'utilisateur (client : payés ; technicien : reçus). */
  async historique(u: UtilisateurConnecte) {
    const filtre =
      u.role === 'TECHNICIEN'
        ? { technicien: { userId: u.id } }
        : { clientId: u.id };
    return this.prisma.paiement.findMany({
      where: { devis: { demande: filtre } },
      include: {
        devis: {
          select: {
            demande: { select: { id: true, numero: true, titre: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
