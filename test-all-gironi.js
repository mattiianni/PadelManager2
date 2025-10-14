#!/usr/bin/env node

/**
 * Test sistema Gironi + Fase Finale per 2, 3 e 4 gironi
 */

// K Factor gironi + BONUS FISSI
const K_GIRONI = 16;

const BONUS_SEMIFINALE_VINCENTE = 8;
const BONUS_SEMIFINALE_PERDENTE = 4;
const BONUS_FINALE_VINCENTE = 8;
const BONUS_FINALE_PERDENTE = 4;
const BONUS_FINALINA_VINCENTE = 4;
const BONUS_FINALINA_PERDENTE = 2;

function calculateEloChange(elo1, elo2, score1, kFactor1, kFactor2) {
    const expectedScore1 = 1 / (1 + Math.pow(10, (elo2 - elo1) / 400));
    const delta1 = kFactor1 * (score1 - expectedScore1);
    const delta2 = kFactor2 * ((1 - score1) - (1 - expectedScore1));
    return { delta1, delta2 };
}

function testGironi(numGironi, numCoppie) {
    console.log('\n' + '='.repeat(80));
    console.log(`🎮 TEST: ${numCoppie} COPPIE, ${numGironi} GIRONI`);
    console.log('='.repeat(80));
    
    const coppiePerGirone = Math.floor(numCoppie / numGironi);
    const gironiConExtra = numCoppie % numGironi;
    
    console.log(`Distribuzione: ${numGironi} gironi`);
    for (let i = 0; i < numGironi; i++) {
        const count = coppiePerGirone + (i < gironiConExtra ? 1 : 0);
        console.log(`  Girone ${String.fromCharCode(65 + i)}: ${count} coppie`);
    }
    
    // Crea squadre
    const teams = Array.from({ length: numCoppie }, (_, i) => ({
        id: i + 1,
        name: `Coppia ${i + 1}`,
        elo: 1500,
        girone: -1,
        puntiGirone: 0,
        gamesWon: 0,
        gamesLost: 0
    }));
    
    // Assegna ai gironi
    let teamIndex = 0;
    for (let g = 0; g < numGironi; g++) {
        const count = coppiePerGirone + (g < gironiConExtra ? 1 : 0);
        for (let i = 0; i < count; i++) {
            teams[teamIndex].girone = g;
            teamIndex++;
        }
    }
    
    console.log('\n🔵 FASE GIRONI');
    
    // Round Robin per ogni girone
    for (let g = 0; g < numGironi; g++) {
        const gironeTeams = teams.filter(t => t.girone === g);
        const gironeName = String.fromCharCode(65 + g);
        
        for (let i = 0; i < gironeTeams.length; i++) {
            for (let j = i + 1; j < gironeTeams.length; j++) {
                const team1 = gironeTeams[i];
                const team2 = gironeTeams[j];
                
                const prob1Win = 1 / (1 + Math.pow(10, (team2.elo - team1.elo) / 400));
                const team1Wins = Math.random() < prob1Win;
                
                const score1 = team1Wins ? 1 : 0;
                const gamesWon1 = team1Wins ? 6 : 4;
                const gamesWon2 = team1Wins ? 4 : 6;
                
                const { delta1, delta2 } = calculateEloChange(
                    team1.elo, team2.elo, score1, K_GIRONI, K_GIRONI
                );
                
                team1.elo += delta1;
                team2.elo += delta2;
                team1.puntiGirone += team1Wins ? 3 : 0;
                team2.puntiGirone += team1Wins ? 0 : 3;
                team1.gamesWon += gamesWon1;
                team1.gamesLost += gamesWon2;
                team2.gamesWon += gamesWon2;
                team2.gamesLost += gamesWon1;
            }
        }
    }
    
    // Qualificazione
    const gironi = [];
    for (let g = 0; g < numGironi; g++) {
        const gironeTeams = teams.filter(t => t.girone === g)
            .sort((a, b) => {
                if (b.puntiGirone !== a.puntiGirone) return b.puntiGirone - a.puntiGirone;
                return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
            });
        gironi.push(gironeTeams);
    }
    
    const primi = gironi.map(g => g[0]);
    const secondi = gironi.map(g => g[1]).filter(Boolean).sort((a, b) => {
        if (b.puntiGirone !== a.puntiGirone) return b.puntiGirone - a.puntiGirone;
        return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
    });
    
    // Prendi le migliori seconde per arrivare a 4 semifinalisti
    const numSecondeNeeded = 4 - primi.length;
    const miglioriSeconde = secondi.slice(0, numSecondeNeeded);
    
    const semifinalisti = [...primi, ...miglioriSeconde];
    
    console.log('\n🏆 QUALIFICATI:');
    primi.forEach((t, idx) => {
        console.log(`  1° Girone ${String.fromCharCode(65 + t.girone)}: ${t.name} (ELO ${t.elo.toFixed(2)}, Δ ${(t.elo - 1500).toFixed(2)})`);
    });
    miglioriSeconde.forEach((t, idx) => {
        console.log(`  ${idx + 1}ª migliore 2ª: ${t.name} (ELO ${t.elo.toFixed(2)}, Δ ${(t.elo - 1500).toFixed(2)})`);
    });
    
    // Semifinali
    console.log('\n🔵 SEMIFINALI');
    const semi1Winner = Math.random() < 0.5 ? semifinalisti[0] : semifinalisti[3];
    const semi1Loser = semi1Winner === semifinalisti[0] ? semifinalisti[3] : semifinalisti[0];
    semi1Winner.elo += BONUS_SEMIFINALE_VINCENTE;
    semi1Loser.elo += BONUS_SEMIFINALE_PERDENTE;
    
    const semi2Winner = Math.random() < 0.5 ? semifinalisti[1] : semifinalisti[2];
    const semi2Loser = semi2Winner === semifinalisti[1] ? semifinalisti[2] : semifinalisti[1];
    semi2Winner.elo += BONUS_SEMIFINALE_VINCENTE;
    semi2Loser.elo += BONUS_SEMIFINALE_PERDENTE;
    
    console.log(`  Semi 1: ${semi1Winner.name} vince (+8), ${semi1Loser.name} perde (+4)`);
    console.log(`  Semi 2: ${semi2Winner.name} vince (+8), ${semi2Loser.name} perde (+4)`);
    
    // Finalina
    const terzo = Math.random() < 0.5 ? semi1Loser : semi2Loser;
    const quarto = terzo === semi1Loser ? semi2Loser : semi1Loser;
    terzo.elo += BONUS_FINALINA_VINCENTE;
    quarto.elo += BONUS_FINALINA_PERDENTE;
    
    // Finale
    const primo = Math.random() < 0.5 ? semi1Winner : semi2Winner;
    const secondo = primo === semi1Winner ? semi2Winner : semi1Winner;
    primo.elo += BONUS_FINALE_VINCENTE;
    secondo.elo += BONUS_FINALE_PERDENTE;
    
    console.log(`  Finalina: ${terzo.name} 3° (+4), ${quarto.name} 4° (+2)`);
    console.log(`  Finale: ${primo.name} 1° (+8), ${secondo.name} 2° (+4)`);
    
    // Quinto classificato
    const nonSemifinalisti = teams.filter(t => !semifinalisti.includes(t));
    const quinto = nonSemifinalisti.sort((a, b) => b.elo - a.elo)[0];
    
    console.log('\n🏆 PODIO:');
    console.log(`  🥇 1°: ${primo.name} → ${primo.elo.toFixed(2)} (Δ +${(primo.elo - 1500).toFixed(2)})`);
    console.log(`  🥈 2°: ${secondo.name} → ${secondo.elo.toFixed(2)} (Δ +${(secondo.elo - 1500).toFixed(2)})`);
    console.log(`  🥉 3°: ${terzo.name} → ${terzo.elo.toFixed(2)} (Δ +${(terzo.elo - 1500).toFixed(2)})`);
    console.log(`     4°: ${quarto.name} → ${quarto.elo.toFixed(2)} (Δ ${(quarto.elo - 1500) >= 0 ? '+' : ''}${(quarto.elo - 1500).toFixed(2)})`);
    console.log(`     5°: ${quinto.name} → ${quinto.elo.toFixed(2)} (Δ ${(quinto.elo - 1500) >= 0 ? '+' : ''}${(quinto.elo - 1500).toFixed(2)})`);
    
    // Verifica ordine
    console.log('\n📊 VERIFICA:');
    const checks = [
        { check: primo.elo > secondo.elo, msg: '1° > 2°' },
        { check: quarto.elo > quinto.elo, msg: '4° > 5°' }
    ];
    
    checks.forEach(({ check, msg }) => {
        console.log(`  ${check ? '✅' : '❌'} ${msg}`);
    });
    
    return checks.every(c => c.check);
}

console.log('\n🎯 TEST SISTEMA GIRONI + FASE FINALE CON BONUS FISSI');
console.log(`Gironi: K=${K_GIRONI} | Semi: +${BONUS_SEMIFINALE_VINCENTE}/+${BONUS_SEMIFINALE_PERDENTE} | Finale: +${BONUS_FINALE_VINCENTE}/+${BONUS_FINALE_PERDENTE} | Finalina: +${BONUS_FINALINA_VINCENTE}/+${BONUS_FINALINA_PERDENTE}\n`);

// Test multipli per ogni configurazione
const configs = [
    { gironi: 2, coppie: 8 },
    { gironi: 3, coppie: 9 },
    { gironi: 4, coppie: 12 }
];

configs.forEach(({ gironi, coppie }) => {
    let successi = 0;
    const numTest = 10;
    
    for (let i = 0; i < numTest; i++) {
        const result = testGironi(gironi, coppie);
        if (result) successi++;
    }
    
    console.log('\n' + '-'.repeat(80));
    console.log(`📊 RISULTATO ${coppie} COPPIE, ${gironi} GIRONI: ${successi}/${numTest} test superati (${(successi/numTest*100).toFixed(0)}%)`);
    console.log('-'.repeat(80) + '\n');
});

console.log('\n✅ TEST COMPLETATI!\n');

