# Progetto UI/UX Mobile First

Documento di analisi e proposta.  
Nessuna modifica applicata all'app in questa fase.

## Obiettivo

Rendere ELO Manager davvero mobile first, mantenendo:

- routing React/Vite attuale
- logica backend invariata
- modelli dati invariati
- nomi variabili e campi form invariati
- struttura a step attuale
- nessuna nuova route

Il refactor deve migliorare chiarezza, leggibilita', gerarchia visiva e flusso decisionale, soprattutto su iPhone.

---

## Diagnosi Generale

L'app ha gia' una buona identita' visiva, ma su mobile eredita troppe decisioni pensate per desktop.

I problemi principali non sono tanto i colori, ma:

- troppe card grandi una dopo l'altra
- padding e radius abbondanti anche dove lo spazio e' poco
- CTA primarie e secondarie sullo stesso piano visivo
- action icon spesso troppo vicine alle pill o ai titoli
- griglie desktop che su mobile diventano sequenze molto lunghe
- bottoni full width usati anche quando l'azione e' secondaria
- header mobile ancora alto e molto denso
- liste lunghe con informazioni, pill e icone tutte nello stesso blocco
- tabelle o pseudo-tabelle che su mobile richiedono scroll o comprimono troppo testo

La direzione corretta e':

- una sola azione primaria per schermata
- azioni secondarie compatte e coerenti
- contenuti sempre prima delle icone
- step piu' corti e leggibili
- footer/action bar sticky nei flussi di inserimento
- card piu' dense e meno decorative

---

## Regole UI Da Applicare Ovunque

### 1. Card mobile piu' compatte

Problema attuale:

- `Card` usa `rounded-[20px]`, `px-5 py-4`, `p-4 md:p-6`
- su mobile ogni sezione occupa molta altezza
- quando una pagina ha 4-5 card, l'utente perde il senso dello step

Proposta:

- mobile: radius 12-14px
- desktop: radius 18-20px se si vuole mantenere il look attuale
- header card mobile: `px-4 py-3`
- body card mobile: `p-3.5`
- spaziatura verticale default: `space-y-4`, non `space-y-6`

Impatto visivo:

- prima: schermate lunghe, molto "gonfie"
- dopo: piu' contenuto visibile nel primo viewport, meno scroll inutile

Pagine impattate:

- tutte
- priorita' alta su `Tornei`, `Sorteggi`, `Risultati`, `TeamTournamentMatchdayPage`

---

### 2. Button system piu' rigoroso

Problema attuale:

- `Button md` e `lg` sono spesso troppo alti su mobile
- molte CTA secondarie sembrano importanti quanto la primaria
- i bottoni con testo lungo causano wrapping o layout instabile

Proposta:

- mobile default: altezza 40px
- azioni primarie: una per blocco o per step
- azioni secondarie: `ghost` o icon button
- azioni distruttive: icona compatta, mai accanto a CTA primaria senza spazio
- su mobile usare action bar in fondo per gli step lunghi

Prima:

- `Torna a tornei`, `Salva`, `Chiudi giornata`, `Stampa` tutti nella stessa riga o blocco

Dopo:

- contenuto dello step
- action bar sticky:
  - sinistra: indietro/annulla
  - destra: azione principale
  - stampa o extra in menu/icona secondaria

Pagine impattate:

- `TeamTournamentMatchdayPage`
- `TournamentFlow`
- `BeatTheBoxFlow`
- `MatchesPage`
- `DrawPage`

---

### 3. Action row standard per card lista

Problema attuale:

- in `TournamentsPage` ci sono varianti diverse dello stesso pattern:
  - pill + icone inline
  - icone sotto
  - CTA a destra
  - azioni nascoste in alcuni casi
- questo produce incoerenze e sovrapposizioni su iPhone

Proposta:

Ogni card lista deve avere sempre:

- riga 1: titolo principale
- riga 2: metadati/data
- riga 3: pill/stato a sinistra, azioni a destra

Se la pill e' lunga:

- pill sopra
- icone sotto a destra

Ma la regola deve essere unica, non caso per caso.

Prima:

- card torneo con titolo, data, pill e icone in competizione

Dopo:

- lettura verticale naturale:
  - cosa e'
  - quando/dove
  - cosa posso fare

Pagine impattate:

- `TournamentsPage`
- `MatchesPage`
- riepiloghi torneo a squadre

---

### 4. Typography mobile piu' controllata

Problema attuale:

- `Elo Manager`, `Tornei Attivi`, `Modifica Risultati` usano titoli molto grandi
- dentro card e pannelli compatti, il font grande crea rotture e wrapping

Proposta:

- page title mobile: 24-26px
- section title mobile: 20-22px
- card title mobile: 16-18px
- body: 14px
- metadata: 12-13px
- niente `text-3xl` dentro componenti molto stretti

Pagine impattate:

- `Header`
- `TournamentsPage`
- `MatchesPage`
- `DashboardPage`
- `RankingPage`

---

## Analisi Per Pagina

## Header

Problemi specifici:

- header mobile occupa molto spazio verticale
- titolo, icona coppa, versione, autore, workspace e icone azione competono nello stesso blocco
- `rounded-[22px]` e padding generoso aumentano l'ingombro
- su iPhone la card header lascia meno spazio al contenuto operativo

Proposta:

- header mobile piu' compatto
- riga 1: menu + `Elo Manager` + coppa
- riga 2: versione/autore/workspace
- icone tema/esci allineate alla riga metadata, non alla riga titolo
- ridurre radius mobile
- ridurre `pt-4` mobile

Prima:

- header alto, quasi una card dashboard

Dopo:

- header informativo ma meno dominante
- piu' contenuto utile visibile sotto

Impatto:

- migliora tutte le pagine
- riduce la sensazione di app "stretta" su mobile

---

## Sidebar/Menu

Problemi specifici:

- menu mobile laterale funziona, ma e' molto largo (`w-72`)
- nav item grandi e con shadow forte
- su mobile il menu sembra una pagina piena, non un pannello rapido

Proposta:

- larghezza mobile: `min(82vw, 300px)`
- item piu' compatti
- stato attivo meno alto
- aggiungere separazione visiva tra area primaria e admin

Prima:

- menu molto protagonista

Dopo:

- menu piu' rapido, meno invasivo

---

## Tornei

Problemi specifici:

- la card iniziale `Inizia da qui` e' alta e compete con `Tornei Attivi`
- `Tornei Attivi` sembra un secondo header, ma e' dentro il flusso contenuti
- le card torneo hanno vari pattern di azione
- tabellone/fase finale dentro card a squadre puo' diventare lungo e denso
- pill lunghe e icone rischiano collisioni

Proposta:

### Prima del contenuto

Sostituire card `Inizia da qui` con una CTA compatta:

- mobile: bottone principale full width
- titolo ridotto o assente
- testo descrittivo rimosso o molto breve

Prima:

- card introduttiva + titolo + testo + bottone

Dopo:

- bottone principale subito visibile: `Nuovo Torneo / Nuova Giornata`
- sotto: `Tornei Attivi`

### Card torneo

Struttura proposta:

```html
<article class="tournament-card">
  <header class="tournament-card__header">
    <button class="tournament-card__title-row">
      <IconChevron />
      <span>Nome torneo</span>
    </button>
    <PrimaryPill />
  </header>

  <div class="tournament-card__meta">
    Circolo - data / stato
  </div>

  <footer class="tournament-card__actions">
    <StatusPill />
    <IconActions />
  </footer>
</article>
```

Impatto:

- tutte le giornate leggibili su 3 righe
- icone sempre prevedibili
- pill non spingono piu' il testo

Priorita':

- altissima

---

## Sorteggi

Problemi specifici:

- layout desktop `opzioni + risultati` su mobile diventa sequenza lunga
- `Risultati Sorteggio` appare prima o troppo vicino a blocchi secondari in alcuni stati
- selezione partecipanti ha liste lunghe con checkbox piccole
- bottoni numerici coppie sono molti e occupano spazio
- CTA `Sorteggia Coppie` puo' perdersi tra card

Proposta:

### Mobile order fisso

1. Opzioni sorteggio
2. Seleziona partecipanti
3. CTA sticky `Sorteggia Coppie`
4. Risultati sorteggio

La card `Risultati Sorteggio` dovrebbe comparire solo dopo il sorteggio, oppure essere collassata finche' vuota.

### Numero coppie

Sostituire la griglia di bottoni numerici con:

- segmented/stepper compatto
- oppure chips su due righe massimo

### Partecipanti

Rendere ogni player row piu' tappabile:

- altezza 44px
- checkbox piu' evidente
- nome a sinistra
- ELO a destra

Prima:

- molte card e molte opzioni visibili subito

Dopo:

- percorso lineare: scelgo, seleziono, sorteggio, vedo risultato

---

## Completa Configurazione Torneo A Squadre

Problemi specifici:

- molte informazioni nello stesso step
- configurazione, squadre, TDS, partite per giornata, azioni finali sono tutte nello stesso livello
- su mobile le squadre in lista rischiano di diventare blocchi ripetitivi molto lunghi

Proposta:

- mantenere lo stesso step/pagina
- dividere visivamente in blocchi piu' chiari:
  - riepilogo formato
  - squadre
  - avanzamento configurazione
  - CTA finale
- CTA `Completa Configurazione` sticky in basso quando tutte le squadre sono valide
- toggle `Testa di Serie` piu' leggibile dentro la singola card squadra

Prima:

- utente deve cercare l'azione finale

Dopo:

- utente capisce quando puo' chiudere lo step

---

## Inserimento Partita Torneo A Squadre

Problemi specifici:

- selezione data, sfida, giocatori, sub-match e CTA stanno tutti nella stessa card
- il bottone finale e' lontano se la lista partite e' lunga
- su mobile `Salva calendario` e `Inserisci risultati` competono

Proposta:

- header compatto con sfida selezionata
- contenuto diviso in mini-sezioni:
  - dati partita
  - coppie/sub-match
  - validazione
- action bar sticky:
  - `Torna`
  - `Inserisci risultati`
  - `Salva calendario` come secondaria o menu

Prima:

- pagina lunga, CTA in fondo

Dopo:

- l'azione principale resta sempre raggiungibile

---

## Inserimento Risultati Torneo A Squadre

Problemi specifici:

- ogni sub-match usa griglia `sm:grid-cols-3`, ma su mobile diventa verticale
- nomi giocatori, input score e `vs` occupano molto
- `Stampa`, `Salva`, `Chiudi giornata` tutti vicini
- il riepilogo vittorie e la card info occupano spazio prima dei risultati

Proposta:

### Sub-match mobile

Layout consigliato:

```html
<section class="submatch-card">
  <div class="submatch-card__players">
    <div>Giocatore A / Giocatore B</div>
    <div>Giocatore C / Giocatore D</div>
  </div>
  <ScoreInput />
</section>
```

### CTA

- `Chiudi giornata` primaria sticky
- `Salva` secondaria
- `Stampa` icon button

Impatto:

- meno scroll
- meno rischio di tap sbagliato
- piu' chiarezza tra azione temporanea e azione finale

---

## Risultati

Problemi specifici:

- pannello `Inserisci Risultato Singolo` e `Modifica Risultati` convivono ma hanno pesi molto diversi
- card annidate e liste espandibili diventano profonde
- icone modifica/cancella/stampa sono presenti ma non sempre nello stesso schema delle card torneo
- alcune stringhe residue e CTA vecchie possono dare impressione di UI non uniforme

Proposta:

- `Inserisci Risultato Singolo` collassato di default con CTA compatta
- `Modifica Risultati` come contenuto principale
- action row identica a `Tornei`
- evitare card dentro card dove possibile
- in mobile, una giornata espansa deve mostrare:
  - titolo
  - data/stato
  - azioni
  - match solo dopo ulteriore espansione

Prima:

- profondita' visiva alta

Dopo:

- lista piu' scansionabile

---

## Classifiche

Problemi specifici:

- card principale contiene titolo, stampa, filtri, tabella/lista e grafico
- filtri possono occupare molto spazio prima della classifica
- su mobile il bottone `Stampa` vicino al titolo puo' competere col titolo

Proposta:

- titolo sezione + stampa come icon button
- filtri in pannello collassabile `Filtri`
- ranking subito visibile
- `ELO History` gia' collassabile: mantenere questa direzione

Prima:

- prima viewport carico di controlli

Dopo:

- prima viewport mostra classifica e stato corrente

---

## Dashboard/Home

Problemi specifici:

- griglia stat 2 colonne mobile va bene, ma card e numeri sono grandi
- top 5, ultima giornata e attivita' recenti hanno pesi simili
- la home rischia di sembrare dashboard decorativa piu' che punto di ritorno operativo

Proposta:

- mantenere statistiche ma ridurre altezza
- mettere una CTA primaria coerente con uso reale
- separare "riepilogo" da "azioni"

Prima:

- dashboard informativa

Dopo:

- home come centro operativo

---

## Beat The Box / Flow Complessi

Problemi specifici:

- molte card grandi con sfondi colorati
- tabelle e classifiche multiple
- finali/semifinali hanno griglie che su mobile si allungano molto

Proposta:

- step header compatto con stato
- una sezione aperta alla volta
- CTA sticky in basso
- classifiche secondarie collassabili
- evitare emoji come struttura visiva principale

Impatto:

- flusso piu' guidato
- meno scroll durante inserimento risultati

---

## CSS Minimo Consigliato

Queste classi potrebbero essere aggiunte senza cambiare logica:

```css
@layer components {
  .mobile-page-stack {
    @apply space-y-4 md:space-y-6;
  }

  .mobile-card {
    @apply rounded-2xl md:rounded-[20px];
  }

  .mobile-card-header {
    @apply px-4 py-3 md:px-6 md:py-4;
  }

  .mobile-card-body {
    @apply p-3.5 md:p-6;
  }

  .mobile-action-row {
    @apply flex items-center justify-between gap-2;
  }

  .mobile-icon-actions {
    @apply flex shrink-0 items-center gap-1.5;
  }

  .mobile-sticky-actions {
    @apply sticky bottom-0 z-20 -mx-4 mt-4 border-t border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 backdrop-blur-xl;
  }

  .mobile-list-card {
    @apply rounded-2xl border border-[var(--app-border)] bg-white/70 p-3 shadow-sm dark:bg-slate-900/55;
  }

  .tap-target {
    @apply min-h-11;
  }
}
```

Nota: nomi e struttura sono proposte. L'implementazione vera dovrebbe riusare `Card` e `Button` esistenti senza cambiare logica.

---

## Template Di Riferimento Per Card Mobile

Questo e' il modello consigliato per tornei, giornate, risultati e partite.

```html
<article class="mobile-list-card">
  <header class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      <h3 class="text-base font-bold leading-snug">Titolo principale</h3>
      <p class="mt-1 text-sm text-app-muted">Data / circolo / dettaglio</p>
    </div>
    <button class="icon-button" aria-label="Espandi">
      <ChevronIcon />
    </button>
  </header>

  <footer class="mt-3 mobile-action-row">
    <div class="min-w-0 flex flex-wrap gap-2">
      <span class="status-pill">Stato</span>
    </div>
    <div class="mobile-icon-actions">
      <button aria-label="Modifica"><EditIcon /></button>
      <button aria-label="Stampa"><PrintIcon /></button>
      <button aria-label="Elimina"><TrashIcon /></button>
    </div>
  </footer>
</article>
```

Impatto:

- stesso schema mentale in tutta l'app
- meno eccezioni layout
- meno sovrapposizioni

---

## Template Di Riferimento Per Step Operativo

Valido per:

- sorteggio
- configurazione squadre
- inserimento partita
- inserimento risultati

```html
<section class="mobile-page-stack">
  <header class="step-header">
    <p class="step-eyebrow">Step corrente</p>
    <h2>Titolo azione</h2>
  </header>

  <Card>
    Contenuto dello step
  </Card>

  <div class="mobile-sticky-actions">
    <button class="secondary">Indietro</button>
    <button class="primary">Azione principale</button>
  </div>
</section>
```

Impatto:

- l'utente non deve cercare la CTA
- il flusso resta lineare
- ogni pagina continua a essere uno step

---

## Priorita' Di Implementazione

### Priorita' 1

- Header mobile compatto
- Card/Button density mobile
- Action row standard
- `TournamentsPage`
- `TeamTournamentMatchdayPage`

Motivo:

- sono le aree con piu' problemi visibili su iPhone
- impattano i flussi piu' usati

### Priorita' 2

- `DrawPage`
- `MatchesPage`
- `RankingPage`

Motivo:

- migliorano operativita' e coerenza
- riducono scroll e controlli troppo presenti

### Priorita' 3

- `DashboardPage`
- `BeatTheBoxFlow`
- `StatistichePage`

Motivo:

- importanti, ma meno urgenti rispetto ai flussi di inserimento e gestione

---

## Cosa Si Vedra' Prima E Dopo

### Prima

- header alto
- card ampie
- molti bottoni pieni
- liste con pill e icone che competono
- CTA spesso in fondo dopo molto scroll
- pagine lunghe anche per azioni semplici

### Dopo

- header piu' basso
- piu' contenuto visibile nel primo viewport
- card piu' compatte
- azioni sempre nello stesso punto
- CTA primaria chiara
- flussi piu' guidati
- meno rischio di sovrapposizione su iPhone

---

## Rischi Da Evitare

- cambiare troppe cose visive insieme senza test mobile reale
- introdurre nuove route o nuovi flow nascosti
- trasformare le card in un design troppo piatto e anonimo
- comprimere troppo le zone tappabili sotto i 44px
- nascondere azioni importanti dietro menu non evidenti
- rendere i PDF o i flussi torneo dipendenti da refactor UI

---

## Raccomandazione Finale

Procedere in micro-refactor controllati:

1. sistema base `Card/Button/Header`
2. `TournamentsPage`
3. `TeamTournamentMatchdayPage`
4. `DrawPage`
5. `MatchesPage`
6. `RankingPage`

Ogni step dovrebbe essere verificato su:

- iPhone 13/14/15 width
- Safari iOS/PWA
- tema chiaro
- tema scuro
- contenuti lunghi
- card con molte azioni

Questo e' il modo piu' sicuro per ottenere una UI davvero mobile first senza rompere i flussi esistenti.
