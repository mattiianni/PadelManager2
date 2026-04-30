# Release Routine

## Stato corrente

- Versione attuale: `4.1.1`
- Formato incrementale successivo: `4.1.2`, `4.1.3`, `4.1.4`, ...
- Mese corrente di riferimento: `Apr 2026`

## Checklist

1. Aggiornare la versione in tutta l'app e nei materiali allegati.
2. Se il mese reale cambia, aggiornare anche il mese visibile nei riferimenti applicativi e documentali.
3. Aggiornare i file `.md` rilevanti e il `README.md`.
4. Eseguire build di verifica.
5. Creare backup `.zip` di ripristino.
6. Creare dump `.txt` completo file-per-file del codice.
7. Fare commit e push della versione locale corrente.

## Note operative

- I riferimenti UI che usano `APP_VERSION` si aggiornano dal valore definito in `constants.ts`.
- I riferimenti in `package.json` e `package-lock.json` vanno mantenuti coerenti con la release corrente.
- I riferimenti mese/anno nei PDF e nei footer vanno aggiornati solo quando il mese reale cambia.
