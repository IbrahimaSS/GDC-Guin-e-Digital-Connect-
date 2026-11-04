import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configurerApp } from '../src/main.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { SmsService } from '../src/sms/sms.service.js';

// Mon compte : fichiers, adresses, préférences de notification, suppression du compte.
describe('Mon compte', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let client: { id: string; jeton: string };
  let autre: { id: string; jeton: string };
  let zoneId: string;
  const api = () => request(app.getHttpServer());
  const auth = (u: { jeton: string }) => ({
    Authorization: `Bearer ${u.jeton}`,
  });

  // Signatures minimales des formats acceptés.
  const PNG = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(32),
  ]);
  const PDF = Buffer.from('%PDF-1.4\n%test\n');

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
    const creer = async (telephone: string, prenom: string) => {
      const u = await prisma.user.create({
        data: { telephone, nom: 'Test', prenom },
      });
      return {
        id: u.id,
        jeton: await jwt.signAsync(
          { sub: u.id, role: 'CLIENT', type: 'acces' },
          { secret, expiresIn: 300 },
        ),
      };
    };
    client = await creer('+224621000101', 'Mohamed');
    autre = await creer('+224621000102', 'Fatoumata');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('enregistre une photo publique et refuse un faux fichier', async () => {
    const res = await api()
      .post('/api/fichiers?type=photo')
      .set(auth(client))
      .attach('fichier', PNG, 'photo.png')
      .expect(201);
    expect(res.body).toMatchObject({ type: 'PHOTO', mime: 'image/png' });
    expect(res.body.url).toMatch(/\/fichiers\/photos\/[0-9a-f]{32}\.png$/);
    // Lisible sans connexion.
    await api()
      .get(new URL(res.body.url).pathname)
      .expect(200)
      .expect('Content-Type', /image\/png/);

    // Un texte déguisé en image est refusé (la signature compte, pas le nom).
    await api()
      .post('/api/fichiers?type=photo')
      .set(auth(client))
      .attach('fichier', Buffer.from('<script>'), 'piege.png')
      .expect(400);
    // Une photo publique ne peut pas être un PDF.
    await api()
      .post('/api/fichiers?type=photo')
      .set(auth(client))
      .attach('fichier', PDF, 'doc.pdf')
      .expect(400);
    await api()
      .post('/api/fichiers?type=photo')
      .attach('fichier', PNG, 'photo.png')
      .expect(401);
  });

  it('protège les pièces justificatives', async () => {
    const res = await api()
      .post('/api/fichiers?type=piece')
      .set(auth(client))
      .attach('fichier', PDF, 'cni.pdf')
      .expect(201);
    const chemin = new URL(res.body.url).pathname;
    await api().get(chemin).expect(401);
    await api().get(chemin).set(auth(autre)).expect(403);
    await api()
      .get(chemin)
      .set(auth(client))
      .expect(200)
      .expect('Content-Type', /application\/pdf/);
  });

  it('gère les adresses enregistrées', async () => {
    const a = await api()
      .post('/api/moi/adresses')
      .set(auth(client))
      .send({ label: 'Domicile', texte: 'Almamya, rue KA-020', zoneId })
      .expect(201);
    expect(a.body.zone).toMatchObject({ nom: 'Kaloum' });
    const liste = await api()
      .get('/api/moi/adresses')
      .set(auth(client))
      .expect(200);
    expect(liste.body).toHaveLength(1);
    await api()
      .delete(`/api/moi/adresses/${a.body.id}`)
      .set(auth(autre))
      .expect(404);
    await api()
      .delete(`/api/moi/adresses/${a.body.id}`)
      .set(auth(client))
      .expect(204);
  });

  it('respecte les préférences de notification', async () => {
    const defaut = await api()
      .get('/api/moi/preferences')
      .set(auth(client))
      .expect(200);
    expect(defaut.body).toMatchObject({ sms: true, whatsapp: true });
    await api()
      .put('/api/moi/preferences')
      .set(auth(client))
      .send({ sms: false })
      .expect(200, {
        sms: false,
        whatsapp: true,
        email: false,
        actualites: false,
      });

    // « demande_publiee » part par SMS : désactivé, seul l'avis dans l'application est créé.
    const sms = app.get(SmsService);
    const avant = sms.historique.length;
    await api()
      .post('/api/demandes')
      .set(auth(client))
      .send({
        metierId: 'plomberie',
        titre: 'Fuite évier',
        description: 'Fuite sous l’évier de la cuisine.',
        zoneId,
        adresse: 'Almamya',
      })
      .expect(201);
    expect(sms.historique.length).toBe(avant);
    expect(
      await prisma.notification.count({ where: { userId: client.id } }),
    ).toBe(1);
  });

  it('supprime le compte : données personnelles effacées, numéro libéré', async () => {
    await api().delete('/api/moi').set(auth(client)).expect(204);
    const u = await prisma.user.findUniqueOrThrow({ where: { id: client.id } });
    expect(u).toMatchObject({
      prenom: 'Compte',
      email: null,
      photoUrl: null,
      statut: 'SUSPENDU',
    });
    expect(u.supprimeLe).toBeInstanceOf(Date);
    expect(
      await prisma.fichier.count({ where: { proprietaireId: client.id } }),
    ).toBe(0);
    // La demande encore ouverte est annulée.
    expect(
      await prisma.demande.count({
        where: { clientId: client.id, statut: 'ENVOYEE' },
      }),
    ).toBe(0);
    // Le numéro peut servir à une nouvelle inscription.
    await api()
      .post('/api/auth/otp/demander')
      .send({ telephone: '621 00 01 01', but: 'inscription' })
      .expect(200);
  });
});
