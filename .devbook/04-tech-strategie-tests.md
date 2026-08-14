## Stratégie de tests (Vitest, intégration & E2E jsdom)

### Pourquoi ce choix

PlanMyJob tourne déjà sur **Vitest 4 + Testing Library + jsdom** dans la CI (`npm test`). Quand j'ai renforcé l'analyse LinkedIn et le flux « Analyser une offre → Créer une candidature », j'ai ajouté des tests **dans la même stack** plutôt qu'introduire Playwright tout de suite.

**Alternatives envisagées :**

| Option | Pour | Contre (dans ce repo, aujourd'hui) |
|--------|------|-------------------------------------|
| **Vitest + jsdom** (retenu) | Même runner que les 110+ tests existants, CI Node seule, exécution ~5 s | Pas de vrai navigateur, CSS/drag natif non garantis |
| **Playwright** | Parcours utilisateur réel, auth Supabase, drag Kanban natif | Nouvelle infra (config, browsers, job CI, compte test, plus lent) |
| **Cypress** | E2E riche | Même coût d'adoption que Playwright, absent du projet |

**Décision :** couvrir le flux métier critique en **intégration + E2E Vitest** d'abord ; compléter avec **Playwright** pour auth Supabase réelle, drag Kanban natif et pages publiques en vrai navigateur.

### Playwright E2E (navigateur) — `e2e/`

Mise en place après Vitest : `@playwright/test`, Chromium, job CI `Playwright E2E`.

```
e2e/
├── public-pages.spec.ts       /share et /bilan (token invalide + valide)
└── helpers/env.ts             tokens publics optionnels
```

Commandes :

```bash
npm run test:e2e              # Chromium headless (port dev 4173)
npm run test:e2e:ui           # mode UI Playwright
npm run test:e2e:headed     # navigateur visible
```

Variables `.env` (optionnelles — tests skippés si absentes) :

| Variable | Usage |
|----------|--------|
| `PLAYWRIGHT_PUBLIC_SHARE_TOKEN` | Rapport public `/share/:token` valide |
| `PLAYWRIGHT_PUBLIC_BILAN_TOKEN` | Bilan mensuel `/bilan/:token` valide |

**Répartition Vitest vs Playwright :**

| Besoin | Vitest jsdom | Playwright |
|--------|--------------|------------|
| Logique `offerAnalyzer`, services mockés | ✅ | — |
| Flux Analyse → Kanban (mocks) | ✅ `tests/e2e/` | — |
| Login, drag Kanban, parcours authentifiés | ✅ mockés | — (volontairement) |
| Pages publiques vs vraie API | partiel (mock) | ✅ `e2e/public-pages.spec.ts` |

**Piège Playwright :** le port 5173 est souvent pris par `npm run dev` → config sur **4173** (`playwright.config.ts` → `webServer`).

### Première mise en place (état du projet)

- **Runner :** Vitest 4 (`package.json` → `npm test`)
- **UI :** `@testing-library/react` + environnement `jsdom` (`/* @vitest-environment jsdom */`)
- **CI :** GitHub Actions job `Lint, test & build` exécute `npm run test`
- **Couverture (optionnelle) :** `npx vitest run --coverage` → ~71 % statements au moment de la doc

Commandes utiles :

```bash
npm test                                          # toute la suite
npm test -- src/lib/offerAnalyzer.test.ts         # un fichier
npm test -- tests/integration/                    # intégration
npm test -- tests/e2e/                            # E2E jsdom
npx vitest run --coverage                         # rapport de couverture
```

### Les 4 niveaux de tests dans PlanMyJob

```
tests/
├── (racine src/)     *.test.ts(x)     → unitaires + composants
├── integration/      flux multi-pages mockés
├── e2e/              parcours app (Layout + sidebar + Kanban)
├── fixtures/offers/  textes d'offres (HelloWork, France Travail)
└── helpers/          builders + assertions réutilisables
```

#### 1. Tests unitaires — `src/lib/` et `src/utils/`

- **Rôle :** logique pure ou services Supabase **mockés** (`vi.mock("./supabase")`).
- **Exemples :** `offerAnalyzer.test.ts` (extraction LinkedIn, HelloWork, France Travail), `candidatures.test.ts`, `shareSnapshot.test.ts`.
- **Pourquoi :** rapides, stables, ciblent les régressions métier (ex. mauvais poste « Logo de l'entreprise » sur LinkedIn).

#### 2. Tests composants / interactions — pages

- **Rôle :** rendu React + clics (`fireEvent`, `waitFor`), Auth et API mockées.
- **Exemples :** `Candidatures.interactions.test.tsx`, `Kanban.interactions.test.tsx`, `AddCandidatureModal.test.tsx`.
- **Pattern :** `MemoryRouter` + `vi.mock("../../contexts/AuthContext")` + `vi.mock("../../lib/candidatures")`.

#### 3. Tests d'intégration — `tests/integration/offer-import.integration.test.tsx`

- **Rôle :** enchaîner **extraction → formulaire → modal → insert** sans monter tout l'App.
- **4 scénarios ajoutés :**
  1. Fixture fichier `hellowork-basic.txt` → `extractedToFormData` avec `statut: "cv_envoye"`
  2. Fixture LinkedIn (LITY) → poste, localisation, CDI, hybride
  3. Router state `addWithInitialData` → modal prérempli → submit
  4. Page **Analyse** → navigation **Candidatures** → submit avec `cv_envoye`

- **Pourquoi un fichier dédié :** le todo `it.todo` existait ; les helpers `tests/helpers/builders.ts` et `assertions.ts` étaient prêts mais non branchés.

#### 4. E2E Vitest (jsdom) — `tests/e2e/application-flow.e2e.test.tsx`

- **Rôle :** parcours **plus proche de l'utilisateur** que l'intégration :
  - `Layout` + sidebar
  - Analyse → Candidatures → **Kanban**
  - store partagé : `insertCandidature` alimente `fetchCandidatures` pour la page suivante

- **Scénario :** coller offre HelloWork → extraire → créer → vérifier **Activus Group** dans la colonne **CV envoyé** du Kanban.

- **Ce n'est pas Playwright :** pas de Chromium ; navigation et DOM simulés. Le fichier s'appelle `*.e2e.test.tsx` pour marquer l'intention « bout en bout applicatif ».

### Choix métier testés (bug corrigé + non-régression)

Deux chemins existaient pour le statut par défaut :

| Chemin | Statut par défaut |
|--------|-------------------|
| Ajout manuel (`AddCandidatureModal.defaultFormData`) | `cv_envoye` |
| Import via Analyse (`extractedToFormData`) | était `a_postuler` → corrigé en **`cv_envoye`** |

Les tests d'intégration et E2E **verrouillent** que le flux « Extraire les informations → Créer une candidature » aboutit bien au Kanban **CV envoyé**, pas « À postuler ».

### Helpers et fixtures

| Fichier | Usage |
|---------|--------|
| `src/lib/testFixtures.ts` | Constantes TS (HelloWork, France Travail, LinkedIn LITY) |
| `tests/fixtures/offers/*.txt` | Même contenu en fichiers pour tests « import fichier » |
| `tests/helpers/builders.ts` | `buildExtractedOffer()` pour payloads partiels |
| `tests/helpers/assertions.ts` | `expectOfferCoreFields()`, `expectCandidatureInKanbanColumn()` |

`expectCandidatureInKanbanColumn` cherche un `h3` de colonne contenant le libellé (ex. « CV envoyé ») puis l'entreprise dans `.kanban__column` — le titre accessible inclut le compteur (« CV envoyé 1 »).

### Pièges rencontrés en écrivant les tests

- **Fichier `.ts` avec JSX :** les tests UI doivent être en `.test.tsx`, sinon esbuild échoue sur `<MemoryRouter>`.
- **Sidebar masquée :** en jsdom, les liens nav sont `aria-hidden` → `getByRole("link", { name: "Kanban", hidden: true })`.
- **Auto-move Kanban 15 jours :** si `cvEnvoyeAt` est trop ancien dans le mock, le Kanban appelle `updateCandidature` au chargement et casse le test → utiliser **`new Date().toISOString()`** pour une candidature fraîche.
- **Doublon « CV envoyé » :** après création, le libellé apparaît dans la liste Candidatures et dans le select du modal → assertions ciblées (`#add-statut`) plutôt que `getByText` global.

### Ce que j'ai retenu

- **Un todo `it.todo` sans infra = dette invisible** ; mieux vaut un test Vitest jsdom qu'un placeholder vide.
- **Intégration vs E2E (dans ce projet) :**
  - *Intégration* = pages + routes, mocks simples ;
  - *E2E jsdom* = Layout, navigation sidebar, état partagé entre pages, assertion Kanban.
- **Playwright reste le bon outil** pour : login Supabase réel, drag & drop natif, pages publiques — Vitest jsdom ne remplace pas le navigateur.
- **Tester le bon couplage :** quand deux modules (`defaultFormData` vs `extractedToFormData`) définissent la même règle métier, un seul test unitaire ne suffit pas ; il faut un test de **flux**.

### Lacunes connues (hors scope actuel)

- Pas de tests sur `Analyse.tsx` isolé (couvert par intégration + E2E Vitest + Playwright).
- `lib/monthlyReport.ts`, PDF (`sharePdf`, `monthlyReportPdf`) peu couverts.
- Pas de hooks testés unitairement (`useCandidaturesBoard`, etc.) — couverture indirecte via pages.
- Playwright : pas de régressions visuelles (screenshots) ni multi-navigateurs (Firefox, WebKit).
- Pas de tests Playwright authentifiés (login, Kanban drag) — couverts par Vitest jsdom.

### Prochaines explorations tests

- Screenshots Playwright sur les pages publiques (optionnel).
- Couvrir le téléchargement PDF en E2E si besoin portfolio.

### Ressources

- [Vitest](https://vitest.dev/)
- [Testing Library — React](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/)
