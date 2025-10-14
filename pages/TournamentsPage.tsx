
import React, { useState, useEffect, useMemo } from 'react';
import { usePadelStore } from '../hooks/usePadelStore.tsx';
import { calculateTournamentStandings, calculateFinalStandingsForRoundRobinFinali } from '../services/tournamentService.ts';
import { printTournamentReport, printBeatTheBoxComplete, printBeatTheBoxBlank } from '../services/printService.ts';
import { calculateAllBoxStandings, createFinalsMatches } from '../services/beatTheBoxService.ts';
import { Tournament, TournamentType, Match, Player, TournamentStandingEntry } from '../types.ts';
import Card from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import Modal from '../components/ui/Modal.tsx';
import { TrashIcon, PrintIcon, PencilIcon, ChevronDownIcon } from '../components/ui/Icons.tsx';

type Page = 'Ranking' | 'Players' | 'Matches' | 'Draw' | 'Tournaments';

interface TournamentsPageProps {
    setActivePage: (page: Page) => void;
    onNavigateToResults: (tournamentId: string) => void;
}

const TournamentsSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
                <div className="p-6">
                     <div className="h-12 bg-gray-50 dark:bg-gray-900 rounded-lg"></div>
                </div>
            </div>
        ))}
    </div>
);


// Helper functions for Beat the Box
const groupMatchesIntoBoxes = (matches: Match[]) => {
    // I match sono già ordinati dal database: prima tutti i match del box 1, poi box 2, ecc.
    // Ogni box ha esattamente 3 match
    const boxes: { boxNumber: number; players: Player[]; matches: Match[] }[] = [];
    
    for (let i = 0; i < matches.length; i += 3) {
        const boxMatches = matches.slice(i, i + 3);
        boxes.push({
            boxNumber: Math.floor(i / 3) + 1,
            players: [],
            matches: boxMatches
        });
    }
    
    return boxes;
};

const processBeatTheBoxData = (matches: Match[], getPlayerById: (id: string) => Player | undefined) => {
    // Separate box matches from semifinal/final matches
    // Conta giocatori unici per determinare il numero di box
    const uniquePlayerIds = new Set<string>();
    matches.forEach(match => {
        match.team1.forEach(id => uniquePlayerIds.add(id));
        match.team2.forEach(id => uniquePlayerIds.add(id));
    });
    const numPlayers = uniquePlayerIds.size;
    const numPairs = numPlayers / 2;
    const numBoxes = numPairs / 2;
    const boxMatchCount = numBoxes * 3; // Ogni box ha 3 match
    
    const boxMatches = matches.slice(0, boxMatchCount);
    const remainingMatches = matches.slice(boxMatchCount);
    
    // SE I MATCH NON HANNO WINNER (torneo vecchio o bug), calcolali dai set
    const boxMatchesWithWinner = boxMatches.map(match => {
        if (match.winner) return match; // Ha già il winner, ok
        
        // Calcola winner dai set
        const sets = match.sets || [];
        if (sets.length === 0) return match; // Nessun set, lascia null
        
        const team1Games = sets.reduce((sum, set) => sum + set.team1, 0);
        const team2Games = sets.reduce((sum, set) => sum + set.team2, 0);
        
        const winner = team1Games === team2Games ? 'draw' : (team1Games > team2Games ? 'team1' : 'team2');
        
        return { ...match, winner } as Match;
    });
    
    // Separate semifinals and finals
    let semifinalMatches: Match[] = [];
    let finalMatches: Match[] = [];
    
    if (numBoxes >= 4 && remainingMatches.length >= 2) {
        // 8+ pairs (4+ boxes): 2 semifinals + 2 finals
        semifinalMatches = remainingMatches.slice(0, 2);
        finalMatches = remainingMatches.slice(2);
    } else {
        // 2-3 boxes: no semifinals, all remaining are finals
        finalMatches = remainingMatches;
    }
    
    const boxes = groupMatchesIntoBoxes(boxMatchesWithWinner);
    
    // Popola i giocatori per ogni box usando i match CON i set
    boxes.forEach(box => {
        const playerIdsSet = new Set<string>();
        box.matches.forEach(match => {
            match.team1.forEach(id => playerIdsSet.add(id));
            match.team2.forEach(id => playerIdsSet.add(id));
        });
        
        const playerIds = Array.from(playerIdsSet);
        box.players = playerIds.map(id => getPlayerById(id)).filter((p): p is Player => p !== undefined);
    });
    
    // Calcola le classifiche usando calculateAllBoxStandings
    // IMPORTANTE: usa boxMatchesWithWinner che ha i winner corretti
    const boxStandings = calculateAllBoxStandings(boxMatchesWithWinner, boxes);
    
    // Calculate games won/lost for each player (per fallback se non c'è elo_history)
    const playerStats = new Map<string, { gamesWon: number; gamesLost: number }>();
    
    matches.forEach(m => {
        if (!m.winner || m.winner === 'draw') return;
        const sets = m.sets || [];
        sets.forEach(set => {
            m.team1.forEach(pid => {
                const stats = playerStats.get(pid) || { gamesWon: 0, gamesLost: 0 };
                stats.gamesWon += set.team1;
                stats.gamesLost += set.team2;
                playerStats.set(pid, stats);
            });
            m.team2.forEach(pid => {
                const stats = playerStats.get(pid) || { gamesWon: 0, gamesLost: 0 };
                stats.gamesWon += set.team2;
                stats.gamesLost += set.team1;
                playerStats.set(pid, stats);
            });
        });
    });
    
    // Crea classifica individuale basata su statistiche (Games W/L e % vittorie)
    const individualStandings: { player: Player; eloChange: number; gamesWon: number; gamesLost: number; winPercentage: number; rank: number }[] = [];
    
    boxes.forEach(box => {
        box.players.forEach(player => {
            const stats = playerStats.get(player.id) || { gamesWon: 0, gamesLost: 0 };
            const winPercentage = (stats.gamesWon + stats.gamesLost) > 0
                ? (stats.gamesWon / (stats.gamesWon + stats.gamesLost)) * 100
                : 0;
            
            individualStandings.push({
                player,
                eloChange: 0, // Non più usato, ma manteniamo per compatibilità
                gamesWon: stats.gamesWon,
                gamesLost: stats.gamesLost,
                winPercentage,
                rank: 0
            });
        });
    });
    
    // Ordina per % vittorie decrescente, poi per gamesWon
    individualStandings.sort((a, b) => {
        if (b.winPercentage !== a.winPercentage) {
            return b.winPercentage - a.winPercentage;
        }
        return b.gamesWon - a.gamesWon;
    });
    individualStandings.forEach((entry, idx) => {
        entry.rank = idx + 1;
    });
    
    return { boxes, boxStandings, semifinalMatches, finalMatches, individualStandings };
};

const TournamentsPage: React.FC<TournamentsPageProps> = ({ setActivePage, onNavigateToResults }) => {
    const { tournaments, matches, deleteTournament, getPlayerById, updateTournament, loading, eloHistory } = usePadelStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [tournamentToEdit, setTournamentToEdit] = useState<Tournament | null>(null);
    const [editName, setEditName] = useState('');
    const [editClub, setEditClub] = useState('');
    const [editDate, setEditDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (tournamentToEdit) {
            setEditName(tournamentToEdit.name);
            setEditClub(tournamentToEdit.club);
            setEditDate(new Date(tournamentToEdit.date).toISOString().split('T')[0]);
        }
    }, [tournamentToEdit]);

    const toggleExpand = (name: string) => {
        setExpandedNames(prev => {
            const newSet = new Set(prev);
            if (newSet.has(name)) {
                newSet.delete(name);
            } else {
                newSet.add(name);
            }
            return newSet;
        });
    };

    const calculateAmericanoStandings = (matches: Match[]): TournamentStandingEntry[] => {
        console.log(`🎯 TournamentsPage Americano: Starting calculation with ${matches.length} matches`);
        
        const playerStats = new Map<string, {
            player: Player;
            totalPoints: number;
            totalGamesWon: number;
            totalGamesLost: number;
            matchesPlayed: number;
        }>();

        // Get all unique players from matches (these are the draw players)
        const allPlayers = new Set<string>();
        matches.forEach(match => {
            [...match.team1, ...match.team2].forEach(playerId => allPlayers.add(playerId));
        });

        console.log(`🎯 TournamentsPage Americano: Found ${allPlayers.size} unique players in ${matches.length} matches`);

        // Initialize all players (only those who were in the draw)
        allPlayers.forEach(playerId => {
            const player = getPlayerById(playerId);
            if (player) {
                playerStats.set(playerId, {
                    player,
                    totalPoints: 0,
                    totalGamesWon: 0,
                    totalGamesLost: 0,
                    matchesPlayed: 0
                });
            }
        });

        // Process each match
        matches.forEach(match => {
            const team1Players = match.team1.map(id => getPlayerById(id)).filter(Boolean) as Player[];
            const team2Players = match.team2.map(id => getPlayerById(id)).filter(Boolean) as Player[];
            
            if (team1Players.length === 2 && team2Players.length === 2 && match.sets) {
                const team1Games = match.sets.reduce((sum, set) => sum + set.team1, 0);
                const team2Games = match.sets.reduce((sum, set) => sum + set.team2, 0);
                
                [...team1Players, ...team2Players].forEach(player => {
                    const stats = playerStats.get(player.id);
                    if (stats) {
                        stats.matchesPlayed++;
                        
                        if (team1Players.includes(player)) {
                            stats.totalPoints += team1Games;
                            stats.totalGamesWon += team1Games;
                            stats.totalGamesLost += team2Games;
                        } else {
                            stats.totalPoints += team2Games;
                            stats.totalGamesWon += team2Games;
                            stats.totalGamesLost += team1Games;
                        }
                    }
                });
            }
        });

        // Convert to standings array
        // For now, assume "games-diff" scoring (we don't have the scoring type stored)
        const standings: TournamentStandingEntry[] = Array.from(playerStats.values()).map(stats => {
            const gameDifference = stats.totalGamesWon - stats.totalGamesLost;
            
            return {
                teamId: stats.player.id,
                team: [stats.player],
                points: gameDifference, // For "games-diff": use game difference
                gamesWon: stats.totalGamesWon,
                gamesLost: stats.totalGamesLost,
                gameDifference,
                matches: stats.matchesPlayed
            };
        });

        console.log(`🎯 TournamentsPage Americano: Created ${standings.length} standings entries`);
        
        return standings.sort((a, b) => b.points - a.points);
    };

    const handlePrint = (tournament: Tournament) => {
        const tournamentMatches = matches.filter(m => m.tournamentId === tournament.id);
        
        // Handle Beat the Box tournaments
        if (tournament.type === TournamentType.BeatTheBox) {
            if (tournament.status === 'scheduled') {
                // Print blank score sheet for scheduled tournaments
                // FILTRA SOLO I BOX MATCHES (escludi semifinali e finali)
                
                // Conta giocatori unici per determinare il numero di box
                const uniquePlayerIds = new Set<string>();
                tournamentMatches.forEach(match => {
                    match.team1.forEach(id => uniquePlayerIds.add(id));
                    match.team2.forEach(id => uniquePlayerIds.add(id));
                });
                const numPlayers = uniquePlayerIds.size;
                const numPairs = numPlayers / 2;
                const numBoxes = numPairs / 2;
                const boxMatchCount = numBoxes * 3; // Ogni box ha 3 match
                
                const boxMatchesOnly = tournamentMatches.slice(0, boxMatchCount);
                const boxes = groupMatchesIntoBoxes(boxMatchesOnly);
                
                // Popola i giocatori per ogni box
                boxes.forEach(box => {
                    const playerIdsSet = new Set<string>();
                    box.matches.forEach(match => {
                        match.team1.forEach(id => playerIdsSet.add(id));
                        match.team2.forEach(id => playerIdsSet.add(id));
                    });
                    
                    const playerIds = Array.from(playerIdsSet);
                    box.players = playerIds.map(id => getPlayerById(id)).filter((p): p is Player => p !== undefined);
                });
                
                printBeatTheBoxBlank(tournament, boxes, getPlayerById);
            } else {
                // Print complete report for completed tournaments
                const { boxes, boxStandings, semifinalMatches, finalMatches, individualStandings } = processBeatTheBoxData(tournamentMatches, getPlayerById);
                
                // USA SEMPRE I DATI RICALCOLATI (stesso algoritmo dell'UI)
                printBeatTheBoxComplete(tournament, boxes, boxStandings, semifinalMatches, finalMatches, individualStandings, getPlayerById);
            }
            return;
        }
        
        let standings: TournamentStandingEntry[];
        if (tournament.type === TournamentType.Americano) {
            standings = calculateAmericanoStandings(tournamentMatches);
        } else if (tournament.type === TournamentType.RoundRobinFinali && tournamentMatches.length > 2) {
            // For Round Robin + Finali, calculate based on finals results
            const roundRobinMatchCount = tournamentMatches.length - 2;
            standings = calculateFinalStandingsForRoundRobinFinali(tournamentMatches, roundRobinMatchCount, getPlayerById);
        } else {
            standings = calculateTournamentStandings(tournamentMatches, getPlayerById);
        }
        
        // For Americano tournaments, we need to get the americanoFields parameter
        // Since we don't have it stored in the tournament, we'll default to 2
        const americanoFields = tournament.type === TournamentType.Americano ? 2 : undefined;
        
        // For Round Robin + Finali tournaments, calculate the number of round robin matches
        // (Total matches - 2 finals matches)
        const roundRobinMatchCount = tournament.type === TournamentType.RoundRobinFinali && tournamentMatches.length > 2
            ? tournamentMatches.length - 2
            : undefined;
        
        printTournamentReport(tournament, standings, tournamentMatches, getPlayerById, americanoFields, 'games-diff', roundRobinMatchCount);
    };

    const handleDelete = (tournamentId: string) => {
        if (window.confirm('Are you sure you want to delete this tournament day? This will also delete all associated matches.')) {
            deleteTournament(tournamentId);
        }
    };
    
    const handleEdit = (tournament: Tournament) => {
        setTournamentToEdit(tournament);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (tournamentToEdit && editClub.trim() && editName.trim()) {
            setIsSubmitting(true);
            try {
                await updateTournament(tournamentToEdit.id, {
                    name: editName,
                    club: editClub,
                    date: new Date(editDate).toISOString(),
                });
                setIsEditModalOpen(false);
                setTournamentToEdit(null);
            } catch (error) {
                console.error("Failed to update tournament:", error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };
    
    const tournamentsByName = useMemo(() => {
        const groups: { [key: string]: Tournament[] } = {};
        tournaments.forEach(t => {
            if (!groups[t.name]) {
                groups[t.name] = [];
            }
            groups[t.name].push(t);
        });
        Object.values(groups).forEach(group => group.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        return groups;
    }, [tournaments]);

    const sortedTournamentNames = Object.keys(tournamentsByName).sort((a, b) => {
        const dateA = new Date(tournamentsByName[a][0].date).getTime();
        const dateB = new Date(tournamentsByName[b][0].date).getTime();
        return dateB - dateA;
    });

    return (
        <>
            <div className="mb-6">
                 <Card>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Inizia da qui!
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                Organizza un nuovo torneo, inserisci una giornata, sorteggia le coppie e memorizza i risultati
                            </p>
                        </div>
                        <Button onClick={() => setActivePage('Draw')} size="lg" className="w-full sm:w-auto flex-shrink-0">
                            Nuova Partita / Nuova Giornata
                        </Button>
                    </div>
                </Card>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <TournamentsSkeleton />
                ) : sortedTournamentNames.length > 0 ? (
                    sortedTournamentNames.map(name => {
                        const tournamentDays = tournamentsByName[name];
                        const isExpanded = expandedNames.has(name);
                        return (
                            <Card 
                                key={name} 
                                title={
                                    <div onClick={() => toggleExpand(name)} className="flex items-center cursor-pointer">
                                        <ChevronDownIcon className={`h-5 w-5 mr-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        <span className="font-bold text-xl">{name}</span>
                                    </div>
                                }
                            >
                                {isExpanded && (
                                    <div className="space-y-3">
                                        {tournamentDays.map(day => (
                                            <div key={day.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
                                                <div>
                                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{day.type}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{day.club} - {new Date(day.date).toLocaleDateString()}</p>
                                                    {day.status === 'scheduled' && (
                                                        <button
                                                            onClick={() => onNavigateToResults(day.id)}
                                                            className="inline-block px-3 py-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-full mt-2 transition-colors cursor-pointer"
                                                        >
                                                            In Corso - Inserisci Risultati
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Button size="sm" variant="secondary" onClick={() => handleEdit(day)} className="!p-2" aria-label="Edit Tournament Day"><PencilIcon /></Button>
                                                    <Button size="sm" variant="secondary" onClick={() => handlePrint(day)} aria-label="Print Report"><PrintIcon /></Button>
                                                    <Button size="sm" variant="danger" onClick={() => handleDelete(day.id)} className="!p-2" aria-label="Delete Tournament Day"><TrashIcon /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        );
                    })
                ) : (
                    <Card>
                        <p className="text-center py-8 text-gray-500">Nessun torneo attivo. Inserisci una nuova partita o sorteggia delle nuove coppie per registrarne uno.</p>
                    </Card>
                )}
            </div>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Tournament Day">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Tournament Name</label>
                        <input
                            type="text"
                            id="edit-name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                     <div>
                        <label htmlFor="edit-club" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Club Name</label>
                        <input
                            type="text"
                            id="edit-club"
                            value={editClub}
                            onChange={(e) => setEditClub(e.target.value)}
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-date" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Date</label>
                        <input
                            type="date"
                            id="edit-date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)} className="mr-2" disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default TournamentsPage;
