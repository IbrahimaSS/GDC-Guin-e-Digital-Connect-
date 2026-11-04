import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configurerApp } from '../src/main.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { SmsService } from '../src/sms/sms.service.js';

// Back-office : comptes, paramètres appliqués, modération, signalements, statistiques.
describe('Back-office', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: string;
  let client: string;
  let zoneId: string;
  const api = () => request(app.getHttpServer());
  const auth = (j: string) => ({ Authorization: `Bearer ${j}` });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configurerApp(module.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe(
      'TRUNCATE "EnvoiNotification", "Notification", "Signalement", "Avis", "Message", "Paiement", "LigneDevis", "Devis", "Demande", "Verification", "Realisation", "ProfilTechnicien", "Session", "CodeOtp", "Adresse", "Fichier", "User", "Zone", "Metier", "Parametre" CASCADE',
    );
    await prisma.metier.create({
      data: { id: 'plomberie', label: 'Plomberie', specialites: [] },
    });
    zoneId = (
      await prisma.zone.create({ data: { nom: 'Kaloum', ville: 'Conakry' } })
    ).id;
    const jwt = app.get(JwtService);
    const secret = app
      .get(ConfigService)
      .getOrThrow<string>('jwt.accessSecret');
    const signer = (id: string, role: string) =>
      jwt.signAsync(
        { sub: id, role, type: 'acces' },
        { secret, expiresIn: 300 },
      );
    const a = await prisma.user.create({
      data: {
        telephone: '+224629000301',
        nom: 'Barry',
        prenom: 'Aïssatou',
        role: 'ADMIN',
      },
    });
    const c = await prisma.user.create({
      data: { telephone: '+224621000302', nom: 'Camara', prenom: 'Mohamed' },
    });
    admin = await signer(a.id, 'ADMIN');
    client = await signer(c.id, 'CLIENT');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('crée un compte et prévient la personne par SMS', async () => {
    const sms = app.get(SmsService);
    const res = await api()
      .post('/api/admin/utilisateurs')
      .set(auth(admin))
      .send({
        nom: 'Condé',
        prenom: 'Alpha',
        telephone: '622 00 03 03',
        role: 'TECHNICIEN',
        metierId: 'plomberie',
        zoneId,
      })
      .expect(201);
    expect(res.body).toMatchObject({
      role: 'TECHNICIEN',
      statut: 'EN_ATTENTE',
      nbDemandes: 0,
      nbSignalements: 0,
    });
    expect(sms.historique[0]).toMatchObject({ numero: '+224622000303' });
    await api()
      .post('/api/admin/utilisateurs')
      .set(auth(admin))
      .send({
        nom: 'X',
        prenom: 'Y',
        telephone: '622 00 03 03',
        role: 'CLIENT',
      })
      .expect(409);
    await api()
      .post('/api/admin/utilisateurs')
      .set(auth(client))
      .send({ nom: 'X', prenom: 'Y', telephone: '622 00 03 04', role: 'ADMIN' })
      .expect(403);
  });

  it('valide chaque paramètre et applique les moyens de paiement', async () => {
    const erreur = await api()
      .put('/api/admin/parametres')
      .set(auth(admin))
      .send({ commission: 2, delaiAvisJours: 'beaucoup' })
      .expect(400);
    expect(erreur.body.message).toHaveLength(2);
    await api()
      .put('/api/admin/parametres')
      .set(auth(admin))
      .send({ moyensPaiement: { especes: false }, logoUrl: null })
      .expect(200);
    const publics = await api().get('/api/parametres').expect(200);
    expect(publics.body.moyensPaiement).toEqual({
      orange: true,
      mtn: true,
      especes: false,
    });
    expect(publics.body).not.toHaveProperty('commission');
  });

  it('ferme les inscriptions quand le paramètre est désactivé', async () => {
    await api()
      .put('/api/admin/parametres')
      .set(auth(admin))
      .send({ inscriptionsOuvertes: false })
      .expect(200);
    const jeton = await app
      .get(JwtService)
      .signAsync(
        { telephone: '+224655000305', type: 'inscription' },
        {
          secret: app.get(ConfigService).getOrThrow<string>('jwt.accessSecret'),
          expiresIn: 300,
        },
      );
    await api()
      .post('/api/auth/inscription')
      .send({
        jetonInscription: jeton,
        nom: 'Sow',
        prenom: 'Awa',
        role: 'CLIENT',
      })
      .expect(403);
    await api()
      .put('/api/admin/parametres')
      .set(auth(admin))
      .send({ inscriptionsOuvertes: true })
      .expect(200);
  });

  it('date la prise en charge et la résolution des signalements', async () => {
    const s = await api()
      .post('/api/signalements')
      .set(auth(client))
      .send({ type: 'autre', cible: 'x', motif: 'Comportement inapproprié.' })
      .expect(201);
    const pris = await api()
      .patch(`/api/admin/signalements/${s.body.id}`)
      .set(auth(admin))
      .send({ statut: 'EN_COURS' })
      .expect(200);
    expect(pris.body.priseEnChargeLe).toBeTruthy();
    const resolu = await api()
      .patch(`/api/admin/signalements/${s.body.id}`)
      .set(auth(admin))
      .send({ statut: 'RESOLU' })
      .expect(200);
    expect(resolu.body.resoluLe).toBeTruthy();
    const stats = await api()
      .get('/api/admin/statistiques')
      .set(auth(admin))
      .expect(200);
    expect(stats.body.signalements.resolusCeMois).toBe(1);
    expect(stats.body.series.mois).toHaveLength(12);
    expect(stats.body.utilisateurs).toMatchObject({
      admins: 1,
      clients: 1,
      techniciens: 1,
    });
  });

  it('compte les techniciens et les demandes des zones', async () => {
    const zones = await api()
      .get('/api/admin/zones')
      .set(auth(admin))
      .expect(200);
    expect(zones.body[0]).toMatchObject({
      nom: 'Kaloum',
      nbDemandes: 0,
      nbTechniciens: 0,
    });
    const metiers = await api()
      .get('/api/admin/metiers')
      .set(auth(admin))
      .expect(200);
    expect(metiers.body[0]).toHaveProperty('nbDemandes', 0);
  });
});
