# Beat the Box

Documento allineato all'implementazione corrente.

## Stato

`Beat the Box` e' implementato e supportato in UI, backend e stampa PDF.

## Regole attuali

- numero coppie: pari
- minimo: 4 coppie
- K-factor: `16`
- salvataggio come torneo di tipo `Beat the Box`

## Flusso

1. Draw crea le coppie.
2. `TournamentFlow` abilita il formato `Beat the Box` solo se il numero di coppie e' valido.
3. `BeatTheBoxFlow` gestisce:
   - animazione iniziale
   - fase box
   - eventuali semifinali
   - finali
4. Il completamento salva match, torneo ed ELO.

## Distribuzione box

La logica e' in `services/beatTheBoxService.ts`.

Caratteristiche:

- ordinamento coppie per ELO
- distribuzione nei box
- creazione partite round robin per box
- calcolo classifiche box
- generazione delle fasi finali in base al numero di box

## Stampa

Funzioni disponibili:

- `printBeatTheBoxBlank`
- `printBeatTheBoxComplete`

## Recupero e modifica

- i tornei `Beat the Box` compaiono in `MatchesPage`
- i match vengono raggruppati per box usando `groupMatchesByPlayerSets`
- se necessario, il sistema ricalcola il `winner` dai set
- i tornei completati possono essere riaperti tramite cascade reset
