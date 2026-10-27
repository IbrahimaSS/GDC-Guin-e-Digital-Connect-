# GDC – Backend

Branche du serveur de la plateforme GDC. Le frontend (branche `Frontend`) fonctionne aujourd'hui avec des
données fictives ; ce backend doit les remplacer. Les points à brancher sont marqués `TODO` dans le code du frontend.

## À construire

| Domaine | Rôle |
|---|---|
| Authentification | Connexion par numéro de téléphone + code SMS, connexion Google (vérification du jeton), sessions |
| Utilisateurs | Clients, techniciens, administrateurs ; profils, photos, portfolio |
| Vérification | Dépôt et contrôle des pièces (niveaux 1 à 3), stockage sécurisé des documents |
| Demandes et missions | Publication, acceptation, statuts, code de début d'intervention, suivi GPS |
| Devis et paiements | Devis, Orange Money / MTN MoMo, conservation du paiement, versement, commission |
| Messagerie | Conversations par mission en temps réel, photos |
| Notifications | SMS, WhatsApp Business, notifications de l'application, modèles et journal |
| Avis et modération | Avis liés aux missions, signalements, modération |
| Référentiels | Métiers, zones (avec coordonnées), paramètres et logo de la plateforme |

## Contrat avec le frontend

Les structures de données attendues sont décrites dans `src/lib/data.ts`, `src/lib/devis.ts`,
`src/lib/messages.ts` et `src/lib/notifier.ts` sur la branche `Frontend`.
