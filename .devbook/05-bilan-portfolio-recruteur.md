## Bilan portfolio — avis recruteur & ingénieur

_Audit du projet PlanMyJob (août 2026) — lecture codebase, tests, CI/CD, README et historique git._

---

### Niveau estimé

**Profil : Junior confirmé → début de Mid-level front-end / full-stack léger**

| Contexte | Positionnement |
|----------|----------------|
| Recherche **alternance / premier CDI dev** | **Très au-dessus** de la moyenne des portfolios |
| **1–2 ans d'expérience** (ou reconversion aboutie) | **Solide**, crédible en entretien technique |
| Poste **Mid pur (3+ ans)** en prod à grande échelle | **En dessous** sur certains critères (scale, E2E navigateur, observabilité) — potentiel visible |

Ce n'est pas un projet tuto TodoMVC : c'est un **produit quasi complet**, pensé utilisateur, avec de la vraie ingénierie solo.

---

### Chiffres clés au moment de l'audit

| Indicateur | Valeur |
|------------|--------|
| Tests Vitest | 200 (60 fichiers) |
| Couverture statements | ~73 % |
| Couverture lines | ~76 % |
| Stack | React 19, TypeScript, Vite 7, Supabase |
| CI/CD | Lint + test + build ; CD Vercel ; previews PR |
| Commits | ~100, workflow PR documenté |

---

### Points forts

#### Côté ingénieur

1. **Architecture cohérente** — `pages / components / hooks / lib / types / utils`, routes protégées, séparation logique/UI (`useCandidaturesBoard`, `useDashboardData`).
2. **Maturité « pro » rare en solo** — CI, CD Vercel, previews PR, branch protection, commits atomiques, workflow PR.
3. **Tests sérieux** — tests d'interactions (Kanban auto-move 15 jours, menu mobile), pas seulement des smoke tests.
4. **Sécurité réfléchie** — RLS Supabase, snapshots figés, RPC `get_public_*` plutôt qu'un SELECT anon ouvert.
5. **Logique métier non triviale** — `offerAnalyzer.ts`, générateur de lettres, bilans mensuels PDF/QR, automatisation Kanban.
6. **Documentation au-dessus de la norme** — README exhaustif, `docs/share-feature.md`, `.devbook/` avec retours d'expérience honnêtes.

#### Côté recruteur / produit

1. **Problème réel** — Kanban candidatures, suivi temporel « CV envoyé », tâches hebdo : répond à un vrai pain.
2. **Différenciation** — Partage lecture seule pour France Travail / coach / recruteur, bilan mensuel exportable.
3. **Finition UX** — Dark mode, pagination, filtres, modales, design cohérent.
4. **Storytelling portfolio** — README « Architecture en 30 secondes » + demo live (`planmyjob.app`).

---

### Points faibles

#### Technique

| Faiblesse | Impact |
|-----------|--------|
| Pas de couche `services/` — API dans `lib/` | OK à cette échelle, moins scalable si le projet grossit |
| Fichiers denses — `offerAnalyzer.ts`, gros hooks | Maintenabilité ; à découper par responsabilité |
| Couverture inégale — Settings ~40 %, auth ~50–60 % | Zones sensibles peu testées |
| Pas de Playwright (E2E navigateur réel) | Drag Kanban, auth réelle, régression visuelle non couverts |
| Objectifs en localStorage vs reste en Supabase | Incohérence de persistance |
| Pas de lazy loading des routes | Perf acceptable aujourd'hui, limite si l'app grossit |
| Accessibilité non documentée/testée | Point souvent relevé en entretien mid+ |

#### Commercial / produit

| Faiblesse | Impact |
|-----------|--------|
| Marché saturé (Huntr, Teal, Notion…) | Positionnement très clair nécessaire |
| Pas de landing marketing séparée | Conversion visiteur → inscription |
| Pas de modèle économique visible | Difficile à vendre comme « produit » vs « portfolio » |
| Pas d'onboarding guidé | Friction nouvel utilisateur |
| Pas de notifications / rappels (roadmap) | Feature clé pour la rétention |
| Mono-utilisateur, pas de collaboration | Limite l'upsell (coach, bootcamp…) |

---

### Notes sur 10

| Critère | Note | Commentaire |
|---------|------|-------------|
| **Ingénieur** | **7,5 / 10** | Excellent pour un projet solo/portfolio. Architecture, tests, CI/CD et sécurité Supabase au niveau d'un junior confirmé qui monte en mid. −1,5 pour E2E navigateur, couverture auth/settings, fichiers monolithiques. |
| **Commercial** | **6 / 10** | MVP riche et niche pertinente, mais pas encore un « business » : pas de GTM, pricing, onboarding, preuve d'usage réel. Landing + positionnement + utilisateurs actifs → 7–7,5. |

---

### Ce qu'un recruteur retiendrait en 30 secondes

> Développeuse autonome qui livre un produit complet de A à Z : front React/TS propre, Supabase avec RLS, CI/CD, 200 tests, feature différenciante (partage + PDF). Profil junior confirmé très crédible, avec une vraie sensibilité produit — pas juste du code.

---

### Plan d'action prioritaire

#### Pour convaincre en entretien (impact max, effort raisonnable)

1. **3–5 tests Playwright** — login → créer candidature → Kanban → partage public
2. **Refactor `offerAnalyzer`** en modules (`extractCompany`, `extractSkills`, `inferSource`…)
3. **Migrer `userGoals` vers Supabase** — cohérence data
4. **Audit a11y rapide** (axe-core) + corrections évidentes
5. **Lazy load des pages** avec `React.lazy` + `Suspense`

#### Pour le côté produit commercial

1. **Landing page** avec ICP clair : _« Le CRM de ta recherche d'emploi — pensé pour France Travail et les coachs carrière »_
2. **Onboarding en 3 étapes** — première candidature, objectif hebdo, tour du Kanban
3. **Freemium simple** — ex. partage public / bilans mensuels en premium
4. **Email de relance** — « Tu n'as pas bougé cette candidature depuis 7 jours »
5. **Export JSON/CSV** — confiance + conformité RGPD
6. **Témoignages / case study** — même 2–3 retours beta suffisent

---

### Verdict

Au-dessus du peloton junior sur la qualité de livraison et la rigueur. Ce qui sépare d'un **mid confirmé en entreprise** :

- l'expérience **prod à l'échelle** (monitoring, perf, E2E, revues de code en équipe),
- la **dimension go-to-market** si le projet devient un vrai SaaS.

Pour un **premier poste dev** ou une **alternance senior** : ce projet peut être l'**argument principal**. En entretien, préparer surtout : pourquoi snapshots figés, comment RLS a été géré, walkthrough Analyse → Candidature → Kanban → Partage.

---

### Ressources liées

- [`index.md`](index.md) — vue d'ensemble projet
- [`04-tech-strategie-tests.md`](04-tech-strategie-tests.md) — stratégie de tests et prochaines étapes Playwright
- [`README.md`](../README.md) — documentation produit et architecture
