import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Paramètres de la plateforme modifiables dans le back-office, avec leur valeur par défaut. */
export const PARAMETRES = {
  commission: 0.05,
  nomPlateforme: 'GDC – Guinée Digital Connect',
  logoUrl: null as string | null,
  telephoneSupport: '+224 620 00 00 00',
  emailSupport: 'support@gdc.gn',
  fraisDeplacementDefaut: 50000,
};

export type CleParametre = keyof typeof PARAMETRES;
/** Paramètres lisibles sans être connecté (en-tête du site, page contact…). */
const PUBLICS: CleParametre[] = [
  'nomPlateforme',
  'logoUrl',
  'telephoneSupport',
  'emailSupport',
];

@Injectable()
export class ParametresService {
  constructor(private readonly prisma: PrismaService) {}

  async get<K extends CleParametre>(cle: K): Promise<(typeof PARAMETRES)[K]> {
    const p = await this.prisma.parametre.findUnique({ where: { cle } });
    return (p?.valeur ?? PARAMETRES[cle]) as (typeof PARAMETRES)[K];
  }

  async tous(publics = false) {
    const enBase = await this.prisma.parametre.findMany();
    const valeurs = {
      ...PARAMETRES,
      ...Object.fromEntries(enBase.map((p) => [p.cle, p.valeur])),
    };
    return publics
      ? Object.fromEntries(PUBLICS.map((c) => [c, valeurs[c]]))
      : valeurs;
  }

  async modifier(valeurs: Partial<Record<string, unknown>>) {
    for (const [cle, valeur] of Object.entries(valeurs)) {
      if (!(cle in PARAMETRES))
        throw new BadRequestException(`Paramètre inconnu : ${cle}`);
      if (
        cle === 'commission' &&
        (typeof valeur !== 'number' || valeur < 0 || valeur > 0.3)
      )
        throw new BadRequestException(
          'La commission est comprise entre 0 et 0,30.',
        );
      const json = valeur as Prisma.InputJsonValue;
      await this.prisma.parametre.upsert({
        where: { cle },
        create: { cle, valeur: json },
        update: { valeur: json },
      });
    }
    return this.tous();
  }
}
