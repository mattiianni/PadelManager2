# Update Summary - 2026-05-01 - v4.1.2

## Highlights

- Versione bump: `4.1.1` -> `4.1.2`
- Matchday torneo a squadre mobile/PWA: footer azioni stabilizzato durante il salvataggio
- Sidebar desktop light: contrasto corretto e selezione attiva resa piu' evidente
- PWA riallineata agli asset PNG reali (`icon.png`, `elo_manager_wordmark.png`)
- Mese corrente aggiornato a `Mag 2026` nei riferimenti applicativi e documentali

## Files Updated

- `constants.ts`
- `package.json`
- `package-lock.json`
- `README.md`
- `RELEASE_ROUTINE.md`
- `components/layout/Sidebar.tsx`
- `components/layout/Header.tsx`
- `pages/TeamTournamentMatchdayPage.tsx`
- `pages/TournamentsPage.tsx`
- `index.html`
- `manifest.json`
- `vite.config.ts`
- `services/printService.ts`
- `scripts/generate-team-tournament-guide-pdf.mjs`
- `Padel_ELO_Manager_Presentazione.html`
- `Padel_ELO_Manager_Testi_Promo.txt`
- `public/icon.png`
- `public/elo_manager_wordmark.png`

## Notes

- Il mese reale e' passato a `Mag 2026`, quindi i riferimenti visibili sono stati aggiornati.
- La correzione sidebar resta confinata al desktop light; mobile drawer e dark mode mantengono il comportamento previsto.
