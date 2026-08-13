## Supabase — liens publics (shares & bilans mensuels)

### Pourquoi ce choix

Partager une candidature ou un bilan sans compte invité, tout en gardant le contrôle (expiration, désactivation, snapshot figé). Alternative écartée : page authentifiée « invité » — trop lourde pour France Travail / coach.

### Première mise en place

1. Migrations SQL dans `supabase/migrations/` :
   - `20260813120000_shares.sql` — table `shares`, RLS, RPC `get_public_share`
   - `20260813130000_shares_insert_policy.sql` — policy INSERT renforcée
   - `20260813140000_monthly_reports.sql` — table `monthly_reports`, RPC `get_public_monthly_report`
2. Après exécution : `NOTIFY pgrst, 'reload schema';` (ou reload via Dashboard API).
3. Front : `src/lib/share.ts`, `src/lib/monthlyReport.ts`, hooks `useActiveShares`, `useMonthlyReports`.

### Usage dans ce projet

| Élément | Fichiers |
|---------|----------|
| Création lien candidature | `ShareModal`, `lib/share.ts`, insert `shares` |
| Page publique candidature | `/share/:token` → `PublicShare`, RPC `get_public_share` |
| Bilan mensuel | `DashboardMonthlyReports`, `lib/monthlyReport.ts`, `utils/monthlyReportSnapshot.ts` |
| Page publique bilan | `/bilan/:token` → `PublicMonthlyReport` |
| Désactivation | `revoked_at` mis à jour ; RPC renvoie `{ error: "revoked" }` |

### Modèle de sécurité

- Token 256 bits, unique, non devinable.
- Colonne `snapshot jsonb` remplie **à la création** — la page publique ne relit jamais `candidatures` en direct.
- RLS : utilisateur authentifié = CRUD sur ses lignes ; **anon** = aucun SELECT table.
- Lecture publique = RPC `SECURITY DEFINER` qui vérifie token, expiration, révocation.

### Pièges rencontrés

- **404 sur `/rpc/create_share`** : signature PostgREST ; contourné par insert direct dans `shares` (voir `docs/share-feature.md`).
- **Oubli reload schema** : table créée en SQL mais API ne la voit pas → erreurs REST 404.
- **Regénérer un bilan** : un seul lien actif par mois — implémenté en révoquant l'ancien enregistrement avant insert.
- **Stats « offres »** : clé ajoutée après premiers snapshots ; UI fallback `offres ?? 0`, regénération nécessaire pour stats à jour.

### Ce que j'ai retenu

- Toujours documenter l'ordre des migrations et le reload schema dans le README.
- Messages utilisateur « désactivé » plutôt que « révoqué » ; technique reste `revoked_at`.
- Paginer les listes dashboard (2 liens/page) pour ne pas surcharger l'écran.

### Ressources

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
- Doc projet : `docs/share-feature.md`
