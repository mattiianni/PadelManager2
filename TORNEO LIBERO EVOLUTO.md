# TORNEO LIBERO EVOLUTO

## Obiettivo

Evolvere `Torneo Libero` da semplice elenco lineare di partite a formato piu' flessibile, capace di ricostruire meglio la struttura reale dell'evento.

Nota di naming:

- il nome visibile del formato nell'app resta sempre `Torneo Libero`
- la dicitura `Evoluto` serve solo come etichetta interna di progetto per distinguere questo refactor dalla versione attuale
- quindi non e' previsto alcun cambio naming in UI, PDF, menu o flussi utente

Oggi il torneo libero permette di:

- creare un numero arbitrario di partite
- usare coppie fisse oppure coppie a girare
- inserire risultati
- chiudere il torneo
- aggiornare ELO
- stampare PDF

Il limite attuale e' che tutte le partite finiscono in un unico elenco "piatto", senza alcuna distinzione di fase, blocco o contesto.

L'obiettivo del refactor e':

- introdurre `Sezioni di gioco`
- permettere di assegnare le partite a una sezione
- migliorare UI e PDF
- mantenere il Torneo Libero come formato flessibile e non pre-strutturato

---

## Concetto Chiave

Il `Torneo Libero Evoluto` non impone uno schema sportivo predefinito.

Non e':

- round robin obbligatorio
- bracket obbligatorio
- gironi obbligatori

Resta un contenitore libero, ma con una struttura descrittiva in piu':

- il torneo e' composto da `sezioni`
- ogni sezione contiene `partite`

Esempi di sezioni:

- `FASE ELIMINATORIA 1 CAMPO 2`
- `SEMIFINALE A`
- `FINALISSIMA`
- `SPAREGGI`
- `TABELLONE ARGENTO`
- `ULTIME PARTITE`

Questo permette di ricostruire a posteriori la logica reale dell'evento senza dover inventare un formato rigido.

---

## Esperienza Utente Desiderata

### Stato attuale

Oggi il flusso e':

1. scelgo numero partite
2. creo elenco partite
3. inserisco punteggi
4. salvo o chiudo torneo

Problema:

- il torneo resta un elenco secco
- non si capisce quali partite appartengono a una fase o a un blocco logico

### Stato desiderato

In fase di inserimento risultati, l'utente deve poter:

1. inserire una sezione
2. dare un nome libero alla sezione
3. aggiungere una o piu' partite sotto quella sezione
4. inserire un'altra sezione
5. aggiungere altre partite
6. chiudere il torneo solo quando ritiene conclusa la costruzione dell'evento

Esempio:

- `FASE ELIMINATORIA 1 CAMPO 2`
- partita 1
- partita 2
- `FINALISSIMA`
- partita finale
- `SPAREGGIO TERZO POSTO`
- partita

---

## Punto Fondamentale Di Prodotto

Il refactor non deve obbligare l'utente a conoscere tutto il torneo all'inizio.

Questo significa:

- la stima iniziale delle partite puo' restare solo un punto di partenza
- l'utente puo' decidere piu' avanti come organizzare davvero il torneo
- la vera struttura deve emergere nella schermata di inserimento risultati

In pratica:

- l'inizio puo' restare leggero
- la struttura definitiva nasce durante la compilazione

Questa e' la filosofia giusta per il Torneo Libero.

---

## Decisioni Fissate

Per questo progetto sono gia' confermate queste regole:

- in chiusura torneo, ogni partita deve appartenere obbligatoriamente a una sezione
- nel `fixed`, la classifica finale resta sempre di coppia
- nel `rotating`, la classifica finale resta sempre individuale
- nella prima versione, le sezioni seguono l'ordine di creazione
- il PDF in bianco mostra solo le partite, senza blocchi note aggiuntivi
- il pulsante finale si chiama sempre `Chiudi Torneo`

Queste decisioni vanno considerate parte strutturale del formato, non preferenze opzionali.

---

## Comportamento Desiderato

### All'inizio

L'utente puo' ancora:

- impostare nome torneo
- scegliere coppie fisse o a girare
- impostare una stima del numero di partite

Ma quella stima non deve piu' essere l'unica struttura del torneo.

### Durante inserimento risultati

La schermata deve permettere:

- `+ Inserisci Sezione`
- campo testo libero per nome sezione
- dentro ogni sezione:
  - `+ Aggiungi Partita`
  - elenco partite della sezione

### Alla fine

L'utente preme:

- `Chiudi Torneo`

e in quel momento:

- backend aggiorna ELO
- calcola classifica finale
- genera PDF coerenti con le sezioni

---

## Scelta Architetturale Consigliata

Le sezioni devono diventare entita' vere del torneo, non semplice testo decorativo.

Quindi non basta:

- aggiungere un titolo visivo in frontend

Serve invece:

- modello dati delle sezioni
- relazione tra sezione e partite
- salvataggio persistente
- uso di questa struttura anche in stampa

---

## Modello Dati Proposto

### Nuova entita': Sezione

Ogni torneo libero puo' avere 0 o piu' sezioni.

Ogni sezione ha:

- id
- tournamentId
- titolo
- ordine

Ogni partita del torneo libero deve poter sapere:

- a quale sezione appartiene
- in che ordine sta dentro la sezione

### Struttura concettuale

```ts
interface TorneoLiberoSection {
    id: string;
    tournamentId: string;
    title: string;
    sortOrder: number;
}

interface TorneoLiberoMatchDraft {
    id: string;
    sectionId: string | null;
    sortOrder: number;
    mode: 'fixed' | 'rotating';
    team1: [string, string] | null;
    team2: [string, string] | null;
    sets: SetScore[];
    winner: 'team1' | 'team2' | 'draw' | null;
    status: 'draft' | 'completed';
}
```

### Nota importante

Nel Torneo Libero Evoluto:

- la sezione non cambia la logica ELO
- la sezione non cambia il tipo di match
- la sezione serve a organizzare il torneo a livello logico, visivo e documentale

---

## Persistenza Database Proposta

Per non forzare il formato dentro la tabella `matches`, propongo due tabelle dedicate.

### Tabella sezioni

```sql
CREATE TABLE torneo_libero_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Collegamento partite -> sezione

Due strade possibili.

#### Opzione A

Aggiungere campi alla tabella `matches`:

```sql
ALTER TABLE matches
ADD COLUMN libero_section_id UUID NULL REFERENCES torneo_libero_sections(id) ON DELETE SET NULL,
ADD COLUMN libero_match_order INTEGER NULL;
```

#### Opzione B

Tabella ponte dedicata:

```sql
CREATE TABLE torneo_libero_match_meta (
    match_id UUID PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
    section_id UUID NULL REFERENCES torneo_libero_sections(id) ON DELETE SET NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Scelta consigliata

Preferisco `Opzione B`:

- isola meglio il comportamento del Torneo Libero
- non sporca la tabella `matches` con campi usati solo da un formato
- lascia piu' margine per evoluzioni future

---

## UX Proposta

### Schermata iniziale

Può restare simile a oggi:

- nome torneo libero
- modalita' coppie
- numero partite stimato

Ma il pulsante finale potrebbe cambiare concettualmente da:

- `Crea X partite`

a qualcosa di piu' flessibile:

- `Apri Struttura Torneo`

oppure:

- `Vai a Inserimento Risultati`

### Schermata risultati evoluta

La schermata nuova deve avere struttura a blocchi:

1. header torneo
2. lista sezioni
3. dentro ogni sezione, lista partite
4. pulsanti aggiunta

Schema:

```text
Torneo Libero: Summer Night

+ Inserisci Sezione

[SEZIONE]
Titolo: FASE ELIMINATORIA 1 CAMPO 2

+ Aggiungi Partita
Partita 1
Partita 2

[SEZIONE]
Titolo: FINALISSIMA

+ Aggiungi Partita
Partita 1

[CHIUDI TORNEO]
```

---

## UI Dettagliata

### Sezione

Ogni sezione deve apparire come blocco distinto e riconoscibile.

Contenuti:

- titolo sezione
- eventuale modifica titolo
- eventuale elimina sezione
- pulsante `+ Aggiungi Partita`
- lista partite della sezione

### Partita

Ogni partita dentro la sezione mantiene la logica attuale:

- coppie fisse oppure a girare
- selezione team/giocatori
- inserimento set
- calcolo vincitore

### Sezione senza partite

Va consentita temporaneamente, ma:

- in chiusura torneo si puo' ignorare
- oppure mostrare warning

Scelta consigliata:

- mantenerla durante editing
- ignorarla automaticamente in chiusura se vuota

---

## Comportamento Di Editing

### Aggiungi sezione

Quando l'utente preme `+ Inserisci Sezione`:

- si crea un blocco nuovo
- con titolo iniziale vuoto o placeholder
- focus immediato sul campo titolo

### Aggiungi partita

Quando l'utente preme `+ Aggiungi Partita` dentro una sezione:

- si crea una nuova partita vuota
- collegata a quella sezione
- con ordinamento interno progressivo

### Ordine

Le sezioni devono avere:

- ordine verticale

Le partite dentro la sezione devono avere:

- ordine progressivo interno

Evoluzione futura possibile:

- drag and drop sezioni
- drag and drop partite

Ma non serve nella prima versione.

---

## Back-end Proposto

### Stato iniziale

Oggi `handleTorneoLiberoConfirm` crea direttamente tutte le partite in un colpo e chiude il torneo.

Questo modello non basta piu' per la versione evoluta.

### Stato desiderato

Serve distinguere due momenti:

1. struttura in editing
2. chiusura torneo

Quindi il backend del Torneo Libero deve poter:

- salvare struttura sezioni
- salvare partite in bozza
- aggiornare sezioni e partite
- chiudere torneo solo alla fine

In chiusura:

- non devono esistere partite fuori sezione
- la validazione deve bloccare il completamento se una partita non e' agganciata a una sezione

### API proposte

```http
POST   /api/torneo-libero/:tournamentId/sections
PUT    /api/torneo-libero/sections/:sectionId
DELETE /api/torneo-libero/sections/:sectionId

POST   /api/torneo-libero/:tournamentId/sections/:sectionId/matches
PUT    /api/torneo-libero/matches/:matchId
DELETE /api/torneo-libero/matches/:matchId

POST   /api/torneo-libero/:tournamentId/finalize
GET    /api/torneo-libero/:tournamentId/structure
```

### Finalizzazione

Quando l'utente preme `Chiudi Torneo`, il backend:

1. verifica che ci siano partite valide
2. verifica che ogni partita completa abbia team e punteggi coerenti
3. salva/aggiorna match e metadati sezione
4. aggiorna ELO
5. calcola classifica finale
6. marca il torneo come `completed`

---

## Regole Classifica

Richiesta fissata:

- classifica sulla base di `%`
- poi `games vinti`
- poi `games persi`

### Interpretazione consigliata

Ordinamento:

1. `percentuale vittorie`
2. `games vinti`
3. `games persi` crescente

In pratica:

- chi vince di piu' sale
- a parita', premiamo chi ha fatto piu' games
- a ulteriore parita', premiamo chi ne ha subiti meno

### Per coppie fisse

La classifica resta per coppia.

### Per coppie a girare

La classifica resta individuale, come oggi.

### Formula percentuale

Per coppie:

- `% vittorie = partite vinte / partite giocate`

Per giocatore singolo in rotating:

- `% vittorie = vittorie / partite giocate`

### Pseudocodice ordinamento

```ts
rows.sort((a, b) => {
    if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
    if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
    if (a.gamesLost !== b.gamesLost) return a.gamesLost - b.gamesLost;
    return a.label.localeCompare(b.label);
});
```

---

## Impatto Su ELO

Il comportamento desiderato resta semplice:

- ogni partita reale aggiorna ELO
- la sezione non influisce sul calcolo ELO

Quindi:

- le sezioni servono a organizzare
- l'ELO continua a dipendere solo dai match effettivamente disputati

Questo e' importante per evitare effetti collaterali.

---

## PDF Nuovi

Il refactor deve cambiare anche i PDF.

### PDF in bianco

Oggi il Torneo Libero stampa un tabellone vuoto lineare.

Nel formato evoluto la stampa in bianco deve poter avere:

- intestazione torneo
- elenco sezioni
- sotto ogni sezione, blocchi partita vuoti
- campi nome squadra / giocatori
- caselle punteggio
- nessuna area note extra nella prima versione

Esempio:

```text
FASE ELIMINATORIA 1 CAMPO 2
Partita 1: [ ] vs [ ]   [ ]-[ ]
Partita 2: [ ] vs [ ]   [ ]-[ ]

FINALISSIMA
Partita 1: [ ] vs [ ]   [ ]-[ ]
```

### PDF completo

Il PDF finale deve mostrare:

- torneo
- sezioni nell'ordine corretto
- partite raggruppate sotto la sezione giusta
- risultati
- classifica finale

Questo risolve il problema del PDF "scialbo" a elenco unico.

### Stile consigliato

Per coerenza con il resto dell'app:

- intestazione classica PDF
- sezioni ben separate
- titolo sezione visibile
- tabella partite piu' compatta
- classifica finale sotto

---

## UI e PDF: Logica Comune

Le sezioni non devono essere solo una decorazione frontend.

Devono essere la stessa struttura usata da:

- schermata risultati
- schermata tornei
- stampa in bianco
- stampa finale

Questo e' il punto che garantisce coerenza.

---

## Integrazione Con Schermata Tornei

Nel riepilogo di `Tornei`, il Torneo Libero potrebbe mostrare:

- nome torneo
- data
- numero sezioni
- numero partite

Nel PDF o nel dettaglio:

- elenco delle sezioni
- conteggio partite per sezione

Possibile testo:

- `3 sezioni - 7 partite`

---

## Strategia Di Implementazione

### Fase 1

Introdurre il modello dati:

- sezioni
- collegamento partite-sezioni

### Fase 2

Refactor UI inserimento risultati:

- aggiunta sezioni
- aggiunta partite dentro sezioni

### Fase 3

Finalizzazione torneo:

- save
- chiusura
- classifica
- ELO

### Fase 4

PDF:

- blank
- complete

### Fase 5

Rifiniture:

- editing titolo sezione
- gestione sezioni vuote
- miglioramento riepilogo in `Tornei`

---

## Scelta Tecnica Consigliata

Per la prima versione, consiglio una via pragmatica:

- mantenere il setup iniziale quasi invariato
- spostare la vera evoluzione nella schermata risultati
- introdurre sezioni vere persistenti
- non cercare di ridisegnare tutto il Torneo Libero dall'inizio

Questo riduce il rischio e rispetta la tua richiesta: la struttura vera nasce alla fine, quando stai davvero costruendo il torneo.

---

## Criticita' Da Tenere D'Occhio

### 1. Partite fuori sezione

Non sono consentite in finalizzazione.

Regola:

- ogni partita deve appartenere a una sezione prima di `Chiudi Torneo`

### 2. Sezioni vuote

Da tollerare in editing, ma ignorare o segnalare in chiusura.

Scelta consigliata per la prima versione:

- tollerate durante editing
- ignorate automaticamente in chiusura se restano vuote

### 3. Doppio uso del numero partite iniziale

Il numero iniziale non deve piu' essere rigido.

Meglio trattarlo come:

- stima iniziale
- oppure rimuoverlo in una fase futura

### 4. Compatibilita' con i tornei liberi gia' esistenti

I vecchi tornei resteranno:

- senza sezioni
- stampati con fallback lineare

I nuovi tornei evoluti useranno:

- sezioni
- layout nuovo

Questa retrocompatibilita' e' importante.

---

## Conclusione

Il `Torneo Libero Evoluto` non deve diventare un nuovo formato rigido.

Deve restare libero, ma finalmente con una grammatica interna:

- il torneo e' fatto di sezioni
- ogni sezione contiene partite
- UI e PDF raccontano questa struttura
- la chiusura torneo produce ELO e classifica finale

Questa e' la direzione giusta per trasformare il Torneo Libero da elenco generico a formato davvero utile per eventi reali, senza perdere la flessibilita' che oggi lo rende prezioso.
