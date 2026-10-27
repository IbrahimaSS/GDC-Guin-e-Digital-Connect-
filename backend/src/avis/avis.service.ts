import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UtilisateurConnecte } from '../common/auth.js';
import { DemandesService } from '../demandes/demandes.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreerAvisDto, FiltreAvisDto } from './avis.dto.js';

const PAR_PAGE = 30;

@Injectable()
export class AvisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly demandes: DemandesService,
  ) {}

  /** Note moyenne et nombre d'avis recalculés à partir des seuls avis publiés. */
  private async recalculer(technicienId: string) {
    const { _avg, _count } = await this.prisma.avis.aggregate({
      where: { technicienId, statut: 'PUBLIE' },
      _avg: { note: true },
      _count: true,
    });
    await this.prisma.profilTechnicien.update({
      where: { id: technicienId },
      data: { note: Math.round((_avg.note ?? 0) * 10) / 10, nbAvis: _count },
    });
  }

  /** Avis vérifié : seulement après une intervention démarrée avec le code du client, puis terminée. */
  async creer(demandeId: string, u: UtilisateurConnecte, dto: CreerAvisDto) {
    const d = await this.demandes.charger(demandeId, u);
    if (d.clientId !== u.id)
      throw new ForbiddenException(
        'Seul le client donne un avis sur la mission.',
      );
    if (d.statut !== 'TERMINEE' || !d.demarreeLe || !d.technicienId)
      throw new ConflictException(
        "L'avis est possible une fois la mission terminée.",
      );
    if (d.avis)
      throw new ConflictException(
        'Vous avez déjà donné votre avis sur cette mission.',
      );
    const avis = await this.prisma.avis.create({
      data: {
        demandeId,
        auteurId: u.id,
        technicienId: d.technicienId,
        note: dto.note,
        criteres: dto.criteres ? { ...dto.criteres } : undefined,
        tags: dto.tags ?? [],
        commentaire: dto.commentaire?.trim(),
        recommande: dto.recommande,
      },
    });
    await this.recalculer(d.technicienId);
    return avis;
  }

  private async avisDuTechnicien(id: string, userId: string) {
    const avis = await this.prisma.avis.findUnique({
      where: { id },
      include: { technicien: { select: { userId: true } } },
    });
    if (!avis || avis.technicien.userId !== userId)
      throw new NotFoundException('Avis introuvable.');
    return avis;
  }

  async repondre(id: string, u: UtilisateurConnecte, reponse: string) {
    const avis = await this.avisDuTechnicien(id, u.id);
    if (avis.reponse)
      throw new ConflictException('Vous avez déjà répondu à cet avis.');
    return this.prisma.avis.update({
      where: { id },
      data: { reponse: reponse.trim() },
    });
  }

  /** Le technicien signale un avis abusif : il reste visible jusqu'à la décision de l'équipe GDC. */
  async signaler(id: string, u: UtilisateurConnecte, motif: string) {
    const avis = await this.avisDuTechnicien(id, u.id);
    if (avis.signale) throw new ConflictException('Cet avis est déjà signalé.');
    await this.prisma.$transaction([
      this.prisma.avis.update({ where: { id }, data: { signale: true } }),
      this.prisma.signalement.create({
        data: { type: 'avis', cible: id, motif, auteurId: u.id },
      }),
    ]);
  }

  async recus(u: UtilisateurConnecte) {
    return this.prisma.avis.findMany({
      where: { technicien: { userId: u.id } },
      include: {
        auteur: { select: { prenom: true, nom: true } },
        demande: { select: { titre: true, numero: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ----------------------------------------------------------- Back-office

  async liste(f: FiltreAvisDto) {
    const page = f.page ?? 1;
    const where = f.statut ? { statut: f.statut } : {};
    const [total, resultats] = await this.prisma.$transaction([
      this.prisma.avis.count({ where }),
      this.prisma.avis.findMany({
        where,
        include: {
          auteur: { select: { prenom: true, nom: true } },
          technicien: {
            select: { id: true, user: { select: { prenom: true, nom: true } } },
          },
          demande: { select: { titre: true, numero: true } },
        },
        orderBy: [{ signale: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * PAR_PAGE,
        take: PAR_PAGE,
      }),
    ]);
    return { total, page, parPage: PAR_PAGE, resultats };
  }

  async moderer(id: string, statut: 'PUBLIE' | 'MASQUE') {
    const avis = await this.prisma.avis
      .update({ where: { id }, data: { statut, signale: false } })
      .catch(() => {
        throw new NotFoundException('Avis introuvable.');
      });
    await this.prisma.signalement.updateMany({
      where: { type: 'avis', cible: id, statut: { not: 'RESOLU' } },
      data: { statut: 'RESOLU' },
    });
    await this.recalculer(avis.technicienId);
    return avis;
  }
}
