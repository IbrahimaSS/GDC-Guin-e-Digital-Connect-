import { BadRequestException } from '@nestjs/common';

/**
 * Numéro mobile guinéen au format international (+2246XXXXXXXX).
 * Accepte « 620 12 34 56 », « 620123456 », « 00224620123456 » ou « +224 620 12 34 56 ».
 */
export function normaliserTelephone(saisie: string): string {
  let chiffres = saisie.replace(/\D/g, '');
  if (chiffres.startsWith('00224')) chiffres = chiffres.slice(5);
  else if (chiffres.startsWith('224') && chiffres.length === 12)
    chiffres = chiffres.slice(3);
  if (!/^6\d{8}$/.test(chiffres))
    throw new BadRequestException(
      'Numéro mobile guinéen invalide (9 chiffres commençant par 6).',
    );
  return `+224${chiffres}`;
}

/** Affichage lisible : +224 620 12 34 56 */
export const formaterTelephone = (t: string) =>
  t.replace(/^\+224(\d{3})(\d{2})(\d{2})(\d{2})$/, '+224 $1 $2 $3 $4');
