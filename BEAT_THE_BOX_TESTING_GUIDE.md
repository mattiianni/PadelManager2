# 📦 BEAT THE BOX - GUIDA AL TEST

## 🧪 TEST SCENARIO 1: 4 COPPIE (2 BOX)

### Preparazione:
1. Vai su DrawPage
2. Seleziona 8 giocatori (4 coppie)
3. Click "Genera Coppie"

### Flusso Nuovo Torneo:
1. Click "BEAT THE BOX"
2. ✨ Animazione 3 secondi
3. Verifica: 2 box con 4 giocatori ciascuno
4. Verifica: Distribuzione ELO (1°+4° in Box1, 2°+3° in Box2)
5. Verifica: 3 partite per box (6 totali)
6. Verifica: MatchScoreInput visibile
7. Click "Salva Calendario"
8. Verifica: Modale "Calendario Salvato"

### Flusso Recupero:
9. Vai su Tornei
10. Trova torneo salvato (badge "Scheduled")
11. Click matita → Apre MatchesPage modale
12. Verifica: Badge "📦 Beat the Box - Fase Box"
13. Inserisci risultati delle 6 partite
14. Click "Calcola Qualificati"
15. Verifica: Modale "Classifiche Box Completate"
16. Verifica: 2 box con primi 2 evidenziati
17. Click "Procedi alle Finali"
18. Verifica: Modale "Beat the Box - Finali"
19. Verifica: 2 finali (1°-2° e 3°-4°)
20. Inserisci risultati finali
21. Click "Finalizza Torneo"
22. Verifica: ELO aggiornati
23. ✅ SUCCESSO!

---

## 🧪 TEST SCENARIO 2: 6 COPPIE (3 BOX)

### Preparazione:
1. Seleziona 12 giocatori (6 coppie)
2. Genera Coppie
3. Click "BEAT THE BOX"

### Verifica:
- 3 box (Box 1, 2, 3)
- Distribuzione: 1°+6°, 2°+5°, 3°+4°
- 9 partite totali (3 per box)
- 3 finali: 1°-2°, 3°-4°, Consolazione

---

## 🧪 TEST SCENARIO 3: 8 COPPIE (4 BOX)

### Preparazione:
1. Seleziona 16 giocatori (8 coppie)
2. Genera Coppie
3. Click "BEAT THE BOX"

### Verifica:
- 4 box
- 12 partite box (3 per box)
- 2 semifinali
- 2 finali (1°-2° e 3°-4°)

### Flusso Recupero:
- Salva calendario
- Riapri
- Inserisci risultati 12 partite box
- Calcola Qualificati
- Modale classifiche 4 box
- Procedi alle Semifinali
- Inserisci risultati 2 semifinali
- Procedi alle Finali
- Inserisci risultati 2 finali
- Finalizza
- ✅ ELO calcolati

---

## 🔍 CHECKLIST VERIFICA GRAFICA

### Box Phase:
- [ ] Sfondo neutro `bg-gray-50 dark:bg-gray-900`
- [ ] Card partite bianche `bg-white dark:bg-gray-800`
- [ ] MatchScoreInput visibile e funzionante
- [ ] 3 pulsanti: Annulla | Salva Calendario (verde) | Calcola Qualificati

### Modali:
- [ ] Badge blu "📦 Beat the Box - Fase Box"
- [ ] Classifiche box con primi 2 evidenziati
- [ ] Semifinali con badge viola
- [ ] Finali con badge giallo
- [ ] Titoli finali corretti (1°-2°, 3°-4°, Consolazione)

### Funzionalità:
- [ ] Validazione: solo numero pari coppie
- [ ] Pulsante "Beat the Box" visibile solo se pari
- [ ] Animazione 3 secondi
- [ ] Distribuzione zigzag corretta
- [ ] Salvataggio calendario OK
- [ ] Recupero da Tornei OK
- [ ] Calcolo qualificati OK
- [ ] Modali si aprono in sequenza
- [ ] Completamento aggiorna ELO
- [ ] Refresh automatico post-completamento

---

## 🚫 TEST EDGE CASE

### Numero Dispari:
1. Seleziona 5 coppie (10 giocatori)
2. Genera Coppie
3. Verifica: Pulsante "BEAT THE BOX" **NON** presente

### Numero Insufficiente:
1. Seleziona 2 coppie (4 giocatori)
2. Verifica: Nessun formato Beat the Box disponibile

### Risultati Mancanti:
1. Crea torneo Beat the Box
2. Non inserire tutti i risultati
3. Click "Calcola Qualificati"
4. Verifica: Alcuni match con winner null
5. Sistema calcola comunque (o errore?)

### Annulla Durante Flusso:
1. Inizia torneo
2. Inserisci alcuni risultati
3. Click "Annulla"
4. Verifica: Torna a DrawPage
5. Verifica: Nessun torneo salvato

---

## 📊 METRICHE SUCCESSO

### Salvataggio:
- Torneo appare in lista Tornei
- Status: "scheduled"
- Badge giallo visibile
- Numero partite corretto

### Recupero:
- Modale si apre con partite corrette
- Risultati già inseriti persistono
- Flusso continua correttamente
- Modali si aprono in sequenza

### Completamento:
- Status diventa "completed"
- ELO aggiornati (verificare differenza)
- Torneo appare in Ranking
- Statistiche corrette

---

**Pronto per il test! Vai su http://localhost:3000**

