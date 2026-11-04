import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UtilisateurConnecte } from '../common/auth.js';
import { normaliserTelephone } from '../common/telephone.js';
import {
  DemandesService,
  INCLURE_DEMANDE,
} from '../demandes/demandes.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SmsService } from '../sms/sms.service.js';
import {
  INCLURE_UTILISATEUR,
  presenterUtilisateur,
} from '../users/presentation.js';
import type {
  CreerSignalementDto,
  CreerUtilisateurDto,
  FiltreDemandesAdminDto,
  FiltreUtilisateursDto,
  TraiterSignalementDto,
} from './admin.dto.js';
import { StatistiquesService } from './statistiques.service.js';

const PAR_PAGE = 25;

/** Utilisateur avec le nombre de demandes publiées (clients). */
const INCLURE_LISTE = {
  ...INCLURE_UTILISATEUR,
  _count: { select: { demandes: true } },
} satisfies Prisma.UserInclude;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly demandes: DemandesService,
    private readonly stats: StatistiquesService,
    private readonly sms: SmsService,
  ) {}

  /** Chiffres du tableau de bord et des statistiques (voir StatistiquesService). */
  statistiques() {
    return this.stats.calculer();
  }

  // ------------------------------------------------------------ Comptes

  async utilisateurs(f: FiltreUtilisateursDto) {
    const page = f.page ?? 1;
    const parPage = f.parPage ?? PAR_PAGE;
    const q = f.q?.trim();
    const where: Prisma.UserWhereInput = {
      supprimeLe: null,
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
        include: INCLURE_LISTE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * parPage,
        take: parPage,
      }),
    ]);
    return {
      total,
      page,
      parPage,
      resultats: liste.map((u) => ({
        ...presenterUtilisateur(u),
        // Client : demandes publiées ; technicien : missions réalisées.
        nbDemandes: u.technicien ? u.technicien.nbMissions : u._count.demandes,
      })),
    };
  }

  /** Fiche détaillée : activité, dernière connexion, signalements visant le compte. */
  async utilisateur(id: string) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      include: INCLURE_LISTE,
    });
    if (!u) throw new NotFoundException('Utilisateur introuvable.');
    const cibles = [id, ...(u.technicien ? [u.technicien.id] : [])];
    const [session, signalements] = await Promise.all([
      this.prisma.session.findFirst({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.prisma.signalement.count({ where: { cible: { in: cibles } } }),
    ]);
    return {
      ...presenterUtilisateur(u),
      nbDemandes: u.technicien ? u.technicien.nbMissions : u._count.demandes,
      derniereConnexion: session?.createdAt ?? null,
      nbSignalements: signalements,
    };
  }

  /**
   * Création d'un compte par l'équipe GDC (un administrateur, par exemple). La personne est
   * prévenue par SMS et se connecte avec son numéro, sans mot de passe.
   */
  async creerUtilisateur(dto: CreerUtilisateurDto) {
    const telephone = normaliserTelephone(dto.telephone);
    if (await this.prisma.user.findUnique({ where: { telephone } }))
      throw new ConflictException('Un compte existe déjà pour ce numéro.');
    if (dto.role === 'TECHNICIEN' && !dto.metierId)
      throw new BadRequestException('Le métier du technicien est requis.');
    if (
      dto.metierId &&
      !(await this.prisma.metier.findUnique({ where: { id: dto.metierId } }))
    )
      throw new BadRequestException('Métier inconnu.');
    if (
      dto.zoneId &&
      !(await this.prisma.zone.findUnique({ where: { id: dto.zoneId } }))
    )
      throw new BadRequestException('Zone inconnue.');

    const u = await this.prisma.user.create({
      data: {
        telephone,
        nom: dto.nom.trim(),
        prenom: dto.prenom.trim(),
        role: dto.role,
        // Un technicien reste invisible tant que son identité n'est pas vérifiée.
        statut: dto.role === 'TECHNICIEN' ? 'EN_ATTENTE' : 'ACTIF',
        zoneId: dto.zoneId,
        typeClient: dto.role === 'CLIENT' ? 'PARTICULIER' : undefined,
        technicien:
          dto.role === 'TECHNICIEN'
            ? {
                create: {
                  metierId: dto.metierId!,
                  zones: dto.zoneId
                    ? { connect: [{ id: dto.zoneId }] }
                    : undefined,
                },
              }
            : undefined,
      },
    });
    await this.sms
      .envoyer({
        canal: 'sms',
        numero: telephone,
        texte: `GDC : un compte a été créé pour vous, ${u.prenom}. Connectez-vous avec ce numéro sur la plateforme GDC.`,
      })
      .catch(() => undefined);
    return this.utilisateur(u.id);
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
    if (cible.supprimeLe)
      throw new BadRequestException('Ce compte a été supprimé.');
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

  // ------------------------------------------------------------ Missions

  async listeDemandes(admin: UtilisateurConnecte, f: FiltreDemandesAdminDto) {
    const page = f.page ?? 1;
    const parPage = f.parPage ?? PAR_PAGE;
    const q = f.q?.trim().replace(/^#/, '');
    const where: Prisma.DemandeWhereInput = {
      ...(f.statut && { statut: f.statut }),
      ...(f.metier && { metierId: f.metier }),
      ...(f.zone && { zoneId: f.zone }),
      ...(q && {
        OR: [
          { titre: { contains: q, mode: 'insensitive' } },
          ...(/^\d+$/.test(q) ? [{ numero: Number(q) }] : []),
          { client: { nom: { contains: q, mode: 'insensitive' } } },
          { client: { prenom: { contains: q, mode: 'insensitive' } } },
        ],
      }),
    };
    const [total, liste] = await this.prisma.$transaction([
      this.prisma.demande.count({ where }),
      this.prisma.demande.findMany({
        where,
        include: INCLURE_DEMANDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * parPage,
        take: parPage,
      }),
    ]);
    return {
      total,
      page,
      parPage,
      resultats: liste.map((d) => this.demandes.presenter(d, admin)),
    };
  }

  // -------------------------------------------------------- Signalements

  signaler(u: UtilisateurConnecte, dto: CreerSignalementDto) {
    return this.prisma.signalement.create({ data: { ...dto, auteurId: u.id } });
  }

  /** Signalements, avec un libellé lisible de l'élément visé (nom, avis, demande). */
  async signalements(statut?: string) {
    const liste = await this.prisma.signalement.findMany({
      where: statut ? { statut: statut as never } : {},
      include: { auteur: { select: { prenom: true, nom: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const ids = (type: string) =>
      liste.filter((s) => s.type === type).map((s) => s.cible);
    const [techniciens, comptes, avis, demandes] = await Promise.all([
      this.prisma.profilTechnicien.findMany({
        where: { id: { in: ids('technicien') } },
        select: { id: true, user: { select: { prenom: true, nom: true } } },
      }),
      this.prisma.user.findMany({
        where: { id: { in: [...ids('client'), ...ids('technicien')] } },
        select: { id: true, prenom: true, nom: true },
      }),
      this.prisma.avis.findMany({
        where: { id: { in: ids('avis') } },
        select: {
          id: true,
          note: true,
          auteur: { select: { prenom: true, nom: true } },
          technicien: {
            select: { user: { select: { prenom: true, nom: true } } },
          },
        },
      }),
      this.prisma.demande.findMany({
        where: { id: { in: ids('demande') } },
        select: { id: true, numero: true, titre: true },
      }),
    ]);
    const nom = (p: { prenom: string; nom: string }) => `${p.prenom} ${p.nom}`;
    const libelles = new Map<string, string>([
      ...techniciens.map((t) => [t.id, nom(t.user)] as const),
      ...comptes.map((u) => [u.id, nom(u)] as const),
      ...avis.map(
        (a) =>
          [
            a.id,
            `Avis ${a.note}★ de ${nom(a.auteur)} sur ${nom(a.technicien.user)}`,
          ] as const,
      ),
      ...demandes.map((d) => [d.id, `#${d.numero} ${d.titre}`] as const),
    ]);
    return liste.map((s) => ({
      ...s,
      cibleLibelle: libelles.get(s.cible) ?? s.cible,
    }));
  }

  /** Changement de statut : les dates de prise en charge et de résolution sont enregistrées. */
  async traiterSignalement(id: string, dto: TraiterSignalementDto) {
    const s = await this.prisma.signalement.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Signalement introuvable.');
    const maintenant = new Date();
    return this.prisma.signalement.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.statut === 'EN_COURS' &&
          !s.priseEnChargeLe && { priseEnChargeLe: maintenant }),
        ...(dto.statut === 'RESOLU' && {
          resoluLe: maintenant,
          priseEnChargeLe: s.priseEnChargeLe ?? maintenant,
        }),
        ...(dto.statut === 'OUVERT' && {
          resoluLe: null,
          priseEnChargeLe: null,
        }),
      },
    });
  }
}
