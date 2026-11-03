import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configurerApp } from '../src/main.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Messagerie en temps réel : authentification à la connexion, salon par demande, réception en direct.
describe('Messagerie en temps réel', () => {
  let app: INestApplication;
  let url: string;
  let demandeId: string;
  let jetonClient: string;
  let jetonTech: string;
  const sockets: Socket[] = [];

  const ouvrir = (token: string) => {
    const s = io(`${url}/messagerie`, {
      auth: { token },
      transports: ['websocket'],
      forceNew: true,
    });
    sockets.push(s);
    return s;
  };
  const connecte = (s: Socket) =>
    new Promise<void>(
      (ok, ko) => (s.on('connect', () => ok()), s.on('connect_error', ko)),
    );

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configurerApp(module.createNestApplication());
    await app.listen(0);
    url = await app.getUrl();

    const prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe(
      'TRUNCATE "EnvoiNotification", "Notification", "Signalement", "Avis", "Message", "Paiement", "LigneDevis", "Devis", "Demande", "Verification", "Realisation", "ProfilTechnicien", "Session", "CodeOtp", "User", "Zone", "Metier", "Parametre" CASCADE',
    );
    await prisma.metier.create({
      data: { id: 'electricite', label: 'Électricité', specialites: [] },
    });
    const zone = await prisma.zone.create({
      data: { nom: 'Kaloum', ville: 'Conakry' },
    });
    const client = await prisma.user.create({
      data: { telephone: '+224621000011', nom: 'Camara', prenom: 'Mohamed' },
    });
    const tech = await prisma.user.create({
      data: {
        telephone: '+224622000022',
        nom: 'Diallo',
        prenom: 'Mamadou',
        role: 'TECHNICIEN',
        technicien: { create: { metierId: 'electricite', niveau: 1 } },
      },
      include: { technicien: true },
    });
    const demande = await prisma.demande.create({
      data: {
        clientId: client.id,
        technicienId: tech.technicien!.id,
        metierId: 'electricite',
        zoneId: zone.id,
        titre: 'Prise qui chauffe',
        description: 'La prise du salon chauffe.',
        adresse: 'Almamya',
        statut: 'ACCEPTEE',
        codeIntervention: '1234',
      },
    });
    demandeId = demande.id;

    const jwt = app.get(JwtService);
    const secret = app
      .get(ConfigService)
      .getOrThrow<string>('jwt.accessSecret');
    jetonClient = await jwt.signAsync(
      { sub: client.id, role: 'CLIENT', type: 'acces' },
      { secret, expiresIn: 300 },
    );
    jetonTech = await jwt.signAsync(
      { sub: tech.id, role: 'TECHNICIEN', type: 'acces' },
      { secret, expiresIn: 300 },
    );
  });

  afterAll(async () => {
    sockets.forEach((s) => s.close());
    await app?.close();
  });

  it('refuse une connexion sans jeton valide', async () => {
    await expect(connecte(ouvrir('faux'))).rejects.toThrow(/Session expirée/);
  });

  it('le technicien reçoit en direct le message envoyé par le client', async () => {
    const s = ouvrir(jetonTech);
    await connecte(s);
    // « rejoindre » part aussitôt connecté : l'utilisateur doit déjà être authentifié.
    await expect(
      s.timeout(3000).emitWithAck('rejoindre', { demandeId }),
    ).resolves.toEqual({ ok: true });

    const recu = new Promise<{ texte: string }>((ok) => s.on('message', ok));
    await request(app.getHttpServer())
      .post(`/api/demandes/${demandeId}/messages`)
      .set('Authorization', `Bearer ${jetonClient}`)
      .send({ texte: 'Bonjour !' })
      .expect(201);
    await expect(recu).resolves.toMatchObject({ texte: 'Bonjour !' });
  });

  it('refuse le salon d’une demande à un utilisateur qui n’y participe pas', async () => {
    const prisma = app.get(PrismaService);
    const autre = await prisma.user.create({
      data: { telephone: '+224623000033', nom: 'Sow', prenom: 'Fatoumata' },
    });
    const jeton = await app
      .get(JwtService)
      .signAsync(
        { sub: autre.id, role: 'CLIENT', type: 'acces' },
        {
          secret: app.get(ConfigService).getOrThrow<string>('jwt.accessSecret'),
          expiresIn: 300,
        },
      );
    const s = ouvrir(jeton);
    await connecte(s);
    const exception = new Promise<{ message: string }>((ok) =>
      s.on('exception', ok),
    );
    s.emit('rejoindre', { demandeId });
    await expect(exception).resolves.toMatchObject({
      message: 'Demande introuvable.',
    });
  });
});
