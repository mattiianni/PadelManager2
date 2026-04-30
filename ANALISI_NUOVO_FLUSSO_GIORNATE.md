# Flusso Giornate

Documento aggiornato al flusso effettivamente presente oggi nell'app.

## Flusso attuale

1. Da `TournamentsPage` si puo':
   - aprire il draw generico
   - inserire una nuova giornata su un torneo esistente
   - gestire un `Torneo a Squadre` (root + giornate)
2. `DrawPage`:
   - selezione partecipanti
   - scelta modalita' draw
   - generazione o conferma coppie
   - (solo "nuovo torneo") avvio `Torneo a Squadre` da "Opzioni sorteggio coppie"
3. `TournamentFlow`:
   - selezione formato
   - setup torneo o giornata
   - scoring / fasi successive
4. salvataggio calendario o completamento torneo

### Flusso Torneo a Squadre

Il Torneo a squadre e' separato dal flow `TournamentFlow` dei tornei a coppie:

1. `DrawPage` crea un torneo "root" (record in `tournaments`) + `team_tournament_configs`
2. In `TournamentsPage` il root mostra `+ Completa configurazione` finche' non e' completata
3. Dopo il completamento:
   - si abilita `+ Inserisci Giornata` per creare le singole giornate (calendario o risultati)
   - le giornate sono record separati in `tournaments` collegati al root via `team_tournament_root_id`
4. Le giornate sono elencate sotto "Gestione torneo" e sono ordinate dalla meno recente alla piu' recente

## Supporto giornate esistenti

L'app supporta l'apertura del draw con `preselectedTournamentName`, usato per:

- creare una nuova giornata su una serie esistente
- precompilare il contesto torneo nel flow successivo

## Serie torneo

La continuita' tra giornate si basa su:

- `tournament.name` per i tornei standard
- `giornata_name` per i casi che la usano esplicitamente, come `Torneo Libero`
- per `Torneo a Squadre` il raggruppamento avviene tramite `team_tournament_root_id`

## ELO tra giornate

Per calcolare gli starting ELO:

- il backend usa `POST /api/tournaments/starting-elos`
- cerca la giornata completata piu' recente della stessa serie
- se non trova nulla, parte da `1500`

## Note

- questo file non descrive piu' una proposta futura
- descrive solo il comportamento attualmente presente in app
