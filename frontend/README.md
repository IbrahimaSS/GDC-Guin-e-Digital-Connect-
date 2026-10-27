# GDC – Guinée Digital Connect (frontend)

Interface web de la plateforme GDC, en Next.js 16 (App Router) + Tailwind CSS 4 + GSAP.

## Lancer le projet

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # version de production
```

## Organisation

| Dossier | Contenu |
|---|---|
| `src/app/(public)` | Site public : accueil, recherche, résultats, profil technicien, à propos |
| `src/app/(auth)` | Connexion (code SMS) et inscriptions client / technicien |
| `src/app/client` | Espace client (8 écrans) |
| `src/app/technicien` | Espace technicien (11 écrans) |
| `src/app/admin` | Back-office (11 écrans) |
| `src/components/motion` | Animations GSAP : transitions de page, `Reveal`, compteurs, graphiques, toasts |
| `src/components/ui` | Composants d'interface (boutons, badges, onglets, tiroir, modale…) |
| `src/lib/data.ts` | Données fictives, à remplacer par l'API |

## Animations

- `PageTransition` : fondu à chaque changement de page.
- `Reveal` : apparition en cascade des enfants au défilement (ScrollTrigger).
- `enter()` (dans `motion/gsap.ts`) : à utiliser à la place de `gsap.from()` pour les entrées,
  car Next garde les pages montées (Activity) et `gsap.from()` peut alors lire un état final erroné.
- Les animations sont désactivées si l'utilisateur a demandé à réduire les animations.
