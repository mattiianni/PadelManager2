# Implementazione ELO

Documento allineato al comportamento attuale di `server.js`.

## Formula

```text
Expected = 1 / (1 + 10^((elo2 - elo1) / 400))
Delta = K * (score - expected)
```

Risultati supportati:

- vittoria: `1`
- pareggio: `0.5`
- sconfitta: `0`

Il calcolo usa la media ELO delle due coppie.

## K-factor attuali

### Fissi

| Tipo | K |
|---|---:|
| `Friendly Match` | 20 |
| `TorneOtto 30'` | 16 |
| `Americano` | 24 |
| `Beat the Box` | 16 |
| `Torneo Libero` | 24 |

### `Round Robin + Finali`

| Fase | K |
|---|---:|
| round robin | 10 |
| finale 1°-2° vincitore | 32 |
| finale 1°-2° perdente | 10 |
| finale 3°-4° vincitore | 4 |
| finale 3°-4° perdente | 24 |

### `Gironi + Fase Finale`

| Fase | K |
|---|---:|
| gironi | 14 |
| semifinali | 20 |
| finale 1°-2° vincitore | 38 |
| finale 1°-2° perdente | 10 |
| finale 3°-4° vincitore | 8 |
| finale 3°-4° perdente | 20 |

## ELO globale vs ELO di serie

Il sistema oggi usa due livelli logici:

### 1. ELO di giornata/serie

Quando un torneo viene completato:

- se e' la prima giornata della serie, ogni giocatore parte da `1500`
- se esiste una giornata completata precedente della stessa serie, il giocatore parte dall'`elo_after` di quella giornata
- durante il completamento torneo il backend calcola l'ELO interno della giornata usando questi valori iniziali

La ricerca della giornata precedente usa:

- `giornataName` se presente
- altrimenti `tournament.name`

### 2. ELO globale

Alla fine del torneo:

- il backend salva un record `elo_history` di tipo `tournament` per ogni giocatore
- aggiorna `players.current_elo` sommando il delta totale del torneo

Quindi:

```text
current_elo = 1500 + somma di tutti i delta storici del workspace
```

## Tipi di record in `elo_history`

- `match`: partite singole fuori torneo
- `tournament`: delta totale del torneo completato
- `manual`: modifica manuale ELO da UI admin/players

## Match singoli

`POST /api/matches` calcola immediatamente l'ELO solo se il match non appartiene a un torneo.

Se `tournamentId` e' presente:

- il match viene salvato
- l'ELO resta in attesa
- il calcolo avviene in `PUT /api/tournaments/complete` o nel bulk flow del torneo

## Tornei completati

Il path principale e' `POST /api/tournaments/bulk-matches`:

- crea il torneo
- salva i match
- calcola gli starting ELO corretti per la serie
- processa tutti i match in ordine
- salva `elo_history`
- aggiorna `players.current_elo`
- porta il torneo a `completed`

## Cascade reset

Per tornei multi-fase l'endpoint `POST /api/tournaments/cascade-reset`:

- reverte i delta `tournament` dal `current_elo`
- elimina i record `elo_history` del torneo
- rimette il torneo a `scheduled`
- elimina i match di fase successiva passati dal frontend

Questo permette di correggere gironi, box o round robin e poi rigenerare semifinali/finali.

## Ricalcolo globale

L'endpoint admin `POST /api/admin/recalculate-elos` riallinea `current_elo` a:

```text
1500 + SUM(delta) su elo_history
```

Serve come manutenzione in caso di disallineamento.
