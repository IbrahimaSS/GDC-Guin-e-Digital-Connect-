import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configurerApp } from '../src/main.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Espace technicien : calendrier, tarifs, réalisations, visibilité dans la recherche.
describe('Profil du technicien', () => {
  let app: INestApplication;
  let jeton: string;
  let technicienId: string;
  const api = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${jeton}` });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configurerApp(module.createNestApplication());
    await app.init();
    const prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe(
      'TRUNCATE "EnvoiNotification", "Notification", "Signalement", "Avis", "Message", "Paiement", "LigneDevis", "Devis", "Demande", "Verification", "Realisation", "ProfilTechnicien", "Session", "CodeOtp", "Adresse", "Fichier", "User", "Zone", "Metier", "Parametre" CASCADE',
    );
    await prisma.metier.create({
      data: { id: 'electricite', label: 'Électricité', specialites: [] },
    });
    const u = await prisma.user.create({
      data: {
        telephone: '+224620000201',
        nom: 'Diallo',
        prenom: 'Mamadou',
        role: 'TECHNICIEN',
        technicien: { create: { metierId: 'electricite', niveau: 1 } },
      },
      include: { technicien: true },
    });
    technicienId = u.technicien!.id;
    jeton = await app
      .get(JwtService)
      .signAsync(
        { sub: u.id, role: 'TECHNICIEN', type: 'acces' },
        {
          secret: app.get(ConfigService).getOrThrow<string>('jwt.accessSecret'),
          expiresIn: 300,
        },
      );
  });

  afterAll(async () => {
    await app?.close();
  });

  it('enregistre le calendrier et les tarifs, et refuse un format invalide', async () => {
    const agenda = {
      planning: [{ jour: 'Lundi', actif: true, debut: '08:00', fin: '18:00' }],
      conges: [{ du: '2026-12-24', au: '2026-12-26', motif: 'Fêtes' }],
      urgences: true,
      delai: '2h',
    };
    const tarifs = [{ prestation: 'Déplacement + diagnostic', prix: 50000 }];
    const res = await api()
      .patch('/api/techniciens/moi')
      .set(auth())
      .send({ agenda, tarifs, disponibilites: 'Lundi (8h – 18h)' })
      .expect(200);
    expect(res.body).toMatchObject({
      agenda,
      tarifs,
      disponibilites: 'Lundi (8h – 18h)',
    });

    await api()
      .patch('/api/techniciens/moi')
      .set(auth())
      .send({
        agenda: {
          ...agenda,
          planning: [
            { jour: 'Lundi', actif: true, debut: '25:00', fin: '18:00' },
          ],
        },
      })
      .expect(400);

    const profil = await api()
      .get(`/api/techniciens/${technicienId}`)
      .expect(200);
    expect(profil.body.tarifs).toEqual(tarifs);
  });

  it('modifie une réalisation', async () => {
    const r = await api()
      .post('/api/techniciens/moi/realisations')
      .set(auth())
      .send({
        titre: 'Tableau',
        categorie: 'Installation',
        imageUrl: 'http://localhost:4000/fichiers/photos/a.png',
      })
      .expect(201);
    const maj = await api()
      .patch(`/api/techniciens/moi/realisations/${r.body.id}`)
      .set(auth())
      .send({ titre: 'Tableau électrique villa' })
      .expect(200);
    expect(maj.body).toMatchObject({
      titre: 'Tableau électrique villa',
      categorie: 'Installation',
    });
  });

  it('disparaît de la recherche quand il se rend invisible', async () => {
    let recherche = await api()
      .get('/api/techniciens?metier=electricite')
      .expect(200);
    expect(recherche.body.total).toBe(1);
    await api()
      .put('/api/moi/preferences')
      .set(auth())
      .send({ visible: false })
      .expect(200);
    recherche = await api()
      .get('/api/techniciens?metier=electricite')
      .expect(200);
    expect(recherche.body.total).toBe(0);
  });
});
