# GDC – Backend

API de la plateforme GDC – Guinée Digital Connect. Elle relie les clients aux techniciens et artisans vérifiés.
Le frontend se trouve sur la branche `Frontend`.

**Technologies :** NestJS 12 (TypeScript, ESM), PostgreSQL, Prisma 7, Socket.IO, Swagger. Tests avec Vitest.

## Démarrer

```bash
npm install                 # installe et génère le client Prisma
cp .env.example .env        # puis remplacer les secrets JWT
npm run db                  # PostgreSQL embarqué sur le port 5433, à laisser ouvert
                            #   (ou : docker compose up -d)
npx prisma migrate deploy   # crée les tables
npm run seed                # données de démonstration de la maquette
npm run start:dev           # http://localhost:4000/api
```

- Documentation interactive : **http://localhost:4000/api/docs**
- En développement, les SMS ne partent pas. Ils s'affichent dans la console de l'API, avec les codes de connexion.

Comptes de démonstration créés par le seed. Pour se connecter, demander un code puis le lire dans la console.

| Rôle | Téléphone |
|---|---|
| Administrateur (Aïssatou Barry) | 629 00 11 22 |
| Client (Mohamed Camara) | 621 11 22 33 |
| Technicien (Mamadou Diallo) | 620 00 00 01 |

## Commandes

| Commande | Rôle |
|---|---|
| `npm run start:dev` | API avec rechargement automatique |
| `npm run build` puis `npm run start:prod` | Version de production |
| `npm run db:migrate` | Crée une migration après modification de `prisma/schema.prisma` |
| `npm run db:deploy` | Applique les migrations (serveur) |
| `npm test` | Tests unitaires |
| `npm run test:e2e` | Parcours complet sur la base `gdc_test`, créée automatiquement. La base doit être lancée. |
| `npm run lint` | Analyse du code (oxlint) |

## Modules

Toutes les routes sont préfixées par `/api`. Elles exigent un jeton (`Authorization: Bearer …`), sauf celles marquées publiques.

| Module | Routes principales |
|---|---|
| Authentification | `POST /auth/otp/demander`, `/auth/otp/verifier`, `/auth/inscription`, `/auth/rafraichir`, `/auth/deconnexion`, `/auth/google` |
| Mon compte | `GET/PATCH /moi`, `GET /moi/sessions` |
| Référentiels | `GET /metiers`, `GET /zones` (publics) ; CRUD dans `/admin/metiers` et `/admin/zones` |
| Techniciens | `GET /techniciens` (recherche publique : métier, zone, note, niveau, disponibilité, tri), `GET /techniciens/:id`, `/techniciens/moi` (profil, disponibilité, réalisations, statistiques) |
| Demandes et missions | `POST /demandes`, `GET /demandes`, `GET /demandes/disponibles`, puis `accepter`, `en-route`, `demarrer` (code ou QR), `terminer`, `desister`, `annuler` |
| Devis et paiement | `GET/PUT /demandes/:id/devis`, `devis/envoyer`, `devis/accepter`, `devis/refuser`, `POST /demandes/:id/paiement`, `paiement/confirmer` (espèces), `GET /paiements` |
| Messagerie | `GET /conversations`, `GET/POST /demandes/:id/messages`, `messages/lus`. Temps réel : Socket.IO, espace de noms `/messagerie` |
| Avis | `POST /demandes/:id/avis`, `GET /avis/recus`, `avis/:id/reponse`, `avis/:id/signaler` ; modération dans `/admin/avis` |
| Vérifications | `POST/GET /verifications` (technicien) ; `/admin/verifications` (prise en charge, décision) |
| Notifications | `GET /notifications`, `PATCH :id/lu`, `POST tout-lu` ; modèles SMS/WhatsApp et journal dans `/admin/notifications` |
| Back-office | `/admin/statistiques`, `/admin/utilisateurs` (suspension), `/admin/demandes`, `/admin/signalements`, `/admin/parametres` (commission, logo…) |

## Règles métier

- **Connexion :** un code à 6 chiffres est envoyé par SMS. Il est valable 5 minutes et accepte 5 essais au plus, avec 3 demandes par 10 minutes. Le serveur ne garde que son empreinte.
- **Sessions :** le jeton d'accès dure 15 minutes. Le jeton de rafraîchissement dure 30 jours et change à chaque utilisation.
- **Technicien :** il est invisible et ne peut pas accepter de mission tant que son identité n'est pas vérifiée (niveau 1). Les niveaux se valident dans l'ordre : identité, compétence, recommandé.
- **Accès à une demande :** le numéro du client n'est communiqué qu'au technicien retenu. Si deux techniciens acceptent en même temps, un seul l'obtient.
- **Code d'intervention (4 chiffres ou QR) :** seul le client le voit. Le technicien le saisit à son arrivée pour démarrer. C'est la preuve de passage, et elle conditionne l'avis.
- **Paiement :** il est conservé par GDC, puis reversé au technicien à la fin de la mission, commission déduite. La commission est de 5 % par défaut et se règle dans les paramètres.
- **Notifications :** chaque événement crée une notification dans l'application et part par SMS et/ou WhatsApp, selon le modèle modifiable dans le back-office. Un échec d'envoi est consigné dans le journal et ne bloque jamais l'action.

## Reste à brancher

Ces points sont marqués `TODO` dans le code.

- **SMS et WhatsApp :** pilotes réels (agrégateur SMS local, WhatsApp Business Cloud API). Fichier : `src/sms/sms.service.ts`.
- **Orange Money et MTN MoMo :** API marchandes, webhook de confirmation et virement au technicien. Fichiers : `src/paiements/paiements.service.ts` et `src/demandes/demandes.service.ts`.
- **Fichiers :** stockage des photos et des pièces justificatives. Les routes reçoivent aujourd'hui des URL.
- **Connexion Google :** renseigner `GOOGLE_CLIENT_ID` dans `.env`.
