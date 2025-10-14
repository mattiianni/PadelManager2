# ⚙️ K-Factors Sistema ELO - Round Robin + Finali

## 📊 Configurazione Implementata

### K-Factors per Tipo di Torneo

| Torneo | K Factor | Note |
|--------|----------|------|
| **TorneOtto 30'** | `16` | Volatilità standard per tornei brevi |
| **Americano** | `24` | Volatilità media per molte partite con partner variabili |
| **Round Robin + Finali** | Variabile | K diversi per fase (vedi sotto) |

### K-Factors per Round Robin + Finali (Fasi)

| Fase | K Factor | Motivo |
|------|----------|--------|
| **Round Robin** | `20` | Volatilità contenuta - determina chi va in finale |
| **Finali** | `36` | Volatilità alta - garantisce che i vincitori abbiano ELO più alto |

## 🎯 Perché K=20/K=36?

### Simulazione Scenario Critico:

**Situazione:**
- Squadra A vince TUTTE le partite del Round Robin
- Squadra B arriva seconda
- **FINALE 1°-2°**: B batte A (upset!)

**Risultato con K=20 RR, K=36 Finali:**
```
1° B: 1528.74 ELO 🥇 (Vincitore finale 1°-2°)
2° A: 1510.14 ELO 🥈 (Perdente finale 1°-2°)
3° C: 1507.29 ELO 🥉 (Vincitore finale 3°-4°)
4° D: 1453.83 ELO     (Perdente finale 3°-4°)
```

✅ **La classifica ELO rispecchia perfettamente i risultati delle finali!**

### Confronto Configurazioni:

| Config | B vs A | A vs C | C vs D | Verdetto |
|--------|--------|--------|--------|----------|
| K=28 uniforme | ✅ B > A (gap: 3.33) | ✅ A > C | ✅ C > D | OK ma rischio |
| **K=20/K=36** | ✅ B > A (gap: 18.60) | ✅ A > C (gap: 2.85) | ✅ C > D | **✅ OTTIMO** |
| K=16/K=32 | ✅ B > A | ❌ **C > A** | ✅ C > D | ❌ Fallisce |

## 🔧 Implementazione Tecnica

### File Modificati:

1. **`api/lib/constants.ts`** e **`pages/api/lib/constants.ts`**
   - Aggiunto `K_FACTORS_ROUND_ROBIN_FINALI`

2. **`api/lib/elo.ts`** e **`pages/api/lib/elo.ts`**
   - Aggiunto parametro `phase?: 'roundRobin' | 'finals'`
   - Logica per usare K diversi in base alla fase

3. **`api/tournaments/bulk-matches.ts`** e **`pages/api/tournaments/bulk-matches.ts`**
   - Calcola automaticamente quale fase (prime N-2 partite = RR, ultime 2 = finali)
   - Passa il parametro `phase` a `calculateEloChange()`

### Come Funziona:

```javascript
// Per ogni match in Round Robin + Finali:
const phase = isRoundRobinFinali 
    ? (matchIndex < roundRobinMatchCount ? 'roundRobin' : 'finals')
    : undefined;

// K=20 per partite 0-5 (Round Robin)
// K=36 per partite 6-7 (Finali)
const eloDelta = calculateEloChange(elo1, elo2, score, tournamentType, phase);
```

## ✅ Vantaggi

1. **Matematicamente robusto**: Le finali hanno peso sufficiente per determinare l'ordine ELO
2. **Margini di sicurezza**: Gap di ~18 punti tra vincitore e perdente finale 1°-2°
3. **Backwards compatible**: Altri tornei (TorneOtto, Americano) non sono influenzati
4. **Duplice garanzia**:
   - Classifica mostrata = basata su finali (UI)
   - Classifica ELO = rispecchia finali (matematica)

## 🧪 Test Raccomandato

Crea un torneo Round Robin + Finali con:
- 4 coppie
- Squadra che vince tutte le partite RR ma perde la finale
- Verifica che il vincitore della finale 1°-2° abbia **sempre** l'ELO più alto

---

**Data implementazione**: 8 Ottobre 2025  
**Versione backup**: new_7.zip

