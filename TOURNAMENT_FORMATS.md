# 🏆 Formati Torneo - Guida Completa

## 📊 Matrice Coppie → Formati Disponibili

| N° Coppie | Giocatori | Formati Disponibili |
|-----------|-----------|---------------------|
| **2** | 4 | 🎾 Match Singolo |
| **3** | 6 | ❌ Nessun formato disponibile |
| **4** | 8 | 🏅 TorneOtto 30' / 🏆 Round Robin + Finali / 🔄 Americano / 🆓 Torneo Libero |
| **5** | 10 | 🏆 Round Robin + Finali / 🆓 Torneo Libero |
| **6-10** | 12-20 | 🏆 Round Robin + Finali / 🔄 Americano / 🆓 Torneo Libero / 🎯 Gironi + Fase Finale |

---

## 🎾 1. MATCH SINGOLO

### Requisiti
- **Coppie:** 2 esatte (4 giocatori)
- **Partite:** 1

### Caratteristiche
- Partita amichevole singola
- Ideale per: sfide rapide, allenamenti

### Sistema ELO
- **K-Factor:** 20
- **Variazione:** ±10 punti (tra squadre pari)

### Esempio Flow
```
2 coppie sorteggi
  ↓
Seleziona "Match Singolo"
  ↓
Inserisci risultato
  ↓
ELO aggiornato con K=20
```

---

## 🏅 2. TorneOtto 30'

### Requisiti
- **Coppie:** 4 esatte (8 giocatori)
- **Partite:** 6 (round robin completo)

### Caratteristiche
- Round Robin: tutti contro tutti
- Partite da 30 minuti
- Classifica finale basata su punti e differenza giochi

### Sistema ELO
- **K-Factor:** 16 (conservativo)
- **Variazione:** ±8 punti (tra squadre pari)
- **Range tipico:** ~47 punti tra primo e ultimo dopo il torneo

### Calendario Partite (4 coppie)
```
Round 1: A-B, C-D
Round 2: A-C, B-D
Round 3: A-D, B-C
```
Totale: 6 partite

### Esempio Flow
```
4 coppie sorteggiate
  ↓
Seleziona "TorneOtto 30'"
  ↓
6 partite generate (round robin)
  ↓
Inserisci tutti i risultati
  ↓
Classifica finale + aggiornamento ELO (K=16)
```

---

## 🏆 3. ROUND ROBIN + FINALI (Sistema Asimmetrico)

### Requisiti
- **Coppie:** 4, 5 o 6+ (8, 10 o 12+ giocatori)
- **Partite:** Variabili

### Struttura del Torneo

#### Con 4 Coppie
- **Fase 1 - Round Robin:** 6 partite (tutti contro tutti)
- **Fase 2 - Finali:** 2 partite
  - Finale 1°-2° posto
  - Finale 3°-4° posto
- **Totale partite:** 8

#### Con 5 Coppie
- **Fase 1 - Round Robin:** 10 partite (tutti contro tutti)
- Le **prime 4 classificate** accedono alle finali
- **Fase 2 - Finali:** 2 partite
- **Totale partite:** 12

#### Con 6+ Coppie
- **Fase 1 - Round Robin:** Tutti contro tutti
- Le **prime 4 classificate** accedono alle finali
- **Fase 2 - Finali:** 2 partite
- **Totale partite:** Round Robin + 2 finali

### Sistema ELO Asimmetrico

#### Fase Round Robin
- **K-Factor:** 10 (simmetrico, conservativo)
- **Variazione:** ±5 punti
- Scopo: determinare le migliori 4 coppie per le finali

#### Fase Finali - K Asimmetrico

**Finale 1°-2° Posto:**
- **Vincitore:** K = 32 → **+16 punti** 🔥
- **Perdente:** K = 10 → **-5 punti**

**Finale 3°-4° Posto:**
- **Vincitore:** K = 4 → **+2 punti**
- **Perdente:** K = 24 → **-12 punti** ⚠️

### Perché il Sistema Asimmetrico?

1. ✅ **Garantisce ordine corretto:** Il 1° ha sempre più ELO del 2°
2. ✅ **Previene inversioni:** Il 3° non può mai superare il 2°
3. ✅ **Penalizza l'ultimo:** Il 4° ha una penalità significativa
4. ✅ **Ricompensa il vincitore:** Chi vince la finale per il 1° posto riceve il massimo

### Esempio Calcolo ELO (con upset)

**Scenario:**
- Coppia A domina il Round Robin (3-0)
- Coppia B arriva seconda (2-1)
- **Upset in finale:** B batte A

**Risultato ELO:**
```
1° B: ~1516 ELO 🥇 (Vincitore finale, +16 dalla finale)
2° A: ~1515 ELO 🥈 (Perdente finale, -5 dalla finale)
3° C: ~1504 ELO 🥉 (Vincitore finale 3°-4°, +2)
4° D: ~1488 ELO     (Perdente finale 3°-4°, -12)
```

✅ **Gap garantiti:** 1° > 2° > 3° > 4° sempre rispettato!

### Esempio Flow
```
5 coppie sorteggiate
  ↓
Seleziona "Round Robin + Finali"
  ↓
10 partite Round Robin (K=10)
  ↓
Classifica Round Robin
  ↓
TOP 4 accedono alle finali
  ↓
2 finali con K asimmetrico
  ↓
Classifica finale + ELO aggiornato
```

---

## 🔄 4. AMERICANO

### Requisiti
- **Coppie minime:** 4 (8 giocatori)
- **Coppie consigliate:** 6-10 (12-20 giocatori)
- **Partite:** Configurabili

### Caratteristiche Uniche
- **Partner casuali:** Cambiano ad ogni partita
- **Classifica individuale:** Ogni giocatore accumula punti personali
- **Flessibile:** Configurabile per numero campi e round

### Configurazione

**Numero Campi:**
- 1-4 campi simultanei
- Determina il numero di partite per round

**Numero Round:**
- Da 2 a 10+ round
- Ogni round crea nuove coppie casuali

**Sistema Punteggio:**
- **Differenza Giochi:** Classifica basata su (giochi vinti - giochi persi)
- **Punti Partita:** Classifica basata su vittorie/sconfitte

### Sistema ELO
- **K-Factor:** 24 (medio-alto)
- **Variazione:** ±12 punti (tra squadre pari)
- **Rationale:** K più alto compensa la variabilità dei partner

### Calcolo Classifica

**Sistema "Differenza Giochi":**
```
Punteggio finale = Giochi Vinti - Giochi Persi
```

**Sistema "Punti Partita":**
```
Vittoria = 3 punti
Sconfitta = 0 punti
```

### Esempio Flow
```
8 giocatori (4 coppie iniziali)
  ↓
Seleziona "Americano"
  ↓
Configura: 2 campi, 4 round, Diff. Giochi
  ↓
16 partite generate (partner casuali)
  ↓
Inserisci risultati
  ↓
Classifica individuale + ELO aggiornato (K=24)
```

---

## 🆓 5. TORNEO LIBERO

### Requisiti
- **Coppie:** 4, 5 o 6+ (flessibile)
- **Partite:** Round Robin completo

### Caratteristiche
- Formato flessibile per qualsiasi numero di coppie
- Round Robin: tutti contro tutti
- Nessuna fase finale
- Classifica basata su punti e differenza giochi

### Sistema ELO
- **K-Factor:** 16 (come TorneOtto)
- **Variazione:** ±8 punti

### Numero Partite per Coppie

| Coppie | Partite Generate |
|--------|------------------|
| 4 | 6 |
| 5 | 10 |
| 6 | 15 |
| 7 | 21 |
| 8 | 28 |

Formula: `n × (n-1) / 2` dove n = numero coppie

### Esempio Flow
```
5 coppie sorteggiate
  ↓
Seleziona "Torneo Libero"
  ↓
10 partite generate (round robin)
  ↓
Inserisci risultati
  ↓
Classifica finale + ELO aggiornato (K=16)
```

---

## 🎯 6. GIRONI + FASE FINALE

### Requisiti
- **Coppie:** 6-10 (12-20 giocatori)
- **Partite:** Fase gironi + fase finale

### Caratteristiche
- ⚠️ **FORMATO IN PREPARAZIONE**
- Pianificato per tornei più grandi
- Previsto: gironi da 3-4 coppie + fase ad eliminazione diretta

### Struttura Pianificata

**Fase 1 - Gironi:**
- Divisione in 2+ gironi
- Round robin all'interno di ogni girone
- Prime 2 di ogni girone accedono alla fase finale

**Fase 2 - Fase Finale:**
- Semifinali
- Finale 1°-2° posto
- Finale 3°-4° posto

### Sistema ELO (Pianificato)
- K-Factor differenziato per fase
- Da definire dopo implementazione

---

## 📝 Tabella Riepilogativa K-Factors

| Formato Torneo | K-Factor | Variazione (1500 vs 1500) | Note |
|----------------|----------|---------------------------|------|
| **Match Singolo** | 20 | ±10 punti | Equilibrato |
| **TorneOtto 30'** | 16 | ±8 punti | Conservativo |
| **Americano** | 24 | ±12 punti | Compensa variabilità |
| **Torneo Libero** | 16 | ±8 punti | Come TorneOtto |
| **Round Robin + Finali** | | | **Sistema Asimmetrico** |
| ↳ Fase Round Robin | 10 | ±5 punti | Molto conservativo |
| ↳ Finale 1°-2° (Winner) | 32 | +16 punti | 🔥 Massima ricompensa |
| ↳ Finale 1°-2° (Loser) | 10 | -5 punti | Minima penalità |
| ↳ Finale 3°-4° (Winner) | 4 | +2 punti | Minima ricompensa |
| ↳ Finale 3°-4° (Loser) | 24 | -12 punti | ⚠️ Alta penalità |
| **Gironi + Fase Finale** | TBD | TBD | In preparazione |

---

## 🎯 Linee Guida per la Scelta del Formato

### Pochi Giocatori (2 coppie / 4 giocatori)
✅ **Match Singolo** - Unica opzione disponibile

### Gruppo Piccolo (4 coppie / 8 giocatori)
- 🏅 **TorneOtto 30'** - Se vuoi un torneo veloce e bilanciato
- 🏆 **Round Robin + Finali** - Se vuoi finali emozionanti e gap ELO maggiori
- 🔄 **Americano** - Se vuoi far giocare tutti con tutti
- 🆓 **Torneo Libero** - Se vuoi flessibilità

### Gruppo Medio (5 coppie / 10 giocatori)
- 🏆 **Round Robin + Finali** - Le prime 4 vanno in finale
- 🆓 **Torneo Libero** - 10 partite round robin

### Gruppo Grande (6-10 coppie / 12-20 giocatori)
- 🏆 **Round Robin + Finali** - Con qualificazione alle finali
- 🔄 **Americano** - Ideale per tanti giocatori, partner variabili
- 🆓 **Torneo Libero** - Se vuoi round robin completo
- 🎯 **Gironi + Fase Finale** - (In preparazione)

---

## 🔄 Changelog

**Versione 2.0** - 9 Ottobre 2025 🎉
- ✅ **SISTEMA ELO SEPARATO PER TORNEO** (breaking change)
- ✅ Ogni torneo ha il proprio contesto ELO isolato
- ✅ Giornate successive dello stesso torneo partono dall'ELO della giornata precedente
- ✅ Prima giornata di ogni torneo parte da 1500
- ✅ Tornei diversi NON si influenzano a vicenda
- ✅ Classifica generale = somma dei delta di tutti i tornei
- ✅ ELO calcolato in-memory per ogni giornata (non più current_elo globale)

**Versione 1.2** - 9 Ottobre 2025
- ✅ Giocatori sotto soglia presenza ora visibili dopo quelli sopra soglia
- ✅ Separatore visivo tra giocatori sopra/sotto soglia (UI e PDF)
- ✅ Intestazione PDF con info filtro torneo e presenza
- ✅ Spiegazione comportamento filtro in PDF

**Versione 1.1** - 9 Ottobre 2025
- ✅ Aggiunto filtro classifica per torneo specifico
- ✅ Aggiunto filtro presenza minima (50%, 60%, 70%, 80%, 90%)
- ✅ Calcolo automatico giornate per torneo
- ✅ Classifica dinamica basata su ELO di torneo specifico

**Versione 2.0.1** - 9 Ottobre 2025
- Documento creato con tutti i 6 formati
- Sistema asimmetrico Round Robin + Finali documentato
- Corretta descrizione: Round Robin + Finali disponibile per 4, 5, 6+ coppie
- Aggiunto Torneo Libero e Gironi + Fase Finale

---

## 📌 Note Implementative

### Formati Completamente Implementati
- ✅ Match Singolo
- ✅ TorneOtto 30'
- ✅ Round Robin + Finali (con sistema asimmetrico)
- ✅ Americano

### Formati Parzialmente Implementati
- ⚠️ Torneo Libero (genera partite ma trattato come TorneOtto)

### Formati In Preparazione
- 🚧 Gironi + Fase Finale

---

## 🎯 Funzionalità Classifica

### Filtro per Torneo
Nella pagina **Classifica**, puoi:
- Visualizzare la **classifica generale** (default)
- Selezionare un **torneo specifico** dal dropdown per vedere solo i giocatori che hanno partecipato

### Filtro Presenza (solo per tornei specifici)
Quando selezioni un torneo con più giornate, puoi filtrare per **presenza minima**:
- **Tutti**: Mostra tutti i giocatori del torneo
- **50%**: Ordina per presenza, chi ha partecipato ad almeno metà delle giornate appare prima
- **60%**, **70%**, **80%**, **90%**: Soglie progressive

**⚠️ IMPORTANTE:** I giocatori sotto soglia **NON spariscono** dalla classifica, ma vengono mostrati **dopo** quelli che superano la soglia, separati da una linea visiva.

**Esempio:**
```
Torneo "TorneOtto Lunedì" con 4 giornate, filtro al 70%:

1. Mario:  1520 ELO (4/4 giornate = 100%) ✅
2. Luca:   1515 ELO (3/4 giornate = 75%)  ✅
─────── SOGLIA 70% (3 giornate su 4) ───────
3. Anna:   1510 ELO (2/4 giornate = 50%)  ⬇️
4. Paolo:  1505 ELO (1/4 giornate = 25%)  ⬇️
```

Questo permette di:
- ✅ Premiare la costanza mettendo in evidenza chi partecipa regolarmente
- ✅ Mantenere tutti i giocatori visibili nella classifica
- ✅ Evitare che chi partecipa a una sola giornata dominante la classifica

---

### Stampa PDF
La stampa include:
- **Intestazione**: Indica se è classifica generale o filtrata per torneo
- **Info Torneo**: Nome, tipo e data del torneo selezionato
- **Info Presenza**: Se attivo, mostra soglia e numero giornate richieste
- **Separatore visivo**: Linea tra giocatori sopra e sotto soglia
- **Nota esplicativa**: Spiega che chi è sotto soglia è elencato dopo

---

## 🎯 Sistema ELO Separato per Torneo (v2.0)

### Come Funziona

**Isolamento Tornei:**
Ogni torneo ha il proprio "universo ELO" completamente isolato dagli altri.

**Esempio Pratico:**
```
TorneOtto Inverno 2025:
  Giornata 1 (3 Ottobre):
    - Mario parte da: 1500 (prima giornata)
    - Mario finisce a: 1525
  
  Giornata 2 (9 Ottobre):
    - Mario parte da: 1525 (da giornata 1)
    - Mario finisce a: 1545

Americano Venerdì (5 Ottobre - in mezzo):
  Giornata 1:
    - Mario parte da: 1500 (prima giornata, indipendente)
    - Mario finisce a: 1520

Classifica Generale di Mario:
  1500 + (TorneOtto: +45) + (Americano: +20) = 1565 ✅
```

**Vantaggi:**
- ✅ **Isolamento**: I tornei non si influenzano
- ✅ **Equità**: Ogni torneo parte da zero (1500)
- ✅ **Continuità**: Giornate successive mantengono la progressione
- ✅ **Trasparenza**: Classifica generale = somma visibile dei contributi

**Classifica Generale:**
```
current_elo = 1500 + Σ(delta di tutti i tornei completati)
```

**Classifica per Torneo:**
```
tournament_elo = ELO dopo ultima giornata di quel torneo
```

---

**Ultimo aggiornamento:** 9 Ottobre 2025  
**Versione:** 2.0 - Sistema ELO Separato

