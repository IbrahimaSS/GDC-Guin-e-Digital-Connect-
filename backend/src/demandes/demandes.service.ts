import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UtilisateurConnecte } from '../common/auth.js';
import { codeNumerique, egalSecurise, sha256 } from '../common/securite.js';
import { formaterTelephone } from '../common/telephone.js';
import type { Prisma, StatutDemande } from '../generated/prisma/client.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreerDemandeDto, FiltreDemandesDto } from './demandes.dto.js';

export const INCLURE_DEMANDE = {
  client: {
    select: {
      id: true,
      nom: true,
      prenom: true,
      telephone: true,
      photoUrl: true,
    },
  },
  technicien: {
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          telephone: true,
          photoUrl: true,
        },
      },
    },
  },
  metier: { select: { id: true, label: true } },
  zone: { select: { id: true, nom: true, lat: true, lng: true } },
  devis: { include: { lignes: { orderBy: { ordre: 'asc' } }, paiement: true } },
  avis: { select: { id: true, note: true } },
} satisfies Prisma.DemandeInclude;

export type DemandeComplete = Prisma.DemandeGetPayload<{
  include: typeof INCLURE_DEMANDE;
}>;

const PAR_PAGE = 20;
const PREFIXE_QR = 'GDC-MISSION';

/** Statuts depuis lesquels chaque action est permise. */
const TRANSITIONS: Record<
  'accepter' | 'enRoute' | 'demarrer' | 'terminer' | 'annuler' | 'desister',
  StatutDemande[]
> = {
  accepter: ['ENVOYEE'],
  enRoute: ['ACCEPTEE'],
  demarrer: ['ACCEPTEE'],
  terminer: ['EN_COURS'],
  annuler: ['ENVOYEE', 'ACCEPTEE'],
  desister: ['ACCEPTEE'],
};

@Injectable()
export class DemandesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Représentation d'une demande pour un participant : le code d'intervention n'est montré qu'au client. */
  presenter(d: DemandeComplete, u: UtilisateurConnecte) {
    const estClient = d.clientId === u.id || u.role === 'ADMIN';
    const tech = d.technicien;
    // Le numéro du client n'est communiqué qu'au technicien retenu.
    const contactVisible =
      estClient || (tech?.userId === u.id && d.statut !== 'ENVOYEE');
    return {
      id: d.id,
      numero: d.numero,
      reference: `#${d.numero}`,
      titre: d.titre,
      description: d.description,
      statut: d.statut,
      metier: d.metier,
      zone: d.zone,
      adresse: d.adresse,
      lat: d.lat,
      lng: d.lng,
      urgente: d.urgente,
      dateSouhaitee: d.dateSouhaitee,
      creneau: d.creneau,
      budget: d.budget,
      photos: d.photos,
      client: {
        id: d.client.id,
        nom: `${d.client.prenom} ${d.client.nom}`,
        photoUrl: d.client.photoUrl,
        telephone: contactVisible
          ? formaterTelephone(d.client.telephone)
          : undefined,
      },
      technicien: tech && {
        id: tech.id,
        userId: tech.userId,
        nom: `${tech.user.prenom} ${tech.user.nom}`,
        photoUrl: tech.user.photoUrl,
        note: tech.note,
        niveau: tech.niveau,
        telephone:
          d.statut === 'ENVOYEE'
            ? undefined
            : formaterTelephone(tech.user.telephone),
      },
      codeIntervention:
        estClient && d.statut === 'ACCEPTEE' ? d.codeIntervention : undefined,
      qrIntervention:
        estClient && d.statut === 'ACCEPTEE'
          ? `${PREFIXE_QR}:${d.numero}:${d.codeIntervention}`
          : undefined,
      devis: d.devis,
      avis: d.avis,
      accepteeLe: d.accepteeLe,
      demarreeLe: d.demarreeLe,
      termineeLe: d.termineeLe,
      annuleeLe: d.annuleeLe,
      creeLe: d.createdAt,
    };
  }

  private async profilTechnicien(userId: string) {
    const t = await this.prisma.profilTechnicien.findUnique({
      where: { userId },
      include: {
        zones: { select: { id: true } },
        user: { select: { statut: true, prenom: true, nom: true } },
      },
    });
    if (!t)
      throw new ForbiddenException("Ce compte n'a pas de profil technicien.");
    return t;
  }

  /** Charge une demande en vérifiant que l'utilisateur y participe (client, technicien retenu ou admin). */
  async charger(id: string, u: UtilisateurConnecte): Promise<DemandeComplete> {
    const d = await this.prisma.demande.findUnique({
      where: { id },
      include: INCLURE_DEMANDE,
    });
    if (!d) throw new NotFoundException('Demande introuvable.');
    if (
      u.role === 'ADMIN' ||
      d.clientId === u.id ||
      d.technicien?.userId === u.id
    )
      return d;
    // Un technicien peut consulter une demande ouverte de son métier avant de l'accepter.
    if (u.role === 'TECHNICIEN' && d.statut === 'ENVOYEE' && !d.technicienId) {
      const t = await this.profilTechnicien(u.id);
      if (t.metierId === d.metierId) return d;
    }
    throw new NotFoundException('Demande introuvable.');
  }

  async creer(u: UtilisateurConnecte, dto: CreerDemandeDto) {
    const [metier, zone] = await Promise.all([
      this.prisma.metier.findFirst({
        where: { id: dto.metierId, actif: true },
      }),
      this.prisma.zone.findFirst({ where: { id: dto.zoneId, actif: true } }),
    ]);
    if (!metier) throw new BadRequestException('Métier indisponible.');
    if (!zone) throw new BadRequestException('Zone non desservie.');
    if (dto.technicienId) {
      const t = await this.prisma.profilTechnicien.findFirst({
        where: {
          id: dto.technicienId,
          niveau: { gte: 1 },
          user: { statut: 'ACTIF' },
        },
      });
      if (!t) throw new BadRequestException('Technicien indisponible.');
    }

    const d = await this.prisma.demande.create({
      data: {
        ...dto,
        dateSouhaitee: dto.dateSouhaitee
          ? new Date(dto.dateSouhaitee)
          : undefined,
        photos: dto.photos ?? [],
        urgente: dto.urgente ?? false,
        clientId: u.id,
        codeIntervention: codeNumerique(4),
      },
      include: INCLURE_DEMANDE,
    });
    await this.notifications.notifier(
      'demande_publiee',
      u.id,
      { mission: d.titre },
      `/client/demandes/${d.id}`,
    );
    if (d.technicien) {
      await this.notifications.notifier(
        'demande_publiee',
        d.technicien.userId,
        { mission: d.titre },
        `/technicien/demandes/${d.id}`,
      );
    }
    return this.presenter(d, u);
  }

  /** Demandes du client, ou missions du technicien. */
  async miennes(u: UtilisateurConnecte, f: FiltreDemandesDto) {
    const page = f.page ?? 1;
    let where: Prisma.DemandeWhereInput;
    if (u.role === 'TECHNICIEN') {
      const t = await this.profilTechnicien(u.id);
      where = { technicienId: t.id };
    } else {
      where = { clientId: u.id };
    }
    if (f.statut) where.statut = f.statut;
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
      resultats: liste.map((d) => this.presenter(d, u)),
    };
  }

  /** Demandes ouvertes que le technicien peut accepter : son métier, ses zones, ou qui lui sont adressées. */
  async disponibles(u: UtilisateurConnecte) {
    const t = await this.profilTechnicien(u.id);
    const zones = t.zones.map((z) => z.id);
    const liste = await this.prisma.demande.findMany({
      where: {
        statut: 'ENVOYEE',
        OR: [
          { technicienId: t.id },
          {
            technicienId: null,
            metierId: t.metierId,
            ...(zones.length && { zoneId: { in: zones } }),
          },
        ],
      },
      include: INCLURE_DEMANDE,
      orderBy: [{ urgente: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
    return liste.map((d) => this.presenter(d, u));
  }

  async detail(id: string, u: UtilisateurConnecte) {
    return this.presenter(await this.charger(id, u), u);
  }

  /** Passage d'état atomique : échoue si la demande a changé entre-temps (ex. deux techniciens acceptent en même temps). */
  private async transition(
    id: string,
    depuis: StatutDemande[],
    data: Prisma.DemandeUncheckedUpdateManyInput,
    filtre: Prisma.DemandeWhereInput = {},
  ) {
    const { count } = await this.prisma.demande.updateMany({
      where: { id, statut: { in: depuis }, ...filtre },
      data,
    });
    if (!count)
      throw new ConflictException(
        "Cette action n'est plus possible pour cette demande.",
      );
    return this.prisma.demande.findUniqueOrThrow({
      where: { id },
      include: INCLURE_DEMANDE,
    });
  }

  async accepter(id: string, u: UtilisateurConnecte) {
    const t = await this.profilTechnicien(u.id);
    if (t.niveau < 1 || t.user.statut !== 'ACTIF')
      throw new ForbiddenException(
        'Votre identité doit être vérifiée avant d’accepter des missions.',
      );
    const d = await this.charger(id, u);
    if (d.technicienId && d.technicienId !== t.id)
      throw new ForbiddenException(
        'Cette demande est adressée à un autre technicien.',
      );
    if (!d.technicienId && d.metierId !== t.metierId)
      throw new ForbiddenException(
        'Cette demande ne correspond pas à votre métier.',
      );

    const maj = await this.transition(
      id,
      TRANSITIONS.accepter,
      { statut: 'ACCEPTEE', technicienId: t.id, accepteeLe: new Date() },
      { OR: [{ technicienId: null }, { technicienId: t.id }] },
    );
    await this.notifications.notifier(
      'demande_acceptee',
      maj.clientId,
      {
        technicien: `${t.user.prenom} ${t.user.nom}`,
        mission: maj.titre,
        code: maj.codeIntervention,
      },
      `/client/demandes/${id}`,
    );
    return this.presenter(maj, u);
  }

  private async exigerTechnicienRetenu(id: string, u: UtilisateurConnecte) {
    const d = await this.charger(id, u);
    if (d.technicien?.userId !== u.id)
      throw new ForbiddenException(
        'Seul le technicien retenu peut effectuer cette action.',
      );
    return d;
  }

  async enRoute(id: string, u: UtilisateurConnecte) {
    const d = await this.exigerTechnicienRetenu(id, u);
    if (!TRANSITIONS.enRoute.includes(d.statut))
      throw new ConflictException(
        "Cette action n'est plus possible pour cette demande.",
      );
    await this.notifications.notifier(
      'technicien_en_route',
      d.clientId,
      {
        technicien: `${d.technicien!.user.prenom} ${d.technicien!.user.nom}`,
        mission: d.titre,
      },
      `/client/demandes/${id}/suivi`,
    );
    return this.presenter(d, u);
  }

  /** Le technicien saisit ou scanne le code du client : preuve de passage, base des avis vérifiés. */
  async demarrer(id: string, u: UtilisateurConnecte, saisie: string) {
    const d = await this.exigerTechnicienRetenu(id, u);
    const t = saisie.trim();
    let code = t.replace(/\D/g, '');
    if (t.startsWith(PREFIXE_QR)) {
      const [, numero, c] = t.split(':');
      if (numero !== String(d.numero))
        throw new BadRequestException(
          'Ce QR code correspond à une autre mission.',
        );
      code = c ?? '';
    }
    if (!egalSecurise(sha256(code), sha256(d.codeIntervention)))
      throw new BadRequestException("Code d'intervention incorrect.");

    const maj = await this.transition(id, TRANSITIONS.demarrer, {
      statut: 'EN_COURS',
      demarreeLe: new Date(),
    });
    await this.notifications.notifier(
      'intervention_demarree',
      d.clientId,
      {
        technicien: `${d.technicien!.user.prenom} ${d.technicien!.user.nom}`,
        mission: d.titre,
      },
      `/client/demandes/${id}`,
    );
    return this.presenter(maj, u);
  }

  async terminer(id: string, u: UtilisateurConnecte) {
    const d = await this.exigerTechnicienRetenu(id, u);
    const maj = await this.transition(id, TRANSITIONS.terminer, {
      statut: 'TERMINEE',
      termineeLe: new Date(),
    });
    await this.prisma.profilTechnicien.update({
      where: { id: d.technicienId! },
      data: { nbMissions: { increment: 1 } },
    });
    // Le paiement conservé par GDC est reversé au technicien à la fin de la mission (commission déduite).
    // TODO : déclencher le virement réel vers le compte mobile money du technicien.
    await this.prisma.paiement.updateMany({
      where: { devis: { demandeId: id }, statut: 'CONFIRME' },
      data: { statut: 'REVERSE' },
    });
    await this.notifications.notifier(
      'mission_terminee',
      d.clientId,
      {
        technicien: `${d.technicien!.user.prenom} ${d.technicien!.user.nom}`,
        mission: d.titre,
      },
      `/client/demandes/${id}/avis`,
    );
    return this.presenter(maj, u);
  }

  /** Le client annule tant que l'intervention n'a pas commencé. */
  async annuler(id: string, u: UtilisateurConnecte) {
    const d = await this.charger(id, u);
    if (d.clientId !== u.id && u.role !== 'ADMIN')
      throw new ForbiddenException('Seul le client peut annuler sa demande.');
    if (d.devis?.paiement?.statut === 'CONFIRME')
      throw new ConflictException(
        'Un paiement a été reçu : contactez le support pour annuler.',
      );
    const maj = await this.transition(id, TRANSITIONS.annuler, {
      statut: 'ANNULEE',
      annuleeLe: new Date(),
    });
    return this.presenter(maj, u);
  }

  /** Le technicien se retire : la demande redevient ouverte aux autres professionnels. */
  async desister(id: string, u: UtilisateurConnecte) {
    const d = await this.exigerTechnicienRetenu(id, u);
    if (d.devis?.paiement?.statut === 'CONFIRME')
      throw new ConflictException(
        'Un paiement a été reçu : contactez le support.',
      );
    const maj = await this.transition(id, TRANSITIONS.desister, {
      statut: 'ENVOYEE',
      technicienId: null,
      accepteeLe: null,
      codeIntervention: codeNumerique(4),
    });
    if (d.devis) await this.prisma.devis.delete({ where: { id: d.devis.id } });
    return this.presenter(maj, u);
  }
}
