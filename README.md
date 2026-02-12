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

- **Candidatures** — Entreprise, poste, lien offre, statut, date, priorité, notes
- **Kanban** — Colonnes (À postuler → CV envoyé → Entretiens → Refus / Offre), drag & drop à venir
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
├── types/           # Modèles (Candidature, Statut, Priorite)
├── lib/             # Supabase client
├── contexts/        # AuthContext, ThemeContext
├── components/      # Layout, Sidebar, etc.
│   ├── Layout/
│   └── Sidebar/
└── pages/
    ├── Dashboard/
    ├── Candidatures/
    ├── CandidatureDetail/
    ├── Kanban/
    ├── Planning/
    ├── Taches/
    ├── Settings/
    ├── Login/
    └── Signup/
```

---

## Supabase

1. Créez un projet sur [app.supabase.com](https://app.supabase.com).
2. Copiez `.env.example` vers `.env` et renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (Settings > API dans le dashboard).
3. Le client est disponible via `import { supabase } from "@/lib/supabase"` (ou `src/lib/supabase`).

---

## Lancer le projet

```bash
# Installer les dépendances
npm install

# Créer un fichier .env à partir de .env.example (pour Supabase)

# Démarrer en développement
npm run dev

# Build production
npm run build

# Prévisualiser le build
npm preview
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
