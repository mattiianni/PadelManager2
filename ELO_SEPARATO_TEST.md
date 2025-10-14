# 🧪 Test Sistema ELO Separato per Torneo

## 📋 Scenario di Test

### Setup Iniziale:
- 4 Giocatori: A, B, C, D (tutti partono da 1500)
- 2 Tornei paralleli:
  - **TorneOtto Inverno** (2 giornate)
  - **Americano Venerdì** (1 giornata in mezzo)

### Timeline:
```
3 Ottobre  → TorneOtto Inverno - Giornata 1
5 Ottobre  → Americano Venerdì - Giornata 1
9 Ottobre  → TorneOtto Inverno - Giornata 2
```

---

## ✅ Risultati Attesi

### TorneOtto Inverno - Giornata 1 (3 Ottobre):

**Partite:**
- A+B vs C+D → Vince A+B

**ELO Partenza:**
- A: 1500, B: 1500, C: 1500, D: 1500

**ELO Finale (K=16 per TorneOtto):**
- A: 1508, B: 1508 (vincitori, +8 ciascuno)
- C: 1492, D: 1492 (perdenti, -8 ciascuno)

**Global ELO (classifica generale):**
- A: 1500 + 8 = 1508
- B: 1500 + 8 = 1508
- C: 1500 - 8 = 1492
- D: 1500 - 8 = 1492

---

### Americano Venerdì - Giornata 1 (5 Ottobre):

**Partite:**
- A+C vs B+D → Vince A+C

**⚠️ ELO Partenza (TORNEO SEPARATO):**
- A: **1500** (non 1508!) ← Parte da zero per questo torneo
- B: **1500** (non 1508!)
- C: **1500** (non 1492!)
- D: **1500** (non 1492!)

**ELO Finale (K=24 per Americano):**
- A: 1512, C: 1512 (vincitori, +12 ciascuno)
- B: 1488, D: 1488 (perdenti, -12 ciascuno)

**Global ELO (classifica generale):**
- A: 1508 + 12 = **1520** (TorneOtto +8, Americano +12)
- B: 1508 - 12 = **1496** (TorneOtto +8, Americano -12)
- C: 1492 + 12 = **1504** (TorneOtto -8, Americano +12)
- D: 1492 - 12 = **1480** (TorneOtto -8, Americano -12)

---

### TorneOtto Inverno - Giornata 2 (9 Ottobre):

**Partite:**
- A+D vs B+C → Vince B+C

**⚠️ ELO Partenza (CONTINUA DA GIORNATA 1 DI TORNEOTTO):**
- A: **1508** (dalla Giornata 1 di TorneOtto, NON 1520!)
- B: **1508** (dalla Giornata 1 di TorneOtto, NON 1496!)
- C: **1492** (dalla Giornata 1 di TorneOtto, NON 1504!)
- D: **1492** (dalla Giornata 1 di TorneOtto, NON 1480!)

**ELO Finale (K=16 per TorneOtto):**
- B: 1516, C: 1500 (vincitori, +8 ciascuno)
- A: 1500, D: 1484 (perdenti, -8 ciascuno)

**Global ELO (classifica generale) - SOMMA FINALE:**
- A: 1500 + (TorneOtto: +0) + (Americano: +12) = **1512**
- B: 1500 + (TorneOtto: +16) + (Americano: -12) = **1504**
- C: 1500 + (TorneOtto: 0) + (Americano: +12) = **1512**
- D: 1500 + (TorneOtto: -16) + (Americano: -12) = **1472**

---

## 📊 Verifica Risultati

### Classifica TorneOtto Inverno (finale, 2 giornate):
```
1. B: 1516 ELO (Giornata 1: +8, Giornata 2: +8)
2. C: 1500 ELO (Giornata 1: -8, Giornata 2: +8)
3. A: 1500 ELO (Giornata 1: +8, Giornata 2: -8)
4. D: 1484 ELO (Giornata 1: -8, Giornata 2: -8)
```

### Classifica Americano Venerdì (1 giornata):
```
1. A: 1512 ELO (+12)
2. C: 1512 ELO (+12)
3. B: 1488 ELO (-12)
4. D: 1488 ELO (-12)
```

### Classifica Generale (somma):
```
1. A: 1512 (TorneOtto: 0, Americano: +12)
2. C: 1512 (TorneOtto: 0, Americano: +12)
3. B: 1504 (TorneOtto: +16, Americano: -12)
4. D: 1472 (TorneOtto: -16, Americano: -12)
```

---

## ✅ Cosa Verificare

- [ ] Giornata 1 di TorneOtto parte da 1500 per tutti
- [ ] Americano parte da 1500 per tutti (ignora TorneOtto)
- [ ] Giornata 2 di TorneOtto parte da ELO Giornata 1 (non da Americano)
- [ ] Global ELO è la somma dei delta
- [ ] Classifica per torneo mostra ELO isolato
- [ ] Classifica generale mostra somma

---

**Test creato:** 9 Ottobre 2025  
**Versione Sistema:** 2.0

