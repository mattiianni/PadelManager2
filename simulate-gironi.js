#!/usr/bin/env node

/**
 * Simulazione Torneo Gironi + Fase Finale
 * Testa la distribuzione ELO con K factors proposti
 */

// K Factor gironi + BONUS FISSI per le fasi finali
const K_GIRONI = 16;

// BONUS FISSI (come richiesto dall'utente)
// 4° è SEMPRE meglio del 5° nei gironi (altrimenti non si qualifica!)
const BONUS_SEMIFINALE_VINCENTE = 8;
const BONUS_SEMIFINALE_PERDENTE = 4;

const BONUS_FINALE_VINCENTE = 8;
const BONUS_FINALE_PERDENTE = 4;

const BONUS_FINALINA_VINCENTE = 4;
const BONUS_FINALINA_PERDENTE = 2;

function calculateEloChange(elo1, elo2, score1, kFactor1, kFactor2) {
    const expectedScore1 = 1 / (1 + Math.pow(10, (elo2 - elo1) / 400));
    const expectedScore2 = 1 - expectedScore1;
    const score2 = 1 - score1;
    
    const delta1 = kFactor1 * (score1 - expectedScore1);
    const delta2 = kFactor2 * (score2 - expectedScore2);
    
    return { delta1, delta2 };
}

function simulateTournament() {
    console.log('\n🎮 SIMULAZIONE TORNEO GIRONI + FASE FINALE (9 COPPIE, 3 GIRONI)\n');
    console.log('Sistema ELO:');
    console.log(`  - Gironi: K = ${K_GIRONI} (calcolo ELO standard)`);
    console.log(`  - Semifinali: +${BONUS_SEMIFINALE_VINCENTE} vincente, +${BONUS_SEMIFINALE_PERDENTE} perdente (BONUS FISSI)`);
    console.log(`  - Finale 1°-2°: +${BONUS_FINALE_VINCENTE} vincente, +${BONUS_FINALE_PERDENTE} perdente (BONUS FISSI)`);
    console.log(`  - Finalina 3°-4°: +${BONUS_FINALINA_VINCENTE} vincente, +${BONUS_FINALINA_PERDENTE} perdente (BONUS FISSI)`);
    console.log('');
    
    // 9 squadre (coppie), tutte partono da 1500
    const teams = Array.from({ length: 9 }, (_, i) => ({
        id: i + 1,
        name: `Coppia ${i + 1}`,
        elo: 1500,
        girone: Math.floor(i / 3), // 0, 1, 2
        puntiGirone: 0,
        gamesWon: 0,
        gamesLost: 0
    }));
    
    console.log('📊 SQUADRE INIZIALI:\n');
    console.log('Girone A: Coppia 1, Coppia 2, Coppia 3');
    console.log('Girone B: Coppia 4, Coppia 5, Coppia 6');
    console.log('Girone C: Coppia 7, Coppia 8, Coppia 9');
    console.log('');
    
    // FASE GIRONI - Round Robin in ogni girone
    console.log('🔵 FASE GIRONI (Round Robin)\n');
    
    for (let g = 0; g < 3; g++) {
        const gironeTeams = teams.filter(t => t.girone === g);
        const gironeName = String.fromCharCode(65 + g); // A, B, C
        console.log(`Girone ${gironeName}:`);
        
        // Ogni squadra gioca contro ogni altra nel girone
        for (let i = 0; i < gironeTeams.length; i++) {
            for (let j = i + 1; j < gironeTeams.length; j++) {
                const team1 = gironeTeams[i];
                const team2 = gironeTeams[j];
                
                // Simula partita: la squadra con ELO più alto ha 70% chance di vincere
                const prob1Win = 1 / (1 + Math.pow(10, (team2.elo - team1.elo) / 400));
                const team1Wins = Math.random() < prob1Win;
                
                const score1 = team1Wins ? 1 : 0;
                const gamesWon1 = team1Wins ? 6 : 4;
                const gamesWon2 = team1Wins ? 4 : 6;
                
                // Calcola ELO change
                const { delta1, delta2 } = calculateEloChange(
                    team1.elo, team2.elo, score1, K_GIRONI, K_GIRONI
                );
                
                team1.elo += delta1;
                team2.elo += delta2;
                
                // Aggiorna statistiche
                team1.puntiGirone += team1Wins ? 3 : 0;
                team2.puntiGirone += team1Wins ? 0 : 3;
                team1.gamesWon += gamesWon1;
                team1.gamesLost += gamesWon2;
                team2.gamesWon += gamesWon2;
                team2.gamesLost += gamesWon1;
                
                console.log(`  ${team1.name} vs ${team2.name}: ${gamesWon1}-${gamesWon2} (Δ1: ${delta1.toFixed(2)}, Δ2: ${delta2.toFixed(2)})`);
            }
        }
        
        // Classifica girone
        gironeTeams.sort((a, b) => {
            if (b.puntiGirone !== a.puntiGirone) return b.puntiGirone - a.puntiGirone;
            return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
        });
        
        console.log(`\n  Classifica Girone ${gironeName}:`);
        gironeTeams.forEach((t, idx) => {
            console.log(`    ${idx + 1}. ${t.name}: ${t.puntiGirone} punti, diff ${t.gamesWon - t.gamesLost} games, ELO ${t.elo.toFixed(2)}`);
        });
        console.log('');
    }
    
    // Qualificati alle semifinali
    const gironeA = teams.filter(t => t.girone === 0).sort((a, b) => b.puntiGirone - a.puntiGirone || (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost));
    const gironeB = teams.filter(t => t.girone === 1).sort((a, b) => b.puntiGirone - a.puntiGirone || (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost));
    const gironeC = teams.filter(t => t.girone === 2).sort((a, b) => b.puntiGirone - a.puntiGirone || (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost));
    
    const primi = [gironeA[0], gironeB[0], gironeC[0]];
    const secondi = [gironeA[1], gironeB[1], gironeC[1]].sort((a, b) => {
        if (b.puntiGirone !== a.puntiGirone) return b.puntiGirone - a.puntiGirone;
        return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
    });
    const miglioreSeconda = secondi[0];
    
    const semifinalisti = [...primi, miglioreSeconda];
    
    console.log('🏆 QUALIFICATI ALLE SEMIFINALI:\n');
    semifinalisti.forEach((t, idx) => {
        const label = idx < 3 ? `1° Girone ${String.fromCharCode(65 + t.girone)}` : 'Migliore 2ª';
        console.log(`  ${label}: ${t.name} (ELO ${t.elo.toFixed(2)}, ${t.puntiGirone} punti, diff ${t.gamesWon - t.gamesLost})`);
    });
    console.log('');
    
    // SEMIFINALI
    console.log('🔵 SEMIFINALI\n');
    
    // Semifinale 1: 1°A vs Migliore 2ª
    const semi1Team1 = semifinalisti[0];
    const semi1Team2 = semifinalisti[3];
    
    const probSemi1 = 1 / (1 + Math.pow(10, (semi1Team2.elo - semi1Team1.elo) / 400));
    const semi1Winner = Math.random() < probSemi1 ? semi1Team1 : semi1Team2;
    const semi1Loser = semi1Winner === semi1Team1 ? semi1Team2 : semi1Team1;
    
    semi1Winner.elo += BONUS_SEMIFINALE_VINCENTE; // BONUS FISSO
    semi1Loser.elo += BONUS_SEMIFINALE_PERDENTE;  // BONUS FISSO
    
    console.log(`Semifinale 1: ${semi1Team1.name} vs ${semi1Team2.name}`);
    console.log(`  Vincitore: ${semi1Winner.name} (+${BONUS_SEMIFINALE_VINCENTE.toFixed(2)} bonus) → ELO ${semi1Winner.elo.toFixed(2)}`);
    console.log(`  Perdente: ${semi1Loser.name} (+${BONUS_SEMIFINALE_PERDENTE.toFixed(2)} bonus) → ELO ${semi1Loser.elo.toFixed(2)}`);
    console.log('');
    
    // Semifinale 2: 1°B vs 1°C
    const semi2Team1 = semifinalisti[1];
    const semi2Team2 = semifinalisti[2];
    
    const probSemi2 = 1 / (1 + Math.pow(10, (semi2Team2.elo - semi2Team1.elo) / 400));
    const semi2Winner = Math.random() < probSemi2 ? semi2Team1 : semi2Team2;
    const semi2Loser = semi2Winner === semi2Team1 ? semi2Team2 : semi2Team1;
    
    semi2Winner.elo += BONUS_SEMIFINALE_VINCENTE; // BONUS FISSO
    semi2Loser.elo += BONUS_SEMIFINALE_PERDENTE;  // BONUS FISSO
    
    console.log(`Semifinale 2: ${semi2Team1.name} vs ${semi2Team2.name}`);
    console.log(`  Vincitore: ${semi2Winner.name} (+${BONUS_SEMIFINALE_VINCENTE.toFixed(2)} bonus) → ELO ${semi2Winner.elo.toFixed(2)}`);
    console.log(`  Perdente: ${semi2Loser.name} (+${BONUS_SEMIFINALE_PERDENTE.toFixed(2)} bonus) → ELO ${semi2Loser.elo.toFixed(2)}`);
    console.log('');
    
    // FINALI
    console.log('🔵 FINALI\n');
    
    // Finalina 3°-4° posto
    const probFinalina = 1 / (1 + Math.pow(10, (semi2Loser.elo - semi1Loser.elo) / 400));
    const terzo = Math.random() < probFinalina ? semi1Loser : semi2Loser;
    const quarto = terzo === semi1Loser ? semi2Loser : semi1Loser;
    
    terzo.elo += BONUS_FINALINA_VINCENTE;  // BONUS FISSO
    quarto.elo += BONUS_FINALINA_PERDENTE; // BONUS FISSO
    
    console.log(`Finalina 3°-4°: ${semi1Loser.name} vs ${semi2Loser.name}`);
    console.log(`  3° posto: ${terzo.name} (+${BONUS_FINALINA_VINCENTE.toFixed(2)} bonus) → ELO ${terzo.elo.toFixed(2)}`);
    console.log(`  4° posto: ${quarto.name} (+${BONUS_FINALINA_PERDENTE.toFixed(2)} bonus) → ELO ${quarto.elo.toFixed(2)}`);
    console.log('');
    
    // Finale 1°-2° posto
    const probFinale = 1 / (1 + Math.pow(10, (semi2Winner.elo - semi1Winner.elo) / 400));
    const primo = Math.random() < probFinale ? semi1Winner : semi2Winner;
    const secondo = primo === semi1Winner ? semi2Winner : semi1Winner;
    
    primo.elo += BONUS_FINALE_VINCENTE;  // BONUS FISSO
    secondo.elo += BONUS_FINALE_PERDENTE; // BONUS FISSO
    
    console.log(`Finale 1°-2°: ${semi1Winner.name} vs ${semi2Winner.name}`);
    console.log(`  1° posto: ${primo.name} (+${BONUS_FINALE_VINCENTE.toFixed(2)} bonus) → ELO ${primo.elo.toFixed(2)}`);
    console.log(`  2° posto: ${secondo.name} (+${BONUS_FINALE_PERDENTE.toFixed(2)} bonus) → ELO ${secondo.elo.toFixed(2)}`);
    console.log('');
    
    // CLASSIFICA FINALE (posizioni REALI del torneo, non per ELO!)
    console.log('='.repeat(70));
    console.log('🏆 CLASSIFICA FINALE DEL TORNEO\n');
    
    // Posizioni reali del torneo
    const classificaFinale = [
        { pos: 1, team: primo, label: '🥇 VINCITORE' },
        { pos: 2, team: secondo, label: '🥈 FINALISTA' },
        { pos: 3, team: terzo, label: '🥉 3° POSTO' },
        { pos: 4, team: quarto, label: '   4° POSTO' }
    ];
    
    // Gli altri classificati dal 5° in poi (ordinati per ELO nei gironi)
    const altri = teams.filter(t => 
        t !== primo && t !== secondo && t !== terzo && t !== quarto
    ).sort((a, b) => b.elo - a.elo);
    
    altri.forEach((t, idx) => {
        classificaFinale.push({ pos: 5 + idx, team: t, label: `   ${5 + idx}° posto` });
    });
    
    classificaFinale.forEach(({ pos, team, label }) => {
        const delta = team.elo - 1500;
        console.log(`${label} - ${team.name}: ${team.elo.toFixed(2)} (${delta >= 0 ? '+' : ''}${delta.toFixed(2)})`);
    });
    
    console.log('='.repeat(70));
    
    // Analisi distribuzione
    console.log('\n📊 ANALISI DISTRIBUZIONE ELO:\n');
    
    const deltaMax = Math.max(...teams.map(t => t.elo - 1500));
    const deltaMin = Math.min(...teams.map(t => t.elo - 1500));
    const range = deltaMax - deltaMin;
    const quinto = classificaFinale[4].team;
    
    console.log(`  Massimo guadagno: +${deltaMax.toFixed(2)} (${primo.name})`);
    console.log(`  Massima perdita: ${deltaMin.toFixed(2)} (${classificaFinale[classificaFinale.length - 1].team.name})`);
    console.log(`  Range totale: ${range.toFixed(2)} punti`);
    console.log('');
    console.log(`  1° posto: ${(primo.elo - 1500) >= 0 ? '+' : ''}${(primo.elo - 1500).toFixed(2)}`);
    console.log(`  2° posto: ${(secondo.elo - 1500) >= 0 ? '+' : ''}${(secondo.elo - 1500).toFixed(2)}`);
    console.log(`  3° posto: ${(terzo.elo - 1500) >= 0 ? '+' : ''}${(terzo.elo - 1500).toFixed(2)}`);
    console.log(`  4° posto: ${(quarto.elo - 1500) >= 0 ? '+' : ''}${(quarto.elo - 1500).toFixed(2)}`);
    console.log(`  5° posto: ${(quinto.elo - 1500) >= 0 ? '+' : ''}${(quinto.elo - 1500).toFixed(2)}`);
    console.log('');
    
    // Verifica equilibrio
    const gap12 = primo.elo - secondo.elo;
    const gap23 = secondo.elo - terzo.elo;
    const gap34 = terzo.elo - quarto.elo;
    const gap45 = quarto.elo - quinto.elo;
    
    console.log('  Gap tra posizioni:');
    console.log(`    1°-2°: ${gap12.toFixed(2)} punti`);
    console.log(`    2°-3°: ${gap23.toFixed(2)} punti`);
    console.log(`    3°-4°: ${gap34.toFixed(2)} punti`);
    console.log(`    4°-5°: ${gap45.toFixed(2)} punti`);
    console.log('');
    
    // ⚠️ VERIFICA CRITICA: ELO deve seguire l'ordine del torneo!
    let allValid = true;
    
    // 1° deve avere più punti di tutti
    if (primo.elo <= secondo.elo || primo.elo <= terzo.elo || primo.elo <= quarto.elo || primo.elo <= quinto.elo) {
        console.log('  ❌ ERRORE: Il 1° posto NON ha il massimo ELO!');
        allValid = false;
    }
    
    // 2° deve avere più punti di 3°, 4°, 5°
    if (secondo.elo <= terzo.elo || secondo.elo <= quarto.elo || secondo.elo <= quinto.elo) {
        console.log('  ❌ ERRORE: Il 2° posto ha meno ELO di qualcuno sotto di lui!');
        allValid = false;
    }
    
    // 3° deve avere più punti di 4° e 5°
    if (terzo.elo <= quarto.elo || terzo.elo <= quinto.elo) {
        console.log('  ❌ ERRORE: Il 3° posto ha meno ELO di qualcuno sotto di lui!');
        allValid = false;
    }
    
    // 4° deve avere più punti del 5° (CRITICO!)
    if (gap45 < 0) {
        console.log('  ❌ ERRORE CRITICO: Il 4° posto ha MENO punti del 5° posto!');
        console.log(`      4° (${quarto.name}): ${quarto.elo.toFixed(2)} (${(quarto.elo - 1500).toFixed(2)})`);
        console.log(`      5° (${quinto.name}): ${quinto.elo.toFixed(2)} (${(quinto.elo - 1500).toFixed(2)})`);
        allValid = false;
    }
    
    if (allValid) {
        console.log('  ✅ PERFETTO: ELO segue esattamente l\'ordine del torneo!');
        console.log(`     1° > 2° > 3° > 4° > 5°`);
        console.log(`     ${primo.elo.toFixed(0)} > ${secondo.elo.toFixed(0)} > ${terzo.elo.toFixed(0)} > ${quarto.elo.toFixed(0)} > ${quinto.elo.toFixed(0)}`);
    }
    
    return allValid;
}

// Run simulation multiple times to see variance
console.log('🎲 ESECUZIONE 20 SIMULAZIONI PER VEDERE LA VARIANZA\n');
console.log('='.repeat(70));

let validResults = 0;
let invalidResults = 0;

for (let i = 1; i <= 20; i++) {
    console.log('\n' + '#'.repeat(70));
    console.log(`# SIMULAZIONE ${i}/20`);
    console.log('#'.repeat(70));
    const isValid = simulateTournament();
    if (isValid) {
        validResults++;
    } else {
        invalidResults++;
    }
    console.log('\n');
}

console.log('\n' + '='.repeat(70));
console.log('📊 RISULTATI FINALI DELLE 20 SIMULAZIONI');
console.log('='.repeat(70));
console.log(`✅ Configurazioni valide (4° > 5°): ${validResults}/20 (${(validResults/20*100).toFixed(1)}%)`);
console.log(`❌ Configurazioni invalide (4° < 5°): ${invalidResults}/20 (${(invalidResults/20*100).toFixed(1)}%)`);
console.log('');

if (validResults === 20) {
    console.log('🎉 PERFETTO! Tutti i test superati!');
    console.log('   La configurazione K è corretta.');
} else if (validResults >= 18) {
    console.log('⚠️  QUASI! La maggior parte dei test superati.');
    console.log('   La configurazione K è accettabile ma potrebbe essere migliorata.');
} else {
    console.log('❌ PROBLEMA! Troppi test falliti.');
    console.log('   La configurazione K NON è adeguata e deve essere modificata.');
}
console.log('='.repeat(70));

