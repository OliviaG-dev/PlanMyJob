---
id: plan-my-job
name: PlanMyJob
description: Organiser sa recherche d'emploi — liens publics Supabase, snapshots, PDF/QR, analyse d'offres modulaire, 201 tests Vitest et Playwright E2E en CI.
technologies: [React, TypeScript, Vite, Vitest, Supabase, jsPDF, qrcode, React Router]
newTechnologies: [jsPDF, qrcode]
githubUrl: https://github.com/OliviaG-dev/PlanMyJob
demoUrl: https://planmyjob.app
---

## Contexte

PlanMyJob est une app React/TypeScript pour suivre candidatures, tâches et progression. Sujets récents : **partage public** (RLS, PDF/QR), **refactor `offerAnalyzer`** (16 modules), **Playwright E2E en CI** + **201 tests Vitest** (intégration + E2E jsdom Analyse → Kanban). Détail : [`06-tech-offer-analyzer-modules.md`](06-tech-offer-analyzer-modules.md), [`04-tech-strategie-tests.md`](04-tech-strategie-tests.md). **Bilan portfolio** (8/10 ingénieur, 6/10 commercial) : [`05-bilan-portfolio-recruteur.md`](05-bilan-portfolio-recruteur.md).

## Nouvelles technologies — vue d'ensemble

| Techno | Déjà connue ? | Rôle dans le projet |
|--------|---------------|---------------------|
| React 19 / TypeScript / Vite | Oui | UI, build, tests Vitest |
| Supabase | Partiel | Auth + tables métier ; **nouveau** : pattern RPC lecture publique sans SELECT anon |
| jsPDF | Non | Génération PDF rapport candidature et bilan mensuel |
| qrcode | Non | QR code data-URL injecté dans la page et le PDF |
| Vitest + Playwright | Partiel → en cours | 201 tests Vitest ; Playwright CI (pages publiques) ; E2E jsdom flux métier |

## Difficultés liées aux nouvelles technos

- PostgREST / cache API : migrations SQL OK mais RPC ou table absents en 404 tant que le schéma n'est pas rechargé.
- Snapshot JSON : distinguer données « live » vs figées ; regénérer un bilan mensuel = révoquer l'ancien token + nouveau snapshot.
- jsPDF : texte long (URLs) à couper manuellement ; emojis remplacés par pastilles CSS en dark mode sur les pages publiques.
- Dark mode : `--primary` trop clair en thème sombre pour boutons CTA blancs — couleurs d'action dédiées (#9e5a66).
- **Import d'offre :** parsing LinkedIn bruyant (logo, badges Hybride/Temps plein) ; default statut divergent entre modal manuel et `extractedToFormData` ; refactor modulaire `offerAnalyzer/` pour maintenabilité.
- **Tests E2E jsdom :** sidebar masquée, auto-move Kanban 15 jours, libellés de colonnes avec compteur.

## Leçons apprises

- Préférer **insert direct** + RLS pour la création de shares plutôt qu'une RPC fragile côté PostgREST.
- Exposer la lecture publique uniquement via **`get_public_*` RPC** (pas de SELECT anon sur la table).
- Factoriser `ConfirmModal`, `ShareQrCode`, `Pagination` — même UX dashboard / modal / pages publiques.
- Tester les stats mensuelles avec snapshots partiels (mois en cours) et semaines ISO chevauchant deux mois.
- **Tests de flux** quand deux modules partagent une règle métier (ex. statut `cv_envoye` à la création) — unitaire seul ≠ suffisant.
- Découper **`offerAnalyzer`** par responsabilité (`inferSource`, `extractCompany`, `linkedInParser`…) — barrel public conservé pour compatibilité imports.
- **Vitest jsdom** pour flux métier rapide ; **Playwright** pour pages publiques et prochainement auth/Kanban.
- Refactor **monolithe → modules** avec barrel stable : zéro churn d'imports consommateurs.

## Prochaines explorations

- Export PDF des lettres de motivation (déjà listé en « Prévu » README).
- Optionnel : edge function pour PDF serveur si les bilans deviennent très longs.
- Parser **Indeed** dédié si les copier-coller deviennent aussi bruyants que LinkedIn.
- **Playwright auth** : login → candidature → Kanban (compléter les 4 specs pages publiques).
- **Merger refactor `offerAnalyzer`** + tests unitaires par module.
- **Portfolio / carrière** : [`05-bilan-portfolio-recruteur.md`](05-bilan-portfolio-recruteur.md) (8/10 ingénieur, 6/10 commercial).
