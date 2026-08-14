## Bilan portfolio — avis recruteur & ingénieur

_Audit PlanMyJob — **mise à jour août 2026** (post-Playwright CI + refactor `offerAnalyzer`)._

---

### Évolution depuis le premier audit

| Axe | Avant | Maintenant |
|-----|-------|------------|
| Tests Vitest | 200 / 60 fichiers | **201 / 59 fichiers** |
| E2E navigateur | ❌ Vitest jsdom seulement | ✅ **Playwright** en CI (job dédié) |
| `offerAnalyzer` | Monolithe ~810 lignes | ✅ **16 modules** (`src/lib/offerAnalyzer/`) — mergé PR #24 |
| Couverture lines | ~76 % | ~**75 %** (stable) |
| README | Badge Vitest | Badges **Vitest + Playwright** |

---

### Niveau estimé

**Profil : Junior confirmé solide → Mid-level front-end en progression**

| Contexte | Positionnement |
|----------|----------------|
| **Alternance / premier CDI dev** | **Très au-dessus** du peloton — différenciation nette |
| **1–2 ans d'expérience** | **Crédible mid junior** — stack, tests et CI au niveau attendu |
| **Mid pur (3+ ans), prod à l'échelle** | **Encore en dessous** sur observabilité, a11y, E2E auth complet, travail en équipe à grande échelle |

Le projet n'est plus seulement un « gros portfolio » : la **pyramide de tests** (unit → intégration jsdom → Playwright CI) et le **refactor métier** montrent une montée en maturité ingénieur.

---

### Chiffres clés

| Indicateur | Valeur |
|------------|--------|
| Tests Vitest | 201 (59 fichiers) |
| Tests Playwright | 4 scénarios (2 invalid token toujours actifs ; 2 avec token Supabase en CI) |
| E2E jsdom (flux app) | `tests/e2e/application-flow.e2e.test.tsx` — Analyse → Candidature → Kanban |
| Couverture statements | ~72,6 % |
| Couverture lines | ~75,4 % |
| Modules `offerAnalyzer` | 16 fichiers (~810 lignes découpées) |
| Stack | React 19, TS, Vite 7, Supabase, Playwright 1.62 |
| CI/CD | Lint + Vitest + build + **Playwright** ; CD Vercel ; previews PR |

---

### Points forts

#### Côté ingénieur

1. **Pyramide de tests complète** — unitaires (`lib/`, `utils/`), composants, interactions (Kanban, Candidatures), intégration import d'offre, E2E jsdom flux métier, Playwright pages publiques en CI.
2. **Refactor `offerAnalyzer` exemplaire** — extraction par responsabilité (`extractCompany`, `linkedInParser`, `inferSource`…), barrel stable (`offerAnalyzer.ts`), fixtures par plateforme (LinkedIn, France Travail, HelloWork, Indeed). Voir [`06-tech-offer-analyzer-modules.md`](06-tech-offer-analyzer-modules.md).
3. **CI mature** — job Playwright séparé, retries CI, upload rapport en cas d'échec, secrets pour tokens publics réels.
4. **Architecture maintenue** — hooks métier (`useCandidaturesBoard`, `useDashboardData`), RLS Supabase, snapshots figés, RPC lecture publique.
5. **Documentation vivante** — README, `.devbook/`, stratégie tests documentée, retours d'expérience honnêtes.

#### Côté recruteur / produit

1. **Produit cohérent** — Kanban, planning, tâches, analyse d'offre, lettres, partage France Travail / coach : vision produit claire.
2. **Différenciation** — Bilans mensuels PDF/QR, liens publics lecture seule : argument fort en entretien.
3. **Capacité d'itération** — PR #23 Playwright + PR #24 refactor analyzer : profil **autonome et orienté amélioration continue**.
4. **Demo live** — `planmyjob.app` + README « Architecture en 30 secondes ».

---

### Points faibles

#### Technique

| Faiblesse | Impact | Priorité |
|-----------|--------|----------|
| Playwright **limité aux pages publiques** — pas login / Kanban drag en navigateur réel | Gap mid+ en entretien | Haute |
| Couverture auth / Settings (~40–60 %) | Zones sensibles | Moyenne |
| Pas de couche `services/` | OK à cette échelle | Basse |
| `userGoals` en localStorage | Incohérence data | Moyenne |
| Pas de lazy loading routes | Perf future | Basse |
| Accessibilité non auditée | Critère mid+ | Moyenne |
| Tests unitaires **par module** analyzer (pas seulement fichier global) | Couverture fine | Basse |

#### Commercial / produit

| Faiblesse | Impact |
|-----------|--------|
| Marché saturé (Huntr, Teal, Notion…) | Positionnement ICP indispensable |
| Pas de landing marketing | Conversion faible |
| Pas de modèle économique / preuve d'usage | Reste un portfolio, pas un SaaS |
| Pas d'onboarding ni notifications | Rétention limitée |

---

### Notes sur 10

| Critère | Note | Δ | Commentaire |
|---------|------|---|-------------|
| **Ingénieur** | **8 / 10** | +0,5 | Playwright CI + refactor modulaire (PR #24) + E2E jsdom flux métier. −2 pour E2E auth/Kanban navigateur, a11y, couverture auth. |
| **Commercial** | **6 / 10** | = | MVP riche, niche pertinente ; toujours pas de GTM ni traction utilisateur. |

---

### Ce qu'un recruteur retiendrait en 30 secondes

> Développeuse autonome qui livre un **produit complet** avec **201 tests Vitest**, **Playwright en CI**, refactor métier propre (analyse d'offres multi-plateformes), Supabase sécurisé (RLS, snapshots). Profil **junior confirmé qui monte en mid** — pas un clone de tuto, une vraie app déployée avec CI/CD et sens produit.

---

### Plan d'action (mis à jour)

#### Priorité immédiate

1. **Playwright auth** — login test → créer candidature → vérifier Kanban (1 spec suffit pour l'entretien)
2. **Tests unitaires par module** — ex. `extractCompany.test.ts`, `linkedInParser.test.ts`

#### Ensuite (entretien / mid)

3. Migrer `userGoals` vers Supabase
4. Audit a11y (axe-core) sur modales + navigation
5. `React.lazy` sur les pages lourdes (OutilsPostulations, Dashboard)

#### Produit commercial

6. Landing page ICP : _« CRM de recherche d'emploi — France Travail & coachs »_
7. Onboarding 3 étapes
8. 2–3 témoignages beta

---

### Verdict

**Progression nette** depuis le premier audit : tu as adressé deux des principaux gaps identifiés (E2E navigateur, monolithe analyzer). Le profil passe de « excellent portfolio junior » à « **candidat crédible pour un poste junior confirmé / début mid** ».

Ce qui manque encore pour un **mid confirmé en entreprise** :

- E2E **critiques** en Playwright (auth, parcours principal)
- Preuve de travail en **équipe** (revues, pair programming) — hors scope solo
- Dimension **produit / traction** si visée SaaS

En entretien, enchaîner : **Analyse offre (modules)** → **Candidature** → **Kanban (auto-move 15j)** → **Partage snapshot + RLS** → **CI (Vitest + Playwright)**.

---

### Ressources liées

- [`index.md`](index.md) — vue d'ensemble
- [`04-tech-strategie-tests.md`](04-tech-strategie-tests.md) — pyramide de tests
- [`06-tech-offer-analyzer-modules.md`](06-tech-offer-analyzer-modules.md) — refactor analyzer
- [`README.md`](../README.md) — doc produit
