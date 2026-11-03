import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FichiersService } from '../fichiers/fichiers.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { lirePreferences } from './preferences.js';
import { INCLURE_UTILISATEUR, presenterUtilisateur } from './presentation.js';
import type {
  AdresseDto,
  ModifierProfilDto,
  PreferencesDto,
} from './users.dto.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fichiers: FichiersService,
  ) {}

  async moi(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: INCLURE_UTILISATEUR,
    });
    return presenterUtilisateur(user);
  }

  async modifier(id: string, dto: ModifierProfilDto) {
    if (dto.email) {
      const email = dto.email.toLowerCase();
      if (await this.prisma.user.findFirst({ where: { email, NOT: { id } } }))
        throw new BadRequestException(
          'Cette adresse e-mail est déjà utilisée.',
        );
      dto.email = email;
    }
    if (
      dto.zoneId &&
      !(await this.prisma.zone.findUnique({ where: { id: dto.zoneId } }))
    )
      throw new BadRequestException('Zone inconnue.');
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: INCLURE_UTILISATEUR,
    });
    return presenterUtilisateur(user);
  }

  async sessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revoqueLe: null, expireLe: { gt: new Date() } },
      select: { id: true, appareil: true, createdAt: true, expireLe: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ------------------------------------------------------------ Adresses

  adresses(userId: string) {
    return this.prisma.adresse.findMany({
      where: { userId },
      include: { zone: { select: { id: true, nom: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async ajouterAdresse(userId: string, dto: AdresseDto) {
    if ((await this.prisma.adresse.count({ where: { userId } })) >= 10)
      throw new BadRequestException('10 adresses maximum.');
    if (
      dto.zoneId &&
      !(await this.prisma.zone.findUnique({ where: { id: dto.zoneId } }))
    )
      throw new BadRequestException('Zone inconnue.');
    return this.prisma.adresse.create({
      data: { ...dto, userId },
      include: { zone: { select: { id: true, nom: true } } },
    });
  }

  async supprimerAdresse(userId: string, id: string) {
    const { count } = await this.prisma.adresse.deleteMany({
      where: { id, userId },
    });
    if (!count) throw new NotFoundException('Adresse introuvable.');
  }

  // --------------------------------------------------------- Préférences

  async preferences(userId: string) {
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { preferences: true, technicien: { select: { visible: true } } },
    });
    return {
      ...lirePreferences(u.preferences),
      ...(u.technicien && { visible: u.technicien.visible }),
    };
  }

  async modifierPreferences(userId: string, dto: PreferencesDto) {
    const { visible, ...notifications } = dto;
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { preferences: true, technicien: { select: { id: true } } },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences: { ...lirePreferences(u.preferences), ...notifications },
      },
    });
    if (visible !== undefined && u.technicien)
      await this.prisma.profilTechnicien.update({
        where: { id: u.technicien.id },
        data: { visible },
      });
    return this.preferences(userId);
  }

  // ---------------------------------------------- Suppression du compte

  /**
   * Suppression à la demande de l'utilisateur. Refusée tant qu'une mission ou un paiement est en cours.
   * Les données personnelles sont effacées ; l'historique (demandes, avis, messages) reste, anonyme,
   * pour l'autre partie et la comptabilité. Le numéro redevient libre pour une nouvelle inscription.
   */
  async supprimerCompte(userId: string) {
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { technicien: { select: { id: true } } },
    });
    if (u.role === 'ADMIN')
      throw new BadRequestException(
        "Un compte administrateur se supprime par l'équipe technique.",
      );
    const participe: Prisma.DemandeWhereInput = u.technicien
      ? { technicienId: u.technicien.id }
      : { clientId: userId };
    const enCours = await this.prisma.demande.count({
      where: { ...participe, statut: { in: ['ACCEPTEE', 'EN_COURS'] } },
    });
    if (enCours)
      throw new ConflictException(
        'Une mission est en cours : terminez-la ou annulez-la avant de supprimer votre compte.',
      );
    const paiement = await this.prisma.paiement.count({
      where: {
        statut: { in: ['EN_ATTENTE', 'CONFIRME'] },
        devis: { demande: participe },
      },
    });
    if (paiement)
      throw new ConflictException(
        'Un paiement est en cours de traitement : réessayez une fois la mission réglée.',
      );

    await this.fichiers.supprimerTout(userId);
    await this.prisma.$transaction([
      // Les demandes encore ouvertes du client sont annulées.
      this.prisma.demande.updateMany({
        where: { clientId: userId, statut: 'ENVOYEE' },
        data: { statut: 'ANNULEE', annuleeLe: new Date() },
      }),
      this.prisma.session.updateMany({
        where: { userId, revoqueLe: null },
        data: { revoqueLe: new Date() },
      }),
      this.prisma.adresse.deleteMany({ where: { userId } }),
      this.prisma.notification.deleteMany({ where: { userId } }),
      ...(u.technicien
        ? [
            this.prisma.profilTechnicien.update({
              where: { id: u.technicien.id },
              data: {
                visible: false,
                disponible: false,
                bio: '',
                specialites: [],
              },
            }),
            this.prisma.realisation.deleteMany({
              where: { technicienId: u.technicien.id },
            }),
          ]
        : []),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          nom: 'supprimé',
          prenom: 'Compte',
          telephone: `supprime-${userId}`,
          email: null,
          googleId: null,
          photoUrl: null,
          entreprise: null,
          preferences: {},
          statut: 'SUSPENDU',
          supprimeLe: new Date(),
        },
      }),
    ]);
  }
}
