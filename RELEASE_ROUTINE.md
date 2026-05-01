# Release Routine

## Stato corrente

- Versione attuale: `4.1.3`
- Formato incrementale successivo: `4.1.4`, `4.1.5`, `4.1.6`, ...
- Mese corrente di riferimento: `Mag 2026`

## Checklist

1. Aggiornare la versione in tutta l'app e nei materiali allegati.
2. Se il mese reale cambia, aggiornare anche il mese visibile nei riferimenti applicativi e documentali.
3. Aggiornare i file `.md` rilevanti e il `README.md`.
4. Aggiornare l'HTML guida utente (`Padel_ELO_Manager_Guida_V4.1.html`) e, se serve, esportarne il PDF aggiornato nella cartella alias/distribuzione.
5. Eseguire build di verifica.
6. Creare backup `.zip` di ripristino.
7. Creare dump `.txt` completo file-per-file del codice.
8. Fare commit e push della versione locale corrente.

## Note operative

- I riferimenti UI che usano `APP_VERSION` si aggiornano dal valore definito in `constants.ts`.
- I riferimenti in `package.json` e `package-lock.json` vanno mantenuti coerenti con la release corrente.
- I riferimenti mese/anno nei PDF e nei footer vanno aggiornati solo quando il mese reale cambia.
- La guida HTML V4.1 va mantenuta sia nel repo sia nella cartella alias `App TorneOtto 3.0` usata per la distribuzione.
