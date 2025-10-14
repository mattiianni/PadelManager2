#!/usr/bin/env node

/**
 * Script di test automatico per Torneo Libero
 * Testa l'intero flusso: creazione coppie → setup → matches → ELO update
 */

const API_BASE = process.env.API_URL || 'http://localhost:3000';

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    console.log(`🔵 ${options.method || 'GET'} ${endpoint}`);
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
    }
    
    return response.json();
}

async function testTorneoLibero() {
    console.log('\n🚀 INIZIO TEST TORNEO LIBERO\n');
    
    try {
        // 1. Get current data
        console.log('📊 Step 1: Recupero dati iniziali');
        const initialData = await apiRequest('/api/data');
        const players = initialData.players;
        
        if (players.length < 8) {
            throw new Error(`Servono almeno 8 giocatori, trovati ${players.length}`);
        }
        
        console.log(`✅ Trovati ${players.length} giocatori`);
        
        // Save initial ELO
        const initialElo = {};
        players.slice(0, 8).forEach(p => {
            initialElo[p.id] = p.currentElo;
            console.log(`   ${p.name} ${p.surname}: ${p.currentElo.toFixed(2)}`);
        });
        
        // 2. Create pairs (simulate draw)
        console.log('\n📊 Step 2: Creazione coppie (simulazione sorteggio)');
        const selectedPlayers = players.slice(0, 8);
        const pairs = [];
        for (let i = 0; i < selectedPlayers.length; i += 2) {
            pairs.push([selectedPlayers[i], selectedPlayers[i + 1]]);
        }
        console.log(`✅ Create ${pairs.length} coppie`);
        pairs.forEach((pair, idx) => {
            console.log(`   Coppia ${idx + 1}: ${pair[0].name} ${pair[0].surname} / ${pair[1].name} ${pair[1].surname}`);
        });
        
        // 3. Create tournament with Torneo Libero type
        console.log('\n📊 Step 3: Creazione torneo libero');
        const tournamentDate = new Date().toISOString().split('T')[0];
        const matches = [];
        
        // Create 6 matches (tutti giocano contro tutti una volta)
        const matchCombinations = [
            [0, 1], [0, 2], [0, 3],
            [1, 2], [1, 3], [2, 3]
        ];
        
        matchCombinations.forEach(([p1, p2], idx) => {
            // Random scores
            const team1Score = Math.random() > 0.5 ? 6 : 4;
            const team2Score = team1Score === 6 ? 4 : 6;
            const winner = team1Score > team2Score ? 'team1' : 'team2';
            
            matches.push({
                team1: [pairs[p1][0].id, pairs[p1][1].id],
                team2: [pairs[p2][0].id, pairs[p2][1].id],
                sets: [{ team1: team1Score, team2: team2Score }],
                winner: winner,
                date: tournamentDate
            });
            
            console.log(`   Match ${idx + 1}: Coppia ${p1 + 1} vs Coppia ${p2 + 1} → ${team1Score}-${team2Score} (Winner: ${winner})`);
        });
        
        const tournamentData = {
            name: `Test Torneo Libero ${Date.now()}`,
            type: 'Torneo Libero',
            date: tournamentDate,
            club: 'Test Club',
            matchIds: [],
            status: 'completed',
            giornataName: 'Test Giornata Automatica'
        };
        
        console.log(`✅ Torneo: "${tournamentData.name}"`);
        console.log(`✅ Giornata: "${tournamentData.giornataName}"`);
        console.log(`✅ ${matches.length} partite create`);
        
        // 4. Send to API
        console.log('\n📊 Step 4: Invio al server');
        const result = await apiRequest('/api/tournaments/bulk-matches', {
            method: 'POST',
            body: JSON.stringify({
                tournament: tournamentData,
                matches: matches
            })
        });
        
        console.log(`✅ Torneo creato con ID: ${result.tournamentId}`);
        
        // 5. Wait a bit for ELO to be updated
        console.log('\n📊 Step 5: Attesa aggiornamento ELO (2s)');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 6. Verify ELO changes
        console.log('\n📊 Step 6: Verifica aggiornamenti ELO');
        const finalData = await apiRequest('/api/data');
        const finalPlayers = finalData.players;
        
        let allUpdated = true;
        let totalDelta = 0;
        
        selectedPlayers.forEach(p => {
            const finalPlayer = finalPlayers.find(fp => fp.id === p.id);
            const initialValue = initialElo[p.id];
            const finalValue = finalPlayer.currentElo;
            const delta = finalValue - initialValue;
            totalDelta += Math.abs(delta);
            
            const updated = Math.abs(delta) > 0.01;
            const status = updated ? '✅' : '❌';
            
            console.log(`   ${status} ${p.name} ${p.surname}: ${initialValue.toFixed(2)} → ${finalValue.toFixed(2)} (Δ ${delta >= 0 ? '+' : ''}${delta.toFixed(2)})`);
            
            if (!updated) {
                allUpdated = false;
            }
        });
        
        console.log(`\n📊 Delta totale: ${totalDelta.toFixed(2)}`);
        
        // 7. Verify ELO history
        console.log('\n📊 Step 7: Verifica storico ELO');
        const eloHistory = finalData.eloHistory.filter(e => e.eventId === result.tournamentId);
        console.log(`✅ Trovate ${eloHistory.length} entry nello storico per questo torneo`);
        
        eloHistory.forEach(entry => {
            const player = selectedPlayers.find(p => p.id === entry.playerId);
            if (player) {
                console.log(`   ${player.name} ${player.surname}: ${entry.eloBefore.toFixed(2)} → ${entry.eloAfter.toFixed(2)} (Δ ${entry.delta >= 0 ? '+' : ''}${entry.delta.toFixed(2)})`);
            }
        });
        
        // 8. Final result
        console.log('\n' + '='.repeat(60));
        // Check if all players have at least one entry (may have multiple due to multiple matches)
        const playersWithHistory = new Set(eloHistory.map(e => e.playerId));
        const allPlayersHaveHistory = selectedPlayers.every(p => playersWithHistory.has(p.id));
        
        if (allUpdated && totalDelta > 0 && allPlayersHaveHistory) {
            console.log('✅ ✅ ✅ TEST SUPERATO! ✅ ✅ ✅');
            console.log('');
            console.log('Torneo Libero funziona correttamente:');
            console.log('  ✅ Torneo creato con successo');
            console.log('  ✅ ELO aggiornati per tutti i giocatori');
            console.log('  ✅ Storico ELO salvato correttamente');
            console.log(`  ✅ Delta totale ELO: ${totalDelta.toFixed(2)}`);
            console.log('='.repeat(60));
            process.exit(0);
        } else {
            console.log('❌ ❌ ❌ TEST FALLITO! ❌ ❌ ❌');
            console.log('');
            if (!allUpdated) {
                console.log('  ❌ Alcuni ELO non sono stati aggiornati');
            }
            if (totalDelta === 0) {
                console.log('  ❌ Nessuna variazione ELO registrata');
            }
            if (!allPlayersHaveHistory) {
                console.log(`  ❌ Alcuni giocatori non hanno storico ELO`);
            }
            console.log('='.repeat(60));
            process.exit(1);
        }
        
    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ ❌ ❌ ERRORE DURANTE IL TEST! ❌ ❌ ❌');
        console.error('');
        console.error('Messaggio:', error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        console.error('='.repeat(60));
        process.exit(1);
    }
}

// Run test
testTorneoLibero();

