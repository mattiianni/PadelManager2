# Update Summary - 2026-05-01 - v4.1.3

## Release

- Versione bump: `4.1.2` -> `4.1.3`
- Mese di riferimento invariato: `Mag 2026`

## Modifiche principali

- Admin:
  - cancellazione workspace con conferma esplicita
  - protezione contro cancellazione del workspace attuale
  - protezione contro cancellazione dell'ultimo workspace disponibile
- Access codes:
  - aggiunta scadenza rapida `Nessuna / 8h / 24h / 48h / 7 giorni`
  - login bloccato per codici scaduti
  - stato UI distinto `Attivo / Scaduto / Disattivato`
- Mobile/PWA:
  - form `Genera Nuovo Codice` riposizionato per layout piu' chiaro
- PWA/assets:
  - `public/icon.svg` allineata all'icona PNG attuale
- Repository:
  - rimossa la cartella `Tutorials`, da rifare in seguito

## Note operative

- La cancellazione di un workspace continua ad affidarsi al cascade del database per eliminare anche i codici associati.
- Le sessioni gia' aperte restano valide fino a scadenza JWT anche se il codice di accesso scade dopo il login.
