import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { UtilisateurConnecte } from '../common/auth.js';
import type { TypeFichier } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Formats acceptés, reconnus à leur signature (premiers octets) et non au type annoncé par le navigateur. */
const FORMATS = [
  {
    mime: 'image/jpeg',
    ext: 'jpg',
    estCeLui: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/png',
    ext: 'png',
    estCeLui: (b: Buffer) =>
      b
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    estCeLui: (b: Buffer) =>
      b.subarray(0, 4).toString('latin1') === 'RIFF' &&
      b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
  {
    mime: 'application/pdf',
    ext: 'pdf',
    estCeLui: (b: Buffer) => b.subarray(0, 5).toString('latin1') === '%PDF-',
  },
];

/** Taille maximale par type de fichier. */
export const TAILLE_MAX: Record<TypeFichier, number> = {
  PHOTO: 5 * 1024 * 1024,
  PIECE: 8 * 1024 * 1024,
};

const DOSSIER: Record<TypeFichier, string> = {
  PHOTO: 'photos',
  PIECE: 'pieces',
};

@Injectable()
export class FichiersService implements OnModuleInit {
  private readonly racine: string;
  private readonly urlPublique: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.racine = resolve(config.getOrThrow<string>('fichiers.dossier'));
    this.urlPublique = config.getOrThrow<string>('fichiers.urlPublique');
  }

  async onModuleInit() {
    await Promise.all(
      Object.values(DOSSIER).map((d) =>
        mkdir(join(this.racine, d), { recursive: true }),
      ),
    );
  }

  /** Dossier des photos, servi tel quel sur /fichiers/photos (lecture publique). */
  get dossierPhotos() {
    return join(this.racine, DOSSIER.PHOTO);
  }

  /** Adresse d'un fichier : publique pour une photo, protégée (connexion requise) pour une pièce. */
  url(type: TypeFichier, nom: string) {
    return type === 'PHOTO'
      ? `${this.urlPublique}/fichiers/photos/${nom}`
      : `${this.urlPublique}/api/fichiers/pieces/${nom}`;
  }

  async enregistrer(
    u: UtilisateurConnecte,
    type: TypeFichier,
    fichier?: { buffer: Buffer; size: number },
  ) {
    if (!fichier?.buffer?.length)
      throw new BadRequestException('Aucun fichier reçu.');
    if (fichier.size > TAILLE_MAX[type])
      throw new BadRequestException(
        `Fichier trop lourd (${TAILLE_MAX[type] / 1024 / 1024} Mo maximum).`,
      );
    const format = FORMATS.find((f) => f.estCeLui(fichier.buffer));
    // Une photo publique ne peut pas être un PDF.
    if (!format || (type === 'PHOTO' && format.mime === 'application/pdf')) {
      throw new BadRequestException(
        type === 'PHOTO'
          ? 'Format accepté : JPEG, PNG ou WebP.'
          : 'Formats acceptés : JPEG, PNG, WebP ou PDF.',
      );
    }
    const nom = `${randomBytes(16).toString('hex')}.${format.ext}`;
    await writeFile(join(this.racine, DOSSIER[type], nom), fichier.buffer, {
      flag: 'wx',
    });
    const f = await this.prisma.fichier.create({
      data: {
        nom,
        type,
        mime: format.mime,
        taille: fichier.size,
        proprietaireId: u.id,
      },
    });
    return { id: f.id, type, mime: f.mime, url: this.url(type, nom) };
  }

  /** Pièce justificative : seuls son propriétaire et l'équipe GDC peuvent la lire. */
  async piece(nom: string, u: UtilisateurConnecte) {
    const f = await this.prisma.fichier.findUnique({ where: { nom } });
    if (!f || f.type !== 'PIECE')
      throw new NotFoundException('Fichier introuvable.');
    if (f.proprietaireId !== u.id && u.role !== 'ADMIN')
      throw new ForbiddenException('Accès réservé.');
    return { chemin: join(this.racine, DOSSIER.PIECE, f.nom), mime: f.mime };
  }

  /** Supprime du disque les fichiers d'un utilisateur (suppression de compte). */
  async supprimerTout(userId: string) {
    const fichiers = await this.prisma.fichier.findMany({
      where: { proprietaireId: userId },
    });
    await Promise.all(
      fichiers.map((f) =>
        unlink(join(this.racine, DOSSIER[f.type], f.nom)).catch(
          () => undefined,
        ),
      ),
    );
    await this.prisma.fichier.deleteMany({ where: { proprietaireId: userId } });
  }
}
