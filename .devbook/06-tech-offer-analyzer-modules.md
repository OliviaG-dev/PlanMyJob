## offerAnalyzer — refactor modulaire

### Pourquoi ce choix

Le fichier monolithique `src/lib/offerAnalyzer.ts` (~810 lignes) mélangeait détection de source, parsing LinkedIn, extraction France Travail, regex salaire/expérience et mapping formulaire. Difficile à tester unitairement par brique et à faire évoluer (ex. ajouter un parser Indeed dédié).

**Alternative envisagée :** garder un seul fichier avec des sections commentées — rejetée car la dette grossissait à chaque plateforme (LinkedIn surtout).

**Décision :** dossier `src/lib/offerAnalyzer/` avec un module par responsabilité, orchestrateur central, barrel `offerAnalyzer.ts` à la racine de `lib/` pour ne pas casser les imports existants.

### Première mise en place

```
src/lib/
├── offerAnalyzer.ts              # réexport public (9 lignes)
└── offerAnalyzer/
    ├── index.ts                  # API publique du dossier
    ├── types.ts                  # ExtractedOffer, LinkedInHeader
    ├── constants.ts              # keywords stack, patterns contrat/télétravail, bruit LinkedIn
    ├── textHelpers.ts            # looksLikeJobTitle, looksLikeCompany, etc.
    ├── inferSource.ts            # inferSourceFromUrl, inferSourceFromText, isFranceTravailOffer
    ├── linkedInParser.ts         # isLinkedInJobPaste, parseLinkedInHeader
    ├── extractPoste.ts
    ├── extractCompany.ts         # section Employeur France Travail incluse
    ├── extractLocation.ts
    ├── extractSkills.ts
    ├── extractContract.ts        # typeContrat + teletravail
    ├── extractSalary.ts          # salaire + URL candidature
    ├── extractExperience.ts
    ├── extractKeyPoints.ts
    ├── extractOfferFromText.ts   # orchestrateur (ordre d'extraction inchangé)
    └── extractedToFormData.ts
```

Imports consommateurs **inchangés** :

```ts
import { extractOfferFromText, inferSourceFromUrl } from "../../lib/offerAnalyzer";
```

### Usage dans ce projet

| Élément | Fichiers |
|---------|----------|
| Page Analyse | `src/pages/Analyse/Analyse.tsx` |
| Outils postulations | `OfferAnalyzerSection.tsx` |
| Modal candidature (source URL, compétences) | `AddCandidatureModal.tsx` |
| Lettres de motivation (keywords) | `src/utils/motivationLetter.ts` |
| Tests unitaires | `src/lib/offerAnalyzer.test.ts` |
| Tests intégration import | `tests/integration/offer-import.integration.test.tsx` |
| Fixtures | `src/lib/testFixtures.ts` |

### Plateformes supportées

| Source | Détection | Parsing dédié |
|--------|-----------|---------------|
| **LinkedIn** | URL + texte + heuristiques copier-coller | ✅ `linkedInParser.ts` (logo, « · il y a X jours », hybride, bruit UI) |
| **France Travail** | URL + texte + `Offre n°` | ✅ Employeur, poste ligne 2, salaire mensuel/cachet, exclusion n° offre comme salaire |
| **Indeed** | URL (`fr.indeed.com`, `smartapply.indeed.com`) + texte | Extracteurs génériques (pas de parser Indeed séparé pour l'instant) |
| HelloWork, WTTJ, site entreprise | URL + texte | Extracteurs génériques |

### Flux d'extraction (`extractOfferFromText`)

Ordre conservé par rapport au monolithe (régression évitée par 24 tests unitaires + 4 intégration) :

1. Normaliser texte → lignes
2. Détecter France Travail / LinkedIn
3. Si LinkedIn → `parseLinkedInHeader` (poste, entreprise, localisation, télétravail, contrat)
4. En-tête générique (ligne 1 = poste, ligne 2 = entreprise)
5. Poste France Travail (`Offre n°` + ligne suivante)
6. Localisation depuis lignes puis patterns
7. Poste (regex + fallback lignes)
8. Entreprise (Employeur FT, patterns « X recherche… »)
9. Contrat + télétravail (patterns + override LinkedIn)
10. Compétences, points clés, salaire, URL, source

### Tests et fixtures

| Fixture | Plateforme | Vérifie |
|---------|------------|---------|
| `LINKEDIN_FULLSTACK_OFFER_FIXTURE` | LinkedIn | LITY, Paris, hybride, CDI, 80k, filtre bruit |
| `FRANCE_TRAVAIL_CDD_OFFER_FIXTURE` | France Travail | Brive, mensuel, débutant accepté |
| `HELLOWORK_BASIC_OFFER_FIXTURE` | HelloWork | Toulouse, salaire, Exp. 3 ans |
| `INDEED_BASIC_OFFER_FIXTURE` | Indeed | Lyon, hybride, source URL + compétence `java` |

```bash
npm test -- src/lib/offerAnalyzer.test.ts
npm test -- tests/integration/offer-import.integration.test.tsx
```

### Pièges rencontrés

- **Ordre d'extraction** — poste et entreprise s'influencent mutuellement ; l'orchestrateur doit garder la séquence du monolithe, pas seulement déléguer à des fonctions isolées.
- **Apostrophes typographiques** — regex LinkedIn (`l'entreprise` vs `l'entreprise`) : les tests LinkedIn servent de filet.
- **Barrel vs dossier** — TypeScript résout `offerAnalyzer.ts` avant `offerAnalyzer/index.ts` ; le fichier barrel à la racine de `lib/` est obligatoire pour compatibilité.
- **Indeed sans parser dédié** — la fixture Indeed verrouille la détection source + extracteurs génériques ; un futur `indeedParser.ts` pourra s'ajouter sans toucher l'API publique.

### Ce que j'ai retenu

- Refactor **par extraction de fonctions pures** d'abord, orchestrateur ensuite — plus sûr que de tout réécrire d'un coup.
- Garder un **point d'entrée stable** (`offerAnalyzer.ts`) évite un churn d'imports dans toute l'app.
- Une fixture par **plateforme majeure** (LinkedIn, France Travail, HelloWork, Indeed) documente le comportement attendu mieux qu'un long commentaire.
- `extractedToFormData` isolé rappelle que le mapping UI (statut `cv_envoye`) est une responsabilité distincte de l'extraction.

### Prochaines explorations

- Parser Indeed dédié si les copier-coller Indeed deviennent bruyants (comme LinkedIn).
- Tests unitaires **par module** (`extractCompany.test.ts`) en plus du fichier d'intégration global.
- Exposer `isFranceTravailOffer` / `isLinkedInJobPaste` en interne testable si besoin debug UI.

### Ressources

- [`04-tech-strategie-tests.md`](04-tech-strategie-tests.md) — stratégie tests import d'offre
- [`README.md`](../README.md) — section « Analyse d'offre »
