# Branch protection — `master`

**Repo** : [OliviaG-dev/PlanMyJob](https://github.com/OliviaG-dev/PlanMyJob)  
**Réglages** : [Settings → Branches](https://github.com/OliviaG-dev/PlanMyJob/settings/branches)

Check à exiger : **`Lint, test & build`**

## Workflow après activation

```bash
git checkout -b feat/ma-fonctionnalite
git push -u origin feat/ma-fonctionnalite
# → Ouvrir une PR → CI ✅ → Preview Vercel en commentaire → Merge
```
