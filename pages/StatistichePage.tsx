import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import { ChevronDownIcon, PrintIcon } from '../components/ui/Icons.tsx';
import { usePadelStore } from '../hooks/usePadelStore.tsx';
import { Player, Tournament, Match, TournamentType } from '../types.ts';
import { printTournamentStatistics } from '../services/printService.ts';

interface TournamentStats {
    tournament: Tournament;
    giornate: string[];
    numeroGiornate: number;
    totalePartite: number;
    totaleGamesDisputati: number;
    mediaGamesPerPartita: number;
    giocatoriPartecipanti: number;
    periodo: { inizio: string; fine: string };
    
    // Top 5
    top5: {
        player: Player;
        variazioneElo: number;
        gamesWon: number;
        gamesLost: number;
    }[];
    
    // Statistiche avanzate
    giocatoreConPiuGamesVinti: { player: Player; games: number }[];
    giocatoreConPiuGamesPersi: { player: Player; games: number }[];
    coppiaFrequente: { players: [Player, Player]; partite: number }[];
    serieVittorie: { player: Player; vittorie: number }[];
    eloPeak: { player: Player; elo: number; data: string }[];
    upset: { count: number; details: string[] }[];
    maggiorGuadagnoElo: { player: Player; guadagno: number; data: string }[];
    peggiorPerditaElo: { player: Player; perdita: number; data: string }[];
    
    // Premi simbolici
    mvp: { player: Player; vittorieGiornate: number }[];
    montagneRusse: { player: Player; volatilita: number }[];
    partenzaLenta: { player: Player; recupero: number }[];
}

// Helper function to safely clone player objects - using JSON for deep copy
const clonePlayer = (player: Player): Player => {
    return JSON.parse(JSON.stringify(player));
};

const StatistichePage: React.FC = () => {
    const { tournaments, matches, players, getPlayerById, eloHistory } = usePadelStore();
    const [expandedTournament, setExpandedTournament] = useState<string | null>(null);

    // Raggruppa tornei per SERIE (seriesKey = giornataName || name)
    const activeTournaments = useMemo(() => {
        const completed = tournaments.filter(t => t.status === 'completed');
        
        // Group by series key
        const groupedByName = new Map<string, Tournament>();
        completed.forEach(t => {
            const seriesKey = (t.giornataName || t.name);
            if (!groupedByName.has(seriesKey)) {
                groupedByName.set(seriesKey, { ...t });
            } else {
                // Merge matchIds from same tournament name by creating a new object
                const existing = groupedByName.get(seriesKey)!;
                groupedByName.set(seriesKey, {
                    ...existing,
                    matchIds: [...existing.matchIds, ...t.matchIds]
                });
            }
        });
        
        const uniqueTournaments = Array.from(groupedByName.values());
        console.log('📊 Active tournaments (grouped by series):', uniqueTournaments.length, '/', tournaments.length);
        console.log('📊 Tournaments:', uniqueTournaments.map(t => ({ key: (t.giornataName || t.name), matchIds: t.matchIds.length })));
        console.log('📊 Total matches:', matches.length);
        return uniqueTournaments;
    }, [tournaments]);

    const calculateTournamentStats = (tournament: Tournament): TournamentStats | null => {
        // Get ALL tournament IDs with the same series key (for multi-giornata tournaments)
        const seriesKey = (tournament.giornataName || tournament.name);
        const allTournamentIds = tournaments
            .filter(t => (t.giornataName || t.name) === seriesKey && t.status === 'completed')
            .map(t => t.id);
        
        // Get all matches for this tournament using tournamentId or matchIds
        const tournamentMatches = matches.filter(m => 
            allTournamentIds.includes(m.tournamentId || '') || tournament.matchIds.includes(m.id)
        );
        
        if (tournamentMatches.length === 0) {
            console.log('⚠️ No matches found for tournament:', tournament.name);
            return null;
        }
        
        console.log('✅ Found', tournamentMatches.length, 'matches for tournament:', tournament.name, 'across', allTournamentIds.length, 'giornate');

        // Get unique giornate (dates) - each unique date is a giornata
        const giornate = Array.from(new Set(tournamentMatches.map(m => m.date))).sort();
        
        // Actually count number of tournament instances (giornate) instead of unique dates
        const numeroGiornate = allTournamentIds.length;
        
        console.log('📊 Giornate (unique dates):', giornate.length, '| Tournament instances:', numeroGiornate);
        
        // Informazioni generali
        const totalePartite = tournamentMatches.length;
        const totaleGamesDisputati = tournamentMatches.reduce((sum, m) => 
            sum + m.sets.reduce((s, set) => s + set.team1 + set.team2, 0), 0
        );
        const mediaGamesPerPartita = totalePartite > 0 ? totaleGamesDisputati / totalePartite : 0;
        
        // Get unique players
        const playerIds = new Set<string>();
        tournamentMatches.forEach(m => {
            m.team1.forEach(id => playerIds.add(id));
            m.team2.forEach(id => playerIds.add(id));
        });
        const giocatoriPartecipanti = playerIds.size;
        
        const periodo = {
            inizio: new Date(giornate[0]).toLocaleDateString('it-IT'),
            fine: new Date(giornate[giornate.length - 1]).toLocaleDateString('it-IT')
        };

        // Get all tournament-related ELO history
        const tournamentEloHistory = eloHistory.filter(h => 
            allTournamentIds.includes(h.eventId) && h.type === 'tournament'
        );
        
        console.log('📊 ELO history entries for', tournament.name, ':', tournamentEloHistory.length);

        // Calcola statistiche per giocatore - use plain object instead of Map
        const playerStatsObj: Record<string, {
            player: Player;
            gamesWon: number;
            gamesLost: number;
            partiteVinte: number;
            partiteTotali: number;
            vittorieConsecutive: number;
            vittorieConsecutiveMax: number;
            variazioneEloTotale: number;
            eloPeak: number;
            eloStart: number;
            variazioniElo: { delta: number; date: string }[];
            giornateVinte: number;
            eloPerGiornata: { date: string; elo: number }[];
        }> = {};

        // Initialize stats for all players
        Array.from(playerIds).forEach(id => {
            const player = getPlayerById(id);
            if (player) {
                // Get player's ELO history for this tournament
                const playerEloHistory = tournamentEloHistory
                    .filter(h => h.playerId === id)
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                
                const eloStart = playerEloHistory.length > 0 ? playerEloHistory[0].eloBefore : player.currentElo;
                const variazioniElo = playerEloHistory.map(h => ({ delta: h.delta, date: h.date }));
                const variazioneEloTotale = player.currentElo - eloStart;
                
                // Calculate ELO peak
                let currentElo = eloStart;
                let eloPeak = eloStart;
                playerEloHistory.forEach(h => {
                    currentElo = h.eloAfter;
                    eloPeak = Math.max(eloPeak, currentElo);
                });

                playerStatsObj[id] = {
                    player: clonePlayer(player),
                    gamesWon: 0,
                    gamesLost: 0,
                    partiteVinte: 0,
                    partiteTotali: 0,
                    vittorieConsecutive: 0,
                    vittorieConsecutiveMax: 0,
                    variazioneEloTotale,
                    eloPeak,
                    eloStart,
                    variazioniElo,
                    giornateVinte: 0,
                    eloPerGiornata: []
                };
            }
        });

        // Process each match (sorted by date)
        const sortedMatches = [...tournamentMatches].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        sortedMatches.forEach(match => {
            const team1Players = match.team1.map(id => getPlayerById(id)).filter(Boolean) as Player[];
            const team2Players = match.team2.map(id => getPlayerById(id)).filter(Boolean) as Player[];
            
            if (team1Players.length === 2 && team2Players.length === 2) {
                const team1Games = match.sets.reduce((sum, set) => sum + set.team1, 0);
                const team2Games = match.sets.reduce((sum, set) => sum + set.team2, 0);
                
                // Update games stats and win streaks - direct mutation on OUR objects
                team1Players.forEach(p => {
                    const stats = playerStatsObj[p.id];
                    if (stats) {
                        stats.gamesWon += team1Games;
                        stats.gamesLost += team2Games;
                        stats.partiteTotali++;
                        if (match.winner === 'team1') {
                            stats.partiteVinte++;
                            stats.vittorieConsecutive++;
                            stats.vittorieConsecutiveMax = Math.max(stats.vittorieConsecutiveMax, stats.vittorieConsecutive);
                        } else {
                            stats.vittorieConsecutive = 0;
                        }
                    }
                });
                
                team2Players.forEach(p => {
                    const stats = playerStatsObj[p.id];
                    if (stats) {
                        stats.gamesWon += team2Games;
                        stats.gamesLost += team1Games;
                        stats.partiteTotali++;
                        if (match.winner === 'team2') {
                            stats.partiteVinte++;
                            stats.vittorieConsecutive++;
                            stats.vittorieConsecutiveMax = Math.max(stats.vittorieConsecutiveMax, stats.vittorieConsecutive);
                        } else {
                            stats.vittorieConsecutive = 0;
                        }
                    }
                });
            }
        });

        // Calculate MVP - giocatore che ha vinto più giornate
        const giornateVinteMap = new Map<string, number>();
        giornate.forEach(giornata => {
            const giornataMatches = tournamentMatches.filter(m => m.date === giornata);
            const giornataPlayerPoints = new Map<string, number>();
            
            // Calculate points for each player in this giornata
            giornataMatches.forEach(match => {
                const team1Games = match.sets.reduce((sum, set) => sum + set.team1, 0);
                const team2Games = match.sets.reduce((sum, set) => sum + set.team2, 0);
                
                match.team1.forEach(id => {
                    giornataPlayerPoints.set(id, (giornataPlayerPoints.get(id) || 0) + team1Games - team2Games);
                });
                match.team2.forEach(id => {
                    giornataPlayerPoints.set(id, (giornataPlayerPoints.get(id) || 0) + team2Games - team1Games);
                });
            });
            
            // Find winner of this giornata
            let maxPoints = -Infinity;
            let winnerId = '';
            giornataPlayerPoints.forEach((points, id) => {
                if (points > maxPoints) {
                    maxPoints = points;
                    winnerId = id;
                }
            });
            
            if (winnerId) {
                giornateVinteMap.set(winnerId, (giornateVinteMap.get(winnerId) || 0) + 1);
            }
        });
        
        Object.keys(playerStatsObj).forEach(id => {
            const stats = playerStatsObj[id];
            if (stats) {
                stats.giornateVinte = giornateVinteMap.get(id) || 0;
            }
        });

        // Create a COMPLETE deep copy to avoid any readonly issues
        const playerStatsArray = Object.values(playerStatsObj).map(s => ({
            ...s,
            player: clonePlayer(s.player),
            variazioniElo: [...s.variazioniElo],
            eloPerGiornata: [...s.eloPerGiornata]
        }));

        // Top 5 classifica
        const top5 = playerStatsArray
            .sort((a, b) => b.player.currentElo - a.player.currentElo)
            .slice(0, 5)
            .map(s => ({
                player: clonePlayer(s.player),
                variazioneElo: s.variazioneEloTotale,
                gamesWon: s.gamesWon,
                gamesLost: s.gamesLost
            }));

        // Giocatore con più games vinti
        const giocatoreConPiuGamesVinti = playerStatsArray
            .filter(s => s.gamesWon > 0)
            .sort((a, b) => b.gamesWon - a.gamesWon)
            .slice(0, 3)
            .map(s => ({ player: clonePlayer(s.player), games: s.gamesWon }));

        // Giocatore con più games persi
        const giocatoreConPiuGamesPersi = playerStatsArray
            .filter(s => s.gamesLost > 0)
            .sort((a, b) => b.gamesLost - a.gamesLost)
            .slice(0, 3)
            .map(s => ({ player: clonePlayer(s.player), games: s.gamesLost }));

        // Coppia più frequente
        const pairCounts = new Map<string, { players: [Player, Player]; count: number }>();
        tournamentMatches.forEach(match => {
            [match.team1, match.team2].forEach(team => {
                const p1 = getPlayerById(team[0]);
                const p2 = getPlayerById(team[1]);
                if (p1 && p2) {
                    const key = [team[0], team[1]].sort().join('-');
                    const existing = pairCounts.get(key);
                    if (!existing) {
                        pairCounts.set(key, { players: [clonePlayer(p1), clonePlayer(p2)], count: 1 });
                    } else {
                        pairCounts.set(key, { players: existing.players, count: existing.count + 1 });
                    }
                }
            });
        });
        const coppiaFrequente = Array.from(pairCounts.values())
            .filter(c => c.count > 1)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map(c => ({ players: c.players, partite: c.count }));

        // Serie di vittorie consecutive
        const serieVittorie = playerStatsArray
            .filter(s => s.vittorieConsecutiveMax > 0)
            .sort((a, b) => b.vittorieConsecutiveMax - a.vittorieConsecutiveMax)
            .slice(0, 3)
            .map(s => ({ player: clonePlayer(s.player), vittorie: s.vittorieConsecutiveMax }));

        // ELO Peak
        const eloPeak = playerStatsArray
            .filter(s => s.eloPeak > s.eloStart)
            .sort((a, b) => b.eloPeak - a.eloPeak)
            .slice(0, 3)
            .map(s => ({ player: clonePlayer(s.player), elo: s.eloPeak, data: periodo.fine }));

        // UPSET - matches where lower ELO team won
        const upsets: string[] = [];
        tournamentMatches.forEach(match => {
            const team1Players = match.team1.map(id => getPlayerById(id)).filter(Boolean) as Player[];
            const team2Players = match.team2.map(id => getPlayerById(id)).filter(Boolean) as Player[];
            
            if (team1Players.length === 2 && team2Players.length === 2) {
                // Get ELO at time of match using history
                const matchHistory = tournamentEloHistory.filter(h => 
                    [...match.team1, ...match.team2].includes(h.playerId) &&
                    h.date === match.date
                );
                
                let team1EloAvg = 0;
                let team2EloAvg = 0;
                
                if (matchHistory.length > 0) {
                    const team1EloSum = match.team1.reduce((sum, id) => {
                        const h = matchHistory.find(h => h.playerId === id);
                        return sum + (h ? h.eloBefore : 1500);
                    }, 0);
                    const team2EloSum = match.team2.reduce((sum, id) => {
                        const h = matchHistory.find(h => h.playerId === id);
                        return sum + (h ? h.eloBefore : 1500);
                    }, 0);
                    team1EloAvg = team1EloSum / 2;
                    team2EloAvg = team2EloSum / 2;
                } else {
                    team1EloAvg = (team1Players[0].currentElo + team1Players[1].currentElo) / 2;
                    team2EloAvg = (team2Players[0].currentElo + team2Players[1].currentElo) / 2;
                }
                
                if ((match.winner === 'team1' && team1EloAvg < team2EloAvg - 20) || 
                    (match.winner === 'team2' && team2EloAvg < team1EloAvg - 20)) {
                    const winningTeam = match.winner === 'team1' ? team1Players : team2Players;
                    const losingTeam = match.winner === 'team1' ? team2Players : team1Players;
                    const diffElo = Math.abs(team1EloAvg - team2EloAvg).toFixed(0);
                    upsets.push(
                        `${winningTeam[0].name} & ${winningTeam[1].name} vs ${losingTeam[0].name} & ${losingTeam[1].name} (Δ${diffElo})`
                    );
                }
            }
        });

        // Maggior guadagno e perdita ELO in una giornata
        const eloPerGiornata = new Map<string, Map<string, number>>(); // playerId -> giornata -> delta
        
        giornate.forEach(giornata => {
            const giornataHistory = tournamentEloHistory.filter(h => h.date === giornata);
            giornataHistory.forEach(h => {
                if (!eloPerGiornata.has(h.playerId)) {
                    eloPerGiornata.set(h.playerId, new Map());
                }
                const currentDelta = eloPerGiornata.get(h.playerId)!.get(giornata) || 0;
                eloPerGiornata.get(h.playerId)!.set(giornata, currentDelta + h.delta);
            });
        });

        let maggiorGuadagnoElo: { player: Player; guadagno: number; data: string }[] = [];
        let peggiorPerditaElo: { player: Player; perdita: number; data: string }[] = [];
        
        eloPerGiornata.forEach((giornateMap, playerId) => {
            const player = getPlayerById(playerId);
            if (player) {
                const playerCopy = clonePlayer(player);
                giornateMap.forEach((delta, giornata) => {
                    if (delta > 0) {
                        maggiorGuadagnoElo.push({
                            player: playerCopy,
                            guadagno: delta,
                            data: new Date(giornata).toLocaleDateString('it-IT')
                        });
                    } else if (delta < 0) {
                        peggiorPerditaElo.push({
                            player: playerCopy,
                            perdita: Math.abs(delta),
                            data: new Date(giornata).toLocaleDateString('it-IT')
                        });
                    }
                });
            }
        });
        
        maggiorGuadagnoElo = maggiorGuadagnoElo
            .sort((a, b) => b.guadagno - a.guadagno)
            .slice(0, 3);
        
        peggiorPerditaElo = peggiorPerditaElo
            .sort((a, b) => b.perdita - a.perdita)
            .slice(0, 3);

        // MVP - giocatore che ha vinto più giornate
        let mvp = playerStatsArray
            .filter(s => s.giornateVinte > 0)
            .sort((a, b) => b.giornateVinte - a.giornateVinte)
            .slice(0, 3)
            .map(s => ({ player: clonePlayer(s.player), vittorieGiornate: s.giornateVinte }));

        // Montagne Russe - volatilità ELO (deviazione standard)
        let montagneRusse = playerStatsArray
            .filter(s => s.variazioniElo.length > 1)
            .map(s => {
                const deltas = s.variazioniElo.map(v => v.delta);
                const mean = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
                const variance = deltas.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / deltas.length;
                const stdDev = Math.sqrt(variance);
                return { player: clonePlayer(s.player), volatilita: stdDev };
            })
            .sort((a, b) => b.volatilita - a.volatilita)
            .slice(0, 3);

        // Partenza Lenta - giocatore che inizia male ma finisce bene
        let partenzaLenta = playerStatsArray
            .filter(s => s.variazioniElo.length >= 2)
            .map(s => {
                const midPoint = Math.floor(s.variazioniElo.length / 2);
                const primaMetaDelta = s.variazioniElo.slice(0, midPoint).reduce((sum, v) => sum + v.delta, 0);
                const secondaMetaDelta = s.variazioniElo.slice(midPoint).reduce((sum, v) => sum + v.delta, 0);
                const recupero = secondaMetaDelta - primaMetaDelta;
                return { player: clonePlayer(s.player), recupero, primaMetaDelta, secondaMetaDelta };
            })
            .filter(r => r.primaMetaDelta < 0 && r.secondaMetaDelta > 0)
            .sort((a, b) => b.recupero - a.recupero)
            .slice(0, 3);

        // Fallback se non ci sono dati (evita array vuoti)
        const defaultPlayerSource = playerStatsArray[0]?.player || players[0];
        const defaultPlayer = defaultPlayerSource ? clonePlayer(defaultPlayerSource) : null;
        
        if (maggiorGuadagnoElo.length === 0 && defaultPlayer) {
            maggiorGuadagnoElo = [{ player: clonePlayer(defaultPlayer), guadagno: 0, data: '(in attesa di dati ulteriori)' }];
        }
        if (peggiorPerditaElo.length === 0 && defaultPlayer) {
            peggiorPerditaElo = [{ player: clonePlayer(defaultPlayer), perdita: 0, data: '(in attesa di dati ulteriori)' }];
        }
        if (mvp.length === 0 && defaultPlayer) {
            mvp = [{ player: clonePlayer(defaultPlayer), vittorieGiornate: 0 }];
        }
        if (montagneRusse.length === 0 && defaultPlayer) {
            montagneRusse = [{ player: clonePlayer(defaultPlayer), volatilita: 0 }];
        }
        if (partenzaLenta.length === 0 && defaultPlayer) {
            partenzaLenta = [{ player: clonePlayer(defaultPlayer), recupero: 0 }];
        }
        if (giocatoreConPiuGamesVinti.length === 0 && defaultPlayer) {
            giocatoreConPiuGamesVinti.push({ player: clonePlayer(defaultPlayer), games: 0 });
        }
        if (giocatoreConPiuGamesPersi.length === 0 && defaultPlayer) {
            giocatoreConPiuGamesPersi.push({ player: clonePlayer(defaultPlayer), games: 0 });
        }
        if (coppiaFrequente.length === 0) {
            // Leave empty, will show "(in attesa...)" in UI
        }
        if (serieVittorie.length === 0 && defaultPlayer) {
            serieVittorie.push({ player: clonePlayer(defaultPlayer), vittorie: 0 });
        }
        if (eloPeak.length === 0 && defaultPlayer) {
            eloPeak.push({ player: clonePlayer(defaultPlayer), elo: 0, data: '' });
        }

        return {
            tournament,
            giornate,
            numeroGiornate,
            totalePartite,
            totaleGamesDisputati,
            mediaGamesPerPartita,
            giocatoriPartecipanti,
            periodo,
            top5,
            giocatoreConPiuGamesVinti,
            giocatoreConPiuGamesPersi,
            coppiaFrequente,
            serieVittorie,
            eloPeak,
            upset: [{ count: upsets.length, details: upsets.slice(0, 3) }],
            maggiorGuadagnoElo,
            peggiorPerditaElo,
            mvp,
            montagneRusse,
            partenzaLenta
        };
    };

    const tournamentStats = useMemo(() => {
        const stats = activeTournaments
            .map(t => calculateTournamentStats(t))
            .filter(Boolean) as TournamentStats[];
        
        console.log('📊 Tournament stats calculated:', stats.length);
        return stats;
    }, [activeTournaments, matches, eloHistory]);

    const handlePrintStats = (stats: TournamentStats) => {
        printTournamentStatistics(stats);
    };

    if (activeTournaments.length === 0 || tournamentStats.length === 0) {
        return (
            <div className="space-y-6">
                <Card>
                    <div className="text-center p-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Nessun Torneo Attivo
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            Per visualizzare le statistiche di un torneo è necessario che sia stata completata almeno una giornata
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {tournamentStats.map(stats => {
                const isExpanded = expandedTournament === stats.tournament.id;
                
                return (
                    <Card key={stats.tournament.id}>
                        <div className="space-y-4">
                            {/* Header collapsibile */}
                            <div 
                                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-lg transition-colors"
                                onClick={() => setExpandedTournament(isExpanded ? null : stats.tournament.id)}
                            >
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {stats.tournament.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {stats.numeroGiornate} giornat{stats.numeroGiornate === 1 ? 'a' : 'e'} • {stats.totalePartite} partite • {stats.giocatoriPartecipanti} giocatori
                                    </p>
                                </div>
                                <ChevronDownIcon className={`h-6 w-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>

                            {/* Contenuto espandibile */}
                            {isExpanded && (
                                <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                                    {/* Bottone stampa */}
                                    <div className="flex justify-end">
                                        <Button onClick={() => handlePrintStats(stats)} variant="secondary" size="sm">
                                            <PrintIcon /> Stampa Riepilogo
                                        </Button>
                                    </div>

                                    {/* 1. Informazioni Generali */}
                                    <div>
                                        <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                                            📋 Informazioni Generali
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            <StatBox label="Periodo" value={`${stats.periodo.inizio} - ${stats.periodo.fine}`} />
                                            <StatBox label="Giornate" value={stats.numeroGiornate.toString()} />
                                            <StatBox label="Partite Totali" value={stats.totalePartite.toString()} />
                                            <StatBox label="Games Disputati" value={stats.totaleGamesDisputati.toString()} />
                                            <StatBox label="Media Games/Partita" value={stats.mediaGamesPerPartita.toFixed(1)} />
                                            <StatBox label="Giocatori" value={stats.giocatoriPartecipanti.toString()} />
                                            <StatBox label="Circolo" value={stats.tournament.club} />
                                        </div>
                                    </div>

                                    {/* 2. Top 5 Classifica */}
                                    <div>
                                        <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                                            🏆 Top 5 Classifica
                                        </h4>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-800">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pos</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Giocatore</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ELO</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Var. ELO</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Games W/L</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                                    {stats.top5.map((entry, idx) => (
                                                        <tr key={entry.player.id}>
                                                            <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">{idx + 1}°</td>
                                                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                                                {entry.player.name} {entry.player.surname}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white font-bold">
                                                                {entry.player.currentElo.toFixed(0)}
                                                            </td>
                                                            <td className={`px-4 py-2 text-sm font-semibold ${entry.variazioneElo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                {entry.variazioneElo >= 0 ? '+' : ''}{entry.variazioneElo.toFixed(0)}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                                                                {entry.gamesWon} / {entry.gamesLost}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* 3. Statistiche Avanzate */}
                                    <div>
                                        <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                                            📊 Statistiche Avanzate
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <StatCard 
                                                title="🎯 Più Games Vinti" 
                                                entries={stats.giocatoreConPiuGamesVinti.length > 0 && stats.giocatoreConPiuGamesVinti[0].games > 0
                                                    ? stats.giocatoreConPiuGamesVinti.map(e => 
                                                        `${e.player.name} ${e.player.surname} (${e.games} games)`
                                                    )
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                            />
                                            <StatCard 
                                                title="😓 Più Games Persi" 
                                                entries={stats.giocatoreConPiuGamesPersi.length > 0 && stats.giocatoreConPiuGamesPersi[0].games > 0
                                                    ? stats.giocatoreConPiuGamesPersi.map(e => 
                                                        `${e.player.name} ${e.player.surname} (${e.games} games)`
                                                    )
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                            />
                                            <StatCard 
                                                title="👥 Coppia Più Frequente" 
                                                entries={stats.coppiaFrequente.length > 0
                                                    ? stats.coppiaFrequente.map(c => 
                                                        `${c.players[0].name} & ${c.players[1].name} (${c.partite} partite)`
                                                    )
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                            />
                                            <StatCard 
                                                title="🔥 Serie Vittorie Consecutive" 
                                                entries={stats.serieVittorie.length > 0 && stats.serieVittorie[0].vittorie > 0
                                                    ? stats.serieVittorie.map(s => 
                                                        `${s.player.name} ${s.player.surname} (${s.vittorie} vittorie)`
                                                    )
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                            />
                                            <StatCard 
                                                title="⭐ ELO Peak" 
                                                entries={stats.eloPeak.length > 0 && stats.eloPeak[0].elo > 0
                                                    ? stats.eloPeak.map(e => 
                                                        `${e.player.name} ${e.player.surname} (${e.elo.toFixed(0)})`
                                                    )
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                            />
                                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg md:col-span-2">
                                                <h5 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">🎲 UPSET</h5>
                                                <p className="text-xs italic text-gray-500 dark:text-gray-400 mb-3">
                                                    (Vittorie contro avversari superiori... sulla carta!)
                                                </p>
                                                <div className="space-y-1">
                                                    {stats.upset[0].count > 0 ? (
                                                        <>
                                                            <div className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
                                                                {stats.upset[0].count} upset{stats.upset[0].count > 1 ? 's' : ''} registrat{stats.upset[0].count > 1 ? 'i' : 'o'}
                                                            </div>
                                                            {stats.upset[0].details.map((detail: string, idx: number) => (
                                                                <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                                                    {idx + 1}. {detail}
                                                                </div>
                                                            ))}
                                                        </>
                                                    ) : (
                                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                                            Nessun upset registrato
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <StatCard 
                                                title="📈 Maggior Guadagno ELO" 
                                                entries={stats.maggiorGuadagnoElo.map(e => 
                                                    e.guadagno > 0 
                                                        ? `${e.player.name} ${e.player.surname} (+${e.guadagno.toFixed(1)} il ${e.data})`
                                                        : '(in attesa di dati ulteriori)'
                                                )}
                                            />
                                            <StatCard 
                                                title="📉 Peggior Perdita ELO" 
                                                entries={stats.peggiorPerditaElo.map(e => 
                                                    e.perdita > 0 
                                                        ? `${e.player.name} ${e.player.surname} (-${e.perdita.toFixed(1)} il ${e.data})`
                                                        : '(in attesa di dati ulteriori)'
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* 4. Premi Simbolici */}
                                    <div>
                                        <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                                            🏅 Premi Simbolici
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <AwardCard 
                                                title="🏆 MVP" 
                                                subtitle="Più giornate vinte"
                                                entries={stats.mvp.map(m => 
                                                    m.vittorieGiornate > 0 
                                                        ? `${m.player.name} ${m.player.surname} (${m.vittorieGiornate} giornat${m.vittorieGiornate === 1 ? 'a' : 'e'})`
                                                        : '(in attesa di dati ulteriori)'
                                                )}
                                                color="yellow"
                                            />
                                            <AwardCard 
                                                title="🎢 Montagne Russe" 
                                                subtitle="ELO più altalenante"
                                                entries={stats.montagneRusse.map(m => 
                                                    m.volatilita > 0 
                                                        ? `${m.player.name} ${m.player.surname} (σ=${m.volatilita.toFixed(1)})`
                                                        : '(in attesa di dati ulteriori)'
                                                )}
                                                color="purple"
                                            />
                                            <AwardCard 
                                                title="🐢 Partenza Lenta" 
                                                subtitle="Inizia male, finisce bene"
                                                entries={stats.partenzaLenta.length > 0 
                                                    ? stats.partenzaLenta.map(p => 
                                                        `${p.player.name} ${p.player.surname} (recupero: +${p.recupero.toFixed(1)})`
                                                    )
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                                color="green"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};

// Componenti helper
const StatBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
        <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
);

const StatCard: React.FC<{ title: string; entries: string[] }> = ({ title, entries }) => (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h5 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">{title}</h5>
        <div className="space-y-1">
            {entries.map((entry, idx) => (
                <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                    {idx + 1}. {entry}
                </div>
            ))}
        </div>
    </div>
);

const AwardCard: React.FC<{ 
    title: string; 
    subtitle: string; 
    entries: string[]; 
    color: 'yellow' | 'purple' | 'green' 
}> = ({ title, subtitle, entries, color }) => {
    const colorClasses = {
        yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
        purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700',
        green: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
    };

    return (
        <div className={`${colorClasses[color]} border-2 p-4 rounded-lg`}>
            <h5 className="font-bold text-gray-900 dark:text-white mb-1">{title}</h5>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{subtitle}</p>
            <div className="space-y-1">
                {entries.map((entry, idx) => (
                    <div key={idx} className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                        {entry}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatistichePage;
