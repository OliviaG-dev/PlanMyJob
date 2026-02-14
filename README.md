# PlanMyJob

**Organisez votre recherche d'emploi comme un vrai projet.**

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?style=flat-square&logo=react-router)
![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?style=flat-square&logo=supabase)
![ESLint](https://img.shields.io/badge/ESLint-9-E34F26?style=flat-square&logo=eslint)

PlanMyJob est une application React / TypeScript conçue pour structurer et optimiser la recherche d'emploi. Tableau Kanban pour le suivi des candidatures, semainier pour la planification, système de tâches inspiré des outils de gestion de projet et dashboard de progression. Objectif : une architecture front-end propre, une gestion d'état claire et une expérience utilisateur orientée productivité.

---

## Fonctionnalités

### Cœur (MVP)

- **Candidatures** — Entreprise, poste, lien offre, statut, date, priorité, notes, localisation, type de contrat, télétravail, source, note personnelle
- **Kanban** — Colonnes (À postuler → CV envoyé → Entretiens → Attente → Refus / Offre), drag & drop pour changer le statut
- **Tâches** — Todo liées aux candidatures (CV, lettre, relance, prépa entretien)
- **Planning** — Semainier : entretiens, relances, deadlines

### Tableau de bord

- Stats : candidatures envoyées, en cours, entretiens
- Visualisations et objectifs (à venir)

### Avancé (prévu)

- Objectifs hebdo, streak, badges
- Rappels et notifications
- Gestion des documents (CV, lettres)
- Recherche par entreprise, techno, statut
- Dark mode, auth optionnelle

---

## Stack

- **React 19** + **TypeScript**
- **Vite 7**
- **React Router** (pages : dashboard, candidatures, kanban, planning, tâches, paramètres, login, inscription)
- **Supabase** (persistance des données, authentification)

---

## Structure du projet

Chaque **page** et chaque **composant** a son propre dossier avec un fichier `.tsx` et un fichier `.css` :

```
src/
├── types/           # Modèles (Candidature, Statut, Priorite, etc.)
├── lib/             # Supabase client, candidatures (CRUD)
├── contexts/        # AuthContext, ThemeContext
├── components/      # Layout, Sidebar
│   ├── Layout/
│   └── Sidebar/
└── pages/
    ├── Dashboard/
    ├── Candidatures/      # Liste + AddCandidatureModal
    ├── CandidatureDetail/
    ├── Kanban/
    ├── Planning/
    ├── Taches/
    ├── Settings/
    ├── Login/
    └── Signup/
```

---

## Lancer le projet

```bash
# Installer les dépendances
npm install

# Créer un fichier .env à partir de .env.example (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

# Démarrer en développement
npm run dev

# Build production
npm run build

# Prévisualiser le build
npm preview

# Linter
npm run lint
```

---

## Routes

| Route               | Page                          |
| ------------------- | ----------------------------- |
| `/`                 | Redirection vers `/dashboard` |
| `/dashboard`        | Tableau de bord               |
| `/candidatures`     | Liste des candidatures        |
| `/candidatures/:id` | Détail d'une candidature      |
| `/kanban`           | Vue Kanban                    |
| `/planning`         | Semainier                     |
| `/taches`           | Tâches                        |
| `/settings`         | Paramètres                    |
| `/login`            | Connexion                     |
| `/signup`           | Inscription                   |

---

_PlanMyJob — Planifiez, postulez, progressez._
