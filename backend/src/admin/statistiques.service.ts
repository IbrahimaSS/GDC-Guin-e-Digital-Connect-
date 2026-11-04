import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const JOUR = 86_400_000;

/** Début du mois `decalage` mois avant le mois courant. */
const debutMois = (decalage: number) => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - decalage, 1);
};

const libelleMois = (d: Date) =>
  d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');

const pourcentage = (part: number, total: number) =>
  total ? Math.round((part / total) * 1000) / 10 : 0;

/**
 * Indicateurs du back-office, calculés à partir des données réelles
 * (aucune valeur estimée : un indicateur sans donnée vaut 0).
 */
@Injectable()
export class StatistiquesService {
  constructor(private readonly prisma: PrismaService) {}

  async calculer() {
    const maintenant = Date.now();
    const debut12Mois = debutMois(11);
    const debutSemaine = new Date(new Date().setHours(0, 0, 0, 0) - 6 * JOUR);

    const [
      utilisateurs,
      demandes,
      paiements,
      verifications,
      avis,
      techniciens,
      signalements,
    ] = await Promise.all([
      this.prisma.user.findMany({
        where: { supprimeLe: null },
        select: { role: true, statut: true, createdAt: true },
      }),
      this.prisma.demande.findMany({
        select: {
          id: true,
          numero: true,
          titre: true,
          statut: true,
          urgente: true,
          clientId: true,
          metierId: true,
          zoneId: true,
          createdAt: true,
          accepteeLe: true,
          termineeLe: true,
          zone: { select: { nom: true } },
        },
      }),
      this.prisma.paiement.findMany({
        where: { statut: { in: ['CONFIRME', 'REVERSE'] } },
        select: { montant: true, commission: true, confirmeLe: true },
      }),
      this.prisma.verification.findMany({
        select: {
          niveau: true,
          statut: true,
          createdAt: true,
          decideLe: true,
          technicien: {
            select: { user: { select: { prenom: true, nom: true } } },
          },
        },
      }),
      this.prisma.avis.findMany({
        select: {
          note: true,
          recommande: true,
          statut: true,
          signale: true,
          createdAt: true,
          demande: { select: { numero: true } },
        },
      }),
      this.prisma.profilTechnicien.findMany({
        where: { user: { supprimeLe: null } },
        select: {
          niveau: true,
          note: true,
          nbAvis: true,
          user: { select: { statut: true } },
        },
      }),
      this.prisma.signalement.findMany({
        select: { type: true, statut: true, createdAt: true, resoluLe: true },
      }),
    ]);

    // --- Comptes
    const comptes = {
      clients: utilisateurs.filter((u) => u.role === 'CLIENT').length,
      techniciens: utilisateurs.filter((u) => u.role === 'TECHNICIEN').length,
      admins: utilisateurs.filter((u) => u.role === 'ADMIN').length,
      techniciensEnAttente: utilisateurs.filter(
        (u) => u.role === 'TECHNICIEN' && u.statut === 'EN_ATTENTE',
      ).length,
      suspendus: utilisateurs.filter((u) => u.statut === 'SUSPENDU').length,
    };
    const inscritsCeMois = utilisateurs.filter(
      (u) => u.createdAt >= debutMois(0),
    ).length;
    const inscritsMoisPrecedent = utilisateurs.filter(
      (u) => u.createdAt >= debutMois(1) && u.createdAt < debutMois(0),
    ).length;

    // --- Missions
    const parStatut = (s: string) =>
      demandes.filter((d) => d.statut === s).length;
    const acceptees = demandes.filter((d) => d.accepteeLe);
    const delais = acceptees.map(
      (d) => (d.accepteeLe!.getTime() - d.createdAt.getTime()) / 60_000,
    );
    const terminees = parStatut('TERMINEE');
    const annulees = parStatut('ANNULEE');
    const demandesParClient = new Map<string, number>();
    for (const d of demandes)
      demandesParClient.set(
        d.clientId,
        (demandesParClient.get(d.clientId) ?? 0) + 1,
      );

    // --- Séries
    const mois = Array.from({ length: 12 }, (_, i) => debutMois(11 - i));
    const finMois = (i: number) =>
      i < 11 ? mois[i + 1] : new Date(maintenant + JOUR);
    const jours = Array.from(
      { length: 7 },
      (_, i) => new Date(debutSemaine.getTime() + i * JOUR),
    );
    const memeJour = (d: Date | null, j: Date) =>
      Boolean(d) &&
      d!.getTime() >= j.getTime() &&
      d!.getTime() < j.getTime() + JOUR;

    // --- Activité récente (événements datés, du plus récent au plus ancien)
    const nom = (u: { prenom: string; nom: string }) => `${u.prenom} ${u.nom}`;
    const activite = [
      ...verifications
        .filter((v) => v.decideLe)
        .map((v) => ({
          type:
            v.statut === 'APPROUVEE'
              ? 'verification_approuvee'
              : 'verification_refusee',
          texte:
            v.statut === 'APPROUVEE'
              ? `${nom(v.technicien.user)} a obtenu le niveau ${v.niveau}`
              : `Vérification niveau ${v.niveau} refusée pour ${nom(v.technicien.user)}`,
          date: v.decideLe!,
        })),
      ...demandes.map((d) => ({
        type: 'demande',
        texte: `Nouvelle demande #${d.numero} à ${d.zone.nom}${d.urgente ? ' (urgent)' : ''}`,
        date: d.createdAt,
      })),
      ...demandes
        .filter((d) => d.termineeLe)
        .map((d) => ({
          type: 'mission_terminee',
          texte: `Mission #${d.numero} terminée`,
          date: d.termineeLe!,
        })),
      ...avis.map((a) => ({
        type: 'avis',
        texte: `Avis ${a.note}★ sur la mission #${a.demande.numero}`,
        date: a.createdAt,
      })),
      ...signalements.map((s) => ({
        type: 'signalement',
        texte: `Signalement : ${s.type}`,
        date: s.createdAt,
      })),
    ]
      .filter((e) => e.date.getTime() <= maintenant)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 6);

    const notes = techniciens.filter((t) => t.nbAvis > 0);
    const recommandations = avis.filter((a) => a.recommande !== null);
    const resolus = signalements.filter((s) => s.resoluLe);
    const resolusCeMois = resolus.filter((s) => s.resoluLe! >= debutMois(0));
    const volume = paiements.reduce((s, p) => s + p.montant, 0);

    return {
      utilisateurs: comptes,
      demandes: Object.fromEntries(
        ['ENVOYEE', 'ACCEPTEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'].map((s) => [
          s,
          parStatut(s),
        ]),
      ),
      demandes7j: demandes.filter((d) => d.createdAt >= debutSemaine).length,
      verificationsEnAttente: verifications.filter(
        (v) => v.statut === 'EN_ATTENTE' || v.statut === 'EN_COURS',
      ).length,
      verificationsParStatut: Object.fromEntries(
        ['EN_ATTENTE', 'EN_COURS', 'APPROUVEE', 'REFUSEE'].map((s) => [
          s,
          verifications.filter((v) => v.statut === s).length,
        ]),
      ),
      avisAModerer: avis.filter((a) => a.statut === 'EN_ATTENTE' || a.signale)
        .length,
      signalementsOuverts: signalements.filter((s) => s.statut !== 'RESOLU')
        .length,
      paiements: {
        nombre: paiements.length,
        volume,
        commissions: paiements.reduce((s, p) => s + p.commission, 0),
      },
      missions: {
        ceMois: demandes.filter((d) => d.createdAt >= debutMois(0)).length,
        /** Délai moyen entre la publication d'une demande et son acceptation */
        delaiReponseMinutes: delais.length
          ? Math.round(delais.reduce((s, v) => s + v, 0) / delais.length)
          : 0,
        /** Missions terminées parmi les missions clôturées (terminées + annulées) */
        tauxReussite: pourcentage(terminees, terminees + annulees),
      },
      techniciens: {
        inscrits: techniciens.length,
        verifiesNiveau2: techniciens.filter((t) => t.niveau >= 2).length,
        noteMoyenne: notes.length
          ? Math.round(
              (notes.reduce((s, t) => s + t.note, 0) / notes.length) * 10,
            ) / 10
          : 0,
        suspendus: techniciens.filter((t) => t.user.statut === 'SUSPENDU')
          .length,
      },
      croissanceMensuelle: pourcentage(
        inscritsCeMois - inscritsMoisPrecedent,
        inscritsMoisPrecedent,
      ),
      clientsRecurrents: pourcentage(
        [...demandesParClient.values()].filter((n) => n >= 2).length,
        demandesParClient.size,
      ),
      recommandation: pourcentage(
        recommandations.filter((a) => a.recommande).length,
        recommandations.length,
      ),
      signalements: {
        resolusCeMois: resolusCeMois.length,
        delaiMoyenHeures: resolus.length
          ? Math.round(
              resolus.reduce(
                (s, x) => s + (x.resoluLe!.getTime() - x.createdAt.getTime()),
                0,
              ) /
                resolus.length /
                3_600_000,
            )
          : 0,
      },
      series: {
        mois: mois.map(libelleMois),
        /** Comptes cumulés à la fin de chaque mois */
        utilisateurs: mois.map(
          (_, i) => utilisateurs.filter((u) => u.createdAt < finMois(i)).length,
        ),
        techniciens: mois.map(
          (_, i) =>
            utilisateurs.filter(
              (u) => u.role === 'TECHNICIEN' && u.createdAt < finMois(i),
            ).length,
        ),
        /** Volume des paiements confirmés par mois (GNF) */
        volume: mois.map((m, i) =>
          paiements
            .filter(
              (p) =>
                p.confirmeLe && p.confirmeLe >= m && p.confirmeLe < finMois(i),
            )
            .reduce((s, p) => s + p.montant, 0),
        ),
        jours: jours.map((j) =>
          j.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
        ),
        demandesJour: jours.map(
          (j) => demandes.filter((d) => memeJour(d.createdAt, j)).length,
        ),
        missionsJour: jours.map(
          (j) => demandes.filter((d) => memeJour(d.termineeLe, j)).length,
        ),
      },
      /** Du dépôt de la demande à l'avis du client */
      entonnoir: {
        demandes: demandes.length,
        acceptees: acceptees.length,
        terminees,
        avis: avis.length,
      },
      demandesParMetier: Object.fromEntries(
        [...new Set(demandes.map((d) => d.metierId))].map((m) => [
          m,
          demandes.filter((d) => d.metierId === m).length,
        ]),
      ),
      demandesParZone: Object.fromEntries(
        [...new Set(demandes.map((d) => d.zone.nom))].map((z) => [
          z,
          demandes.filter((d) => d.zone.nom === z).length,
        ]),
      ),
      activite,
      periode: { depuis: debut12Mois },
    };
  }
}
