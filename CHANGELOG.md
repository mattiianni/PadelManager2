# Changelog

Questo file consolida gli storici precedentemente salvati come `UPDATE_SUMMARY_*.md`.

## v4.1.5 — 2026-06-19

- Deploy: Configurato deploy su Vercel e risolte incompatibilità Serverless (incluso pass a `bcryptjs`).
- Admin: Evidenziato l'accesso di utenti non-admin nell'Audit Log con pill rossa.
- UI Layout: Allineato il nome del workspace sotto versione e data nell'header desktop.
- Riferimenti versione aggiornati a `4.1.5` e data a `Giu 2026`.

## v4.1.4 — 2026-05-01

- Admin: tab `Invia dati` + API per copiare un torneo tra workspace (dati indipendenti).
- UI Stitch: classe `.stitch-row` riutilizzabile applicata a righe interne (Top 5) e alle card giornate in `Tornei`.
- Statistiche: pill `Dati parziali` con contrasto corretto anche in dark.

## v4.1.3 — 2026-05-01

- Admin: cancellazione workspace con conferma e guardrail (non attuale, non ultimo).
- Access codes: scadenza rapida (`Nessuna / 8h / 24h / 48h / 7 giorni`), login bloccato per scaduti, stato UI `Attivo / Scaduto / Disattivato`.
- Mobile/PWA: form `Genera Nuovo Codice` riposizionato.
- PWA/assets: `public/icon.svg` riallineata al PNG.

## v4.1.2 — 2026-05-01

- Matchday torneo a squadre mobile/PWA: footer azioni stabilizzato durante il salvataggio.
- Sidebar desktop light: contrasto corretto e selezione attiva piu' evidente.
- PWA: icone/manifest riallineati agli asset PNG reali.
- Mese riferimento aggiornato a `Mag 2026`.

## v4.1.1 — 2026-04-30

- Header: metadata alleggeriti e icone leggermente piu' scure.
- Dashboard: KPI principali riallineati al colore del titolo.

## v4.1.0 — 2026-04-30

- Versioning: nuova routine patch-first (4.1.0 -> 4.1.1 -> ...).
- Reskin UI consolidato (Stitch) senza cambiare logica applicativa.
- Light mode: contrasto corretto nelle aree reskinnate.
- PWA: refresh piu' aggressivo e asset coerenti.

## v4.0.12 — 2026-04-30

- Presentazione HTML: link reale allo sviluppatore (mailto) + versione aggiornata.

## v4.0.11 — 2026-04-30

- Tornei a squadre (eliminazione diretta): fix fixture con BYE e propagazione turni.
- Admin: endpoint reset bracket eliminazione diretta.
- PDF: stampa esplicita `BYE` al posto di placeholder.
- UX mobile: back/chiusura risultati rientrano su `Tornei`.
- Header: titolo mobile-first (una riga su iPhone/PWA).

## v4.0.10 — 2026-04-28

- iOS PWA safe-area: spostato padding bottom nel main scroll container (senza cambiare sizing interno).

## v4.0.9 — 2026-04-27

- Mobile/PWA: fix overflow data su form tornei linkati e team/playoff.
- Team tournament: action bar mobile migliorata; `Modifica Risultati` instradato alla matchday page dedicata.
- Header mobile: sticky piu' sicuro (safe area) e scroll isolation migliore.
- Sidebar mobile: layering corretto (drawer sopra header).
