# Update Summary - 2026-04-30 - v4.0.11

## Highlights

- Tornei a squadre (ELIMINAZIONE DIRETTA): fix gestione fixture con BYE (niente slot “bucati”) e propagazione coerente ai turni successivi.
- Reset bracket eliminazione diretta (admin): endpoint per rigenerare un tabellone incoerente senza ricreare il torneo.
- PDF tabellone eliminazione diretta: nei casi `squadra vs BYE` e `BYE vs BYE` stampa esplicita di `BYE` al posto di placeholder tipo `Vincente ...`.
- UX mobile: nei flussi giornata torneo a squadre, back/chiusura risultati tornano a `Tornei`.
- Header: titolo “Padel Elo Manager” con sizing mobile-first (una riga su iPhone PWA).

## Notes

- Versione bump: `4.0.10` → `4.0.11`
