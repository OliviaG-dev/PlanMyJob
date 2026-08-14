---
id: plan-my-job
name: PlanMyJob
description: Organiser sa recherche d'emploi — liens publics Supabase, snapshots, PDF/QR, analyse d'offres LinkedIn et stratégie de tests Vitest (intégration + E2E jsdom).
technologies: [React, TypeScript, Vite, Vitest, Supabase, jsPDF, qrcode, React Router]
newTechnologies: [jsPDF, qrcode]
githubUrl: https://github.com/OliviaG-dev/PlanMyJob
demoUrl: https://planmyjob.app
---

## Contexte

PlanMyJob est une app React/TypeScript pour suivre candidatures, tâches et progression. Les sujets techniques récents : **partage par lien public** (snapshot figé, RLS Supabase, PDF/QR), **analyse d'offres LinkedIn** (`offerAnalyzer.ts`) et **stratégie de tests** (200 tests Vitest — intégration import d'offre + E2E jsdom jusqu'au Kanban). Détail tests : [`04-tech-strategie-tests.md`](04-tech-strategie-tests.md). **Bilan portfolio** (niveau, notes, plan d'action) : [`05-bilan-portfolio-recruteur.md`](05-bilan-portfolio-recruteur.md).

## Nouvelles technologies — vue d'ensemble

| Techno | Déjà connue ? | Rôle dans le projet |
|--------|---------------|---------------------|
| React 19 / TypeScript / Vite | Oui | UI, build, tests Vitest |
| Supabase | Partiel | Auth + tables métier ; **nouveau** : pattern RPC lecture publique sans SELECT anon |
| jsPDF | Non | Génération PDF rapport candidature et bilan mensuel |
| qrcode | Non | QR code data-URL injecté dans la page et le PDF |
| Vitest (stratégie tests) | Partiel | Unit + intégration + E2E jsdom ; Playwright reporté volontairement |

## Difficultés liées aux nouvelles technos

- PostgREST / cache API : migrations SQL OK mais RPC ou table absents en 404 tant que le schéma n'est pas rechargé.
- Snapshot JSON : distinguer données « live » vs figées ; regénérer un bilan mensuel = révoquer l'ancien token + nouveau snapshot.
- jsPDF : texte long (URLs) à couper manuellement ; emojis remplacés par pastilles CSS en dark mode sur les pages publiques.
- Dark mode : `--primary` trop clair en thème sombre pour boutons CTA blancs — couleurs d'action dédiées (#9e5a66).
- **Import d'offre :** parsing LinkedIn bruyant (logo, badges Hybride/Temps plein) ; default statut divergent entre modal manuel et `extractedToFormData`.
- **Tests E2E jsdom :** sidebar masquée, auto-move Kanban 15 jours, libellés de colonnes avec compteur.

## Leçons apprises

- Préférer **insert direct** + RLS pour la création de shares plutôt qu'une RPC fragile côté PostgREST.
- Exposer la lecture publique uniquement via **`get_public_*` RPC** (pas de SELECT anon sur la table).
- Factoriser `ConfirmModal`, `ShareQrCode`, `Pagination` — même UX dashboard / modal / pages publiques.
- Tester les stats mensuelles avec snapshots partiels (mois en cours) et semaines ISO chevauchant deux mois.
- **Tests de flux** quand deux modules partagent une règle métier (ex. statut `cv_envoye` à la création) — unitaire seul ≠ suffisant.
- Préférer **Vitest jsdom** pour E2E applicatif tant que la CI reste Node-only ; documenter quand passer à Playwright.

## Prochaines explorations

- Export PDF des lettres de motivation (déjà listé en « Prévu » README).
- Optionnel : edge function pour PDF serveur si les bilans deviennent très longs.
- **Playwright** : login réel + drag Kanban + non-régression visuelle (voir section fin de `04-tech-strategie-tests.md`).
- **Portfolio / carrière** : voir le plan d'action détaillé dans [`05-bilan-portfolio-recruteur.md`](05-bilan-portfolio-recruteur.md) (notes 7,5/10 ingénieur, 6/10 commercial).
