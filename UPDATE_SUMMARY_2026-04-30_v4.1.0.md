# Update Summary - 2026-04-30 - v4.1.0

## Highlights

- Versione bump: `4.0.12` -> `4.1.0`
- Definita la nuova routine di versioning:
  - release corrente `4.1.0`
  - prossima release `4.1.1`
  - incrementi successivi su patch
- Consolidato il reskin Stitch mantenendo la logica applicativa invariata
- Corretto il contrasto in light mode nelle aree reskinnate
- PWA aggiornata con asset coerenti e refresh automatico piu' aggressivo
- Repository GitHub allineata alla versione locale corrente

## Files Updated

- `constants.ts`
- `package.json`
- `package-lock.json`
- `README.md`
- `components/layout/Header.tsx`
- `services/printService.ts`
- `scripts/generate-team-tournament-guide-pdf.mjs`
- `Padel_ELO_Manager_Presentazione.html`
- `Padel_ELO_Manager_Testi_Promo.txt`

## Notes

- Il mese corrente resta `Apr 2026`, quindi i riferimenti data/mese visibili non cambiano in questa release.
- La PWA continua a restare disattivata nel dev server, ma e' pronta e auto-aggiornante in build production.
