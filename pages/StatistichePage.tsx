import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import { ChevronDownIcon, PrintIcon } from '../components/ui/Icons.tsx';
import { usePadelStore } from '../hooks/usePadelStore.tsx';
import { Player, Tournament, Match, TournamentType, TeamTournamentMatchday, TeamTournamentTeam, TeamTournamentPlayerStatsRow } from '../types.ts';
import { printTeamTournamentReport, printTeamTournamentStatistics, printTournamentStatistics } from '../services/printService.ts';

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
        eloTorneo: number; // Tournament-specific final ELO
        variazioneElo: number;
        gamesWon: number;
        gamesLost: number;
    }[];
    
    // Statistiche avanzate
    giocatoreConPiuGamesVinti: { player: Player; games: number }[];
    giocatoreConPiuGamesPersi: { player: Player; games: number }[];
    coppiaFrequente: { players: [Player, Player]; partite: number }[];
    serieVittorie: { player: Player; vittorie: number }[];
    upset: { count: number; details: string[] }[];
    maggiorGuadagnoElo: { player: Player; guadagno: number; data: string }[];
    peggiorPerditaElo: { player: Player; perdita: number; data: string }[];
    
    // Premi simbolici
    mvp: { player: Player; vittorieGiornate: number }[];
    
    // Nuove statistiche
    gameWinRate: { player: Player; percentage: number }[];
    gameRatio: { player: Player; ratio: number }[];
    partiteVinte: { player: Player; wins: number }[];
    eloPerPartita: { player: Player; eloPerMatch: number }[];
    upsetPercentage: { player: Player; percentage: number }[];
    migliorCoppiaWinRate: { players: [Player, Player]; winRate: number; partite: number }[];
    serieSconfitte: { player: Player; sconfitte: number }[];
    resilienza: { player: Player; perditaMedia: number }[];

    // Nuove statistiche aggiunte
    form: { player: Player; form: string; lastMatches: number }[];
    clutchPerformance: { player: Player; clutchWinRate: number; clutchMatches: number }[];
    difesaFerrea: { player: Player; avgGameDifference: number; wins: number }[];
}

// Helper function to safely clone player objects - using JSON for deep copy
const clonePlayer = (player: Player): Player => {
    return JSON.parse(JSON.stringify(player));
};

const StatistichePage: React.FC = () => {
    const { tournaments, matches, players, getPlayerById, eloHistory, getTeamTournamentPlayerStats, getTeamTournamentConfig, getTeamTournamentMatchdays, getTeamTournamentTeams } = usePadelStore();
    const [expandedTournament, setExpandedTournament] = useState<string | null>(null);
    // Unified dropdown key: '' | `series:${seriesKey}` | `tt:${rootId}`
    const [selectedTournamentKey, setSelectedTournamentKey] = useState<string>('');
    const [teamTournamentPlayerStatsByRoot, setTeamTournamentPlayerStatsByRoot] = useState<Record<string, TeamTournamentPlayerStatsRow[]>>({});
    const [teamTournamentConfigByRoot, setTeamTournamentConfigByRoot] = useState<Record<string, any>>({});
    const [teamTournamentTeamsByRoot, setTeamTournamentTeamsByRoot] = useState<Record<string, TeamTournamentTeam[]>>({});
    const [teamTournamentMatchdaysByRoot, setTeamTournamentMatchdaysByRoot] = useState<Record<string, TeamTournamentMatchday[]>>({});
    const [teamTournamentLoadingByRoot, setTeamTournamentLoadingByRoot] = useState<Record<string, boolean>>({});

    const selectedTeamTournamentRootId = selectedTournamentKey.startsWith('tt:') ? selectedTournamentKey.slice(3) : null;
    const selectedSeriesKey = selectedTournamentKey.startsWith('series:') ? selectedTournamentKey.slice(7) : null;

    // Get completed tournaments for filter dropdown
    const completedTournaments = useMemo(() => {
        // Keep existing statistics flow unchanged for the classic formats:
        // Team Tournaments have their own dedicated draft section (separate optgroup).
        const completed = tournaments
            .filter(t => t.status === 'completed')
            .filter(t => t.type !== TournamentType.TorneoASquadre);
        const groupedByName = new Map<string, Tournament>();
        
        completed.forEach(t => {
            const seriesKey = (t.giornataName || t.name);
            if (!groupedByName.has(seriesKey)) {
                groupedByName.set(seriesKey, { ...t });
            }
        });
        
        return Array.from(groupedByName.values()).sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [tournaments]);

    const teamTournamentRoots = useMemo(() => {
        // Root = no giornataName, Torneo a Squadre
        const roots = tournaments
            .filter(t => t.type === TournamentType.TorneoASquadre)
            .filter(t => !t.giornataName)
            .map(t => ({ ...t, rootId: t.teamTournamentRootId || t.id }))
            // Keep only actual roots (id == rootId) to avoid any weirdness
            .filter(t => t.id === t.rootId);

        // Deduplicate by (name, club). This prevents accidental duplicates from buggy edits
        // from polluting the statistics dropdown while we keep DB cleanup separate.
        const norm = (s: string) => s.trim().toLowerCase();
        const map = new Map<string, Tournament>();
        roots.forEach(r => {
            const key = `${norm(r.name)}|${norm(r.club)}`;
            const existing = map.get(key);
            if (!existing) {
                map.set(key, r);
                return;
            }
            const existingTime = new Date(existing.date).getTime();
            const nextTime = new Date(r.date).getTime();
            if (Number.isFinite(nextTime) && nextTime >= existingTime) {
                map.set(key, r);
            }
        });
        return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [tournaments]);

    // Raggruppa tornei per SERIE (seriesKey = giornataName || name)
    const activeTournaments = useMemo(() => {
        const completed = tournaments
            .filter(t => t.status === 'completed')
            .filter(t => t.type !== TournamentType.TorneoASquadre);
        
        // Filter by selected classic series if specified
        const filteredCompleted = selectedSeriesKey
            ? completed.filter(t => (t.giornataName || t.name) === selectedSeriesKey)
            : completed;
        
        // Group by series key
        const groupedByName = new Map<string, Tournament>();
        filteredCompleted.forEach(t => {
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
    }, [tournaments, selectedSeriesKey]);

    useEffect(() => {
        // Team Tournaments: load minimal dataset to compute the first statistics slices
        // (info, top 5, frequent pairs, streak) and print a consistent PDF.
        if (!selectedTeamTournamentRootId) return;
        if (
            teamTournamentPlayerStatsByRoot[selectedTeamTournamentRootId] &&
            teamTournamentConfigByRoot[selectedTeamTournamentRootId] &&
            teamTournamentTeamsByRoot[selectedTeamTournamentRootId] &&
            teamTournamentMatchdaysByRoot[selectedTeamTournamentRootId]
        ) {
            return;
        }

        let cancelled = false;

        const load = async () => {
            try {
                setTeamTournamentLoadingByRoot(prev => ({ ...prev, [selectedTeamTournamentRootId]: true }));
                const [stats, cfg, teams, matchdays] = await Promise.all([
                    getTeamTournamentPlayerStats(selectedTeamTournamentRootId),
                    getTeamTournamentConfig(selectedTeamTournamentRootId),
                    getTeamTournamentTeams(selectedTeamTournamentRootId),
                    getTeamTournamentMatchdays(selectedTeamTournamentRootId),
                ]);
                if (cancelled) return;
                setTeamTournamentPlayerStatsByRoot(prev => ({ ...prev, [selectedTeamTournamentRootId]: stats }));
                setTeamTournamentConfigByRoot(prev => ({ ...prev, [selectedTeamTournamentRootId]: cfg }));
                setTeamTournamentTeamsByRoot(prev => ({ ...prev, [selectedTeamTournamentRootId]: teams }));
                setTeamTournamentMatchdaysByRoot(prev => ({ ...prev, [selectedTeamTournamentRootId]: matchdays }));
            } catch {
                // keep non-blocking
            } finally {
                if (!cancelled) setTeamTournamentLoadingByRoot(prev => ({ ...prev, [selectedTeamTournamentRootId]: false }));
            }
        };

        load();
        return () => { cancelled = true; };
    }, [
        selectedTeamTournamentRootId,
        teamTournamentPlayerStatsByRoot,
        teamTournamentConfigByRoot,
        teamTournamentTeamsByRoot,
        teamTournamentMatchdaysByRoot,
        getTeamTournamentPlayerStats,
        getTeamTournamentConfig,
        getTeamTournamentTeams,
        getTeamTournamentMatchdays,
    ]);

    const teamTournamentDerived = useMemo(() => {
        if (!selectedTeamTournamentRootId) return null;
        const cfg = teamTournamentConfigByRoot[selectedTeamTournamentRootId] || null;
        const matchdays = teamTournamentMatchdaysByRoot[selectedTeamTournamentRootId] || [];

        const rrMatchdays = matchdays
            .filter(md => md.phase === 'round_robin' || !md.phase)
            .filter(md => md.status === 'completed');

        const rrMatchdaysChrono = [...rrMatchdays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const scheduleTotal =
            cfg?.schedule?.kind === 'round_robin'
                ? (cfg.schedule.days || []).reduce((sum: number, d: any) => sum + (d.matches?.length || 0), 0)
                : 0;
        const playedTotal = rrMatchdays.length;

        const playerKey = (p: { name: string; surname: string }) => `${p.name}`.trim().toLowerCase() + '|' + `${p.surname}`.trim().toLowerCase();
        const displayName = (p: { name: string; surname: string }) => `${p.name} ${p.surname}`.trim();

        const isBlankSets = (sets: any[] | null) => {
            if (!sets || sets.length === 0) return true;
            return sets.every(s => Number(s.team1 || 0) === 0 && Number(s.team2 || 0) === 0);
        };

        const formatDate = (iso: string) => new Date(iso).toLocaleDateString('it-IT');
        const periodo = rrMatchdaysChrono.length > 0
            ? { inizio: formatDate(rrMatchdaysChrono[0].date), fine: formatDate(rrMatchdaysChrono[rrMatchdaysChrono.length - 1].date) }
            : { inizio: '—', fine: '—' };

        type PStat = {
            name: string;
            surname: string;
            matchesPlayed: number;
            matchesWon: number;
            matchesLost: number;
            gamesWon: number;
            gamesLost: number;
        };

        const statsByPlayer = new Map<string, PStat>();
        const upsert = (p: { name: string; surname: string }) => {
            const key = playerKey(p);
            const existing = statsByPlayer.get(key);
            if (existing) return existing;
            const created: PStat = {
                name: p.name,
                surname: p.surname,
                matchesPlayed: 0,
                matchesWon: 0,
                matchesLost: 0,
                gamesWon: 0,
                gamesLost: 0,
            };
            statsByPlayer.set(key, created);
            return created;
        };

        const pairAgg = new Map<string, { label: string; played: number; wins: number; draws: number; losses: number }>();
        const bumpPair = (a: { name: string; surname: string }, b: { name: string; surname: string }) => {
            const ka = playerKey(a);
            const kb = playerKey(b);
            const [x, y] = [ka, kb].sort();
            const key = `${x}--${y}`;
            const label = `${displayName(a)} & ${displayName(b)}`;
            const prev = pairAgg.get(key) || { label, played: 0, wins: 0, draws: 0, losses: 0 };
            pairAgg.set(key, prev);
        };

        const chronological = [...rrMatchdays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let gamesDisputati = 0;
        let partiteDisputate = 0; // sub-match played (non-blank sets)

        chronological.forEach(md => {
            (md.subMatches || [])
                .filter(sm => !sm.cancelled)
                .forEach(sm => {
                    const t1 = sm.team1Players || [];
                    const t2 = sm.team2Players || [];
                    if (t1.length >= 2) bumpPair(t1[0], t1[1]);
                    if (t2.length >= 2) bumpPair(t2[0], t2[1]);

                    if (isBlankSets(sm.sets as any)) return;

                    const t1Games = (sm.sets || []).reduce((sum: number, s: any) => sum + Number(s.team1 || 0), 0);
                    const t2Games = (sm.sets || []).reduce((sum: number, s: any) => sum + Number(s.team2 || 0), 0);
                    gamesDisputati += (t1Games + t2Games);
                    partiteDisputate += 1;

                    // Winner comes from backend, but fallback to games
                    const winner = sm.winner && sm.winner !== 'draw'
                        ? sm.winner
                        : (t1Games === t2Games ? null : (t1Games > t2Games ? 'team1' : 'team2'));

                    // Pair stats (wins/draws/losses)
                    if (t1.length >= 2) {
                        const key = [playerKey(t1[0]), playerKey(t1[1])].sort().join('--');
                        const p = pairAgg.get(key);
                        if (p) {
                            p.played += 1;
                            if (winner === 'team1') p.wins += 1;
                            else if (winner === 'team2') p.losses += 1;
                            else p.draws += 1;
                        }
                    }
                    if (t2.length >= 2) {
                        const key = [playerKey(t2[0]), playerKey(t2[1])].sort().join('--');
                        const p = pairAgg.get(key);
                        if (p) {
                            p.played += 1;
                            if (winner === 'team2') p.wins += 1;
                            else if (winner === 'team1') p.losses += 1;
                            else p.draws += 1;
                        }
                    }

                    t1.forEach(p => {
                        const st = upsert(p);
                        st.matchesPlayed += 1;
                        st.gamesWon += t1Games;
                        st.gamesLost += t2Games;
                        if (winner === 'team1') st.matchesWon += 1;
                        else if (winner === 'team2') st.matchesLost += 1;
                    });
                    t2.forEach(p => {
                        const st = upsert(p);
                        st.matchesPlayed += 1;
                        st.gamesWon += t2Games;
                        st.gamesLost += t1Games;
                        if (winner === 'team2') st.matchesWon += 1;
                        else if (winner === 'team1') st.matchesLost += 1;
                    });
                });
        });

        const rows = Array.from(statsByPlayer.values()).map(s => {
            const diff = s.gamesWon - s.gamesLost;
            const winPct = s.matchesPlayed > 0 ? Math.round((s.matchesWon / s.matchesPlayed) * 100) : 0;
            return { ...s, gamesDiff: diff, winPercentage: winPct };
        });

        const mediaGamesPerPartita = partiteDisputate > 0 ? (gamesDisputati / partiteDisputate) : 0;

        const top5 = [...rows]
            .filter(r => r.matchesPlayed > 0)
            .sort((a, b) => {
                if (b.winPercentage !== a.winPercentage) return b.winPercentage - a.winPercentage;
                if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed;
                return (b.gamesDiff - a.gamesDiff);
            })
            .slice(0, 5);

        // Longest win streak across the chronological submatches
        const streakByPlayer = new Map<string, { label: string; current: number; best: number }>();
        const touchStreak = (p: { name: string; surname: string }) => {
            const key = playerKey(p);
            const existing = streakByPlayer.get(key);
            if (existing) return existing;
            const created = { label: displayName(p), current: 0, best: 0 };
            streakByPlayer.set(key, created);
            return created;
        };
        chronological.forEach(md => {
            (md.subMatches || [])
                .filter(sm => !sm.cancelled)
                .forEach(sm => {
                    if (isBlankSets(sm.sets as any)) return;
                    const t1Games = (sm.sets || []).reduce((sum: number, s: any) => sum + Number(s.team1 || 0), 0);
                    const t2Games = (sm.sets || []).reduce((sum: number, s: any) => sum + Number(s.team2 || 0), 0);
                    const winner = sm.winner && sm.winner !== 'draw'
                        ? sm.winner
                        : (t1Games === t2Games ? null : (t1Games > t2Games ? 'team1' : 'team2'));

                    (sm.team1Players || []).forEach(p => {
                        const st = touchStreak(p);
                        if (winner === 'team1') {
                            st.current += 1;
                            st.best = Math.max(st.best, st.current);
                        } else if (winner === 'team2') {
                            st.current = 0;
                        }
                    });
                    (sm.team2Players || []).forEach(p => {
                        const st = touchStreak(p);
                        if (winner === 'team2') {
                            st.current += 1;
                            st.best = Math.max(st.best, st.current);
                        } else if (winner === 'team1') {
                            st.current = 0;
                        }
                    });
                });
        });

        const streakTop = Array.from(streakByPlayer.values())
            .filter(s => s.best > 0)
            .sort((a, b) => b.best - a.best)
            .slice(0, 5);

        const pairsTop = Array.from(pairAgg.values())
            .filter(p => p.played > 1)
            .sort((a, b) => b.played - a.played)
            .slice(0, 5);

        const mostGamesWon = [...rows]
            .filter(r => r.gamesWon > 0)
            .sort((a, b) => b.gamesWon - a.gamesWon)
            .slice(0, 3);

        const mostGamesLost = [...rows]
            .filter(r => r.gamesLost > 0)
            .sort((a, b) => b.gamesLost - a.gamesLost)
            .slice(0, 3);

        const bestPairsByWinRate = Array.from(pairAgg.values())
            .filter(p => p.played >= 2)
            .map(p => ({ ...p, winRate: p.played > 0 ? (p.wins / p.played) * 100 : 0 }))
            .sort((a, b) => {
                if (b.winRate !== a.winRate) return b.winRate - a.winRate;
                return b.played - a.played;
            })
            .slice(0, 3);

        return {
            playedTotal,
            scheduleTotal,
            cfg,
            periodo,
            gamesDisputati,
            mediaGamesPerPartita,
            top5,
            pairsTop,
            streakTop,
            mostGamesWon,
            mostGamesLost,
            bestPairsByWinRate,
            playerRows: rows,
        };
    }, [selectedTeamTournamentRootId, teamTournamentConfigByRoot, teamTournamentMatchdaysByRoot]);

    const calculateTournamentStats = (tournament: Tournament): TournamentStats | null => {
        // Get ALL tournament IDs with the same series key (for multi-giornata tournaments)
        const seriesKey = (tournament.giornataName || tournament.name);
        const tournamentIds = tournaments
            .filter(t => (t.giornataName || t.name) === seriesKey && t.status === 'completed')
            .map(t => t.id);
        
        // Get all matches for this tournament using ONLY tournamentId (like RankingPage)
        const tournamentMatches = matches.filter(m => 
            m.tournamentId && tournamentIds.includes(m.tournamentId)
        );
        
        if (tournamentMatches.length === 0) {
            console.log('⚠️ No matches found for tournament:', tournament.name);
            return null;
        }
        
        console.log('✅ Found', tournamentMatches.length, 'matches for tournament:', tournament.name, 'across', tournamentIds.length, 'giornate');

        // Get unique giornate (dates) - each unique date is a giornata
        const giornate = Array.from(new Set(tournamentMatches.map(m => m.date))).sort();
        
        // Actually count number of tournament instances (giornate) instead of unique dates
        const numeroGiornate = tournamentIds.length;
        
        console.log('📊 Giornate (unique dates):', giornate.length, '| Tournament instances:', numeroGiornate);
        
        // Informazioni generali
        const totalePartite = tournamentMatches.length;
        const totaleGamesDisputati = tournamentMatches.reduce((sum, m) => 
            sum + m.sets.reduce((s, set) => s + set.team1 + set.team2, 0), 0
        );
        const mediaGamesPerPartita = totalePartite > 0 ? totaleGamesDisputati / totalePartite : 0;
        
        // Get unique players - COPY EXACT LOGIC FROM RANKINGPAGE
        // Get only players who participated in this tournament (any giornata) - EXACT COPY FROM RANKINGPAGE
        const playersInTournament = new Set<string>();
        tournamentMatches.forEach(m => {
            m.team1.forEach(id => playersInTournament.add(id));
            m.team2.forEach(id => playersInTournament.add(id));
        });
        const filteredPlayers = players.filter(p => playersInTournament.has(p.id));
        
        const giocatoriPartecipanti = filteredPlayers.length;
        
        const periodo = {
            inizio: new Date(giornate[0]).toLocaleDateString('it-IT'),
            fine: new Date(giornate[giornate.length - 1]).toLocaleDateString('it-IT')
        };

        // Get all tournament-related ELO history ONLY for players who actually played matches - COPY FROM RANKINGPAGE
        const tournamentEloHistory = eloHistory.filter(h => 
            tournamentIds.includes(h.eventId) && h.type === 'tournament' && playersInTournament.has(h.playerId)
        );

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
            eloStart: number;
            variazioniElo: { delta: number; date: string }[];
            giornateVinte: number;
            eloPerGiornata: { date: string; elo: number }[];
        }> = {};

        // Initialize stats ONLY for players who actually played matches in this tournament - COPY FROM RANKINGPAGE
        filteredPlayers.forEach(player => {
            // Get player's ELO history for this tournament - EXACT COPY FROM RANKINGPAGE
            const tournamentEloEntries = eloHistory.filter(e => 
                e.playerId === player.id && tournamentIds.includes(e.eventId)
            ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort chronologically (oldest first)
            
            const eloStart = 1500; // Rankings always start from 1500 per tournament series
            const eloFinale = tournamentEloEntries.length > 0 ? tournamentEloEntries[tournamentEloEntries.length - 1].eloAfter : eloStart;
            const variazioniElo = tournamentEloEntries.map(h => ({ delta: h.delta, date: h.date }));
            
            // Calculate tournament-specific ELO - EXACT COPY FROM RANKINGPAGE
            let displayElo = player.currentElo;
            if (tournamentEloEntries.length > 0) {
                // Rankings always start from 1500 per tournament series
                const initialElo = 1500;
                // Calculate total delta for this tournament
                const tournamentDelta = tournamentEloEntries.reduce((sum, entry) => sum + entry.delta, 0);
                // Display ELO = initial ELO + tournament variations
                displayElo = initialElo + tournamentDelta;
            }
            
            const variazioneEloTotale = displayElo - eloStart;

            playerStatsObj[player.id] = {
                player: clonePlayer(player),
                gamesWon: 0,
                gamesLost: 0,
                partiteVinte: 0,
                partiteTotali: 0,
                vittorieConsecutive: 0,
                vittorieConsecutiveMax: 0,
                variazioneEloTotale,
                eloStart,
                variazioniElo,
                giornateVinte: 0,
                eloPerGiornata: []
            };
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

        // Calculate MVP - giocatore che ha vinto più giornate (FIXED: iterate over tournament instances)
        const giornateVinteMap = new Map<string, number>();
        
        tournamentIds.forEach(tournamentId => {
            // Use same filtering logic as main tournament matches (ONLY tournamentId)
            const giornataMatches = tournamentMatches.filter(m => 
                m.tournamentId === tournamentId
            );
            
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
            
            // Find winner(s) of this giornata - handle ties
            let maxPoints = -Infinity;
            const winnerIds: string[] = [];

            // First pass: find max points
            giornataPlayerPoints.forEach((points, id) => {
                if (points > maxPoints) {
                    maxPoints = points;
                }
            });

            // Second pass: collect all players with max points
            giornataPlayerPoints.forEach((points, id) => {
                if (points === maxPoints) {
                    winnerIds.push(id);
                }
            });

            // Award victory to all tied winners
            winnerIds.forEach(id => {
                giornateVinteMap.set(id, (giornateVinteMap.get(id) || 0) + 1);
            });
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

        // Top 5 classifica - sort by tournament-specific final ELO
        const top5 = playerStatsArray
            .sort((a, b) => {
                // Use tournament-specific final ELO, not global ELO
                const aFinalElo = a.eloStart + a.variazioneEloTotale;
                const bFinalElo = b.eloStart + b.variazioneEloTotale;
                return bFinalElo - aFinalElo;
            })
            .slice(0, 5)
            .map(s => ({
                player: clonePlayer(s.player),
                eloTorneo: s.eloStart + s.variazioneEloTotale, // Tournament-specific final ELO
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

        // NUOVE STATISTICHE - Game Win Rate %
        const gameWinRate = playerStatsArray
            .filter(s => s.gamesWon + s.gamesLost > 0)
            .map(s => ({
                player: clonePlayer(s.player),
                percentage: (s.gamesWon / (s.gamesWon + s.gamesLost)) * 100
            }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 3);

        // Game Ratio
        const gameRatio = playerStatsArray
            .filter(s => s.gamesLost > 0)
            .map(s => ({
                player: clonePlayer(s.player),
                ratio: s.gamesWon / s.gamesLost
            }))
            .sort((a, b) => b.ratio - a.ratio)
            .slice(0, 3);

        // Partite Vinte
        const partiteVinte = playerStatsArray
            .filter(s => s.partiteVinte > 0)
            .sort((a, b) => b.partiteVinte - a.partiteVinte)
            .slice(0, 3)
            .map(s => ({ player: clonePlayer(s.player), wins: s.partiteVinte }));

        // ELO per Partita
        const eloPerPartita = playerStatsArray
            .filter(s => s.partiteTotali > 0)
            .map(s => ({
                player: clonePlayer(s.player),
                eloPerMatch: s.variazioneEloTotale / s.partiteTotali
            }))
            .sort((a, b) => b.eloPerMatch - a.eloPerMatch)
            .slice(0, 3);

        // % Upset (vittorie contro ELO superiori) - ALLINEATO con logica UPSET originale
        const upsetPercentage = playerStatsArray
            .filter(s => s.partiteTotali > 0)
            .map(s => {
                let upsetWins = 0;
                sortedMatches.forEach(match => {
                    const team1Players = match.team1.map(id => getPlayerById(id)).filter(Boolean) as Player[];
                    const team2Players = match.team2.map(id => getPlayerById(id)).filter(Boolean) as Player[];
                    
                    if (team1Players.length === 2 && team2Players.length === 2) {
                        const playerInTeam1 = team1Players.some(p => p.id === s.player.id);
                        const playerInTeam2 = team2Players.some(p => p.id === s.player.id);
                        
                        if ((playerInTeam1 && match.winner === 'team1') || (playerInTeam2 && match.winner === 'team2')) {
                            // Use same logic as UPSET calculation
                            const team1EloAvg = (team1Players[0].currentElo + team1Players[1].currentElo) / 2;
                            const team2EloAvg = (team2Players[0].currentElo + team2Players[1].currentElo) / 2;
                            
                            // Player's team won against stronger team (same logic as UPSET)
                            if ((playerInTeam1 && team1EloAvg < team2EloAvg - 20) || 
                                (playerInTeam2 && team2EloAvg < team1EloAvg - 20)) {
                                upsetWins++;
                            }
                        }
                    }
                });
                
                return {
                    player: clonePlayer(s.player),
                    percentage: (upsetWins / s.partiteTotali) * 100
                };
            })
            .filter(s => s.percentage > 0)
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 3);

        // Miglior Coppia Win Rate
        const pairWinRates = new Map<string, { players: [Player, Player]; wins: number; total: number }>();
        tournamentMatches.forEach(match => {
            [match.team1, match.team2].forEach(team => {
                const p1 = getPlayerById(team[0]);
                const p2 = getPlayerById(team[1]);
                if (p1 && p2) {
                    const key = [team[0], team[1]].sort().join('-');
                    const existing = pairWinRates.get(key);
                    if (!existing) {
                        pairWinRates.set(key, { 
                            players: [clonePlayer(p1), clonePlayer(p2)], 
                            wins: match.winner === (team === match.team1 ? 'team1' : 'team2') ? 1 : 0,
                            total: 1
                        });
                    } else {
                        existing.total++;
                        if (match.winner === (team === match.team1 ? 'team1' : 'team2')) {
                            existing.wins++;
                        }
                    }
                }
            });
        });
        
        const migliorCoppiaWinRate = Array.from(pairWinRates.values())
            .filter(p => p.total >= 2)
            .map(p => ({
                players: p.players,
                winRate: (p.wins / p.total) * 100,
                partite: p.total
            }))
            .sort((a, b) => b.winRate - a.winRate)
            .slice(0, 3);

        // Serie Sconfitte Consecutive
        const serieSconfitte = playerStatsArray
            .filter(s => s.vittorieConsecutiveMax > 0 || s.partiteTotali > 0)
            .map(s => {
                // Calculate max consecutive losses
                let maxLosses = 0;
                let currentLosses = 0;
                
                sortedMatches.forEach(match => {
                    const team1Players = match.team1.map(id => getPlayerById(id)).filter(Boolean) as Player[];
                    const team2Players = match.team2.map(id => getPlayerById(id)).filter(Boolean) as Player[];
                    
                    if (team1Players.length === 2 && team2Players.length === 2) {
                        const playerInTeam1 = team1Players.some(p => p.id === s.player.id);
                        const playerInTeam2 = team2Players.some(p => p.id === s.player.id);
                        
                        if (playerInTeam1 || playerInTeam2) {
                            const won = (playerInTeam1 && match.winner === 'team1') || (playerInTeam2 && match.winner === 'team2');
                            if (won) {
                                currentLosses = 0;
                            } else {
                                currentLosses++;
                                maxLosses = Math.max(maxLosses, currentLosses);
                            }
                        }
                    }
                });
                
                return { player: clonePlayer(s.player), sconfitte: maxLosses };
            })
            .filter(s => s.sconfitte > 0)
            .sort((a, b) => b.sconfitte - a.sconfitte)
            .slice(0, 3);


        // Resilienza (perdita ELO media per sconfitta)
        const resilienza = playerStatsArray
            .filter(s => s.partiteTotali > s.partiteVinte && s.variazioneEloTotale < 0)
            .map(s => {
                const sconfitte = s.partiteTotali - s.partiteVinte;
                const perditaMedia = Math.abs(s.variazioneEloTotale) / sconfitte;
                return {
                    player: clonePlayer(s.player),
                    perditaMedia: perditaMedia
                };
            })
            .sort((a, b) => a.perditaMedia - b.perditaMedia) // Lower is better
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

        // ===== NUOVE STATISTICHE =====

        // 1. FORM - Ultimi 5 match per giocatore (W/L pattern)
        const form = playerStatsArray
            .map(s => {
                // Get matches for this player, sorted by date
                const playerMatches = sortedMatches.filter(m =>
                    [...m.team1, ...m.team2].includes(s.player.id)
                );

                // Get last 5 matches
                const last5 = playerMatches.slice(-5);
                const formString = last5.map(match => {
                    const isTeam1 = match.team1.includes(s.player.id);
                    const won = (isTeam1 && match.winner === 'team1') ||
                                (!isTeam1 && match.winner === 'team2');
                    return won ? '🟢' : '🔴';
                }).join(' ');

                return {
                    player: clonePlayer(s.player),
                    form: formString || 'N/A',
                    lastMatches: last5.length
                };
            })
            .filter(f => f.lastMatches >= 3) // Show only players with at least 3 matches
            .sort((a, b) => {
                // Sort by number of green circles (wins) in form string
                const aWins = (a.form.match(/🟢/g) || []).length;
                const bWins = (b.form.match(/🟢/g) || []).length;
                return bWins - aWins;
            })
            .slice(0, 5);

        // 2. CLUTCH PERFORMANCE - Win rate in finals/semifinals
        // For Round Robin + Finali, last 2 matches are finals
        // For other formats, consider last 20% of matches as "clutch"
        const clutchPerformance = playerStatsArray
            .map(s => {
                const playerMatches = sortedMatches.filter(m =>
                    [...m.team1, ...m.team2].includes(s.player.id)
                );

                // Determine clutch matches (last 20% or minimum 2)
                const clutchCount = Math.max(2, Math.ceil(playerMatches.length * 0.2));
                const clutchMatches = playerMatches.slice(-clutchCount);

                let clutchWins = 0;
                clutchMatches.forEach(match => {
                    const isTeam1 = match.team1.includes(s.player.id);
                    const won = (isTeam1 && match.winner === 'team1') ||
                                (!isTeam1 && match.winner === 'team2');
                    if (won) clutchWins++;
                });

                const winRate = clutchMatches.length > 0
                    ? (clutchWins / clutchMatches.length) * 100
                    : 0;

                return {
                    player: clonePlayer(s.player),
                    clutchWinRate: winRate,
                    clutchMatches: clutchMatches.length
                };
            })
            .filter(c => c.clutchMatches >= 2)
            .sort((a, b) => b.clutchWinRate - a.clutchWinRate)
            .slice(0, 3);

        // 3. DIFESA FERREA - Average game difference in won matches
        const difesaFerrea = playerStatsArray
            .map(s => {
                const wonMatches = sortedMatches.filter(m => {
                    const isTeam1 = m.team1.includes(s.player.id);
                    return (isTeam1 && m.winner === 'team1') ||
                           (!isTeam1 && m.winner === 'team2');
                });

                if (wonMatches.length === 0) {
                    return {
                        player: clonePlayer(s.player),
                        avgGameDifference: 0,
                        wins: 0
                    };
                }

                // Calculate average game difference
                let totalDifference = 0;
                wonMatches.forEach(match => {
                    const isTeam1 = match.team1.includes(s.player.id);
                    match.sets.forEach(set => {
                        const diff = isTeam1
                            ? (set.team1 - set.team2)
                            : (set.team2 - set.team1);
                        totalDifference += diff;
                    });
                });

                const avgDiff = totalDifference / wonMatches.length;

                return {
                    player: clonePlayer(s.player),
                    avgGameDifference: avgDiff,
                    wins: wonMatches.length
                };
            })
            .filter(d => d.wins >= 2)
            .sort((a, b) => b.avgGameDifference - a.avgGameDifference)
            .slice(0, 3);

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
            upset: [{ count: upsets.length, details: upsets.slice(0, 3) }],
            maggiorGuadagnoElo,
            peggiorPerditaElo,
            mvp,
            gameWinRate,
            gameRatio,
            partiteVinte,
            eloPerPartita,
            upsetPercentage,
            migliorCoppiaWinRate,
            serieSconfitte,
            resilienza,
            form,
            clutchPerformance,
            difesaFerrea
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

    // If user selected a team tournament, show the draft even if there are no classic stats.
    const isTeamTournamentMode = !!selectedTeamTournamentRootId;

    if (!isTeamTournamentMode && (activeTournaments.length === 0 || tournamentStats.length === 0)) {
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
            {/* Tournament Filter */}
            <Card>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Filtra per Torneo
                    </label>
                    <select
                        value={selectedTournamentKey || ''}
                        onChange={(e) => setSelectedTournamentKey(e.target.value)}
                        className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                        <option value="">Tutti i Tornei</option>
                        {teamTournamentRoots.length > 0 && (
                            <optgroup label="Tornei a Squadre">
                                {teamTournamentRoots.map(t => (
                                    <option key={`tt:${t.id}`} value={`tt:${t.id}`}>
                                        {t.name}
                                    </option>
                                ))}
                            </optgroup>
                        )}
                        {completedTournaments.length > 0 && (
                            <optgroup label="Altri tornei">
                                {completedTournaments.map(tournament => (
                                    <option key={`series:${(tournament.giornataName || tournament.name)}`} value={`series:${(tournament.giornataName || tournament.name)}`}>
                                        {tournament.name}
                                    </option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                </div>
            </Card>

            {/* Draft Team Tournament stats (basic only) */}
            {isTeamTournamentMode && selectedTeamTournamentRootId && (() => {
                const root = teamTournamentRoots.find(r => r.id === selectedTeamTournamentRootId) || null;
                const rows = teamTournamentPlayerStatsByRoot[selectedTeamTournamentRootId] || [];
                const loading = !!teamTournamentLoadingByRoot[selectedTeamTournamentRootId];
                const cfg = teamTournamentConfigByRoot[selectedTeamTournamentRootId] || null;
                const teams = teamTournamentTeamsByRoot[selectedTeamTournamentRootId] || [];
                const matchdays = teamTournamentMatchdaysByRoot[selectedTeamTournamentRootId] || [];
                const derived = teamTournamentDerived;
                return (
                    <Card key={`tt-card:${selectedTeamTournamentRootId}`}>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {root?.name || 'Torneo a Squadre'}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {root?.club || ''}{cfg?.scoringType ? ` • ${cfg.scoringType}` : ''}{cfg?.matchesPerDay ? ` • ${cfg.matchesPerDay} partite` : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            if (!root || !cfg) return;
                                            printTeamTournamentStatistics(
                                                { name: root.name, club: root.club, type: TournamentType.TorneoASquadre },
                                                cfg,
                                                teams,
                                                matchdays
                                            );
                                        }}
                                        disabled={loading || !root || !cfg}
                                    >
                                        <span className="flex items-center gap-1"><PrintIcon /> Stampa riepilogo</span>
                                    </Button>
                                </div>
                            </div>

                            {/* 1) Informazioni generali */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <StatBox label="Squadre" value={teams.length ? String(teams.length) : (cfg?.initialTeamCount ? String(cfg.initialTeamCount) : '—')} />
                                <StatBox label="Giocatori/Team" value={cfg?.defaultPlayersPerTeam ? String(cfg.defaultPlayersPerTeam) : '—'} />
                                <StatBox label="Partite/Giornata" value={cfg?.matchesPerDay ? String(cfg.matchesPerDay) : '—'} />
                                <StatBox label="Periodo" value={derived ? `${derived.periodo.inizio} - ${derived.periodo.fine}` : '—'} />
                                <StatBox label="Partite RR" value={derived ? `${derived.playedTotal} / ${derived.scheduleTotal || '—'}` : '—'} />
                                <StatBox label="Games Disputati" value={derived ? String(derived.gamesDisputati) : '—'} />
                                <StatBox label="Media G/Partita" value={derived ? derived.mediaGamesPerPartita.toFixed(1) : '—'} />
                            </div>

                            {/* 2) Top 5 (senza ELO) */}
                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="px-4 py-2 bg-sky-600 text-white text-sm font-bold">
                                    Top 5
                                </div>
                                {loading ? (
                                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Caricamento...</div>
                                ) : !derived || derived.top5.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                                        Nessun dato disponibile. Serve almeno una partita completata.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-semibold">Giocatore</th>
                                                    <th className="px-3 py-2 text-center font-semibold">G</th>
                                                    <th className="px-3 py-2 text-center font-semibold">V</th>
                                                    <th className="px-3 py-2 text-center font-semibold">P</th>
                                                    <th className="px-3 py-2 text-center font-semibold">Diff</th>
                                                    <th className="px-3 py-2 text-center font-semibold">%</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {derived.top5.map((r, idx) => (
                                                    <tr key={`${r.name}-${r.surname}-${idx}`}>
                                                        <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">{r.name} {r.surname}</td>
                                                        <td className="px-3 py-2 text-center">{r.matchesPlayed}</td>
                                                        <td className="px-3 py-2 text-center">{r.matchesWon}</td>
                                                        <td className="px-3 py-2 text-center">{r.matchesLost}</td>
                                                        <td className="px-3 py-2 text-center">{r.gamesDiff >= 0 ? `+${r.gamesDiff}` : r.gamesDiff}</td>
                                                        <td className="px-3 py-2 text-center">{r.winPercentage}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* 3) Altre info (personali) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-4 py-2 bg-sky-600 text-white text-sm font-bold">
                                        Più games vinti
                                    </div>
                                    {loading ? (
                                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Caricamento...</div>
                                    ) : !derived || derived.mostGamesWon.length === 0 ? (
                                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Nessun dato disponibile.</div>
                                    ) : (
                                        <div className="p-4 space-y-1 text-sm text-gray-800 dark:text-gray-200">
                                            {derived.mostGamesWon.map((r, i) => (
                                                <div key={`${r.name}-${r.surname}-${i}`}>{i + 1}. {r.name} {r.surname} ({r.gamesWon})</div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-4 py-2 bg-sky-600 text-white text-sm font-bold">
                                        Più games persi
                                    </div>
                                    {loading ? (
                                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Caricamento...</div>
                                    ) : !derived || derived.mostGamesLost.length === 0 ? (
                                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Nessun dato disponibile.</div>
                                    ) : (
                                        <div className="p-4 space-y-1 text-sm text-gray-800 dark:text-gray-200">
                                            {derived.mostGamesLost.map((r, i) => (
                                                <div key={`${r.name}-${r.surname}-${i}`}>{i + 1}. {r.name} {r.surname} ({r.gamesLost})</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-4 py-2 bg-sky-600 text-white text-sm font-bold">
                                        Miglior coppia (Win Rate)
                                    </div>
                                    {loading ? (
                                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Caricamento...</div>
                                    ) : !derived || derived.bestPairsByWinRate.length === 0 ? (
                                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Nessun dato disponibile.</div>
                                    ) : (
                                        <div className="p-4 space-y-1 text-sm text-gray-800 dark:text-gray-200">
                                            {derived.bestPairsByWinRate.map((p, i) => (
                                                <div key={`${p.label}-${i}`}>{i + 1}. {p.label} ({p.winRate.toFixed(0)}% in {p.played})</div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="px-4 py-2 bg-sky-600 text-white text-sm font-bold">
                                        Streak (vittorie consecutive)
                                    </div>
                                    {loading ? (
                                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Caricamento...</div>
                                    ) : !derived || derived.streakTop.length === 0 ? (
                                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Nessun dato disponibile.</div>
                                    ) : (
                                        <div className="p-4 space-y-1 text-sm text-gray-800 dark:text-gray-200">
                                            {derived.streakTop.map((s, i) => (
                                                <div key={`${s.label}-${i}`}>{i + 1}. {s.label} ({s.best})</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="px-4 py-2 bg-sky-600 text-white text-sm font-bold">
                                    Classifica Giocatori
                                </div>
                                {loading ? (
                                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Caricamento...</div>
                                ) : rows.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                                        Nessun dato disponibile. Serve almeno una giornata completata.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-semibold">Giocatore</th>
                                                    <th className="px-3 py-2 text-center font-semibold">G</th>
                                                    <th className="px-3 py-2 text-center font-semibold">V</th>
                                                    <th className="px-3 py-2 text-center font-semibold">P</th>
                                                    <th className="px-3 py-2 text-center font-semibold">GF</th>
                                                    <th className="px-3 py-2 text-center font-semibold">GS</th>
                                                    <th className="px-3 py-2 text-center font-semibold">Diff</th>
                                                    <th className="px-3 py-2 text-center font-semibold">%</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {rows.map((r, idx) => (
                                                    <tr key={`${r.name}-${r.surname}-${idx}`}>
                                                        <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">{r.name} {r.surname}</td>
                                                        <td className="px-3 py-2 text-center">{r.matchesPlayed}</td>
                                                        <td className="px-3 py-2 text-center">{r.matchesWon}</td>
                                                        <td className="px-3 py-2 text-center">{r.matchesLost}</td>
                                                        <td className="px-3 py-2 text-center">{r.gamesWon}</td>
                                                        <td className="px-3 py-2 text-center">{r.gamesLost}</td>
                                                        <td className="px-3 py-2 text-center">{r.gamesDiff >= 0 ? `+${r.gamesDiff}` : r.gamesDiff}</td>
                                                        <td className="px-3 py-2 text-center">{r.winPercentage}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                );
            })()}

            {/* Existing statistics for non-team tournaments (unchanged) */}
            {!isTeamTournamentMode && tournamentStats.map(stats => {
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
                                            <span className="flex items-center gap-1"><PrintIcon /> Stampa Riepilogo</span>
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
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Games V/P</th>
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
                                                                {entry.eloTorneo.toFixed(0)}
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

                                    {/* 4. Statistiche di Performance */}
                                    <div>
                                        <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                                            📈 Statistiche di Performance
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <StatCard 
                                                title="🎯 Game Win Rate %" 
                                                entries={stats.gameWinRate.length > 0
                                                    ? stats.gameWinRate.map(e => 
                                                        `${e.player.name} ${e.player.surname} (${e.percentage.toFixed(1)}%)`
                                                    )
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                            />
                                            <StatCard 
                                                title="📊 Game Ratio" 
                                                entries={stats.gameRatio.length > 0
                                                    ? stats.gameRatio.map(e => 
                                                        `${e.player.name} ${e.player.surname} (${e.ratio.toFixed(2)})`
                                                    )
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                            />
                                            <StatCard 
                                                title="💪 Partite Vinte" 
                                                entries={stats.partiteVinte.length > 0
                                                    ? stats.partiteVinte.map(e => 
                                                        `${e.player.name} ${e.player.surname} (${e.wins} vittorie)`
                                                    )
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                            />
                                            <StatCard 
                                                title="📈 ELO per Partita" 
                                                entries={stats.eloPerPartita.length > 0
                                                    ? stats.eloPerPartita.map(e => 
                                                        `${e.player.name} ${e.player.surname} (${e.eloPerMatch >= 0 ? '+' : ''}${e.eloPerMatch.toFixed(1)})`
                                                    )
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                            />
                                            <StatCard 
                                                title="🎲 % Upset Riusciti" 
                                                entries={stats.upsetPercentage.length > 0
                                                    ? stats.upsetPercentage.map(e => 
                                                        `${e.player.name} ${e.player.surname} (${e.percentage.toFixed(1)}%)`
                                                    )
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                            />
                                            <StatCard
                                                title="👥 Miglior Coppia (Win Rate)"
                                                entries={stats.migliorCoppiaWinRate.length > 0
                                                    ? stats.migliorCoppiaWinRate.map(e =>
                                                        `${e.players[0].name} & ${e.players[1].name} (${e.winRate.toFixed(1)}% - ${e.partite} partite)`
                                                    )
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                            />
                                            <StatCard
                                                title="📊 Form (Ultimi Match)"
                                                entries={stats.form.length > 0
                                                    ? stats.form.map(f =>
                                                        `${f.player.name} ${f.player.surname} (${f.form})`
                                                    )
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                            />
                                            <StatCard
                                                title="🎯 Clutch Performance"
                                                entries={stats.clutchPerformance.length > 0
                                                    ? stats.clutchPerformance.map(c =>
                                                        `${c.player.name} ${c.player.surname} (${c.clutchWinRate.toFixed(1)}% in ${c.clutchMatches} match decisivi)`
                                                    )
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                            />
                                            <StatCard
                                                title="🛡️ Difesa Ferrea"
                                                entries={stats.difesaFerrea.length > 0
                                                    ? stats.difesaFerrea.map(d =>
                                                        `${d.player.name} ${d.player.surname} (+${d.avgGameDifference.toFixed(1)} games di media in ${d.wins} vittorie)`
                                                    )
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* 5. Premi Simbolici */}
                                    <div>
                                        <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                                            🏅 Premi Simbolici
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
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
                                        </div>
                                    </div>

                                    {/* 6. Premi Speciali */}
                                    <div>
                                        <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                                            🎯 Premi Speciali
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <AwardCard 
                                                title="🎯 Cecchino" 
                                                subtitle="Miglior Game Win Rate"
                                                entries={stats.gameWinRate.length > 0
                                                    ? [`${stats.gameWinRate[0].player.name} ${stats.gameWinRate[0].player.surname} (${stats.gameWinRate[0].percentage.toFixed(1)}%)`]
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                                color="blue"
                                            />
                                            <AwardCard 
                                                title="💎 Giant Killer" 
                                                subtitle="Più vittorie contro ELO superiori"
                                                entries={stats.upsetPercentage.length > 0
                                                    ? [`${stats.upsetPercentage[0].player.name} ${stats.upsetPercentage[0].player.surname} (${stats.upsetPercentage[0].percentage.toFixed(1)}%)`]
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                                color="orange"
                                            />
                                            <AwardCard 
                                                title="🛡️ Incassatore" 
                                                subtitle="Resilienza (minor perdita ELO)"
                                                entries={stats.resilienza.length > 0
                                                    ? [`${stats.resilienza[0].player.name} ${stats.resilienza[0].player.surname} (-${stats.resilienza[0].perditaMedia.toFixed(1)} ELO/match)`]
                                                    : ['(in attesa di dati ulteriori)']
                                                }
                                                color="teal"
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
    color: 'yellow' | 'purple' | 'green' | 'blue' | 'orange' | 'teal' 
}> = ({ title, subtitle, entries, color }) => {
    const colorClasses = {
        yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400/50 dark:border-yellow-300/18',
        purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-400/50 dark:border-purple-300/18',
        green: 'bg-green-50 dark:bg-green-900/20 border-green-400/50 dark:border-green-300/18',
        blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-400/50 dark:border-blue-300/18',
        orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-400/50 dark:border-orange-300/18',
        teal: 'bg-teal-50 dark:bg-teal-900/20 border-teal-400/50 dark:border-teal-300/18'
    };

    return (
        <div className={`${colorClasses[color]} border p-4 rounded-lg`}>
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
