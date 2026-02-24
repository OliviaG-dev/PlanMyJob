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
- **Planning** — Calendrier mensuel avec navigation mois précédent/suivant + bouton « Aujourd'hui ». Affichage des événements par jour : Nouvelle candidature, CV envoyé, Entretien RH, Entretien technique, Attente de réponse, Refus (couleurs distinctes). Clic sur une journée : modal avec liste des événements et liens vers les fiches candidature.
- **Tâches** — Todo liste par semaine ISO (lundi = début). Navigation mois précédent/suivant + bouton « Ce mois ». Semaines en accordéon (ouvrir/fermer), priorités (basse, normale, haute), badge « En cours » pour la semaine courante, semaines passées grisées. Persistance Supabase.

### Tableau de bord

- **Stats** — Candidatures (envoyées, en cours, entretiens), taux de conversion, organisation par statut.
- **Répartition** — Liste par statut + graphique donut (répartition des candidatures).
- **Objectifs & motivation** — Objectifs candidatures (semaine et mois) réglables dans Paramètres, jours depuis la dernière candidature, sites d’emploi utilisés.
- Thème et design alignés avec le reste de l’app (stat-cards, couleurs primary).

### Avancé

- **Dark mode** — Bascule thème clair/sombre (paramètres).
- **Auth Supabase** — Connexion, inscription, **mot de passe oublié** (lien sur la page de connexion → saisie email → envoi du lien), **réinitialisation du mot de passe** (page dédiée après clic sur le lien email), **changer le mot de passe** depuis Paramètres (envoi d’un email de réinitialisation).
- **Paramètres** — Compte (email, bouton « Changer le mot de passe », déconnexion), Apparence (thème clair/sombre), **Objectifs** (candidatures par semaine et par mois, sauvegardés en localStorage par utilisateur).

### Ressources (Outils postulations)

- **Analyser une offre d'emploi** — Collez le texte d’une annonce (LinkedIn, Indeed, etc.) : extraction automatique du poste, entreprise, type de contrat, télétravail, localisation, expérience, compétences techniques, points clés, salaire, lien. Formulaire éditable puis **Créer une candidature** pour pré-remplir le modal d’ajout. Logique d’extraction dans `src/lib/offerAnalyzer.ts` (voir `src/lib/offerAnalyzer.md` pour la doc).
- **Mail / lettre de motivation** — Générateur de lettre semi-automatique : formulaire (poste, entreprise, 3 compétences, réalisation, motivation), optionnellement offre d'emploi collée, style (Auto / Classique / Moderne / Startup), prénom/nom pour la signature. Réalisation = choix d'un **projet** (Mes projets) ou saisie libre. Génération d'une lettre personnalisée (templates par ton), score de matching indicatif, mots-clés détectés depuis l'offre, copie en un clic. Voir `doc.md` pour la doc détaillée.
- **Mes projets** — Gestion de projets (titre + description) dans la page Ressources : ajout, édition, suppression. Les projets servent de « réalisation importante » dans le générateur de lettre. Persistance Supabase par utilisateur.
- **CV** — Stockage de CV avec lien (Google Drive, etc.), type (Tech, Agence, Grande entreprise, Autre), format (Court, Complet). Barre de progression (X / 10) avec segments et indicateur par site. Visualisation en grand (iframe) et copie du lien. Persistance Supabase par utilisateur.
- **Sites d’emploi** — Liste de sites (LinkedIn, HelloWork, Indeed, Welcome to the Jungle, France Travail, etc.) chargée depuis Supabase. Ajout et suppression de sites. Par site : cases « Compte créé » et « Compte mis à jour », sauvegardées en base (utilisateur connecté) ou en localStorage. Grille 2 colonnes (1 en mobile/tablette).

### Prévu

- Streak, badges
- Rappels et notifications
- Export PDF des lettres
- Recherche par entreprise, techno, statut

---

## Stack

- **React 19** + **TypeScript**
- **Vite 7**
- **React Router** (pages : dashboard, candidatures, kanban, planning, tâches, ressources, paramètres, login, inscription, mot de passe oublié, réinitialisation mot de passe)
- **Supabase** (persistance des données, authentification ; tables : candidatures, tâches, cv_ressources, job_sites, user_job_site_status, projets)
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
│   ├── Planning/         # Calendrier mensuel + événements candidatures
│   ├── Taches/           # Todo par semaine ISO (accordéon, priorités)
│   ├── OutilsPostulations/  # Ressources : CV, sites d’emploi, générateur lettre, Mes projets, analyser une offre
│   ├── Settings/    # Compte (changer mot de passe, déconnexion), Apparence, Objectifs
│   ├── Login/
│   ├── Signup/
│   ├── ForgotPassword/  # Mot de passe oublié (saisie email, envoi lien)
│   └── ResetPassword/  # Nouveau mot de passe après clic sur le lien email
```

---

## Lancer le projet

```bash
# Installer les dépendances
npm install

# Créer un fichier .env à la racine :
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...


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
| `/ressources`       | Ressources                    |
| `/settings`         | Paramètres                    |
| `/login`            | Connexion                     |
| `/signup`           | Inscription                   |
| `/forgot-password`  | Mot de passe oublié           |
| `/reset-password`   | Réinitialisation du mot de passe (après clic sur le lien email) |

---

_PlanMyJob — Planifiez, postulez, progressez._
