import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';

export const sha256 = (valeur: string) =>
  createHash('sha256').update(valeur).digest('hex');

/** Comparaison à temps constant de deux empreintes hexadécimales. */
export function egalSecurise(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Code numérique aléatoire (cryptographiquement sûr) de `longueur` chiffres. */
export const codeNumerique = (longueur: number) =>
  String(randomInt(0, 10 ** longueur)).padStart(longueur, '0');

export const jetonAleatoire = () => randomBytes(48).toString('base64url');
