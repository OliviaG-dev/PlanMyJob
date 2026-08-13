## jsPDF & qrcode — export PDF et QR côté client

### Pourquoi ce choix

Permettre à un coach ou France Travail d'**ouvrir le lien** (QR) ou **archiver un PDF** sans backend dédié. Alternatives : print CSS seul (moins portable), PDF serveur (coût + infra).

### Première mise en place

```bash
npm install jspdf qrcode
npm install -D @types/qrcode
```

- `src/utils/sharePdf.ts` — PDF rapport candidature + helper `getQrDataUrl`
- `src/utils/monthlyReportPdf.ts` — PDF bilan mensuel (stats, sources, semaines, QR)
- `src/components/ShareQrCode/ShareQrCode.tsx` — affichage QR sur pages publiques

### Usage dans ce projet

| Page | Action |
|------|--------|
| `PublicShare` | Bouton « Télécharger PDF », carte QR + URL |
| `PublicMonthlyReport` | Idem pour bilan mensuel |
| Import dynamique | `await import("../../utils/sharePdf")` pour ne pas alourdir le bundle initial |

### Détails d'implémentation

- **QR** : `QRCode.toDataURL(url, { width: 200, color: { dark: "#3d3836", light: "#ffffff" } })` puis `doc.addImage` en bas de page PDF.
- **URLs longues** : `prepareLinkForPdfWrap()` insère des espaces après `/`, `?`, `&` pour le wrap jsPDF.
- **Nom de fichier** : slug ASCII (`PlanMyJob_Report_EXO_DEV.pdf`, `PlanMyJob_Bilan_Mars_2026.pdf`).
- **Pagination PDF** : helper `ensureSpace()` + `addPage()` pour les bilans avec beaucoup de semaines.

### Pièges rencontrés

- jsPDF ne gère pas bien les **URLs** ou textes longs sans `splitTextToSize`.
- Police par défaut (helvetica) : pas de serif du thème app — acceptable pour un export utilitaire.
- QR + PDF = async ; bouton avec état « Génération… » et gestion d'erreur utilisateur.

### Ce que j'ai retenu

- Réutiliser `getQrDataUrl` exporté depuis `sharePdf.ts` pour le bilan mensuel.
- Garder la génération PDF **pure** (entrée = snapshot déjà chargé) — testable sans Supabase.
- Tests unitaires sur `buildPdfFilename` / `buildMonthlyPdfFilename` uniquement (pas de snapshot visuel PDF en CI).

### Ressources

- [jsPDF](https://github.com/parallax/jsPDF)
- [node-qrcode](https://github.com/soldair/node-qrcode)
