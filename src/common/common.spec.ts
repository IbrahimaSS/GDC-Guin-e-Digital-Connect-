import { BadRequestException } from '@nestjs/common';
import { formaterMontant, totalDevis } from '../devis/devis.service.js';
import { codeNumerique, egalSecurise, sha256 } from './securite.js';
import { formaterTelephone, normaliserTelephone } from './telephone.js';

describe('téléphone', () => {
  it.each([
    '620 12 34 56',
    '620123456',
    '00224620123456',
    '+224 620 12 34 56',
    '224620123456',
  ])('normalise « %s »', (saisie) => {
    expect(normaliserTelephone(saisie)).toBe('+224620123456');
  });

  it.each(['520123456', '62012345', '+33 6 12 34 56 78', ''])(
    'refuse « %s »',
    (saisie) => {
      expect(() => normaliserTelephone(saisie)).toThrow(BadRequestException);
    },
  );

  it('formate pour l’affichage', () => {
    expect(formaterTelephone('+224620123456')).toBe('+224 620 12 34 56');
  });
});

describe('sécurité', () => {
  it('génère des codes de la bonne longueur, zéros compris', () => {
    for (let i = 0; i < 200; i++) expect(codeNumerique(4)).toMatch(/^\d{4}$/);
  });

  it('compare des empreintes', () => {
    expect(egalSecurise(sha256('1234'), sha256('1234'))).toBe(true);
    expect(egalSecurise(sha256('1234'), sha256('4321'))).toBe(false);
  });
});

describe('devis', () => {
  it('additionne les lignes et le déplacement', () => {
    expect(
      totalDevis({
        lignes: [
          { quantite: 6, prix: 75000 },
          { quantite: 4, prix: 60000 },
        ],
        deplacement: 50000,
      }),
    ).toBe(740000);
  });

  it('formate un montant en GNF', () => {
    expect(formaterMontant(1500000)).toBe('1 500 000 GNF');
  });
});
