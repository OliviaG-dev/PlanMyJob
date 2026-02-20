# Documentation complète — Générateur de lettre de motivation (débutant)

Cette fonctionnalité permet de créer une **lettre de motivation semi-automatique** dans `Outils Postulations`, sans écrire tout le texte à la main.

Le principe est simple : tu remplis quelques champs, puis l'app génère une base personnalisée que tu peux ensuite modifier.

---

## 1) Objectif de la feature

Le générateur t'aide à :

- gagner du temps sur chaque candidature
- éviter la page blanche
- adapter la lettre à une offre précise
- garder une structure pro (objet, intro, corps, conclusion)
- obtenir un score indicatif de "matching"

Ce n'est pas une IA externe : c'est un moteur intelligent basé sur des templates + logique de sélection.

---

## 2) Où trouver la feature

Dans la page `Ressources` -> bloc **Mail / lettre de motivation**.

---

## 3) Parcours utilisateur (pas à pas)

### Étape 1 — Remplir le mini formulaire

Champs principaux :

- **Poste visé** (ex: Frontend Developer React)
- **Entreprise** (ex: PlanMyJob)
- **3 compétences clés**
- **1 réalisation importante**
- **Pourquoi cette entreprise ?**

Champs optionnels :

- **Offre d'emploi** (texte collé de l'annonce)
- **Ton souhaité** (`Auto`, `Classique`, `Moderne`, `Startup`)
- **Années d'expérience**

### Étape 2 — Cliquer sur "Générer la lettre"

L'app produit une lettre complète avec :

- objet
- formule d'introduction
- paragraphes adaptés
- formule de fin

### Étape 3 — Modifier manuellement

La lettre générée est **éditable** directement dans la zone de texte.

### Étape 4 — Copier

Tu peux copier la version finale avec le bouton **Copier**.

---

## 4) À quoi sert chaque champ (version débutant)

### Champs obligatoires

- **Poste visé** : injecté dans l'objet et les phrases principales
- **Entreprise** : injectée dans l'intro et la motivation
- **Compétences** : utilisées dans le corps de la lettre
- **Réalisation** : phrase "preuve" qui valorise ton impact
- **Motivation** : explique pourquoi tu veux cette entreprise

### Champs optionnels

- **Offre d'emploi**
  - détecte les mots-clés de l'annonce
  - priorise les compétences qui matchent dans la lettre
  - active la détection automatique de ton (si `Ton = Auto`)
  - améliore la pertinence du score de matching
- **Ton souhaité**
  - `Classique` = plus formel
  - `Moderne` = plus direct / actuel
  - `Startup` = plus dynamique / impact
  - `Auto` = ton estimé depuis l'annonce
- **Années d'expérience**
  - utilisé surtout pour affiner le score de matching

---

## 5) Comment la génération fonctionne (simple)

Le moteur suit 4 étapes :

1. détecter les mots-clés de l'offre (si fournie)
2. choisir un style de blocs selon le ton (`intro`, `body`, `closing`)
3. injecter les variables (poste, entreprise, skills, réalisation, motivation)
4. retourner une lettre complète prête à éditer

---

## 6) Templates dynamiques (idée clé)

Le générateur utilise des blocs de phrases :

- plusieurs phrases possibles pour l'introduction
- plusieurs phrases possibles pour le corps
- plusieurs phrases possibles pour la conclusion

Puis il sélectionne une variante selon les infos saisies (logique "seed"), ce qui donne des lettres légèrement différentes d'un cas à l'autre.

Résultat : rendu plus naturel sans dépendre d'une API d'IA.

---

## 7) Adaptation à l'offre d'emploi

Quand tu colles une annonce :

- l'app compare tes compétences au texte de l'offre
- les compétences trouvées sont remontées en priorité
- une phrase spécifique peut mentionner explicitement ces points
- l'interface affiche les mots-clés détectés

Exemple :

- Offre contient `React`, `autonomie`, `travail en équipe`
- Si tu as ces compétences, elles seront mises en avant automatiquement

---

## 8) Score de matching (ce que ça signifie)

Le score affiché est un **indicateur interne**, pas une vérité absolue.

Il combine :

- **compétences matchées** entre ton profil saisi et l'annonce
- **stack détectée** (technos / outils connus dans l'offre)
- **expérience** (si mention de niveau type "X ans" + champ renseigné)

Il sert à te guider pour améliorer ta candidature.

---

## 9) Détection automatique du ton

Si `Ton = Auto` et qu'il y a une offre :

- mots type `challenge`, `innovation`, `agile` -> tendance `Startup`
- mots type `rigueur`, `process`, `conformité` -> tendance `Classique`
- mots type `mission`, `impact`, `durable` -> tendance `Moderne`

Le ton détecté est affiché dans les badges du résultat.

---

## 10) Bonnes pratiques pour de meilleurs résultats

- mets des compétences concrètes (`React`, `TypeScript`, `Tests`, etc.)
- écris une réalisation mesurable (`+22% conversion`, `-30% bugs`, etc.)
- colle une offre complète quand possible
- relis et personnalise toujours avant envoi
- adapte la formule finale au contexte (mail court vs lettre complète)

---

## 11) Limites actuelles (normal pour une V1)

- pas d'export PDF intégré dans ce bloc (pour l'instant)
- score indicatif, non "scientifique"
- détection de ton basée sur mots-clés (heuristique simple)
- nécessite une relecture humaine (important)

---

## 12) Cas d'usage recommandé

Utiliser ce générateur comme base :

- **80% automatique** (structure + phrases + adaptation)
- **20% humain** (personnalisation finale selon entreprise/offre)

C'est ce mix qui donne les meilleurs résultats en candidature réelle.

---

## 13) FAQ rapide

- **Je peux générer sans offre d'emploi ?**  
  Oui, complètement. L'offre est optionnelle.

- **Pourquoi mon score est bas ?**  
  Souvent : compétences trop génériques, offre non collée, ou expérience non renseignée.

- **Je dois garder le texte tel quel ?**  
  Non. Le but est de te fournir une excellente base à ajuster.

---

## 14) Explication du code (pour débutant)

Cette partie explique **qui fait quoi dans le code** de `src/pages/OutilsPostulations/OutilsPostulations.tsx`.

### 14.1 Les types (la base)

- `LetterTone` : définit les tons autorisés (`classic`, `modern`, `startup`)
- `GenerateLetterInput` : décrit toutes les données nécessaires pour générer une lettre
- `LetterBlock` : structure les templates en 3 parties (`intro`, `body`, `closing`)

Pourquoi c'est utile : TypeScript vérifie automatiquement que les fonctions reçoivent les bonnes données.

### 14.2 Les constantes importantes

- `TONE_LABELS` : convertit les valeurs techniques en libellés lisibles dans l'UI
- `LETTER_BLOCKS` : stocke toutes les phrases modèles par ton
- `STARTUP_TONE_HINTS`, `CLASSIC_TONE_HINTS`, `MISSION_TONE_HINTS` : mots-clés pour détecter le ton
- `KNOWN_STACK_KEYWORDS` : liste de technos/outils détectés dans une offre

Pourquoi c'est utile : toute la logique métier est centralisée, facile à maintenir.

### 14.3 Fonctions utilitaires (petits outils)

- `normalizeText(value)`  
  Met en minuscule et retire les accents pour comparer des textes proprement.

- `buildSeed(input)`  
  Fabrique un nombre "empreinte" à partir des champs saisis.

- `pickBySeed(options, seed)`  
  Choisit une phrase dans une liste en fonction du seed.

Pourquoi c'est utile : on obtient des variantes de texte stables, sans hasard total.

### 14.4 Fonctions d'analyse de l'offre

- `detectKeywords(offerText, userSkills)`  
  Retourne les compétences utilisateur trouvées dans l'offre.

- `detectToneFromOffer(offerText)`  
  Compte les mots-clés par catégorie puis choisit le ton dominant.

- `extractOfferStackMatches(offerText)`  
  Cherche les technos connues (`React`, `TypeScript`, etc.) dans l'offre.

Pourquoi c'est utile : la lettre devient plus pertinente pour le recruteur.

### 14.5 Fonction de scoring

- `computeMatchingScore(input)`  
  Calcule un score (%) à partir de :
  - ratio de compétences matchées
  - stack détectée
  - expérience (si l'offre mentionne "X ans")

Le score est volontairement simple : il guide, mais ne remplace pas un jugement humain.

### 14.6 Fonctions de génération

- `injectTemplate(template, values)`  
  Remplace `{{company}}`, `{{position}}`, `{{skillsList}}` dans une phrase.

- `generateLetter(data)`  
  Fonction principale qui :
  1. priorise les compétences matchées
  2. choisit les blocs selon le ton
  3. injecte les variables dans les templates
  4. assemble l'objet + salutation + paragraphes + formule finale

Résultat : une lettre complète en texte brut, directement éditable.

### 14.7 Le composant React d'interface

- `MotivationGeneratorSection()` gère l'écran complet :
  - états du formulaire (`position`, `company`, `skills`, `offerText`, etc.)
  - état du résultat (`generatedLetter`, `matchingScore`, `matchedSkills`)
  - actions utilisateur :
    - `handleGenerate()` pour lancer la génération
    - `handleCopy()` pour copier la lettre

Il remplace l'ancien placeholder via `<MotivationGeneratorSection />` dans la page.

---

## 15) Flux technique complet (de la saisie au résultat)

1. L'utilisateur remplit le formulaire.
2. `handleGenerate()` construit un objet `GenerateLetterInput`.
3. Si `ton = auto`, le composant appelle `detectToneFromOffer()`.
4. `generateLetter()` produit le texte de la lettre.
5. `computeMatchingScore()` calcule le score et les matches.
6. L'UI affiche :
   - la lettre editable
   - les badges (score, ton utilisé, ton détecté)
   - les mots-clés détectés
7. `handleCopy()` envoie le texte dans le presse-papiers.

---

## 16) Conseils pour modifier le code sans casser

- Ajouter un nouveau ton :
  - étendre `LetterTone`
  - ajouter son libellé dans `TONE_LABELS`
  - ajouter ses templates dans `LETTER_BLOCKS`
  - ajouter sa logique de détection (optionnel)

- Ajouter de nouveaux mots-clés stack :
  - compléter `KNOWN_STACK_KEYWORDS`

- Ajuster la formule du score :
  - modifier uniquement `computeMatchingScore()`
  - garder une borne min/max pour éviter les scores incohérents

- Garder une bonne DX :
  - préférer des fonctions pures (testables)
  - éviter de mélanger logique métier et JSX
  - conserver les noms explicites déjà en place
