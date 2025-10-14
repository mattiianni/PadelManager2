# Database Schema - Padel ELO Manager

## Database: Neon PostgreSQL

### Configurazione
- **Provider**: Neon Database (Serverless PostgreSQL)
- **Libreria**: `@neondatabase/serverless`
- **SSL**: Sempre abilitato
- **Ambiente**: Utilizzato sia in sviluppo che in produzione

### Variabile d'ambiente richiesta
```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

---

## Tabelle e Campi

### 1. **players** (Giocatori)
Gestisce i giocatori e i loro punteggi ELO.

| Campo | Tipo | Descrizione | Default |
|-------|------|-------------|---------|
| `id` | UUID | ID univoco (PK) | `gen_random_uuid()` |
| `name` | VARCHAR(255) | Nome del giocatore | - |
| `surname` | VARCHAR(255) | Cognome del giocatore | - |
| `position` | VARCHAR(50) | Posizione in campo (Dritto/Rovescio) | - |
| `initial_elo` | REAL | ELO iniziale | 1500 |
| `current_elo` | REAL | ELO corrente | 1500 |

**Vincoli:**
- NOT NULL su tutti i campi

---

### 2. **tournaments** (Tornei)
Gestisce i tornei e le loro informazioni.

| Campo | Tipo | Descrizione | Default |
|-------|------|-------------|---------|
| `id` | UUID | ID univoco (PK) | `gen_random_uuid()` |
| `name` | VARCHAR(255) | Nome del torneo | - |
| `type` | VARCHAR(100) | Tipo di torneo | - |
| `date` | TIMESTAMPTZ | Data e ora del torneo | - |
| `club` | VARCHAR(255) | Nome del club | - |
| `status` | VARCHAR(20) | Stato ('scheduled', 'completed') | 'scheduled' |
| `americano_fields` | INTEGER | Numero campi per Americano | NULL |
| `americano_scoring_type` | VARCHAR(20) | Tipo scoring Americano | NULL |
| `final_standings` | JSONB | Classifica finale | NULL |
| `giornata_name` | VARCHAR(255) | Nome giornata (per tornei multipli) | NULL |

**Tipi di torneo supportati:**
- `TorneOtto 30'` - K-factor: 16
- `Americano` - K-factor: 24
- `Round Robin + Finali` - K-factor: 28 (variabile per fase)
- `Friendly Match` - K-factor: 20
- `Beat the Box` - K-factor: 16
- `Torneo Libero`
- `Gironi + Fase Finale`

**Vincoli:**
- NOT NULL su `id`, `name`, `type`, `date`, `club`, `status`

---

### 3. **matches** (Partite)
Gestisce le partite giocate.

| Campo | Tipo | Descrizione | Default |
|-------|------|-------------|---------|
| `id` | UUID | ID univoco (PK) | `gen_random_uuid()` |
| `date` | TIMESTAMPTZ | Data e ora della partita | - |
| `team1_p1_id` | UUID | Player 1 del Team 1 (FK → players.id) | - |
| `team1_p2_id` | UUID | Player 2 del Team 1 (FK → players.id) | - |
| `team2_p1_id` | UUID | Player 1 del Team 2 (FK → players.id) | - |
| `team2_p2_id` | UUID | Player 2 del Team 2 (FK → players.id) | - |
| `sets` | JSONB | Array di punteggi per set | - |
| `winner` | VARCHAR(10) | Vincitore ('team1', 'team2', 'draw') | NULL |
| `tournament_id` | UUID | ID torneo (FK → tournaments.id) | NULL |

**Formato sets (JSONB):**
```json
[
  { "team1": 6, "team2": 4 },
  { "team1": 3, "team2": 6 }
]
```

**Vincoli:**
- NOT NULL su `id`, `date`, `sets`
- FOREIGN KEY con `ON DELETE CASCADE` per tutti i player_id
- FOREIGN KEY con `ON DELETE CASCADE` per `tournament_id`

---

### 4. **elo_history** (Storico ELO)
Traccia tutte le variazioni di ELO.

| Campo | Tipo | Descrizione | Default |
|-------|------|-------------|---------|
| `id` | UUID | ID univoco (PK) | `gen_random_uuid()` |
| `event_id` | UUID | ID evento (match_id o tournament_id) | - |
| `player_id` | UUID | ID giocatore (FK → players.id) | - |
| `elo_before` | REAL | ELO prima dell'evento | - |
| `elo_after` | REAL | ELO dopo l'evento | - |
| `delta` | REAL | Variazione ELO | - |
| `date` | TIMESTAMPTZ | Data e ora dell'evento | - |
| `type` | VARCHAR(50) | Tipo evento ('match', 'tournament', 'manual') | - |

**Tipi di evento:**
- `match`: Partita singola
- `tournament`: Torneo completo
- `manual`: Modifica manuale ELO

**Vincoli:**
- NOT NULL su tutti i campi
- FOREIGN KEY con `ON DELETE CASCADE` per `player_id`

---

## API Endpoints

### Players
- `GET /api/data` - Ottieni tutti i dati (players, matches, tournaments, eloHistory)
- `POST /api/players` - Aggiungi giocatore
- `PUT /api/players` - Aggiorna giocatore
- `DELETE /api/players` - Elimina giocatore

### Matches
- `POST /api/matches` - Aggiungi partita
- `PUT /api/matches` - Aggiorna punteggi partite
- `DELETE /api/matches` - Elimina partita (revert ELO)

### Tournaments
- `POST /api/tournaments/bulk-matches` - Crea torneo con partite
- `PUT /api/tournaments` - Aggiorna torneo
- `PUT /api/tournaments/complete` - Completa torneo e calcola ELO
- `DELETE /api/tournaments` - Elimina torneo (revert ELO)

### Utility
- `POST /api/reset-all-elo` - Reset completo di tutti gli ELO a 1500

---

## Sistema ELO

### Calcolo ELO
La formula ELO è implementata nella funzione `calculateEloChange()` in `server.js`:

```
expectedScore = 1 / (1 + 10^((elo2 - elo1) / 400))
delta = K_FACTOR * (actualScore - expectedScore)
```

### K-Factors per Tipo Torneo
- **TorneOtto 30'**: 16
- **Americano**: 24
- **Round Robin + Finali**: 
  - Round Robin: 10
  - Finale 1°-2°: Vincitore 32, Perdente 10
  - Finale 3°-4°: Vincitore 4, Perdente 24
- **Friendly Match**: 20
- **Beat the Box**: 16

### Sistema Isolato vs Globale
- **Beat the Box**: Usa sempre ELO globale corrente
- **Altri tornei con giornate**: Sistema isolato per giornata
  - Giornata 1: Parte da ELO 1500
  - Giornata N: Parte dall'ELO finale della giornata precedente
  - Ogni giornata aggiorna l'ELO globale con il delta totale

---

## Logging

Il sistema di logging è implementato in `/utils/logger.js` con:
- Livelli: debug, info, warn, error
- Colori e emoji per console
- Rotazione automatica file log
- Logging specifico per ELO, match, tournament

---

## Note Tecniche

1. **Cascade Delete**: Tutte le relazioni FK usano `ON DELETE CASCADE`
2. **UUID**: Tutti gli ID sono UUID v4 generati da PostgreSQL
3. **Timezone**: Tutti i timestamp sono `TIMESTAMPTZ` (timezone-aware)
4. **JSON**: I campi `sets` e `final_standings` usano JSONB per query efficienti
5. **Transazioni**: Le operazioni di torneo completamento sono atomiche


