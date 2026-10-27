import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  codeNumerique,
  egalSecurise,
  jetonAleatoire,
  sha256,
} from '../common/securite.js';
import { normaliserTelephone } from '../common/telephone.js';
import type { Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SmsService } from '../sms/sms.service.js';
import {
  INCLURE_UTILISATEUR,
  presenterUtilisateur,
} from '../users/presentation.js';
import type { InscriptionDto } from './auth.dto.js';

const MAX_CODES_PAR_PERIODE = 3;
const PERIODE_CODES_MS = 10 * 60 * 1000;

/** « 15m », « 30d », « 12h », « 45s » → millisecondes. */
function duree(valeur: string): number {
  const m = /^(\d+)([smhd])$/.exec(valeur);
  if (!m) throw new Error(`Durée invalide : ${valeur}`);
  return (
    Number(m[1]) *
    { s: 1e3, m: 6e4, h: 3.6e6, d: 8.64e7 }[m[2] as 's' | 'm' | 'h' | 'd']
  );
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly sms: SmsService,
  ) {}

  private empreinteCode(telephone: string, code: string) {
    return sha256(
      `${telephone}:${code}:${this.config.getOrThrow('jwt.refreshSecret')}`,
    );
  }

  /** Envoie un code de connexion à 6 chiffres par SMS (3 demandes maximum par 10 minutes). */
  async demanderCode(saisie: string) {
    const telephone = normaliserTelephone(saisie);
    const recents = await this.prisma.codeOtp.count({
      where: {
        telephone,
        createdAt: { gte: new Date(Date.now() - PERIODE_CODES_MS) },
      },
    });
    if (recents >= MAX_CODES_PAR_PERIODE)
      throw new HttpException(
        'Trop de demandes de code. Réessayez dans quelques minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );

    const code = codeNumerique(6);
    const ttl = this.config.getOrThrow<number>('otp.ttlMinutes');
    await this.prisma.codeOtp.create({
      data: {
        telephone,
        codeHash: this.empreinteCode(telephone, code),
        expireLe: new Date(Date.now() + ttl * 60_000),
      },
    });
    await this.sms.envoyer({
      canal: 'sms',
      numero: telephone,
      texte: `GDC : votre code de connexion est ${code}. Valable ${ttl} minutes. Ne le communiquez à personne.`,
    });
    return { expireDansSecondes: ttl * 60 };
  }

  /**
   * Vérifie le code. Compte existant → session ouverte.
   * Nouveau numéro → jeton d'inscription (15 min) à présenter à POST /auth/inscription.
   */
  async verifierCode(saisie: string, code: string, appareil?: string) {
    const telephone = normaliserTelephone(saisie);
    const otp = await this.prisma.codeOtp.findFirst({
      where: { telephone, utilise: false },
      orderBy: { createdAt: 'desc' },
    });
    const maxEssais = this.config.getOrThrow<number>('otp.maxEssais');
    if (!otp || otp.expireLe < new Date() || otp.essais >= maxEssais)
      throw new UnauthorizedException('Code expiré. Demandez un nouveau code.');

    if (!egalSecurise(otp.codeHash, this.empreinteCode(telephone, code))) {
      await this.prisma.codeOtp.update({
        where: { id: otp.id },
        data: { essais: { increment: 1 } },
      });
      throw new UnauthorizedException('Code incorrect.');
    }
    await this.prisma.codeOtp.update({
      where: { id: otp.id },
      data: { utilise: true },
    });

    const user = await this.prisma.user.findUnique({ where: { telephone } });
    if (!user) {
      const jetonInscription = await this.jwt.signAsync(
        { telephone, type: 'inscription' },
        {
          secret: this.config.getOrThrow('jwt.accessSecret'),
          expiresIn: '15m',
        },
      );
      return { inscriptionRequise: true as const, jetonInscription };
    }
    if (user.statut === 'SUSPENDU')
      throw new ForbiddenException(
        'Ce compte est suspendu. Contactez le support.',
      );
    return this.ouvrirSession(user.id, user.role, appareil);
  }

  /** Création du compte après vérification du numéro. */
  async inscrire(dto: InscriptionDto, appareil?: string) {
    let telephone: string;
    try {
      const charge = await this.jwt.verifyAsync<{
        telephone: string;
        type: string;
      }>(dto.jetonInscription, {
        secret: this.config.getOrThrow('jwt.accessSecret'),
      });
      if (charge.type !== 'inscription') throw new Error();
      telephone = charge.telephone;
    } catch {
      throw new UnauthorizedException(
        "Vérification du numéro expirée. Recommencez l'inscription.",
      );
    }
    if (await this.prisma.user.findUnique({ where: { telephone } }))
      throw new BadRequestException('Un compte existe déjà pour ce numéro.');
    if (dto.role === 'TECHNICIEN' && !dto.technicien)
      throw new BadRequestException('Le métier du technicien est requis.');
    if (
      dto.technicien &&
      !(await this.prisma.metier.findUnique({
        where: { id: dto.technicien.metierId },
      }))
    )
      throw new BadRequestException('Métier inconnu.');

    const user = await this.prisma.user.create({
      data: {
        telephone,
        nom: dto.nom.trim(),
        prenom: dto.prenom.trim(),
        email: dto.email?.toLowerCase(),
        role: dto.role,
        // Un technicien n'est visible qu'après vérification de niveau 1.
        statut: dto.role === 'TECHNICIEN' ? 'EN_ATTENTE' : 'ACTIF',
        zoneId: dto.zoneId,
        typeClient:
          dto.role === 'CLIENT' ? (dto.typeClient ?? 'PARTICULIER') : undefined,
        entreprise: dto.entreprise,
        technicien:
          dto.role === 'TECHNICIEN' && dto.technicien
            ? {
                create: {
                  metierId: dto.technicien.metierId,
                  specialites: dto.technicien.specialites ?? [],
                  experience: dto.technicien.experience ?? 0,
                  bio: dto.technicien.bio ?? '',
                  zones: {
                    connect: (
                      dto.technicien.zones ?? (dto.zoneId ? [dto.zoneId] : [])
                    ).map((id) => ({ id })),
                  },
                },
              }
            : undefined,
      },
    });
    return this.ouvrirSession(user.id, user.role, appareil);
  }

  /** Échange un jeton de rafraîchissement contre une nouvelle paire de jetons (rotation). */
  async rafraichir(jeton: string, appareil?: string) {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: sha256(jeton) },
      include: { user: true },
    });
    if (!session || session.revoqueLe || session.expireLe < new Date())
      throw new UnauthorizedException('Session expirée. Reconnectez-vous.');
    if (session.user.statut === 'SUSPENDU')
      throw new ForbiddenException('Ce compte est suspendu.');
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revoqueLe: new Date() },
    });
    return this.ouvrirSession(
      session.userId,
      session.user.role,
      appareil ?? session.appareil ?? undefined,
    );
  }

  async deconnecter(jeton: string) {
    await this.prisma.session.updateMany({
      where: { tokenHash: sha256(jeton), revoqueLe: null },
      data: { revoqueLe: new Date() },
    });
  }

  /** Ferme toutes les sessions sauf celle en cours (« déconnecter les autres appareils »). */
  async deconnecterAutres(userId: string, jetonActuel?: string) {
    await this.prisma.session.updateMany({
      where: {
        userId,
        revoqueLe: null,
        ...(jetonActuel && { NOT: { tokenHash: sha256(jetonActuel) } }),
      },
      data: { revoqueLe: new Date() },
    });
  }

  /** Connexion Google : le jeton est vérifié auprès de Google, puis rattaché à un compte existant. */
  async connexionGoogle(jeton: string, appareil?: string) {
    const profil = await this.verifierJetonGoogle(jeton);
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: profil.sub }, { email: profil.email }] },
    });
    if (!user)
      throw new NotFoundException(
        "Aucun compte GDC n'est associé à ce compte Google. Inscrivez-vous avec votre numéro de téléphone.",
      );
    if (user.statut === 'SUSPENDU')
      throw new ForbiddenException('Ce compte est suspendu.');
    if (!user.googleId)
      await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: profil.sub },
      });
    return this.ouvrirSession(user.id, user.role, appareil);
  }

  async lierGoogle(userId: string, jeton: string) {
    const profil = await this.verifierJetonGoogle(jeton);
    const deja = await this.prisma.user.findFirst({
      where: { googleId: profil.sub, NOT: { id: userId } },
    });
    if (deja)
      throw new BadRequestException(
        'Ce compte Google est déjà lié à un autre compte GDC.',
      );
    await this.prisma.user.update({
      where: { id: userId },
      data: { googleId: profil.sub, email: profil.email },
    });
  }

  private async verifierJetonGoogle(
    jeton: string,
  ): Promise<{ sub: string; email: string }> {
    const clientId = this.config.get<string>('googleClientId');
    if (!clientId)
      throw new BadRequestException(
        "La connexion Google n'est pas configurée sur ce serveur.",
      );
    const reponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(jeton)}`,
    );
    if (!reponse.ok) throw new UnauthorizedException('Jeton Google invalide.');
    const infos = (await reponse.json()) as {
      aud?: string;
      sub?: string;
      email?: string;
      email_verified?: string;
      iss?: string;
    };
    const emetteurValide =
      infos.iss === 'accounts.google.com' ||
      infos.iss === 'https://accounts.google.com';
    if (
      infos.aud !== clientId ||
      !emetteurValide ||
      infos.email_verified !== 'true' ||
      !infos.sub ||
      !infos.email
    ) {
      throw new UnauthorizedException('Jeton Google invalide.');
    }
    return { sub: infos.sub, email: infos.email.toLowerCase() };
  }

  private async ouvrirSession(userId: string, role: Role, appareil?: string) {
    const rafraichissement = jetonAleatoire();
    const ttlRafraichissement = duree(this.config.getOrThrow('jwt.refreshTtl'));
    await this.prisma.session.create({
      data: {
        userId,
        tokenHash: sha256(rafraichissement),
        appareil: appareil?.slice(0, 200),
        expireLe: new Date(Date.now() + ttlRafraichissement),
      },
    });
    const ttlAcces = this.config.getOrThrow<string>('jwt.accessTtl');
    const acces = await this.jwt.signAsync(
      { sub: userId, role, type: 'acces' },
      {
        secret: this.config.getOrThrow('jwt.accessSecret'),
        expiresIn: Math.round(duree(ttlAcces) / 1000),
      },
    );
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: INCLURE_UTILISATEUR,
    });
    return {
      inscriptionRequise: false as const,
      acces,
      rafraichissement,
      expireDansSecondes: Math.round(duree(ttlAcces) / 1000),
      utilisateur: presenterUtilisateur(user),
    };
  }
}
