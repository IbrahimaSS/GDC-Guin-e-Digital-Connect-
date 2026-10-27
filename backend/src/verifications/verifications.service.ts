import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UtilisateurConnecte } from '../common/auth.js';
import { formaterTelephone } from '../common/telephone.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  DeciderVerificationDto,
  DemanderVerificationDto,
} from './verifications.dto.js';

@Injectable()
export class VerificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async profil(userId: string) {
    const t = await this.prisma.profilTechnicien.findUnique({
      where: { userId },
    });
    if (!t)
      throw new ForbiddenException("Ce compte n'a pas de profil technicien.");
    return t;
  }

  /** Les niveaux se valident dans l'ordre : identité (1), compétence (2), recommandé (3). */
  async demander(u: UtilisateurConnecte, dto: DemanderVerificationDto) {
    const t = await this.profil(u.id);
    if (dto.niveau !== t.niveau + 1)
      throw new BadRequestException(
        `Prochaine étape : niveau ${t.niveau + 1}.`,
      );
    const enCours = await this.prisma.verification.count({
      where: { technicienId: t.id, statut: { in: ['EN_ATTENTE', 'EN_COURS'] } },
    });
    if (enCours)
      throw new ConflictException(
        'Une demande de vérification est déjà en cours de traitement.',
      );
    return this.prisma.verification.create({
      data: {
        technicienId: t.id,
        niveau: dto.niveau,
        pieces: dto.pieces.map((p) => ({ ...p })),
        message: dto.message,
      },
    });
  }

  async miennes(u: UtilisateurConnecte) {
    const t = await this.profil(u.id);
    return this.prisma.verification.findMany({
      where: { technicienId: t.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ----------------------------------------------------------- Back-office

  async liste(statut?: string) {
    const liste = await this.prisma.verification.findMany({
      where: statut ? { statut: statut as never } : {},
      include: {
        technicien: {
          include: {
            user: {
              select: {
                prenom: true,
                nom: true,
                telephone: true,
                photoUrl: true,
              },
            },
            metier: { select: { label: true } },
          },
        },
        decideur: { select: { prenom: true, nom: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return liste.map(({ technicien, ...v }) => ({
      ...v,
      technicien: {
        id: technicien.id,
        nom: `${technicien.user.prenom} ${technicien.user.nom}`,
        telephone: formaterTelephone(technicien.user.telephone),
        photoUrl: technicien.user.photoUrl,
        metier: technicien.metier.label,
        niveau: technicien.niveau,
      },
    }));
  }

  /** L'admin ouvre le dossier : il passe « en cours » pour éviter un double traitement. */
  async prendre(id: string) {
    const { count } = await this.prisma.verification.updateMany({
      where: { id, statut: 'EN_ATTENTE' },
      data: { statut: 'EN_COURS' },
    });
    if (!count)
      throw new ConflictException('Ce dossier est déjà pris en charge.');
  }

  async decider(
    id: string,
    admin: UtilisateurConnecte,
    dto: DeciderVerificationDto,
  ) {
    const v = await this.prisma.verification.findUnique({
      where: { id },
      include: { technicien: { include: { user: true } } },
    });
    if (!v) throw new NotFoundException('Vérification introuvable.');
    if (!['EN_ATTENTE', 'EN_COURS'].includes(v.statut))
      throw new ConflictException('Cette vérification a déjà été décidée.');

    const approuvee = dto.decision === 'APPROUVEE';
    await this.prisma.$transaction([
      this.prisma.verification.update({
        where: { id },
        data: {
          statut: dto.decision,
          commentaire: dto.commentaire,
          decideurId: admin.id,
          decideLe: new Date(),
        },
      }),
      ...(approuvee
        ? [
            this.prisma.profilTechnicien.update({
              where: { id: v.technicienId },
              data: { niveau: Math.max(v.technicien.niveau, v.niveau) },
            }),
            // Identité vérifiée : le compte devient visible et peut accepter des missions.
            ...(v.niveau === 1 && v.technicien.user.statut === 'EN_ATTENTE'
              ? [
                  this.prisma.user.update({
                    where: { id: v.technicien.userId },
                    data: { statut: 'ACTIF' },
                  }),
                ]
              : []),
          ]
        : []),
    ]);
    await this.notifications.notifier(
      'verification_decidee',
      v.technicien.userId,
      { resultat: approuvee ? 'approuvée' : 'refusée' },
      '/technicien/verification',
    );
    return this.prisma.verification.findUniqueOrThrow({ where: { id } });
  }
}
