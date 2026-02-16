# PlanMyJob

**Organisez votre recherche d'emploi comme un vrai projet.**

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?style=flat-square&logo=react-router)
![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?style=flat-square&logo=supabase)
![ESLint](https://img.shields.io/badge/ESLint-9-E34F26?style=flat-square&logo=eslint)

PlanMyJob est une application React / TypeScript conçue pour structurer et optimiser la recherche d'emploi. Tableau Kanban pour le suivi des candidatures, calendrier mensuel pour la planification, système de tâches inspiré des outils de gestion de projet et dashboard de progression. Thème élégant (rose/beige), dark mode et design cohérent. Architecture front-end propre et expérience utilisateur orientée productivité.

---

## Fonctionnalités

### Cœur (MVP)

- **Candidatures** — Entreprise, poste, lien offre, statut, date, priorité, notes, localisation, type de contrat, télétravail, source, note personnelle. Liste paginée (3 par section), filtres (nom, télétravail, ville, note) avec icônes, drag & drop entre listes (En cours / Terminée / Refus).
- **Fiche candidature** — Détail complet, badge de statut Kanban coloré (à postuler, offre, refus, etc.), **temporalité « CV envoyé »** : affichage du temps écoulé depuis le passage en statut « CV envoyé » (secondes, minutes, heures, jours, semaines, mois), bouton supprimer avec style rouge.
- **Kanban** — Colonnes (À postuler → CV envoyé → Entretien RH → Entretien technique → Attente de réponse → Refus / Offre), drag & drop pour changer le statut, pagination par colonne, badge de comptage centré par colonne.
- **Tâches** — Todo liées aux candidatures (CV, lettre, relance, prépa entretien), navigation mois précédent/suivant + bouton « Aujourd'hui », affichage des événements par jour : Nouvelle candidature, CV envoyé, Entretien RH, Entretien technique, Attente de réponse, Refus (couleurs distinctes). Clic sur une journée : modal avec liste des événements et liens vers les fiches candidature.

### Tableau de bord

- Stats : candidatures envoyées, en cours, entretiens
- Visualisations et objectifs (à venir)

### Avancé

- **Dark mode** — Bascule thème clair/sombre (paramètres)
- Auth Supabase (connexion, inscription)

### Prévu

- Objectifs hebdo, streak, badges
- Rappels et notifications
- Gestion des documents (CV, lettres)
- Recherche par entreprise, techno, statut

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
├── components/      # Layout, Sidebar, Pagination, Select, CandidaturesFilters
│   ├── Layout/
│   ├── Sidebar/
│   ├── Pagination/
│   ├── Select/           # Menu déroulant réutilisable (filtres, formulaire)
│   └── CandidaturesFilters/
├── pages/
│   ├── Dashboard/
│   ├── Candidatures/      # Liste + AddCandidatureModal + filtres + pagination
│   ├── CandidatureDetail/ # Détail + badges statut + temporalité CV envoyé
│   ├── Kanban/
│   ├── Planning/
│   ├── Taches/
│   ├── Settings/
│   ├── Login/
│   └── Signup/
```

---

## Lancer le projet

```bash
# Installer les dépendances
npm install

# Créer un fichier .env à la racine :
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# (Optionnel) Pour le planning et la temporalité, exécuter une migration SQL (colonnes : cv_envoye_at, entretien_rh_at, entretien_technique_at, attente_reponse_at, refus_at) dans l’éditeur SQL Supabase

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
| `/planning`         | Calendrier mensuel            |
| `/taches`           | Tâches                        |
| `/settings`         | Paramètres                    |
| `/login`            | Connexion                     |
| `/signup`           | Inscription                   |

---

_PlanMyJob — Planifiez, postulez, progressez._
