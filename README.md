# GDC – Guinée Digital Connect

Plateforme de mise en relation entre clients et techniciens / artisans vérifiés en Guinée.
Projet né lors du Hackathon Future Champions 2026.

## Organisation du dépôt

| Dossier | Contenu |
|---|---|
| [`frontend/`](frontend) | Application web (Next.js 16, Tailwind CSS 4, GSAP) : site public, espaces client et technicien, back-office |
| [`backend/`](backend) | API (NestJS, PostgreSQL, Prisma, Socket.IO) : comptes, demandes, devis, paiements, messagerie, notifications |

## Branches

| Branche | Rôle |
|---|---|
| `main` | Version de référence : le frontend et le backend y sont fusionnés une fois validés. |
| `Frontend` | Travail sur le dossier `frontend/`. |
| `Backend` | Travail sur le dossier `backend/`. |

Chaque branche ne modifie que son dossier : les fusions dans `main` se font sans conflit.

## Démarrer

**Backend** (http://localhost:4000/api, documentation : http://localhost:4000/api/docs)

```bash
cd backend
npm install
cp .env.example .env
npm run db                  # base PostgreSQL de développement (à laisser ouverte)
npx prisma migrate deploy
npm run seed                # données de démonstration
npm run start:dev
```

**Frontend** (http://localhost:3000)

```bash
cd frontend
npm install
npm run dev
```

Le détail de chaque partie se trouve dans `frontend/README.md` et `backend/README.md`.
