# Partage sécurisé de candidature

Fonctionnalité de lien public en lecture seule pour partager une candidature (France Travail, recruteur, coach…).

## Installation Supabase

Exécuter le script SQL dans **Supabase Dashboard → SQL → New query** :

```
supabase/migrations/20260813120000_shares.sql
```

Cela crée :

- la table `shares`
- les policies RLS (accès propriétaire authentifié)
- les RPC `create_share`, `get_public_share`, `revoke_share`

## Utilisation

1. Ouvrir une fiche candidature
2. Cliquer **Partager**
3. Choisir la durée (24 h, 7 j, 30 j, jamais)
4. Optionnel : ajouter des notes publiques
5. Copier le lien `https://…/share/<token>`

La page publique affiche un snapshot figé, une timeline, un QR code et permet de télécharger `PlanMyJob_Report.pdf`.

## Dépannage — erreur 404 sur create_share

Si tu vois `POST .../rpc/create_share 404`, c'est un problème de signature PostgREST.  
**Depuis la v2 du code**, la création passe par un **insert direct** dans `shares` (plus fiable).  
Seule la lecture publique utilise encore `get_public_share`.

Exécute aussi (optionnel, sécurité renforcée) :

```
supabase/migrations/20260813130000_shares_insert_policy.sql
```

## Dépannage — erreur 404 (général)

Dans l'onglet **Network** du navigateur, clique sur la requête en rouge. Si l'URL contient `supabase.co/rest/v1/` :

| URL | Cause probable |
|-----|----------------|
| `/rest/v1/shares` | Table `shares` absente ou cache API non rechargé |
| `/rest/v1/rpc/create_share` | Fonction RPC absente ou cache API non rechargé |
| `/rest/v1/rpc/get_public_share` | Idem |

**Correctifs :**

1. Ré-exécuter **tout** le script `supabase/migrations/20260813120000_shares.sql` (pas seulement une partie).
2. Vérifier dans SQL Editor :

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'shares';

SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('create_share', 'get_public_share', 'revoke_share');
```

Les 3 requêtes doivent retourner des lignes.

3. Recharger le cache API : **Project Settings → API → Reload schema** (ou attendre ~30 s après le SQL).
4. Vérifier que `.env` pointe vers le **même projet** Supabase que celui où tu as exécuté la migration (`VITE_SUPABASE_URL`).

Si l'URL 404 est `/share/...` sur **planmyjob.app** (sans supabase.co), le code n'est pas encore déployé en production — tester en local (`npm run dev`) ou merger et déployer.


- Token aléatoire 256 bits (généré côté Postgres)
- Snapshot JSON figé à la création (pas de données live)
- Pas de SELECT anon direct sur `shares` — lecture publique via RPC uniquement
- Révocation réservée à l'utilisateur authentifié propriétaire
- Page publique : `noindex, nofollow`
