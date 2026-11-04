// Mise en service d'une base vide (production) : `npm run init` après `prisma migrate deploy`.
// Crée les métiers et les zones de départ, et le compte administrateur. Sans danger si on le relance :
// rien d'existant n'est modifié ni supprimé (contrairement au seed de démonstration).
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

interface Depart {
  metiers: {
    id: string;
    label: string;
    actif: boolean;
    specialites: string[];
  }[];
  zones: {
    nom: string;
    ville: string;
    actif: boolean;
    lat: number;
    lng: number;
  }[];
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const { metiers, zones } = JSON.parse(
    readFileSync(join(process.cwd(), 'prisma', 'seed-data.json'), 'utf8'),
  ) as Depart;

  let crees = 0;
  for (const m of metiers) {
    const existe = await prisma.metier.findFirst({
      where: { OR: [{ id: m.id }, { label: m.label }] },
    });
    if (!existe) {
      await prisma.metier.create({ data: m });
      crees++;
    }
  }
  for (const z of zones) {
    if (!(await prisma.zone.findUnique({ where: { nom: z.nom } }))) {
      await prisma.zone.create({ data: z });
      crees++;
    }
  }
  console.log(`Métiers et zones : ${crees} ajouté(s).`);

  // Administrateur : numéro au format international (+224…), connexion par code SMS comme les autres.
  const tel = process.env.ADMIN_TELEPHONE?.replace(/\s/g, '');
  if (!tel) {
    console.log('ADMIN_TELEPHONE absent : aucun administrateur créé.');
    return;
  }
  if (!/^\+224\d{9}$/.test(tel))
    throw new Error('ADMIN_TELEPHONE doit être au format +224XXXXXXXXX.');
  const admin = await prisma.user.findUnique({ where: { telephone: tel } });
  if (admin) {
    if (admin.role !== 'ADMIN')
      await prisma.user.update({
        where: { id: admin.id },
        data: { role: 'ADMIN', statut: 'ACTIF' },
      });
    console.log(`Administrateur ${tel} : déjà présent.`);
    return;
  }
  await prisma.user.create({
    data: {
      telephone: tel,
      prenom: process.env.ADMIN_PRENOM ?? 'Administrateur',
      nom: process.env.ADMIN_NOM ?? 'GDC',
      role: 'ADMIN',
      statut: 'ACTIF',
    },
  });
  console.log(`Administrateur ${tel} : créé.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
