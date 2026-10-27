import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UtilisateurConnecte } from '../common/auth.js';
import {
  DemandesService,
  INCLURE_DEMANDE,
} from '../demandes/demandes.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  INCLURE_UTILISATEUR,
  presenterUtilisateur,
} from '../users/presentation.js';
import type {
  CreerSignalementDto,
  FiltreDemandesAdminDto,
  FiltreUtilisateursDto,
  TraiterSignalementDto,
} from './admin.dto.js';

const PAR_PAGE = 25;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly demandes: DemandesService,
  ) {}

  /** Chiffres du tableau de bord du back-office. */
  async statistiques() {
    const [
      roles,
      demandes,
      verifications,
      signalements,
      paiements,
      parMetier,
      parZone,
    ] = await this.prisma.$transaction([
      this.prisma.user.groupBy({
        by: ['role', 'statut'],
        _count: { _all: true },
        orderBy: { role: 'asc' },
      }),
      this.prisma.demande.groupBy({
        by: ['statut'],
        _count: { _all: true },
        orderBy: { statut: 'asc' },
      }),
      this.prisma.verification.count({
        where: { statut: { in: ['EN_ATTENTE', 'EN_COURS'] } },
      }),
      this.prisma.signalement.count({ where: { statut: { not: 'RESOLU' } } }),
      this.prisma.paiement.aggregate({
        where: { statut: { in: ['CONFIRME', 'REVERSE'] } },
        _sum: { montant: true, commission: true },
        _count: true,
      }),
      this.prisma.demande.groupBy({
        by: ['metierId'],
        _count: { _all: true },
        orderBy: { metierId: 'asc' },
      }),
      this.prisma.demande.groupBy({
        by: ['zoneId'],
        _count: { _all: true },
        orderBy: { zoneId: 'asc' },
      }),
    ]);
    const nomsZones = new Map(
      (
        await this.prisma.zone.findMany({ select: { id: true, nom: true } })
      ).map((z) => [z.id, z.nom]),
    );
    const compte = (g: { _count: unknown }) =>
      (g._count as { _all: number })._all;
    const utilisateurs = {
      clients: 0,
      techniciens: 0,
      admins: 0,
      techniciensEnAttente: 0,
      suspendus: 0,
    };
    for (const g of roles) {
      if (g.role === 'CLIENT') utilisateurs.clients += compte(g);
      if (g.role === 'TECHNICIEN') utilisateurs.techniciens += compte(g);
      if (g.role === 'ADMIN') utilisateurs.admins += compte(g);
      if (g.role === 'TECHNICIEN' && g.statut === 'EN_ATTENTE')
        utilisateurs.techniciensEnAttente += compte(g);
      if (g.statut === 'SUSPENDU') utilisateurs.suspendus += compte(g);
    }
    return {
      utilisateurs,
      demandes: Object.fromEntries(demandes.map((g) => [g.statut, compte(g)])),
      verificationsEnAttente: verifications,
      signalementsOuverts: signalements,
      paiements: {
        nombre: paiements._count,
        volume: paiements._sum.montant ?? 0,
        commissions: paiements._sum.commission ?? 0,
      },
      demandesParMetier: Object.fromEntries(
        parMetier.map((g) => [g.metierId, compte(g)]),
      ),
      demandesParZone: Object.fromEntries(
        parZone.map((g) => [nomsZones.get(g.zoneId) ?? g.zoneId, compte(g)]),
      ),
    };
  }

  async utilisateurs(f: FiltreUtilisateursDto) {
    const page = f.page ?? 1;
    const q = f.q?.trim();
    const where: Prisma.UserWhereInput = {
      ...(f.role && { role: f.role }),
      ...(f.statut && { statut: f.statut }),
      ...(q && {
        OR: [
          { nom: { contains: q, mode: 'insensitive' } },
          { prenom: { contains: q, mode: 'insensitive' } },
          { telephone: { contains: q.replace(/\D/g, '') || q } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      }),
    };
    const [total, liste] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: INCLURE_UTILISATEUR,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAR_PAGE,
        take: PAR_PAGE,
      }),
    ]);
    return {
      total,
      page,
      parPage: PAR_PAGE,
      resultats: liste.map(presenterUtilisateur),
    };
  }

  async utilisateur(id: string) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      include: INCLURE_UTILISATEUR,
    });
    if (!u) throw new NotFoundException('Utilisateur introuvable.');
    return presenterUtilisateur(u);
  }

  /** Suspendre ferme aussi toutes les sessions ouvertes du compte. */
  async changerStatut(
    id: string,
    admin: UtilisateurConnecte,
    statut: 'ACTIF' | 'SUSPENDU',
  ) {
    if (id === admin.id)
      throw new BadRequestException(
        'Vous ne pouvez pas modifier votre propre compte.',
      );
    const cible = await this.prisma.user.findUnique({
      where: { id },
      include: { technicien: { select: { niveau: true } } },
    });
    if (!cible) throw new NotFoundException('Utilisateur introuvable.');
    // Un technicien réactivé sans identité vérifiée revient en attente, pas en actif.
    const nouveau =
      statut === 'ACTIF' && cible.technicien && cible.technicien.niveau < 1
        ? 'EN_ATTENTE'
        : statut;
    await this.prisma.user.update({ where: { id }, data: { statut: nouveau } });
    if (statut === 'SUSPENDU')
      await this.prisma.session.updateMany({
        where: { userId: id, revoqueLe: null },
        data: { revoqueLe: new Date() },
      });
    return this.utilisateur(id);
  }

  async listeDemandes(admin: UtilisateurConnecte, f: FiltreDemandesAdminDto) {
    const page = f.page ?? 1;
    const where: Prisma.DemandeWhereInput = {
      ...(f.statut && { statut: f.statut }),
      ...(f.metier && { metierId: f.metier }),
      ...(f.zone && { zoneId: f.zone }),
    };
    const [total, liste] = await this.prisma.$transaction([
      this.prisma.demande.count({ where }),
      this.prisma.demande.findMany({
        where,
        include: INCLURE_DEMANDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAR_PAGE,
        take: PAR_PAGE,
      }),
    ]);
    return {
      total,
      page,
      parPage: PAR_PAGE,
      resultats: liste.map((d) => this.demandes.presenter(d, admin)),
    };
  }

  signaler(u: UtilisateurConnecte, dto: CreerSignalementDto) {
    return this.prisma.signalement.create({ data: { ...dto, auteurId: u.id } });
  }

  signalements(statut?: string) {
    return this.prisma.signalement.findMany({
      where: statut ? { statut: statut as never } : {},
      include: { auteur: { select: { prenom: true, nom: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async traiterSignalement(id: string, dto: TraiterSignalementDto) {
    return this.prisma.signalement
      .update({ where: { id }, data: dto })
      .catch(() => {
        throw new NotFoundException('Signalement introuvable.');
      });
  }
}
