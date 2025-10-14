# Sistema di Esportazione PDF

## Overview
Il sistema di esportazione PDF utilizza la **funzionalità nativa di stampa del browser** (`window.print()`) per generare documenti PDF formattati.

## Meccanismo di Funzionamento

### 1. Processo Base
```javascript
// 1. Apertura nuova finestra
const printWindow = window.open('', '_blank');

// 2. Scrittura HTML con stili
printWindow.document.write(`
  <!DOCTYPE html>
  <html>
    <head>
      <title>Titolo Documento</title>
      <style>
        @page { size: A4; margin: 12mm 10mm; }
        @media print { ... }
      </style>
    </head>
    <body>
      ${contenutoHTML}
      <script>
        setTimeout(() => {
          window.print();  // 3. Avvio stampa
          window.close();  // 4. Chiusura finestra
        }, 250);
      </script>
    </body>
  </html>
`);

// 3. Chiusura documento
printWindow.document.close();
```

### 2. Timeout di Stampa
- **250ms**: Per documenti semplici (ranking, report)
- **500ms**: Per grafici complessi (ELO chart con Recharts)

Questo timeout è necessario per permettere al browser di:
- Caricare i font esterni (Google Fonts - Manrope)
- Renderizzare i grafici SVG
- Applicare gli stili CSS

---

## Funzioni di Esportazione Disponibili

### 1. `printChart(chartContainerId: string)`
**Stampa grafico andamento storico ELO**

- **Formato**: A4 Landscape
- **Contenuto**: Grafico SVG generato da Recharts
- **Caratteristiche**:
  - Nasconde legenda Recharts originale
  - Aggiunge legenda personalizzata ottimizzata per stampa
  - SVG responsive al 100% della pagina
  - Timeout: 500ms

**Utilizzo:**
```typescript
import { printChart } from './services/printService.ts';
printChart('elo-chart-container');
```

---

### 2. `printRanking(ranking: RankingEntry[])`
**Stampa classifica giocatori**

- **Formato**: A4 Portrait
- **Contenuto**:
  - Tabella classifica con posizione, nome, ELO attuale
  - Delta ELO con frecce (↑ ↓ →)
  - Percentuali vittoria
  - Partite giocate/vinte/perse
  - Statistiche games vinti/persi

**Colonne:**
| Pos | Giocatore | ELO | Δ | V | S | P | % | GW | GL |

---

### 3. `printTournamentReport(tournament, matches, players, standings, eloHistory?)`
**Stampa report completo torneo**

- **Formato**: A4 Portrait
- **Contenuto**:
  - Header con nome torneo, club, data, tipo
  - Tabella classifica finale
  - Elenco tutte le partite con punteggi
  - Variazioni ELO per giocatore (se torneo completato)
  - Footer con timestamp generazione

**Sezioni:**
1. **Classifica**: Posizione, giocatore, partite, vittorie, sconfitte, games, delta ELO
2. **Partite**: Team vs Team, punteggi set, vincitore
3. **Variazioni ELO**: Solo per tornei completati

---

### 4. `printTournamentStatistics(stats: any)`
**Stampa statistiche dettagliate torneo**

- **Formato**: A4 Portrait
- **Contenuto**:
  - Top 5 giocatori per:
    - Maggior numero vittorie
    - Miglior percentuale vittoria (min 2 partite)
    - Maggior guadagno ELO
  - Statistiche complete per ogni giocatore:
    - Partite, vittorie, sconfitte, pareggi
    - Games vinti/persi
    - Percentuale vittoria
    - Variazione ELO totale

---

### 5. `printBeatTheBoxBlank(tournament, boxes, players)`
**Stampa tabellone vuoto Beat the Box**

- **Formato**: A4 Portrait
- **Contenuto**:
  - Header torneo
  - Box 1, 2, 3 con composizione squadre
  - Spazi vuoti per punteggi da compilare a mano
  - Tabella risultati vuota

**Utilizzo:** Prima dell'inizio del torneo per avere tabellone cartaceo

---

### 6. `printBeatTheBoxComplete(tournament, boxes, semifinals, finals, standings, players)`
**Stampa tabellone completo Beat the Box**

- **Formato**: A4 Portrait
- **Contenuto**:
  - Header torneo
  - Box 1, 2, 3 con risultati partite
  - Semifinali con punteggi
  - Finali (1°-2° posto, 3°-4° posto)
  - Classifica squadre
  - Classifica individuale con statistiche

**Sezioni:**
1. **Box Phase**: Tabelle con team, punteggi, vincitore
2. **Semifinals**: Vincitori box vs vincitore diverso
3. **Finals**: 
   - Finale 1°-2° posto
   - Finale 3°-4° posto
4. **Team Standings**: Classifica finale squadre
5. **Individual Standings**: Classifica individuale giocatori

---

## Stili CSS Principali

### @page Rules
```css
@page {
  size: A4;                    /* A4 Portrait (default) */
  size: A4 landscape;          /* A4 Landscape (per grafici) */
  margin: 12mm 10mm;           /* Margini standard */
  margin: 7mm 6mm;             /* Margini ridotti (Beat the Box) */
}
```

### Font
- **Screen**: System fonts (-apple-system, Roboto, Arial)
- **Print**: Google Font "Manrope" (400, 700)

### Print-specific Rules
```css
@media print {
  body {
    -webkit-print-color-adjust: exact;  /* Preserve colors in PDF */
    print-color-adjust: exact;
  }
  .no-print {
    display: none !important;           /* Nasconde elementi UI */
  }
}
```

### Tabelle
```css
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9px-10px;
}
th {
  background-color: #2196f3;  /* Blu per header */
  color: white;
  padding: 4px 5px;
}
td {
  border-bottom: 1px solid #e5e7eb;
  padding: 4px 5px;
}
tr:nth-child(even) {
  background-color: #f8fafc;  /* Zebra striping */
}
```

### Delta ELO Colori
```css
.delta-positive { color: green !important; }  /* ELO aumentato */
.delta-negative { color: red !important; }    /* ELO diminuito */
```

---

## Limitazioni e Note

### 1. Browser Compatibility
- Funziona su tutti i browser moderni (Chrome, Firefox, Safari, Edge)
- `window.print()` è supportato universalmente
- `print-color-adjust: exact` richiede prefissi vendor

### 2. Font Loading
- **Google Fonts** può richiedere tempo per il caricamento
- Timeout di 250-500ms garantisce rendering completo
- Fallback a system fonts se font non disponibile

### 3. Grafici SVG
- Recharts genera SVG che può essere pesante
- Timeout di 500ms per grafici complessi
- Legenda personalizzata per evitare problemi di rendering

### 4. Popup Blockers
- `window.open()` può essere bloccato da popup blockers
- L'utente deve autorizzare i popup dal sito

### 5. Dimensioni Pagina
- Layout ottimizzato per **A4** (210mm x 297mm)
- Landscape per grafici larghi
- Portrait per documenti testuali

---

## Esempi di Utilizzo

### Esportare Classifica
```typescript
import { printRanking } from './services/printService.ts';

const ranking: RankingEntry[] = [...];
printRanking(ranking);
```

### Esportare Report Torneo
```typescript
import { printTournamentReport } from './services/printService.ts';

printTournamentReport(
  tournament,
  matches,
  players,
  standings,
  eloHistory
);
```

### Esportare Grafico ELO
```typescript
import { printChart } from './services/printService.ts';

// Dopo aver renderizzato il grafico nel DOM
printChart('elo-chart-container');
```

---

## Workflow Utente

1. **Utente clicca** pulsante "Stampa" nell'interfaccia
2. **Si apre** nuova finestra con contenuto formattato
3. **Si avvia** automaticamente dialog di stampa del browser
4. **Utente seleziona**:
   - Stampante (fisica o "Salva come PDF")
   - Orientamento (automatico)
   - Formato (A4)
5. **Conferma** stampa o salvataggio PDF
6. **Finestra si chiude** automaticamente

---

## Personalizzazione Futura

Per aggiungere nuovi tipi di export:
1. Creare funzione in `printService.ts`
2. Generare HTML come stringa
3. Definire stili CSS specifici
4. Chiamare `openPrintWindow(title, content, pageStyles)`
5. Impostare timeout appropriato

**Template:**
```typescript
export const printMyDocument = (data: any) => {
  const content = `
    <style>
      @page { size: A4; margin: 12mm; }
      /* custom styles */
    </style>
    <div>
      <!-- HTML content -->
    </div>
  `;
  
  openPrintWindow('My Document', content);
};
```


