---
id: plan-my-job
name: PlanMyJob
description: Organiser sa recherche d'emploi — apprentissage des liens publics Supabase, snapshots JSON et export PDF/QR côté client.
technologies: [React, TypeScript, Vite, Supabase, jsPDF, qrcode, React Router]
newTechnologies: [jsPDF, qrcode]
githubUrl: https://github.com/OliviaG-dev/PlanMyJob
demoUrl: https://planmyjob.app
---

## Contexte

PlanMyJob est une app React/TypeScript pour suivre candidatures, tâches et progression. Les fonctionnalités récentes les plus techniques : **partage par lien public** (rapport candidature + bilan mensuel) avec snapshot figé, RLS Supabase, et **export PDF + QR code** entièrement côté navigateur.

## Nouvelles technologies — vue d'ensemble

| Techno | Déjà connue ? | Rôle dans le projet |
|--------|---------------|---------------------|
| React 19 / TypeScript / Vite | Oui | UI, build, tests Vitest |
| Supabase | Partiel | Auth + tables métier ; **nouveau** : pattern RPC lecture publique sans SELECT anon |
| jsPDF | Non | Génération PDF rapport candidature et bilan mensuel |
| qrcode | Non | QR code data-URL injecté dans la page et le PDF |

## Difficultés liées aux nouvelles technos

- PostgREST / cache API : migrations SQL OK mais RPC ou table absents en 404 tant que le schéma n'est pas rechargé.
- Snapshot JSON : distinguer données « live » vs figées ; regénérer un bilan mensuel = révoquer l'ancien token + nouveau snapshot.
- jsPDF : texte long (URLs) à couper manuellement ; emojis remplacés par pastilles CSS en dark mode sur les pages publiques.
- Dark mode : `--primary` trop clair en thème sombre pour boutons CTA blancs — couleurs d'action dédiées (#9e5a66).

## Leçons apprises

- Préférer **insert direct** + RLS pour la création de shares plutôt qu'une RPC fragile côté PostgREST.
- Exposer la lecture publique uniquement via **`get_public_*` RPC** (pas de SELECT anon sur la table).
- Factoriser `ConfirmModal`, `ShareQrCode`, `Pagination` — même UX dashboard / modal / pages publiques.
- Tester les stats mensuelles avec snapshots partiels (mois en cours) et semaines ISO chevauchant deux mois.

## Prochaines explorations

- Export PDF des lettres de motivation (déjà listé en « Prévu » README).
- Optionnel : edge function pour PDF serveur si les bilans deviennent très longs.
