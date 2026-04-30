# PROGETTO BRACKET

## Obiettivo

Definire una progettazione chiara e coerente per introdurre in ELO Manager un sistema di tabellone a eliminazione diretta con `bye`, applicabile in futuro sia:

- ai tornei `Singolo / A Coppie`
- ai `Tornei a Squadre`

senza rompere la logica attuale dell'app e mantenendo coerenza tra:

- UI
- PDF
- gestione risultati
- aggiornamento ELO

Nota fondamentale:

- nel documento, `partecipante` significa sempre l'unita' sportiva che occupa uno slot del tabellone
- nel `Torneo a Squadre`, il partecipante e' una squadra composta da X giocatori e gioca una sfida su X partite interne
- nei tornei `Singolo / A Coppie`, il partecipante e' una coppia composta sempre da 2 giocatori
- quindi, quando si parla di seed, bye, bracket e avanzamento, non si intende necessariamente una persona singola

---

## Regola Base: ELO Coppia

Regola fissata:

- `ELO coppia = ELO giocatore 1 + ELO giocatore 2`

Questa regola serve per:

- ordinare le coppie per forza
- assegnare i seed
- distribuire i `bye`

Non serve invece per il calcolo diretto dell'ELO post-partita, che continua a lavorare sugli ELO individuali dei giocatori.

---

## Cos'è un Bye

Nel tabellone a eliminazione diretta, quando il numero dei partecipanti non è una potenza di 2, alcune posizioni vengono riempite con un `BYE`.

Chi affronta un `BYE`:

- non gioca davvero una partita
- passa automaticamente al turno successivo
- non genera ELO
- non genera score
- non genera statistiche partita

Quindi il `BYE` non è una partita vinta 6-0 6-0: è semplicemente un avanzamento automatico di tabellone.

---

## Dimensione Del Tabellone

Il tabellone va costruito sulla prossima potenza di 2 disponibile.

Esempi:

- 2 partecipanti -> tabellone da 2
- 3 o 4 partecipanti -> tabellone da 4
- 5, 6, 7, 8 partecipanti -> tabellone da 8
- 9-16 partecipanti -> tabellone da 16
- 17-32 partecipanti -> tabellone da 32

Formula concettuale:

- `bracketSize = prossima potenza di 2 >= numero partecipanti`

Numero di bye:

- `byeCount = bracketSize - numeroPartecipanti`

Esempi pratici:

- 5 coppie -> tabellone 8 -> 3 bye
- 6 coppie -> tabellone 8 -> 2 bye
- 10 coppie -> tabellone 16 -> 6 bye

---

## Seeding Stile ATP

L'obiettivo è replicare una logica di tabellone simile a quella ATP.

Regole principali:

- seed 1 e seed 2 su lati opposti del tabellone
- seed 3 e 4 in metà opposte
- seed 5-8 distribuiti nei quarti corretti
- i seed successivi riempiono gli slot residui
- i `bye` vengono assegnati ai seed più alti

Questa è la regola voluta per i tornei `Singolo / A Coppie`.

### Criterio di seed per coppie

Ordine seed:

- seed 1 = coppia con ELO più alto
- seed 2 = seconda coppia
- seed 3 = terza coppia
- ecc.

Calcolo:

- `ELO coppia = somma dei due ELO`

### Esempio

Con 6 coppie:

- tabellone da 8
- 2 bye
- i bye vanno a seed 1 e seed 2
- gli altri 4 giocano il primo turno reale

Con 5 coppie:

- tabellone da 8
- 3 bye
- i bye vanno a seed 1, 2 e 3
- seed 4 contro seed 5 come unico match reale del primo turno

---

## Regola Fondamentale Dei Bye

Un `BYE` deve apparire nel tabellone, ma non deve produrre una partita reale.

Quindi:

- appare come `BYE` nel bracket
- non è cliccabile come match editabile
- non genera record partita reale
- non genera score
- non genera ELO
- non compare nelle stampe come match con risultato
- fa avanzare automaticamente l'avversario al turno successivo

Questa è una distinzione fondamentale per evitare incoerenze tra UI, statistiche e PDF.

---

## Tornei Singolo / A Coppie: Flusso Proposto

### Flusso logico desiderato

1. l'utente sceglie il numero di coppie
2. il sistema genera o compone le coppie
3. il sistema calcola l'ELO di coppia
4. il sistema ordina le coppie per seed
5. costruisce il tabellone alla prossima potenza di 2
6. assegna i bye alle coppie migliori
7. mostra il bracket completo
8. genera solo i match reali del primo turno
9. i bye fanno avanzare automaticamente le coppie
10. si procede turno per turno fino alla finale

### Finale

Per i tornei `Singolo / A Coppie` la fase conclusiva desiderata è:

- solo finale `1°-2°`
- nessuna finale `3°-4°`

Quindi il formato è un'eliminazione diretta pura.

---

## UI Proposta Per Singolo / Coppie

### Schermata bracket

Elementi da mostrare:

- nome torneo
- data
- circolo
- formato: `Eliminazione Diretta`
- numero coppie
- dimensione tabellone
- eventuale indicazione seed

### Struttura visiva

Bracket orizzontale con colonne:

- Primo turno
- Ottavi / Quarti
- Semifinali
- Finale

Ogni box match mostra:

- nome coppia 1
- nome coppia 2
- seed piccolo
- eventuale `BYE`
- evidenziazione del vincitore

### Mobile

Su mobile il bracket deve essere:

- scrollabile orizzontalmente
- leggibile
- pulito
- con box compatti

### Desktop

Su desktop può avere resa più piena, stile ATP:

- lati opposti
- finale centrale
- linee di collegamento più evidenti

---

## PDF Proposto Per Singolo / Coppie

### Variante 1: Bracket Puro

Documento dedicato al tabellone:

- nome torneo in alto
- data e circolo
- tabellone centrato
- `BYE` visibili
- finale centrale
- stile pulito e tecnico

### Variante 2: Report Con Tabellone

Documento più completo:

- intestazione classica app
- piccolo riepilogo torneo
- tabellone sotto
- eventualmente vincitori/finalisti in fondo

### Stile consigliato

Per coerenza con i PDF storici:

- struttura sobria
- blu/grigio
- niente look da dashboard web
- bracket centrale e ordinato

---

## Gestione Risultati Per Singolo / Coppie

Flusso corretto:

1. il primo turno mostra solo i match reali
2. chi ha `BYE` è già qualificato al turno successivo
3. quando si chiudono i match del turno, il turno successivo si popola
4. se un risultato viene modificato, il ramo successivo va resettato
5. i vincitori successivi vengono ricalcolati

Questo è importante per evitare incoerenze nel bracket.

---

## Classifiche Finali Per Singolo / Coppie

Per il formato desiderato:

- `1°` = vincitore finale
- `2°` = finalista sconfitto
- gli altri possono essere classificati solo per turno raggiunto

Possibile rappresentazione:

- Vincitore
- Finalista
- Semifinalisti
- Quarti di finale

Senza ulteriori spareggi, non esiste una classifica precisa completa oltre il 2° posto.

---

## ELO Nei Tornei Singolo / Coppie

Regola desiderata:

- ELO si aggiorna solo sui match realmente giocati
- nessun ELO sui bye

Quindi:

- il seed usa l'ELO coppia come somma
- il match usa sempre l'ELO individuale dei giocatori
- il bye non tocca il rating

---

## Torneo a Squadre: Compatibilità Con Eliminazione Diretta

### Domanda chiave

Il sistema attuale di `3` o `5` partite per giornata è compatibile con un torneo a eliminazione diretta con bye?

Risposta:

- sì

Perché il `bye` agisce sul livello di tabellone tra squadre, non sul contenuto della giornata.

Quindi:

- la sfida `Squadra A vs Squadra B` rimane sempre strutturata come oggi
- dentro restano `3` o `5` sub-match
- il bye salta solo la creazione di una giornata in quel turno

Quando la squadra arriva al turno successivo, lì gioca normalmente la sua giornata a 3 o 5 partite.

---

## Torneo a Squadre: Flusso Proposto

### Logica generale

1. si crea il tabellone squadre
2. si assegnano i seed
3. si assegnano i bye alle squadre migliori
4. il bracket mostra tutte le fasi
5. i turni con bye non generano giornate
6. i match reali generano giornate come oggi
7. i vincitori avanzano
8. finale unica oppure struttura prevista dal torneo

### Stato attuale favorevole

Il sistema team ha già una base forte:

- `fixtures`
- dipendenze tra turni
- propagazione vincitori
- reset rami successivi

Quindi il lato squadre è la base migliore per la prima implementazione.

---

## UI Proposta Per Torneo a Squadre

Bracket simile a quello singoli/coppie, ma con:

- nomi squadra
- indicazione turno
- stato partita:
  - `BYE`
  - `Da giocare`
  - `In corso`
  - `Completata`

Ogni nodo reale del bracket può aprire:

- la giornata
- il riepilogo
- l'inserimento risultati

I nodi con bye:

- non sono editabili
- mostrano solo l'avanzamento automatico

---

## PDF Proposto Per Torneo a Squadre

Due documenti distinti ma coerenti:

### 1. PDF Bracket Torneo

- tabellone complessivo
- turni
- bye
- finale

### 2. PDF Giornata

- dettagli della singola sfida tra squadre
- le 3 o 5 partite interne

In questo modo:

- il bracket racconta la struttura del torneo
- il PDF giornata racconta il dettaglio sportivo della sfida

---

## Modello Dati Minimo Necessario Per Il Bracket

Per i tornei `Singolo / A Coppie` servirà un vero motore di bracket.

Minimo concettuale:

- `bracketId`
- `tournamentId`
- `size`
- `format`
- `hasBye`
- `finalOnly`

Per ogni nodo/match:

- `roundNumber`
- `matchNumber`
- `slot`
- `seed1`
- `seed2`
- `participant1`
- `participant2`
- `isBye`
- `dependsOn`
- `winner`
- `status`

Punto chiave:

- un match reale e un avanzamento per bye non sono la stessa cosa

Questa distinzione è fondamentale per non sporcare:

- ELO
- statistiche
- PDF
- cronologia risultati

---

## Criticità Da Evitare

### 1. Trattare il bye come match reale

Errore da evitare assolutamente.

Se lo si fa:

- si falsano statistiche
- si sporca l'ELO
- si crea confusione nei PDF

### 2. Modifica di un match già a bracket avanzato

Se un risultato cambia:

- vanno resettati i match dipendenti
- vanno svuotati i vincitori successivi
- il bracket va ricostruito in quel ramo

### 3. Seed modificati dopo l'avvio

Una volta iniziato il torneo:

- i seed non devono più essere ricalcolati

### 4. Nomi lunghi

I bracket, soprattutto nei PDF, devono prevedere:

- testi su due righe
- riduzioni font sensate
- box leggibili

### 5. Mobile

Un bracket largo su mobile richiede:

- scroll orizzontale
- spaziatura compatta
- finale ben visibile

---

## Ordine Migliore Di Implementazione

Ordine consigliato:

### Fase 1

`Torneo a Squadre - Eliminazione Diretta con Bye`

Perché:

- hai già gran parte dell'infrastruttura
- il concetto di fase e dipendenze esiste già
- rischio architetturale più basso

### Fase 2

`Singolo / A Coppie - Eliminazione Diretta con Bye`

Perché:

- qui serve un motore bracket dedicato
- conviene costruirlo dopo aver consolidato il modello sulle squadre

---

## Piano Tecnico Di Implementazione

Questa sezione descrive come implementerei il progetto nell'app, senza ancora modificare il codice.

L'idea generale è introdurre un piccolo motore bracket riutilizzabile, poi collegarlo prima al torneo a squadre e in seguito ai tornei singolo/coppie.

---

## File Nuovi Proposti

### `services/bracketService.ts`

Contiene la logica pura del bracket:

- calcolo potenza di 2
- ordinamento seed
- distribuzione stile ATP
- assegnazione bye
- generazione nodi bracket
- avanzamento automatico bye
- risoluzione vincitori
- reset ramo dipendente

Questo file deve essere indipendente da React e dal database.

### `components/BracketView.tsx`

Componente UI riutilizzabile per mostrare il tabellone.

Responsabilità:

- render colonne turno
- render box match
- mostrare `BYE`
- mostrare vincitori
- gestire click sui match reali
- scroll orizzontale mobile

Non deve contenere logica sportiva pesante.

### `components/BracketMatchCard.tsx`

Card singola del match nel bracket.

Mostra:

- seed
- nome partecipante
- stato
- vincitore
- `BYE`

### `utils/bracketLabels.ts`

Helper per label coerenti:

- `Primo turno`
- `Ottavi`
- `Quarti`
- `Semifinali`
- `Finale`
- `BYE`
- `Da giocare`
- `Completata`

### `services/bracketPrintService.ts`

Renderer HTML/PDF del bracket.

Responsabilità:

- tabellone stampabile
- layout compatto
- evitare tagli brutti in stampa
- stile coerente con i PDF storici

In alternativa, le funzioni possono stare inizialmente dentro `services/printService.ts`, ma solo se il blocco resta isolato e ben nominato.

---

## Tipi TypeScript Proposti

Da aggiungere in `types.ts` o in un file dedicato `types/bracket.ts`.

```ts
export type BracketParticipantKind = 'pair' | 'team';

export interface BracketParticipant {
    id: string;
    kind: BracketParticipantKind;
    label: string;
    seed: number;
    strength: number;
    playerIds?: string[];
    teamNumber?: number;
}

export type BracketRoundCode =
    | 'round_of_32'
    | 'round_of_16'
    | 'quarterfinal'
    | 'semifinal'
    | 'final';

export type BracketMatchStatus =
    | 'bye'
    | 'planned'
    | 'scheduled'
    | 'completed'
    | 'blocked';

export interface BracketMatchNode {
    id: string;
    tournamentId: string;
    roundCode: BracketRoundCode;
    roundIndex: number;
    slot: number;
    participant1: BracketParticipant | null;
    participant2: BracketParticipant | null;
    winnerParticipantId: string | null;
    status: BracketMatchStatus;
    isBye: boolean;
    dependsOn: {
        left?: string;
        right?: string;
    } | null;
    realMatchId?: string | null;
    teamTournamentFixtureId?: string | null;
}

export interface Bracket {
    id: string;
    tournamentId: string;
    kind: BracketParticipantKind;
    size: number;
    finalOnly: true;
    participants: BracketParticipant[];
    matches: BracketMatchNode[];
}
```

Nota importante:

- `BracketMatchNode` non coincide sempre con un match reale
- un nodo `bye` vive solo nel bracket
- il match reale nasce solo quando due partecipanti veri devono giocare

---

## Algoritmo Bracket Generico

### 1. Calcolo dimensione

```ts
export const nextPowerOfTwo = (count: number): number => {
    let size = 1;
    while (size < count) size *= 2;
    return Math.max(size, 2);
};
```

### 2. Calcolo ELO coppia

```ts
export const pairStrength = (pair: [Player, Player]): number => {
    return pair[0].currentElo + pair[1].currentElo;
};
```

### 3. Creazione seed coppie

```ts
export const createPairParticipants = (pairs: [Player, Player][]): BracketParticipant[] => {
    return pairs
        .map((pair, index) => ({
            id: `pair-${pair[0].id}-${pair[1].id}`,
            kind: 'pair' as const,
            label: `${pair[0].name} ${pair[0].surname} / ${pair[1].name} ${pair[1].surname}`,
            seed: index + 1,
            strength: pairStrength(pair),
            playerIds: [pair[0].id, pair[1].id],
        }))
        .sort((a, b) => b.strength - a.strength)
        .map((p, index) => ({ ...p, seed: index + 1 }));
};
```

### 4. Posizionamento stile ATP

Per una prima implementazione solida userei una funzione deterministica.

Idea:

- generare l'ordine standard seed per tabellone
- inserire i seed reali
- riempire gli slot mancanti con `BYE`
- i `BYE` vanno contro i seed più alti

Esempio di mapping base:

```ts
const seedPositionsBySize: Record<number, number[]> = {
    2: [1, 2],
    4: [1, 4, 3, 2],
    8: [1, 8, 4, 5, 3, 6, 7, 2],
    16: [1, 16, 8, 9, 4, 13, 5, 12, 3, 14, 6, 11, 7, 10, 15, 2],
    32: [
        1, 32, 16, 17, 8, 25, 9, 24,
        4, 29, 13, 20, 5, 28, 12, 21,
        3, 30, 14, 19, 6, 27, 11, 22,
        7, 26, 10, 23, 15, 18, 31, 2,
    ],
};
```

Nota:

- questo mapping mantiene 1 e 2 opposti
- 3 e 4 in metà opposte
- distribuisce gli altri seed in modo leggibile e stabile

### 5. Inserimento bye

```ts
export const placeParticipantsWithByes = (
    participants: BracketParticipant[],
    bracketSize: number,
): Array<BracketParticipant | null> => {
    const positions = seedPositionsBySize[bracketSize];
    const slots: Array<BracketParticipant | null> = Array(bracketSize).fill(null);

    participants.forEach(participant => {
        const slotIndex = positions.indexOf(participant.seed);
        if (slotIndex >= 0) slots[slotIndex] = participant;
    });

    return slots;
};
```

Gli slot `null` diventano `BYE`.

### 6. Generazione primo turno

```ts
export const createFirstRoundNodes = (
    tournamentId: string,
    slots: Array<BracketParticipant | null>,
): BracketMatchNode[] => {
    const nodes: BracketMatchNode[] = [];

    for (let i = 0; i < slots.length; i += 2) {
        const p1 = slots[i];
        const p2 = slots[i + 1];
        const hasBye = !p1 || !p2;
        const autoWinner = hasBye ? (p1 || p2) : null;

        nodes.push({
            id: `bracket-${tournamentId}-r1-${i / 2 + 1}`,
            tournamentId,
            roundCode: roundCodeForSize(slots.length, 0),
            roundIndex: 0,
            slot: i / 2 + 1,
            participant1: p1,
            participant2: p2,
            winnerParticipantId: autoWinner?.id || null,
            status: hasBye ? 'bye' : 'planned',
            isBye: hasBye,
            dependsOn: null,
            realMatchId: null,
            teamTournamentFixtureId: null,
        });
    }

    return nodes;
};
```

### 7. Generazione turni successivi

I turni successivi nascono come nodi `blocked`, con dipendenze dai nodi precedenti.

```ts
export const createNextRoundNodes = (
    tournamentId: string,
    previousRound: BracketMatchNode[],
    roundIndex: number,
): BracketMatchNode[] => {
    const nodes: BracketMatchNode[] = [];

    for (let i = 0; i < previousRound.length; i += 2) {
        const left = previousRound[i];
        const right = previousRound[i + 1];

        nodes.push({
            id: `bracket-${tournamentId}-r${roundIndex + 1}-${i / 2 + 1}`,
            tournamentId,
            roundCode: roundCodeForSize(previousRound.length * 2, roundIndex),
            roundIndex,
            slot: i / 2 + 1,
            participant1: null,
            participant2: null,
            winnerParticipantId: null,
            status: 'blocked',
            isBye: false,
            dependsOn: {
                left: left.id,
                right: right.id,
            },
            realMatchId: null,
            teamTournamentFixtureId: null,
        });
    }

    return nodes;
};
```

---

## Risoluzione Vincitori

Quando un nodo viene completato:

1. si salva il vincitore
2. si cercano i nodi dipendenti
3. si popola `participant1` o `participant2`
4. se entrambi sono presenti, il nodo diventa `planned`

Pseudocodice:

```ts
export const resolveBracketAfterWinner = (
    bracket: Bracket,
    completedNodeId: string,
    winnerId: string,
): Bracket => {
    const matches = bracket.matches.map(node =>
        node.id === completedNodeId
            ? { ...node, winnerParticipantId: winnerId, status: 'completed' as const }
            : node
    );

    const winner = bracket.participants.find(p => p.id === winnerId) || null;

    const updated = matches.map(node => {
        if (!node.dependsOn || !winner) return node;

        if (node.dependsOn.left === completedNodeId) {
            const next = { ...node, participant1: winner };
            return activateIfReady(next);
        }

        if (node.dependsOn.right === completedNodeId) {
            const next = { ...node, participant2: winner };
            return activateIfReady(next);
        }

        return node;
    });

    return { ...bracket, matches: updated };
};
```

---

## Reset Ramo Dopo Modifica Risultato

Se si modifica un risultato di un turno già avanzato:

- il nodo modificato cambia vincitore
- tutti i nodi dipendenti vanno svuotati
- eventuali match reali successivi vanno eliminati o marcati da rigenerare
- il ramo viene ripopolato dal nuovo vincitore

Pseudocodice:

```ts
export const resetDependentBranch = (
    bracket: Bracket,
    sourceNodeId: string,
): Bracket => {
    const dependentIds = collectDependentNodeIds(bracket.matches, sourceNodeId);

    const matches = bracket.matches.map(node => {
        if (!dependentIds.has(node.id)) return node;

        return {
            ...node,
            participant1: null,
            participant2: null,
            winnerParticipantId: null,
            status: 'blocked' as const,
            realMatchId: null,
            teamTournamentFixtureId: null,
        };
    });

    return { ...bracket, matches };
};
```

Questo concetto esiste già in forma simile nel torneo a squadre con il reset dei fixture dipendenti.

---

## Persistenza Database Proposta

### Tabelle nuove per bracket generico

```sql
CREATE TABLE tournament_brackets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL,
    size INTEGER NOT NULL,
    final_only BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tournament_bracket_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bracket_id UUID NOT NULL REFERENCES tournament_brackets(id) ON DELETE CASCADE,
    participant_key VARCHAR(255) NOT NULL,
    label TEXT NOT NULL,
    seed INTEGER NOT NULL,
    strength INTEGER NOT NULL,
    player_ids JSONB,
    team_number INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tournament_bracket_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bracket_id UUID NOT NULL REFERENCES tournament_brackets(id) ON DELETE CASCADE,
    round_code VARCHAR(50) NOT NULL,
    round_index INTEGER NOT NULL,
    slot INTEGER NOT NULL,
    participant1_id UUID REFERENCES tournament_bracket_participants(id),
    participant2_id UUID REFERENCES tournament_bracket_participants(id),
    winner_participant_id UUID REFERENCES tournament_bracket_participants(id),
    status VARCHAR(30) NOT NULL,
    is_bye BOOLEAN NOT NULL DEFAULT FALSE,
    depends_on JSONB,
    real_match_id UUID REFERENCES matches(id),
    team_tournament_fixture_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Perché tabelle dedicate

Il bracket deve esistere anche quando non esiste un match reale.

Questo succede con:

- bye
- turni futuri
- nodi bloccati
- finale non ancora determinata

Usare solo la tabella `matches` creerebbe confusione.

---

## API Proposte

### Tornei singolo/coppie

```http
POST /api/tournaments/:id/bracket
GET /api/tournaments/:id/bracket
POST /api/tournaments/:id/bracket/:nodeId/match
PUT /api/tournaments/:id/bracket/:nodeId/result
```

### Tornei a squadre

Si può riusare parte della struttura esistente dei fixture oppure introdurre lo stesso modello bracket.

Opzione conservativa:

```http
POST /api/team-tournaments/:id/elimination-bracket
GET /api/team-tournaments/:id/elimination-bracket
POST /api/team-tournaments/:id/bracket/:nodeId/matchday
PUT /api/team-tournaments/:id/bracket/:nodeId/result
```

---

## Integrazione Con Torneo a Squadre

Il formato `ELIMINAZIONE DIRETTA` esiste già a livello di configurazione, ma oggi è disabilitato in UI.

Implementazione proposta:

1. abilitare `ELIMINAZIONE DIRETTA` nella select
2. dopo configurazione squadre, generare bracket
3. usare le squadre come partecipanti
4. assegnare seed
5. creare nodi bye e nodi reali
6. per ogni nodo reale `planned`, permettere creazione giornata
7. quando la giornata viene completata, aggiornare il nodo bracket
8. propagare vincitore al turno successivo

### Relazione con 3 o 5 partite

Resta invariata:

- il nodo bracket decide `Squadra A vs Squadra B`
- la giornata decide le `3` o `5` partite interne
- il bye non crea giornata

### Primo approccio consigliato

Per la prima versione team:

- seed basato su ordine squadre configurato
- in futuro eventualmente seed manuale

Questo evita di introdurre ranking squadra non ancora presente.

---

## Integrazione Con Singolo / Coppie

Qui serve un formato nuovo dentro `TournamentFlow`.

Formato proposto:

```ts
type TournamentFormat =
    | 'match-singolo'
    | 'torneotto-30'
    | 'round-robin-finali'
    | 'americano'
    | 'torneo-libero'
    | 'gironi-fase-finale'
    | 'beat-the-box'
    | 'eliminazione-diretta';
```

Nuovo tipo torneo:

```ts
export enum TournamentType {
    EliminazioneDiretta = "Eliminazione Diretta",
}
```

Flusso:

1. sorteggio coppie
2. scelta formato `Eliminazione Diretta`
3. calcolo seed per somma ELO
4. anteprima bracket
5. salvataggio torneo
6. creazione bracket
7. inserimento risultati turno per turno

### Match reali

Alla creazione del torneo:

- i nodi bye non generano match
- i nodi reali del primo turno generano match o restano `planned`

Approccio consigliato:

- generare i match reali solo quando l'utente avvia/inserisce il turno
- evitare di creare subito partite future ancora indeterminate

---

## UI Dettagliata

### `BracketView`

Props proposte:

```ts
interface BracketViewProps {
    bracket: Bracket;
    onOpenMatch?: (node: BracketMatchNode) => void;
    readonly?: boolean;
}
```

Comportamento:

- raggruppa match per `roundIndex`
- renderizza colonne
- su mobile usa `overflow-x-auto`
- i nodi `bye` sono statici
- i nodi `planned` sono cliccabili
- i nodi `blocked` sono disabilitati
- i nodi `completed` mostrano vincitore

### `BracketMatchCard`

Stati:

- `bye`
- `blocked`
- `planned`
- `scheduled`
- `completed`

Classi visive:

- `bye`: grigio leggero, testo `BYE`
- `planned`: bordo blu
- `scheduled`: pill `In corso`
- `completed`: vincitore evidenziato
- `blocked`: opacità ridotta

---

## PDF Bracket: Struttura HTML

Il PDF deve essere più vicino ai PDF storici che alle card UI.

Struttura:

```html
<section class="print-section avoid-break">
    <h1>Nome Torneo</h1>
    <div class="meta">Circolo - Data</div>
    <div class="blue-separator"></div>
</section>

<section class="bracket-print">
    <div class="bracket-round">
        <h2>Quarti</h2>
        <div class="bracket-match">...</div>
    </div>
    <div class="bracket-round">
        <h2>Semifinali</h2>
        <div class="bracket-match">...</div>
    </div>
    <div class="bracket-round">
        <h2>Finale</h2>
        <div class="bracket-match">...</div>
    </div>
</section>
```

Regole stampa:

```css
.bracket-print,
.bracket-round,
.bracket-match {
    break-inside: avoid;
    page-break-inside: avoid;
}

.bracket-print {
    width: 100%;
    display: grid;
    grid-auto-flow: column;
    gap: 18px;
}
```

Per bracket grandi:

- orientamento landscape
- font compatto
- box più stretti
- eventualmente split su due pagine solo tra turni, non dentro al singolo match

---

## Stampe PDF Specifiche Per Eliminazione Diretta

Per i tornei a eliminazione diretta, sia `Singolo / A Coppie` sia `Torneo a Squadre`, servono due famiglie di stampa distinte:

- stampa in bianco, da usare prima o durante il torneo
- stampa finale, da usare a torneo concluso o parzialmente completato

Regola fissata:

- tutte le stampe di questi tornei devono essere in `A4 landscape`
- quindi orizzontali
- non vanno adattate al formato verticale degli altri tornei

Questa scelta è corretta perché un bracket ha bisogno di spazio laterale.

---

## Stampa In Bianco Del Bracket

La stampa in bianco deve funzionare come le schede punteggi degli altri tornei, ma adattata al tabellone.

Obiettivo:

- stampare il tabellone prima di giocare
- lasciare spazi scrivibili a mano
- mostrare eventuali `BYE`
- non generare risultati finti

### Contenuto

La stampa in bianco deve includere:

- nome torneo
- circolo
- data
- formato `Eliminazione Diretta`
- tabellone completo
- seed
- nomi partecipanti
- `BYE` visibili
- quadrati/caselle per inserire punteggi a mano
- spazio per indicare il vincitore di ogni match reale

### Singolo / Coppie

Ogni match reale deve avere:

- coppia 1
- coppia 2
- seed delle coppie
- caselle punteggio
- spazio firma/opzionale se in futuro serve

Esempio concettuale:

```html
<div class="bracket-match blank-match">
    <div class="participant">
        <span class="seed">1</span>
        <span class="name">Rossi / Bianchi</span>
        <span class="score-box"></span>
        <span class="score-box"></span>
        <span class="score-box"></span>
    </div>
    <div class="participant">
        <span class="seed">8</span>
        <span class="name">Verdi / Neri</span>
        <span class="score-box"></span>
        <span class="score-box"></span>
        <span class="score-box"></span>
    </div>
</div>
```

I `BYE`:

- appaiono nel bracket
- non hanno caselle punteggio
- mostrano `BYE`
- indicano visivamente il passaggio automatico

### Torneo a Squadre

Ogni nodo reale `Squadra A vs Squadra B` deve rimandare alla logica già nota:

- la sfida è una giornata
- dentro ci sono 3 o 5 partite

La stampa in bianco può avere due livelli:

1. bracket generale in bianco
2. scheda giornata in bianco per ogni sfida reale

Per la prima implementazione, consigliato:

- stampa bracket generale in bianco
- per ogni match reale, spazio punteggio sintetico squadra
- le schede dettagliate 3/5 partite restano stampabili dalla giornata, come sistema separato

---

## Stampa Finale Del Bracket

La stampa finale deve raccontare il torneo concluso o in avanzamento.

Contenuto:

- nome torneo
- data
- circolo
- tabellone completo
- risultati reali
- vincitori evidenziati
- `BYE` visibili ma non trattati come match
- campione finale
- finalista

### Singolo / Coppie

La stampa finale deve mostrare:

- tutte le partite giocate
- risultati per set/game secondo logica già esistente
- vincitore di ogni nodo
- finale unica 1°-2°
- nessuna finalina 3°-4°

Il riepilogo finale:

- `Campioni`
- `Finalisti`
- eventuale lista `Semifinalisti` e `Quarti di finale`

### Torneo a Squadre

La stampa finale del bracket deve mostrare:

- avanzamento squadre
- risultati sintetici delle sfide
- stato dei nodi non ancora giocati
- vincitore finale

I dettagli delle singole giornate restano nei report giornata:

- 3 o 5 partite interne
- giocatori schierati
- punteggi
- riepilogo sfida

Il PDF bracket non deve diventare troppo carico.

---

## Funzioni Di Stampa Proposte

Da aggiungere in `services/printService.ts` oppure in `services/bracketPrintService.ts`.

Preferenza tecnica:

- creare `services/bracketPrintService.ts`
- richiamarlo da `printService.ts` solo se serve compatibilità con l'attuale sistema

Funzioni:

```ts
export const printBlankEliminationBracket = (
    bracket: Bracket,
    tournamentDetails: Tournament,
) => {
    // A4 landscape, tabellone vuoto con caselle punteggio
};

export const printCompletedEliminationBracket = (
    bracket: Bracket,
    tournamentDetails: Tournament,
) => {
    // A4 landscape, tabellone con risultati e vincitori
};

export const printTeamBlankEliminationBracket = (
    bracket: Bracket,
    tournamentDetails: Tournament,
) => {
    // A4 landscape, bracket squadre in bianco
};

export const printTeamCompletedEliminationBracket = (
    bracket: Bracket,
    tournamentDetails: Tournament,
) => {
    // A4 landscape, bracket squadre finale
};
```

Eventualmente le due funzioni team possono essere unificate con quelle generiche se il `BracketParticipant.kind` è sufficiente.

---

## CSS PDF A4 Landscape

Tutti i PDF bracket devono usare sempre:

```css
@page {
    size: A4 landscape;
    margin: 10mm;
}

body {
    font-family: Arial, sans-serif;
    color: #111827;
    background: white;
}

.bracket-page {
    width: 100%;
    min-height: 180mm;
}

.bracket-header {
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 8mm;
}

.bracket-print-landscape {
    width: 100%;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(38mm, 1fr);
    gap: 6mm;
    align-items: center;
}

.bracket-round {
    break-inside: avoid;
    page-break-inside: avoid;
}

.bracket-match {
    break-inside: avoid;
    page-break-inside: avoid;
    border: 1px solid #2563eb;
    padding: 3mm;
    margin-bottom: 5mm;
    min-height: 16mm;
}

.participant {
    display: grid;
    grid-template-columns: 8mm 1fr auto;
    gap: 2mm;
    align-items: center;
    min-height: 6mm;
}

.score-boxes {
    display: inline-flex;
    gap: 1.5mm;
}

.score-box {
    width: 7mm;
    height: 6mm;
    border: 1px solid #111827;
    display: inline-block;
}

.bye {
    color: #6b7280;
    font-style: italic;
}

.winner {
    font-weight: 900;
    color: #065f46;
}
```

Nota:

- niente `A4 portrait` per questi PDF
- niente card pesanti da dashboard
- layout pulito e stampabile
- caselle punteggio ben visibili nella stampa in bianco

---

## Differenza Tra Stampa In Bianco E Finale

### In bianco

Mostra:

- tabellone completo
- partecipanti già posizionati
- bye
- caselle vuote
- nessun vincitore evidenziato

Non mostra:

- punteggi finti
- match non reali per bye

### Finale

Mostra:

- risultati reali
- vincitori
- campione
- finalista
- stato dei turni non completati, se il torneo è ancora in corso

Non mostra:

- caselle scrivibili
- bye come partite giocate

---

## Anti-Taglio Nei PDF Bracket

I blocchi indivisibili sono:

- intestazione torneo
- titolo turno
- singolo match bracket
- eventuale riepilogo campione/finalista

Regole:

```css
.bracket-header,
.bracket-round-title,
.bracket-match,
.bracket-summary {
    break-inside: avoid;
    page-break-inside: avoid;
}
```

Per bracket molto grandi:

- se il tabellone non entra in una pagina, si può spezzare per macro-sezioni
- mai spezzare una singola card match tra due pagine
- mai lasciare titolo turno isolato in fondo pagina

---

## Integrazione UI Dei Pulsanti Stampa

Nei tornei a eliminazione diretta servono almeno due pulsanti:

- `Stampa tabellone`
- `Stampa scheda punteggi`

Possibile naming:

- `Stampa tabellone` = stampa finale/attuale
- `Scheda punteggi` = stampa in bianco

Nel caso del torneo a squadre:

- dal riepilogo torneo: `Stampa tabellone`
- dalla singola giornata: stampa dettaglio 3/5 partite come già avviene
- dal bracket: eventuale `Scheda tabellone`

---

## Test Da Prevedere

### Unit test bracket

Casi minimi:

- 2 partecipanti
- 3 partecipanti con 1 bye
- 5 partecipanti con 3 bye
- 6 partecipanti con 2 bye
- 8 partecipanti senza bye
- 10 partecipanti con 6 bye

Verifiche:

- dimensione tabellone corretta
- numero bye corretto
- seed 1 e 2 opposti
- bye ai seed più alti
- nessun match reale per bye
- avanzamento automatico corretto

### Test flusso risultati

- completamento match primo turno
- popolamento turno successivo
- modifica risultato
- reset ramo successivo
- finale completata

### Test ELO

- bye non genera ELO
- match reale genera ELO
- modifica risultato ricalcola correttamente

---

## Strategia Di Implementazione Senza Rischi

### Step 1: solo motore bracket

Creare `bracketService.ts` con test, senza UI.

### Step 2: UI read-only

Mostrare un bracket statico da dati mock o preview.

### Step 3: torneo a squadre

Abilitare eliminazione diretta per le squadre.

### Step 4: PDF bracket squadre

Stampa del tabellone generale.

### Step 5: singolo/coppie

Aggiungere formato `Eliminazione Diretta` nel flow coppie.

### Step 6: PDF bracket singolo/coppie

Stampa tabellone e report finale.

---

## Stato Implementazione Reale

Aggiornamento operativo al `24 Apr 2026`.

### Già implementato in app

Per ora e' stato implementato **solo** il ramo:

- `Torneo a Squadre`
- formato `Eliminazione Diretta`

Senza toccare:

- `Singolo / A Coppie`
- `Torneo Libero`
- logica storica `Round Robin`

### Backend gia' attivo

- abilitazione del formato `Eliminazione Diretta` nei tornei a squadre
- supporto a `round_of_32`, `round_of_16`, `quarterfinal`, `semifinal`, `final_1_2`
- gestione `BYE` con avanzamento automatico
- salvataggio `winnerTeamNumber` e `loserTeamNumber`
- aggiornamento del ramo successivo man mano che le sfide vengono chiuse
- reset del ramo dipendente quando una sfida gia' chiusa viene modificata

### Configurazione gia' attiva

- toggle `Testa di Serie` per ogni squadra
- massimo teste di serie = `numero squadre / 2`
- e' ammesso anche un numero inferiore al massimo
- le teste di serie sono distribuite in aree separate del tabellone
- il resto del tabellone viene sorteggiato casualmente

### UI gia' attiva

- `Completa Configurazione` genera il tabellone
- animazione di generazione tabellone in stile shuffle
- card torneo e pagine matchday/sommario leggono le nuove fasi del bracket
- inserimento sfide con il flusso gia' noto:
  - `+ Aggiungi Partita`
  - menu a discesa con le sfide disponibili
- nessun cambio ai flussi esistenti del round robin

### PDF gia' attivi

- stampa singola giornata `Eliminazione Diretta`:
  - **senza classifica**
  - con riepilogo delle sfide madri gia' completate
- stampa riepilogo torneo `Eliminazione Diretta`:
  - tabellone dedicato
  - **sempre in A4 landscape**
  - niente classifica round robin
- il ramo iOS continua a usare la preview stampabile corretta

### Cose ancora da rifinire

- ulteriore compattazione grafica del bracket PDF se emergono casi limite con nomi molto lunghi
- eventuale miglioramento del disegno delle linee di collegamento tra turni nel PDF
- eventuale versione `blank` del bracket a squadre per compilazione manuale
- rifinitura del sommario finale torneo a squadre in ottica solo bracket

### Cose volutamente non ancora implementate

- eliminazione diretta `Singolo / A Coppie`
- motore bracket generico riusabile per tutti i formati
- PDF bracket `Singolo / A Coppie`
- scheda punteggi bianca dedicata al bracket
- qualsiasi refactor del `Torneo Libero`

---

## Nome Formato Proposto

Per chiarezza lato utente:

### Singolo / Coppie

- `Eliminazione Diretta`

eventualmente con sottotitolo:

- `con seeding e bye automatici`

### Torneo a Squadre

- `Eliminazione Diretta`

con turni:

- Ottavi
- Quarti
- Semifinali
- Finale

---

## Conclusione

Il progetto `Bracket con Bye` è coerente con la direzione dell'app.

### Decisioni già fissate

- ELO coppia = somma
- bye ai seed più alti
- seeding stile ATP
- finale solo 1°-2° per singoli/coppie
- niente match reale per i bye
- niente ELO sui bye

### Valutazione tecnica

- lato `Torneo a Squadre`: molto fattibile
- lato `Singolo / A Coppie`: fattibile, ma richiede un motore bracket vero

### Valutazione UI/PDF

La resa grafica a bracket stile ATP è assolutamente fattibile sia:

- in UI
- nei PDF

con una soluzione coerente e pulita, anche su mobile.
