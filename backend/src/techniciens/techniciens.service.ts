import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { formaterTelephone } from '../common/telephone.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  DisponibiliteDto,
  ModifierProfilTechnicienDto,
  RealisationDto,
  RechercheTechniciensDto,
} from './techniciens.dto.js';

const INCLURE_CARTE = {
  user: {
    select: {
      nom: true,
      prenom: true,
      photoUrl: true,
      zone: { select: { id: true, nom: true } },
    },
  },
  metier: { select: { id: true, label: true } },
  zones: { select: { id: true, nom: true } },
} satisfies Prisma.ProfilTechnicienInclude;

type Carte = Prisma.ProfilTechnicienGetPayload<{
  include: typeof INCLURE_CARTE;
}>;

/** Fiche résumée affichée dans les résultats de recherche. */
function presenterCarte(t: Carte) {
  return {
    id: t.id,
    nom: `${t.user.prenom} ${t.user.nom}`,
    photoUrl: t.user.photoUrl,
    metier: t.metier,
    specialites: t.specialites,
    zone: t.user.zone,
    zonesIntervention: t.zones,
    note: t.note,
    nbAvis: t.nbAvis,
    niveau: t.niveau,
    disponible: t.disponible,
    experience: t.experience,
    missions: t.nbMissions,
  };
}

/** Un technicien n'apparaît publiquement qu'avec un compte actif et une identité vérifiée. */
const VISIBLE: Prisma.ProfilTechnicienWhereInput = {
  niveau: { gte: 1 },
  user: { statut: 'ACTIF' },
};

@Injectable()
export class TechniciensService {
  constructor(private readonly prisma: PrismaService) {}

  async rechercher(f: RechercheTechniciensDto) {
    const page = f.page ?? 1;
    const parPage = f.parPage ?? 12;
    const q = f.q?.trim();
    const where: Prisma.ProfilTechnicienWhereInput = {
      ...VISIBLE,
      ...(f.metier && { metierId: f.metier }),
      ...(f.zone && {
        OR: [{ zones: { some: { id: f.zone } } }, { user: { zoneId: f.zone } }],
      }),
      ...(f.niveauMin && { niveau: { gte: f.niveauMin } }),
      ...(f.noteMin && { note: { gte: f.noteMin } }),
      ...(f.disponible !== undefined && { disponible: f.disponible }),
      ...(q && {
        AND: [
          {
            OR: [
              { user: { nom: { contains: q, mode: 'insensitive' } } },
              { user: { prenom: { contains: q, mode: 'insensitive' } } },
              { metier: { label: { contains: q, mode: 'insensitive' } } },
              { specialites: { has: q } },
              { bio: { contains: q, mode: 'insensitive' } },
            ],
          },
        ],
      }),
    };
    const tri: Record<
      string,
      Prisma.ProfilTechnicienOrderByWithRelationInput[]
    > = {
      pertinence: [
        { disponible: 'desc' },
        { niveau: 'desc' },
        { note: 'desc' },
      ],
      note: [{ note: 'desc' }, { nbAvis: 'desc' }],
      avis: [{ nbAvis: 'desc' }],
      experience: [{ experience: 'desc' }],
      missions: [{ nbMissions: 'desc' }],
    };
    const [total, liste] = await this.prisma.$transaction([
      this.prisma.profilTechnicien.count({ where }),
      this.prisma.profilTechnicien.findMany({
        where,
        include: INCLURE_CARTE,
        orderBy: tri[f.tri ?? 'pertinence'],
        skip: (page - 1) * parPage,
        take: parPage,
      }),
    ]);
    return { total, page, parPage, resultats: liste.map(presenterCarte) };
  }

  /** Profil public complet : réalisations et avis publiés. */
  async profil(id: string) {
    const t = await this.prisma.profilTechnicien.findFirst({
      where: { id, ...VISIBLE },
      include: {
        ...INCLURE_CARTE,
        user: {
          select: {
            nom: true,
            prenom: true,
            photoUrl: true,
            telephone: true,
            createdAt: true,
            zone: { select: { id: true, nom: true } },
          },
        },
        realisations: { orderBy: { createdAt: 'desc' } },
        avisRecus: {
          where: { statut: 'PUBLIE' },
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            auteur: { select: { prenom: true, nom: true } },
            demande: { select: { titre: true } },
          },
        },
      },
    });
    if (!t) throw new NotFoundException('Technicien introuvable.');
    return {
      ...presenterCarte(t),
      bio: t.bio,
      disponibilites: t.disponibilites,
      telephone: formaterTelephone(t.user.telephone),
      inscritLe: t.user.createdAt,
      realisations: t.realisations,
      avis: t.avisRecus.map((a) => ({
        id: a.id,
        auteur: `${a.auteur.prenom} ${a.auteur.nom}`,
        note: a.note,
        commentaire: a.commentaire,
        tags: a.tags,
        reponse: a.reponse,
        mission: a.demande.titre,
        date: a.createdAt,
      })),
    };
  }

  async monProfil(userId: string) {
    return this.prisma.profilTechnicien
      .findUniqueOrThrow({
        where: { userId },
        include: { ...INCLURE_CARTE, realisations: true },
      })
      .catch(() => {
        throw new ForbiddenException("Ce compte n'a pas de profil technicien.");
      });
  }

  async modifier(userId: string, dto: ModifierProfilTechnicienDto) {
    const { zones, ...champs } = dto;
    if (
      dto.metierId &&
      !(await this.prisma.metier.findUnique({ where: { id: dto.metierId } }))
    )
      throw new BadRequestException('Métier inconnu.');
    await this.monProfil(userId);
    return this.prisma.profilTechnicien.update({
      where: { userId },
      data: {
        ...champs,
        ...(zones && { zones: { set: zones.map((id) => ({ id })) } }),
      },
      include: { ...INCLURE_CARTE, realisations: true },
    });
  }

  async disponibilite(userId: string, { disponible }: DisponibiliteDto) {
    await this.monProfil(userId);
    return this.prisma.profilTechnicien.update({
      where: { userId },
      data: { disponible },
      select: { disponible: true },
    });
  }

  async ajouterRealisation(userId: string, dto: RealisationDto) {
    const t = await this.monProfil(userId);
    if (t.realisations.length >= 30)
      throw new BadRequestException('30 réalisations maximum.');
    return this.prisma.realisation.create({
      data: { ...dto, technicienId: t.id },
    });
  }

  async supprimerRealisation(userId: string, id: string) {
    const t = await this.monProfil(userId);
    const { count } = await this.prisma.realisation.deleteMany({
      where: { id, technicienId: t.id },
    });
    if (!count) throw new NotFoundException('Réalisation introuvable.');
  }

  /** Chiffres du tableau de bord technicien. */
  async statistiques(userId: string) {
    const t = await this.monProfil(userId);
    const [parStatut, paiements] = await this.prisma.$transaction([
      this.prisma.demande.groupBy({
        by: ['statut'],
        where: { technicienId: t.id },
        _count: { _all: true },
        orderBy: { statut: 'asc' },
      }),
      this.prisma.paiement.findMany({
        where: {
          statut: { in: ['CONFIRME', 'REVERSE'] },
          devis: { demande: { technicienId: t.id } },
        },
        select: { montant: true, commission: true, statut: true },
      }),
    ]);
    const missions = Object.fromEntries(
      parStatut.map((g) => [g.statut, (g._count as { _all: number })._all]),
    );
    const gains = paiements.reduce((s, p) => s + p.montant - p.commission, 0);
    const enAttente = paiements
      .filter((p) => p.statut === 'CONFIRME')
      .reduce((s, p) => s + p.montant - p.commission, 0);
    return {
      note: t.note,
      nbAvis: t.nbAvis,
      niveau: t.niveau,
      missions,
      gains,
      gainsEnAttente: enAttente,
    };
  }
}
