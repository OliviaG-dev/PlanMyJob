# PlanMyJob

**Organisez votre recherche d'emploi comme un vrai projet.**

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?style=flat-square&logo=react-router)
![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?style=flat-square&logo=supabase)
![ESLint](https://img.shields.io/badge/ESLint-9-E34F26?style=flat-square&logo=eslint)
![CI](https://github.com/OliviaG-dev/PlanMyJob/actions/workflows/ci.yml/badge.svg)
![CD](https://github.com/OliviaG-dev/PlanMyJob/actions/workflows/deploy.yml/badge.svg)

PlanMyJob est une application React / TypeScript conçue pour structurer et optimiser la recherche d'emploi. Tableau Kanban pour le suivi des candidatures, calendrier mensuel pour la planification, système de tâches inspiré des outils de gestion de projet et dashboard de progression. Thème élégant (rose/beige), dark mode et design cohérent. Architecture front-end propre et expérience utilisateur orientée productivité.

---

## Architecture en 30 secondes

- **Pages (`src/pages/`)** : orchestration de l'écran, navigation, composition UI.
- **Composants (`src/components/`)** : briques UI réutilisables (pagination, filtres, selects, layout, loader, graphiques).
- **Hooks (`src/hooks/`)** : logique métier et chargement de données (dashboard, candidatures, tâches, ressources).
- **Lib (`src/lib/`)** : accès Supabase et helpers métier.
- **Types (`src/types/`)** : contrats TypeScript partagés.
- **Contexts (`src/contexts/`)** : état global auth + thème.

Ce découpage permet de garder des pages lisibles, une logique testable et une évolution plus simple des fonctionnalités.

---

## Fonctionnalités

### Cœur (MVP)

- **Candidatures** — Entreprise, poste, lien offre, statut, date, priorité, notes, localisation, type de contrat, télétravail, source, note personnelle. Liste paginée (3 par section), filtres (nom, télétravail, ville, note) avec icônes, drag & drop entre listes (En cours / Terminée / Refus). **Nouvelle candidature** : statut par défaut **CV envoyé**.
- **Fiche candidature** — Détail complet, badge de statut Kanban coloré (à postuler, offre, refus, etc.), **temporalité « CV envoyé »** : affichage du temps écoulé depuis le passage en statut « CV envoyé » (secondes, minutes, heures, jours, semaines, mois), bouton supprimer avec style rouge, **partage par lien public** (modal Partager).
- **Kanban** — Colonnes (À postuler → CV envoyé → Entretien RH → Entretien technique → Attente de réponse → Refus → Sans réponse → Offre), drag & drop pour changer le statut, pagination par colonne, badge de comptage centré par colonne. Les colonnes **Refus / Sans réponse / Offre** utilisent des cartes compactes carrées.
- **Automatisation Kanban** — Au chargement de la page Kanban, une candidature restée en `cv_envoye` depuis plus de 15 jours (basé sur `cvEnvoyeAt`) est automatiquement déplacée en `sans_reponse`.
- **Planning** — Calendrier mensuel avec navigation mois précédent/suivant + bouton « Aujourd'hui ». Affichage des événements par jour : Nouvelle candidature, CV envoyé, Entretien RH, Entretien technique, Attente de réponse, Refus (couleurs distinctes). Clic sur une journée : modal avec liste des événements et liens vers les fiches candidature.
- **Tâches** — Todo liste par semaine ISO (lundi = début). Navigation mois précédent/suivant + bouton « Ce mois ». Semaines en accordéon (ouvrir/fermer), priorités (basse, normale, haute), badge « En cours » pour la semaine courante, semaines passées grisées. Persistance Supabase.

### Tableau de bord

- **Stats** — Candidatures (envoyées, en cours, entretiens), taux de conversion, organisation par statut.
- **Répartition** — Liste par statut (inclut **Sans réponse**, même à 0) + graphique donut (répartition des candidatures).
- **Objectifs & motivation** — Objectifs candidatures (semaine et mois) réglables dans Paramètres, jours depuis la dernière candidature, sites d'emploi utilisés.
- **Liens de partage actifs** — Liste paginée (2 par page) des liens publics de candidature encore actifs : voir, copier, **désactiver** (avec confirmation).
- **Bilans mensuels** — Sélecteur de mois, génération ou regénération d'un lien public avec stats + détail semaine par semaine ; liste paginée des bilans actifs.
- Thème et design alignés avec le reste de l'app (stat-cards, couleurs primary).

### Partage de liens publics

Liens en **lecture seule**, snapshot **figé** à la création (pas de données live). Idéal pour France Travail, un recruteur ou un coach.

#### Rapport de candidature (`/share/:token`)

- **Création** — Depuis la fiche candidature : bouton **Partager**, durée (24 h, 7 j, 30 j, jamais), notes publiques optionnelles.
- **Page publique** — Entreprise, poste, statut, informations, timeline, notes ; **QR code** et **téléchargement PDF** (`PlanMyJob_Report_*.pdf`).
- **Gestion** — Dashboard « Liens de partage actifs », modal Partager (liens existants), **désactivation** avec modal de confirmation.

#### Bilan mensuel (`/bilan/:token`)

- **Création** — Dashboard « Bilans mensuels » : choix du mois, durée du lien (7 j, 30 j, jamais), **Générer le bilan** (ou **Regénérer** — l'ancien lien est alors désactivé).
- **Contenu figé** — Stats du mois (envoyées, en cours, entretiens, offres reçues, taux refus / sans réponse, répartition par source), candidatures **semaine par semaine** (accordéons sur la page web).
- **Mois en cours** — Bilan **partiel** jusqu'à la date du jour.
- **Page publique** — Même esprit visuel que l'app (rose/beige), QR code, export PDF (`PlanMyJob_Bilan_*.pdf`).
- **Gestion** — Liste paginée sur le dashboard, copie du lien, désactivation confirmée.

#### Migrations Supabase requises

Exécuter dans l'ordre (SQL Editor), puis `NOTIFY pgrst, 'reload schema';` :

1. `supabase/migrations/20260813120000_shares.sql`
2. `supabase/migrations/20260813130000_shares_insert_policy.sql` (recommandé)
3. `supabase/migrations/20260813140000_monthly_reports.sql`

Dépannage détaillé : [`docs/share-feature.md`](docs/share-feature.md).

### Avancé

- **Dark mode** — Bascule thème clair/sombre (paramètres).
- **Auth Supabase** — Connexion, inscription, **mot de passe oublié** (lien sur la page de connexion → saisie email → envoi du lien), **réinitialisation du mot de passe** (page dédiée après clic sur le lien email), **changer le mot de passe** depuis Paramètres (envoi d'un email de réinitialisation).
- **Paramètres** — Compte (email, bouton « Changer le mot de passe », déconnexion), Apparence (thème clair/sombre), **Objectifs** (candidatures par semaine et par mois, sauvegardés en localStorage par utilisateur).
- **Page 404** — Illustration dédiée et bouton « Retour à l'accueil » pour toute URL non reconnue.
- **Loader** — Composant de chargement réutilisable (spinner plein écran au chargement auth, réutilisable en inline ailleurs).
- **Sources de candidature** — Ajout de la source **France Travail** (formulaire candidature, détail candidature, dashboard).

### Analyse d'offre

- **Analyser une offre d'emploi** — Page dédiée (`/analyse`). Collez le texte d'une annonce (LinkedIn, Indeed, etc.) : extraction automatique du poste, entreprise, type de contrat, télétravail, localisation, expérience, compétences techniques, points clés, salaire, lien. Formulaire éditable puis **Créer une candidature** pour pré-remplir le modal d'ajout. Logique d'extraction dans `src/lib/offerAnalyzer.ts` (voir `src/lib/offerAnalyzer.md` pour la doc).

### Ressources (Outils postulations)

- **Mail / lettre de motivation** — Générateur de lettre semi-automatique : formulaire (poste, entreprise, 3 compétences, réalisation, motivation), optionnellement offre d'emploi collée, style (Auto / Classique / Moderne / Startup), prénom/nom pour la signature. Réalisation = choix d'un **projet** (Mes projets) ou saisie libre. Génération d'une lettre personnalisée (templates par ton), score de matching indicatif, mots-clés détectés depuis l'offre, copie en un clic. Voir `doc.md` pour la doc détaillée.
- **Mes projets** — Gestion de projets (titre + description) dans la page Ressources : ajout, édition, suppression. Les projets servent de « réalisation importante » dans le générateur de lettre. Persistance Supabase par utilisateur.
- **CV** — Stockage de CV avec lien (Google Drive, etc.), type (Tech, Agence, Grande entreprise, Autre), format (Court, Complet). Barre de progression (X / 10) avec segments et indicateur par site. Visualisation en grand (iframe) et copie du lien. Persistance Supabase par utilisateur.
- **Sites d'emploi** — Liste de sites (LinkedIn, HelloWork, Indeed, Welcome to the Jungle, France Travail, etc.) chargée depuis Supabase. Ajout et suppression de sites. Par site : cases « Compte créé » et « Compte mis à jour », sauvegardées en base (utilisateur connecté) ou en localStorage. Grille 2 colonnes (1 en mobile/tablette).

### Prévu

- Streak, badges
- Rappels et notifications
- Export PDF des lettres
- Recherche par entreprise, techno, statut

---

## Stack

- **React 19** + **TypeScript**
- **Vite 7**
- **React Router** (pages : dashboard, candidatures, analyse, kanban, planning, tâches, ressources, paramètres, login, inscription, mot de passe oublié, réinitialisation mot de passe, **partage public**, **bilan mensuel public**, 404)
- **Supabase** (persistance des données, authentification ; tables : candidatures, tâches, cv_ressources, job_sites, user_job_site_status, projets, **shares**, **monthly_reports**)
- **jsPDF** + **qrcode** — Export PDF et QR code côté client (pages publiques de partage)
- **localStorage** (objectifs hebdo/mois par utilisateur, voir `src/lib/userGoals.ts`)

---

## Structure du projet

Chaque **page** et chaque **composant** a son propre dossier avec un fichier `.tsx` et un fichier `.css` :

```
src/
├── types/           # Modèles (Candidature, Tache, Statut, Priorite, CvRessource, etc.)
├── lib/             # Supabase client, candidatures, taches, cvRessources, jobSites, projets, offerAnalyzer, userGoals
├── data/            # Données statiques (whyCompanyTemplates.json, interface.ts)
├── contexts/        # AuthContext, ThemeContext
├── components/      # Layout, Sidebar, Pagination, Select, CandidaturesFilters, Loader, ShareModal, ConfirmModal…
│   ├── Layout/
│   ├── Sidebar/
│   ├── Pagination/
│   ├── Select/           # Menu déroulant réutilisable (filtres, formulaire)
│   ├── CandidaturesFilters/
│   ├── ConfirmModal/     # Confirmation (ex. désactivation d'un lien)
│   ├── DashboardActiveShares/
│   ├── DashboardMonthlyReports/
│   ├── ShareCandidatureCard/
│   ├── ShareModal/       # Création / gestion des liens candidature
│   ├── ShareQrCode/
│   └── Loader/           # Spinner de chargement réutilisable (plein écran ou inline)
├── pages/
│   ├── Dashboard/
│   ├── Candidatures/      # Liste + AddCandidatureModal + filtres + pagination
│   ├── CandidatureDetail/ # Détail + badges statut + temporalité CV envoyé + partage
│   ├── Analyse/           # Analyse d'offre d'emploi (extraction + création candidature)
│   ├── Kanban/
│   ├── Planning/         # Calendrier mensuel + événements candidatures
│   ├── Taches/           # Todo par semaine ISO (accordéon, priorités)
│   ├── OutilsPostulations/  # Ressources : CV, sites d'emploi, générateur lettre, Mes projets
│   ├── PublicShare/       # Page publique rapport candidature (/share/:token)
│   ├── PublicMonthlyReport/  # Page publique bilan mensuel (/bilan/:token)
│   ├── Settings/    # Compte (changer mot de passe, déconnexion), Apparence, Objectifs
│   ├── Login/
│   ├── Signup/
│   ├── ForgotPassword/  # Mot de passe oublié (saisie email, envoi lien)
│   ├── ResetPassword/  # Nouveau mot de passe après clic sur le lien email
│   └── NotFound/       # Page 404 (illustration + bouton Retour à l'accueil)
```

---

## CI/CD

Déploiement **Vercel production** via GitHub Actions uniquement (intégration Git Vercel désactivée pour éviter les doubles deploys).

```
PR          → CI (lint, test, build) → si ✅ → Preview Vercel (URL en commentaire)
Push master → CI → si ✅ → CD (deploy Vercel prod)
```

### CI — `.github/workflows/ci.yml`

Exécuté à chaque push sur `main`/`master` et sur chaque pull request :

1. **Install** — `npm ci`
2. **Lint** — `npm run lint`
3. **Test** — `npm run test` (Vitest)
4. **Build** — `npm run build` (variables Supabase placeholder en CI)

### Playwright E2E — `.github/workflows/ci.yml` (job `e2e`)

Exécuté après le job **Lint, test & build** :

1. **Install** — `npm ci` + `npx playwright install --with-deps chromium`
2. **E2E** — `npm run test:e2e` (Chromium headless, serveur Vite sur le port 4173)

Secrets optionnels pour les pages publiques valides :

| Secret | Description |
| ------ | ----------- |
| `PLAYWRIGHT_PUBLIC_SHARE_TOKEN` | Token d'un lien `/share/:token` actif |
| `PLAYWRIGHT_PUBLIC_BILAN_TOKEN` | Token d'un lien `/bilan/:token` actif |

Sans ces secrets, la CI exécute quand même les tests sur tokens invalides.

### CD — `.github/workflows/deploy.yml`

Déclenché automatiquement après une CI **réussie** sur un **push** vers `main`/`master`.

- Hébergement : **Vercel** (`vercel.json` — rewrites SPA React Router)
- Commande : `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod` (CLI officiel)
- Variables Supabase injectées au build via secrets GitHub

### Preview — `.github/workflows/preview.yml`

Déclenché après une CI **réussie** sur une **pull request** :

1. Build environnement **preview** Vercel
2. `vercel deploy --prebuilt` (sans `--prod`)
3. Commentaire automatique sur la PR avec l’URL de preview (mis à jour à chaque push)

#### Secrets GitHub (Actions)

Configurés dans **Settings → Secrets and variables → Actions** :

| Secret | Description |
| ------ | ----------- |
| `VERCEL_TOKEN` | Token Vercel ([Account → Tokens](https://vercel.com/account/tokens)) |
| `VERCEL_ORG_ID` | ID organisation (`orgId` dans `.vercel/project.json`) |
| `VERCEL_PROJECT_ID` | ID projet (`projectId` dans `.vercel/project.json`) |
| `VITE_SUPABASE_URL` | URL Supabase (build production) |
| `VITE_SUPABASE_ANON_KEY` | Clé anon Supabase (build production et preview) |
| `PLAYWRIGHT_PUBLIC_SHARE_TOKEN` | *(optionnel)* Token partage candidature pour E2E |
| `PLAYWRIGHT_PUBLIC_BILAN_TOKEN` | *(optionnel)* Token bilan mensuel public pour E2E |

Conserver les variables Supabase dans **Vercel → Project → Settings → Environment Variables** (Production **et** Preview).

Récupérer les IDs Vercel en local :

```bash
npx vercel link
type .vercel\project.json   # Windows
# cat .vercel/project.json  # macOS / Linux
```

### Branch protection (`master`)

La branche `master` doit exiger une **CI verte** avant merge. Configuration détaillée : [`docs/branch-protection.md`](docs/branch-protection.md).

Check GitHub à exiger : **`Lint, test & build`**.

---

## Lancer le projet

```bash
# Installer les dépendances
npm install

# Créer un fichier .env à la racine :
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
#
# Playwright E2E (optionnel — liens publics actifs) :
# PLAYWRIGHT_PUBLIC_SHARE_TOKEN=...   # lien /share/:token actif
# PLAYWRIGHT_PUBLIC_BILAN_TOKEN=...   # lien /bilan/:token actif


# Démarrer en développement
npm run dev

# Build production
npm run build

# Prévisualiser le build
npm run build && npm run preview

# Linter
npm run lint

# Tests unitaires / intégration (Vitest + jsdom, ~5 s)
npm run test

# Tests E2E navigateur (Playwright + Chromium)
npm run test:e2e

# Playwright — mode UI interactif
npm run test:e2e:ui

# Playwright — navigateur visible
npm run test:e2e:headed

# Vitest en mode watch (optionnel)
npx vitest
```

### Stratégie de tests

| Couche | Outil | Commande | Rôle |
| ------ | ----- | -------- | ---- |
| Unitaires & composants | Vitest + Testing Library | `npm test` | Logique métier, hooks, UI mockée (~110+ tests) |
| Intégration / E2E jsdom | Vitest (`tests/integration/`, `tests/e2e/`) | `npm test` | Flux multi-pages sans vrai navigateur |
| E2E navigateur | Playwright (`e2e/`) | `npm run test:e2e` | Pages publiques `/share` et `/bilan` |

Specs Playwright :

| Fichier | Couverture | Prérequis |
| ------- | ---------- | --------- |
| `e2e/public-pages.spec.ts` | `/share` et `/bilan` (token invalide + valide) | Supabase ; tokens optionnels |

Les parcours authentifiés (login, Analyse → Kanban, drag) restent couverts par **Vitest** (`tests/e2e/`, `tests/integration/`).

---

## Routes

| Route               | Page                          |
| ------------------- | ----------------------------- |
| `/`                 | Redirection vers `/dashboard` |
| `/dashboard`        | Tableau de bord               |
| `/candidatures`     | Liste des candidatures        |
| `/candidatures/:id` | Détail d'une candidature      |
| `/analyse`          | Analyse d'offre d'emploi     |
| `/kanban`           | Vue Kanban                    |
| `/planning`         | Calendrier mensuel            |
| `/taches`           | Tâches                        |
| `/ressources`       | Ressources                    |
| `/settings`         | Paramètres                    |
| `/share/:token`     | Rapport public de candidature (lecture seule, sans auth) |
| `/bilan/:token`     | Bilan mensuel public (lecture seule, sans auth) |
| `/login`            | Connexion                     |
| `/signup`           | Inscription                   |
| `/forgot-password`  | Mot de passe oublié           |
| `/reset-password`   | Réinitialisation du mot de passe (après clic sur le lien email) |
| `*`                 | Page 404 (toute URL non reconnue)                              |

---

## Documentation

| Ressource | Contenu |
| --------- | ------- |
| [`docs/share-feature.md`](docs/share-feature.md) | Partage candidature — migrations Supabase, dépannage |
| [`.devbook/`](.devbook/index.md) | Notes d'apprentissage technique (Dev Book) — liens publics, PDF, QR code |

---

_PlanMyJob — Planifiez, postulez, progressez._
