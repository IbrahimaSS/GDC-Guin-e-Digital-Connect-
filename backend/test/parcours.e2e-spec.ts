import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configurerApp } from '../src/main.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { SmsService } from '../src/sms/sms.service.js';

// Parcours complet d'une mission : inscription, vérification, demande, devis, paiement, messagerie, avis.
describe('Parcours d’une mission', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let sms: SmsService;
  let zoneId: string;
  const api = () => request(app.getHttpServer());

  const CLIENT = '621 00 00 01';
  const TECHNICIEN = '622 00 00 02';
  const ADMIN = '623 00 00 03';

  /** Demande un code, le lit dans l'historique SMS et le vérifie. */
  async function verifierNumero(telephone: string) {
    await api().post('/api/auth/otp/demander').send({ telephone }).expect(200);
    const code = /code de connexion est (\d{6})/.exec(
      sms.historique[0].texte,
    )![1];
    const res = await api()
      .post('/api/auth/otp/verifier')
      .send({ telephone, code })
      .expect(200);
    return res.body;
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configurerApp(module.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
    sms = app.get(SmsService);

    await prisma.$executeRawUnsafe(
      'TRUNCATE "EnvoiNotification", "Notification", "Signalement", "Avis", "Message", "Paiement", "LigneDevis", "Devis", "Demande", "Verification", "Realisation", "ProfilTechnicien", "Session", "CodeOtp", "User", "Zone", "Metier", "Parametre" CASCADE',
    );
    await prisma.metier.create({
      data: { id: 'plomberie', label: 'Plomberie', specialites: ['Fuites'] },
    });
    zoneId = (
      await prisma.zone.create({
        data: { nom: 'Kaloum', ville: 'Conakry', lat: 9.5092, lng: -13.7122 },
      })
    ).id;
    await prisma.user.create({
      data: {
        telephone: '+224623000003',
        nom: 'Barry',
        prenom: 'Aïssatou',
        role: 'ADMIN',
      },
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  let client: { acces: string; rafraichissement: string };
  let technicien: { acces: string };
  let admin: { acces: string };
  let demandeId: string;
  const bearer = (s: { acces: string }) => ({
    Authorization: `Bearer ${s.acces}`,
  });

  it('refuse un code incorrect puis inscrit un nouveau client', async () => {
    await api()
      .post('/api/auth/otp/demander')
      .send({ telephone: CLIENT })
      .expect(200);
    await api()
      .post('/api/auth/otp/verifier')
      .send({ telephone: CLIENT, code: '000000' })
      .expect(401);

    const etape = await verifierNumero(CLIENT);
    expect(etape.inscriptionRequise).toBe(true);
    const res = await api()
      .post('/api/auth/inscription')
      .send({
        jetonInscription: etape.jetonInscription,
        nom: 'Camara',
        prenom: 'Mohamed',
        role: 'CLIENT',
        zoneId,
      })
      .expect(201);
    expect(res.body.utilisateur).toMatchObject({
      nomComplet: 'Mohamed Camara',
      role: 'CLIENT',
      telephone: '+224 621 00 00 01',
    });
    client = res.body;
  });

  it('protège les routes et fait tourner le jeton de rafraîchissement', async () => {
    await api().get('/api/moi').expect(401);
    await api().get('/api/admin/statistiques').set(bearer(client)).expect(403);

    const res = await api()
      .post('/api/auth/rafraichir')
      .send({ rafraichissement: client.rafraichissement })
      .expect(200);
    await api()
      .post('/api/auth/rafraichir')
      .send({ rafraichissement: client.rafraichissement })
      .expect(401);
    client = res.body;
    await api().get('/api/moi').set(bearer(client)).expect(200);
  });

  it('inscrit un technicien, invisible tant que son identité n’est pas vérifiée', async () => {
    const etape = await verifierNumero(TECHNICIEN);
    const res = await api()
      .post('/api/auth/inscription')
      .send({
        jetonInscription: etape.jetonInscription,
        nom: 'Condé',
        prenom: 'Alpha',
        role: 'TECHNICIEN',
        zoneId,
        technicien: { metierId: 'plomberie', experience: 7, zones: [zoneId] },
      })
      .expect(201);
    technicien = res.body;
    expect(res.body.utilisateur.statut).toBe('EN_ATTENTE');
    const recherche = await api()
      .get('/api/techniciens?metier=plomberie')
      .expect(200);
    expect(recherche.body.total).toBe(0);
  });

  it('l’admin valide la vérification d’identité', async () => {
    const v = await api()
      .post('/api/verifications')
      .set(bearer(technicien))
      .send({
        niveau: 1,
        pieces: [{ type: 'piece_identite', url: 'https://exemple.gn/cni.jpg' }],
      })
      .expect(201);

    admin = await verifierNumero(ADMIN);
    const liste = await api()
      .get('/api/admin/verifications?statut=EN_ATTENTE')
      .set(bearer(admin))
      .expect(200);
    expect(liste.body).toHaveLength(1);
    await api()
      .post(`/api/admin/verifications/${v.body.id}/decision`)
      .set(bearer(admin))
      .send({ decision: 'APPROUVEE' })
      .expect(200);

    const recherche = await api()
      .get('/api/techniciens?metier=plomberie&disponible=true')
      .expect(200);
    expect(recherche.body.resultats[0]).toMatchObject({
      nom: 'Alpha Condé',
      niveau: 1,
    });
  });

  it('le client publie une demande, le technicien l’accepte et démarre avec le code', async () => {
    const d = await api()
      .post('/api/demandes')
      .set(bearer(client))
      .send({
        metierId: 'plomberie',
        titre: 'Fuite sous l’évier',
        description: 'Fuite importante sous l’évier de la cuisine.',
        zoneId,
        adresse: 'Almamya, rue KA-020',
        urgente: true,
      })
      .expect(201);
    demandeId = d.body.id;

    const dispo = await api()
      .get('/api/demandes/disponibles')
      .set(bearer(technicien))
      .expect(200);
    expect(dispo.body.map((x: { id: string }) => x.id)).toContain(demandeId);
    // Le numéro du client reste masqué avant acceptation.
    expect(dispo.body[0].client.telephone).toBeUndefined();

    await api()
      .post(`/api/demandes/${demandeId}/accepter`)
      .set(bearer(technicien))
      .expect(200);
    const vueClient = await api()
      .get(`/api/demandes/${demandeId}`)
      .set(bearer(client))
      .expect(200);
    const vueTech = await api()
      .get(`/api/demandes/${demandeId}`)
      .set(bearer(technicien))
      .expect(200);
    expect(vueClient.body.codeIntervention).toMatch(/^\d{4}$/);
    expect(vueTech.body.codeIntervention).toBeUndefined();

    const faux = vueClient.body.codeIntervention === '0000' ? '1111' : '0000';
    await api()
      .post(`/api/demandes/${demandeId}/demarrer`)
      .set(bearer(technicien))
      .send({ code: faux })
      .expect(400);
    await api()
      .post(`/api/demandes/${demandeId}/demarrer`)
      .set(bearer(technicien))
      .send({ code: vueClient.body.qrIntervention })
      .expect(200);
  });

  it('devis, acceptation et paiement Orange Money avec commission', async () => {
    await api()
      .put(`/api/demandes/${demandeId}/devis`)
      .set(bearer(technicien))
      .send({
        lignes: [
          { libelle: 'Remplacement du siphon', quantite: 1, prix: 150000 },
        ],
        deplacement: 50000,
      })
      .expect(200);
    // Brouillon invisible pour le client
    const avant = await api()
      .get(`/api/demandes/${demandeId}/devis`)
      .set(bearer(client))
      .expect(200);
    expect(avant.body).toEqual({});

    await api()
      .post(`/api/demandes/${demandeId}/devis/envoyer`)
      .set(bearer(technicien))
      .expect(200);
    const devis = await api()
      .post(`/api/demandes/${demandeId}/devis/accepter`)
      .set(bearer(client))
      .expect(200);
    expect(devis.body).toMatchObject({
      statut: 'ACCEPTE',
      total: 200000,
      commission: 10000,
    });

    const p = await api()
      .post(`/api/demandes/${demandeId}/paiement`)
      .set(bearer(client))
      .send({ moyen: 'ORANGE', numero: '621 00 00 01' })
      .expect(201);
    expect(p.body).toMatchObject({
      statut: 'CONFIRME',
      montant: 200000,
      commission: 10000,
    });
    expect(p.body.reference).toMatch(/^OM-/);
  });

  it('messagerie entre le client et le technicien', async () => {
    await api()
      .post(`/api/demandes/${demandeId}/messages`)
      .set(bearer(client))
      .send({ texte: 'Je suis à la maison.' })
      .expect(201);
    const conv = await api()
      .get('/api/conversations')
      .set(bearer(technicien))
      .expect(200);
    expect(conv.body[0]).toMatchObject({
      demandeId,
      nonLus: 1,
      interlocuteur: { nom: 'Mohamed Camara' },
    });
    await api()
      .post(`/api/demandes/${demandeId}/messages/lus`)
      .set(bearer(technicien))
      .expect(200, { lus: 1 });
  });

  it('fin de mission, reversement et avis vérifié', async () => {
    await api()
      .post(`/api/demandes/${demandeId}/terminer`)
      .set(bearer(technicien))
      .expect(200);
    const paiement = await prisma.paiement.findFirstOrThrow({
      where: { devis: { demandeId } },
    });
    expect(paiement.statut).toBe('REVERSE');

    await api()
      .post(`/api/demandes/${demandeId}/avis`)
      .set(bearer(client))
      .send({ note: 5, commentaire: 'Rapide et propre.' })
      .expect(201);
    await api()
      .post(`/api/demandes/${demandeId}/avis`)
      .set(bearer(client))
      .send({ note: 1 })
      .expect(409);

    const t = await api().get('/api/techniciens?metier=plomberie').expect(200);
    const profil = await api()
      .get(`/api/techniciens/${t.body.resultats[0].id}`)
      .expect(200);
    expect(profil.body).toMatchObject({ note: 5, nbAvis: 1, missions: 1 });
    expect(profil.body.avis[0]).toMatchObject({
      auteur: 'Mohamed Camara',
      mission: 'Fuite sous l’évier',
    });
  });

  it('notifications et journal des SMS', async () => {
    const notifs = await api()
      .get('/api/notifications')
      .set(bearer(client))
      .expect(200);
    expect(notifs.body.map((n: { titre: string }) => n.titre)).toEqual(
      expect.arrayContaining([
        'Demande acceptée',
        'Nouveau devis',
        'Mission terminée',
      ]),
    );
    const journal = await api()
      .get('/api/admin/notifications/journal')
      .set(bearer(admin))
      .expect(200);
    expect(journal.body.length).toBeGreaterThan(0);
  });

  it('l’admin suspend un compte : ses sessions sont fermées', async () => {
    const moi = await api().get('/api/moi').set(bearer(client)).expect(200);
    await api()
      .patch(`/api/admin/utilisateurs/${moi.body.id}/statut`)
      .set(bearer(admin))
      .send({ statut: 'SUSPENDU' })
      .expect(200);
    await api()
      .post('/api/auth/rafraichir')
      .send({ rafraichissement: client.rafraichissement })
      .expect(401);
    const stats = await api()
      .get('/api/admin/statistiques')
      .set(bearer(admin))
      .expect(200);
    expect(stats.body).toMatchObject({
      utilisateurs: { clients: 1, techniciens: 1, suspendus: 1 },
      paiements: { volume: 200000, commissions: 10000 },
    });
  });
});
