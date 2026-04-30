
import React, { useMemo, useState } from 'react';
import { usePadelStore } from '../hooks/usePadelStore.tsx';
import { Player, RankingEntry, SetScore, Tournament, TournamentType } from '../types.ts';
import Card from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import RankingChart from '../components/RankingChart.tsx';
import { PrintIcon, ArrowUpIcon, ArrowDownIcon, ArrowStableIcon, ChevronDownIcon, InfoIcon } from '../components/ui/Icons.tsx';
import { printRanking } from '../services/printService.ts';
import { getTournamentDisplayName } from '../utils/tournamentLabels.ts';
import PlayerProfileModal from '../components/PlayerProfileModal.tsx';

interface RankingPageProps {
    theme: 'light' | 'dark';
}

const RankingSkeleton: React.FC = () => (
    <div className="space-y-2 animate-pulse">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4">
                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>
        ))}
    </div>
);


const RankingPage: React.FC<RankingPageProps> = ({ theme }) => {
    const { players, matches, eloHistory, tournaments, loading } = usePadelStore();
    const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
    const [profilePlayer, setProfilePlayer] = useState<Player | null>(null);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
    const [presenceThreshold, setPresenceThreshold] = useState<number>(0);
    const [showAllPlayers, setShowAllPlayers] = useState<boolean>(false);

    // Reset showAllPlayers when tournament or threshold changes
    React.useEffect(() => {
        setShowAllPlayers(false);
    }, [selectedTournamentId, presenceThreshold]);

    // Calculate giornate for selected tournament SERIES (by seriesKey = giornataName || name)
    const tournamentGiornate = useMemo(() => {
        if (!selectedTournamentId) return [];
        // Count how many tournament records exist with this series key
        const tournamentRecords = tournaments.filter(t => (t.giornataName || t.name) === selectedTournamentId);
        // Each tournament record = 1 giornata
        return tournamentRecords.map(t => new Date(t.date).toISOString().split('T')[0]).sort();
    }, [selectedTournamentId, tournaments]);

    const rankingData: RankingEntry[] = useMemo(() => {
        if (loading && !players.length) {
            return [];
        }

        const sortedEventsByDate = [...eloHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Filter players based on tournament selection
        let filteredPlayers = players;
        
        if (selectedTournamentId) {
            // Get all tournament IDs with this series key (giornataName || name)
            const tournamentIds = tournaments
                .filter(t => (t.giornataName || t.name) === selectedTournamentId)
                .map(t => t.id);
            // Get only players who participated in this tournament (any giornata)
            const tournamentMatches = matches.filter(m => m.tournamentId && tournamentIds.includes(m.tournamentId));
            const playersInTournament = new Set<string>();
            tournamentMatches.forEach(m => {
                m.team1.forEach(id => playersInTournament.add(id));
                m.team2.forEach(id => playersInTournament.add(id));
            });
            filteredPlayers = players.filter(p => playersInTournament.has(p.id));
        }
        
        return filteredPlayers
            .map(player => {
                // Filter matches based on selection
                let playerMatches = matches.filter(m => {
                    const hasPlayer = m.team1.includes(player.id) || m.team2.includes(player.id);
                    if (!hasPlayer) return false;
                    
                    // If tournament is selected, only count matches from that series (by seriesKey)
                    if (selectedTournamentId) {
                        const tournament = tournaments.find(t => t.id === m.tournamentId);
                        return tournament && (tournament.giornataName || tournament.name) === selectedTournamentId;
                    }
                    
                    // Otherwise, only count matches from completed tournaments or friendly matches
                    if (!m.tournamentId) return true; // Friendly match
                    
                    const tournament = tournaments.find(t => t.id === m.tournamentId);
                    return tournament?.status === 'completed';
                });
                
                const matchesPlayed = playerMatches.length;

                let matchesWon = 0;
                let gamesWon = 0;
                let gamesLost = 0;

                playerMatches.forEach(match => {
                    const isTeam1 = match.team1.includes(player.id);
                    const setsArray = Array.isArray(match.sets) ? match.sets : Object.values(match.sets) as SetScore[];
                    const team1GamesTotal = setsArray.reduce((sum, set) => sum + (set.team1 || 0), 0);
                    const team2GamesTotal = setsArray.reduce((sum, set) => sum + (set.team2 || 0), 0);

                    if (isTeam1) {
                        gamesWon += team1GamesTotal;
                        gamesLost += team2GamesTotal;
                        if (match.winner === 'team1') {
                            matchesWon++;
                        }
                    } else {
                        gamesWon += team2GamesTotal;
                        gamesLost += team1GamesTotal;
                        if (match.winner === 'team2') {
                            matchesWon++;
                        }
                    }
                });
                
                const winPercentage = matchesPlayed > 0 ? (matchesWon / matchesPlayed) * 100 : 0;
                
                // For tournament-specific ranking, get last delta from that series (by seriesKey)
                let lastDelta = null;
                if (selectedTournamentId) {
                    const tournamentIds = tournaments.filter(t => (t.giornataName || t.name) === selectedTournamentId).map(t => t.id);
                    const tournamentEloEntries = eloHistory.filter(e => 
                        e.playerId === player.id && tournamentIds.includes(e.eventId)
                    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    lastDelta = tournamentEloEntries.length > 0 ? tournamentEloEntries[0].delta : null;
                } else {
                    const lastEloEntry = sortedEventsByDate.find(e => e.playerId === player.id);
                    lastDelta = lastEloEntry ? lastEloEntry.delta : null;
                }

                // Calculate ELO for tournament-specific series view
                let displayElo = player.currentElo;
                if (selectedTournamentId) {
                    const tournamentIds = tournaments.filter(t => (t.giornataName || t.name) === selectedTournamentId).map(t => t.id);
                    const tournamentEloEntries = eloHistory.filter(e => 
                        e.playerId === player.id && tournamentIds.includes(e.eventId)
                    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort chronologically (oldest first)
                    
                    if (tournamentEloEntries.length > 0) {
                        // Rankings always start from 1500 per tournament series
                        const initialElo = 1500;
                        // Calculate total delta for this tournament
                        const tournamentDelta = tournamentEloEntries.reduce((sum, entry) => sum + entry.delta, 0);
                        // Display ELO = initial ELO + tournament variations
                        displayElo = initialElo + tournamentDelta;
                    }
                }

                // Calculate presence percentage for this player (if series selected)
                let presencePercentage = 100;
                let playerGiornateCount = 0;
                if (selectedTournamentId && tournamentGiornate.length > 0) {
                    // Get all tournament IDs with this series key
                    const tournamentRecords = tournaments.filter(t => (t.giornataName || t.name) === selectedTournamentId);
                    // Count in how many of these tournament records (giornate) the player participated
                    playerGiornateCount = tournamentRecords.filter(tournamentRecord => {
                        // Check if player has any match in this specific tournament record
                        return matches.some(m => 
                            m.tournamentId === tournamentRecord.id && 
                            (m.team1.includes(player.id) || m.team2.includes(player.id))
                        );
                    }).length;
                    presencePercentage = (playerGiornateCount / tournamentGiornate.length) * 100;
                }

                return {
                    ...player,
                    currentElo: displayElo,
                    rank: 0,
                    matchesPlayed,
                    matchesWon,
                    gamesWon,
                    gamesLost,
                    winPercentage,
                    lastDelta,
                    presencePercentage,
                    playerGiornateCount,
                };
            })
            .sort((a, b) => {
                // When presence threshold is set, sort by presence first, then by ELO
                if (selectedTournamentId && presenceThreshold > 0) {
                    const aAboveThreshold = a.presencePercentage >= presenceThreshold;
                    const bAboveThreshold = b.presencePercentage >= presenceThreshold;
                    
                    if (aAboveThreshold && !bAboveThreshold) return -1;
                    if (!aAboveThreshold && bAboveThreshold) return 1;
                }
                // Same group or no threshold: sort by ELO
                return b.currentElo - a.currentElo;
            })
            .map((player, index) => ({ ...player, rank: index + 1 }));
    }, [players, matches, eloHistory, loading, selectedTournamentId, presenceThreshold, tournamentGiornate, tournaments]);

    const handleToggleExpand = (playerId: string) => {
        setExpandedPlayerId(prevId => (prevId === playerId ? null : playerId));
    };

    // Get completed tournaments for the dropdown (deduplicated by SERIES KEY = giornataName || name)
    const completedTournaments = useMemo(() => {
        const tournamentMap = new Map<string, Tournament>();
        tournaments
            .filter(t => t.status === 'completed' && t.type !== TournamentType.TorneoASquadre)
            .forEach(t => {
                const seriesKey = (t.giornataName || t.name);
                if (!tournamentMap.has(seriesKey)) {
                    tournamentMap.set(seriesKey, t);
                }
            });
        return Array.from(tournamentMap.values());
    }, [tournaments]);

    const handleTournamentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value; // This is now the SERIES KEY (giornataName || name)
        setSelectedTournamentId(value || null);
        setPresenceThreshold(0); // Reset threshold when changing tournament
    };

    const presenceOptions = [0, 50, 60, 70, 80, 90];

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Classifica Giocatori</h2>
                    <Button 
                        onClick={() => printRanking(
                            rankingData, 
                            eloHistory, 
                            matches, 
                            tournaments,
                            selectedTournamentId,
                            presenceThreshold,
                            tournamentGiornate
                        )} 
                        size="md" 
                        disabled={loading || rankingData.length === 0}
                    >
                        <span className="flex items-center gap-1"><PrintIcon /> Stampa</span>
                    </Button>
                </div>
                
                {/* Filters */}
                <div className="mb-6 space-y-4">
                    {/* Tournament Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Filtra per Torneo
                        </label>
                        <select
                            value={selectedTournamentId || ''}
                            onChange={handleTournamentChange}
                            className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        >
                            <option value="">Classifica Generale</option>
                            {completedTournaments.map(tournament => (
                                <option key={(tournament.giornataName || tournament.name)} value={(tournament.giornataName || tournament.name)}>
                                    {tournament.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Presence Filter - Only shown when tournament is selected */}
                    {selectedTournamentId && tournamentGiornate.length > 1 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                👥 Presenza Minima ({tournamentGiornate.length} giornate)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {presenceOptions.map(threshold => (
                                    <Button
                                        key={threshold}
                                        onClick={() => setPresenceThreshold(threshold)}
                                        variant={presenceThreshold === threshold ? 'primary' : 'secondary'}
                                        size="sm"
                                        type="button"
                                    >
                                        {threshold === 0 ? 'Tutti' : `${threshold}%`}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Info text */}
                    {selectedTournamentId && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            📈 Mostrando: <strong>{rankingData.length}</strong> {rankingData.length === 1 ? 'giocatore' : 'giocatori'}
                            {presenceThreshold > 0 && (
                                <>
                                    <br />
                                    <span className="text-xs">
                                        I giocatori sotto soglia {presenceThreshold}% sono elencati dopo quelli che la superano
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className="overflow-x-auto">
                    {loading && !players.length ? <RankingSkeleton /> : (
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-2 py-3 w-8"></th>
                                    <th scope="col" className="px-4 py-3">Player</th>
                                    <th scope="col" className="px-4 py-3">ELO</th>
                                    <th scope="col" className="px-4 py-3 text-center">Last Δ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(showAllPlayers ? rankingData : rankingData.slice(0, 8)).map((player, idx) => {
                                    const isExpanded = expandedPlayerId === player.id;
                                    const playerHistory = eloHistory
                                        .filter(entry => {
                                            if (entry.playerId !== player.id) return false;
                                            // If tournament is selected, only show history for that series (giornataName || name)
                                            if (selectedTournamentId) {
                                                const tournamentIds = tournaments
                                                    .filter(t => (t.giornataName || t.name) === selectedTournamentId)
                                                    .map(t => t.id);
                                                return tournamentIds.includes(entry.eventId);
                                            }
                                            return true;
                                        })
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                                    // Check if we need to show separator (first player below threshold)
                                    const prevPlayer = idx > 0 ? rankingData[idx - 1] : null;
                                    const showSeparator = selectedTournamentId && presenceThreshold > 0 && 
                                        prevPlayer &&
                                        prevPlayer.presencePercentage >= presenceThreshold &&
                                        player.presencePercentage < presenceThreshold;

                                    return (
                                        <React.Fragment key={player.id}>
                                            {showSeparator && (
                                                <tr className="border-t-4 border-sky-500 dark:border-sky-400">
                                                    <td colSpan={4} className="py-2 px-4 bg-sky-50 dark:bg-sky-900/20 text-center text-xs font-medium text-sky-700 dark:text-sky-300">
                                                        ⬇️ SOGLIA {presenceThreshold}% ({Math.ceil(presenceThreshold * tournamentGiornate.length / 100)} giornate su {tournamentGiornate.length}) ⬇️
                                                    </td>
                                                </tr>
                                            )}
                                            <tr
                                                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                                onClick={() => handleToggleExpand(player.id)}
                                            >
                                                <td className="px-2 py-4 font-medium text-gray-900 dark:text-white w-8">{player.rank}</td>
                                                <td className="px-4 py-4 font-semibold text-gray-900 dark:text-white">
                                                    <div className="flex items-center">
                                                        <span>{player.name} {player.surname}</span>
                                                        {playerHistory.length > 0 && (
                                                            <ChevronDownIcon className={`ml-2 h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 font-bold text-sky-600 dark:text-sky-400">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setProfilePlayer(player); }}
                                                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                                                            aria-label="Profilo giocatore"
                                                        >
                                                            <InfoIcon />
                                                        </button>
                                                        {player.currentElo.toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                <div className="flex justify-center" title={player.lastDelta !== null ? `${player.lastDelta >= 0 ? '+' : ''}${player.lastDelta.toFixed(2)}` : 'No change'}>
                                                        {player.lastDelta !== null && player.lastDelta > 0 && <ArrowUpIcon className="h-5 w-5 text-green-500" />}
                                                        {player.lastDelta !== null && player.lastDelta < 0 && <ArrowDownIcon className="h-5 w-5 text-red-500" />}
                                                        {(player.lastDelta === null || player.lastDelta === 0) && <ArrowStableIcon className="h-5 w-5 text-gray-500" />}
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && playerHistory.length > 0 && (
                                                <tr className="bg-gray-50 dark:bg-gray-900/50">
                                                    <td colSpan={4} className="p-0">
                                                        <div className="p-4">
                                                            <h4 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">ELO History</h4>
                                                            <ul className="list-none p-0 m-0 space-y-2">
                                                                {playerHistory.map(entry => {
                                                                    let description = '';
                                                                    if (entry.type === 'manual') {
                                                                        description = 'Aggiornamento Manuale';
                    } else if (entry.type === 'tournament') {
                        const tournament = tournaments.find(t => t.id === entry.eventId);
                        if (tournament) {
                            // Se è filtrato per torneo, mostra solo il tipo (senza nome torneo)
                            if (selectedTournamentId) {
                                description = tournament.type;
                            } else {
                                // Classifica generale: tipo + nome torneo tra parentesi
                                description = `${tournament.type} (${getTournamentDisplayName(tournament, tournaments)})`;
                            }
                        } else {
                            description = 'Giornata Torneo';
                        }
                                                                    } else {
                                                                        description = 'Partita Amichevole';
                                                                    }
                                                                    const deltaSign = entry.delta >= 0 ? '+' : '';
                                                                    return (
                                                                        <li key={entry.eventId + entry.type} className="flex justify-between items-center text-xs p-2 rounded-md bg-white dark:bg-gray-800 shadow-sm">
                                                                            <div className="text-gray-500 dark:text-gray-400">
                                                                                <span className="font-medium text-gray-700 dark:text-gray-300">{description}</span> il {new Date(entry.date).toLocaleDateString()}
                                                                            </div>
                                                                            <strong className={`font-mono ${entry.delta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                                {deltaSign}{entry.delta.toFixed(2)}
                                                                            </strong>
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                    {rankingData.length > 5 && (
                        <div className="mt-4 flex justify-center">
                            <Button 
                                onClick={() => setShowAllPlayers(!showAllPlayers)}
                                variant="outline"
                                className="w-full max-w-xs !border-slate-200/45 !bg-slate-50/70 dark:!border-white/5 dark:!bg-white/[0.03]"
                            >
                                {showAllPlayers ? 'Mostra meno' : `Mostra tutti (${rankingData.length} giocatori)`}
                            </Button>
                        </div>
                    )}
                 {(rankingData.length === 0 && !loading) && (
                    <p className="text-center py-8 text-gray-500">No players found. Add players on the Players page to get started.</p>
                )}
                </div>
            </Card>
            
            <RankingChart theme={theme} selectedSeriesKey={selectedTournamentId} />
            <PlayerProfileModal player={profilePlayer} onClose={() => setProfilePlayer(null)} theme={theme} />
        </div>
    );
};

export default RankingPage;
