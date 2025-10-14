
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Player, Match, Tournament, EloHistoryEntry, FieldPosition, SetScore } from '../types.ts';

// The new store interface is simplified. It provides data and functions to interact with the backend API.
interface PadelStore {
    players: Player[];
    matches: Match[];
    tournaments: Tournament[];
    eloHistory: EloHistoryEntry[];
    loading: boolean;
    addPlayer: (name: string, surname: string, position: FieldPosition) => Promise<void>;
    updatePlayerAndElo: (playerId: string, updatedData: Pick<Player, 'name' | 'surname' | 'position'>, newElo: number) => Promise<void>;
    deletePlayer: (playerId: string) => Promise<void>;
    addMatch: (match: Omit<Match, 'id'>) => Promise<void>;
    // FIX: Changed `newTournament` type to `Omit<Tournament, 'id'>` to match the implementation and the caller's data structure.
    addMultipleMatches: (matches: Omit<Match, 'id'>[], newTournament: Omit<Tournament, 'id'>) => Promise<void>;
    deleteMatch: (matchId: string) => Promise<void>;
    updateTournamentMatches: (matchUpdates: Array<{ matchId: string; sets: SetScore[] }>) => Promise<void>;
    addTournament: (tournament: Omit<Tournament, 'id'>) => Promise<Tournament>;
    updateTournament: (tournamentId: string, updatedData: Pick<Tournament, 'club' | 'date' | 'name'>) => Promise<void>;
    deleteTournament: (tournamentId: string) => Promise<void>;
    getPlayerById: (id: string) => Player | undefined;
}

const PadelStoreContext = createContext<PadelStore | null>(null);

// Helper to make API requests and handle errors
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'API request failed');
    }
    return response.json();
}

export const PadelStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [eloHistory, setEloHistory] = useState<EloHistoryEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all data from a single bootstrap endpoint
            const data = await apiRequest<{
                players: Player[];
                matches: Match[];
                tournaments: Tournament[];
                eloHistory: EloHistoryEntry[];
            }>('/api/data');
            
            setPlayers(data.players);
            setMatches(data.matches);
            setTournaments(data.tournaments);
            setEloHistory(data.eloHistory);

        } catch (error) {
            console.error("Failed to fetch initial data:", error);
            // Optionally set an error state to show in the UI
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addPlayer = async (name: string, surname: string, position: FieldPosition): Promise<void> => {
        await apiRequest('/api/players', {
            method: 'POST',
            body: JSON.stringify({ name, surname, position }),
        });
        await fetchData(); // Refetch all data to get the new state from the server
    };
    
    const updatePlayerAndElo = async (playerId: string, updatedData: Pick<Player, 'name' | 'surname' | 'position'>, newElo: number): Promise<void> => {
        await apiRequest(`/api/players`, {
             method: 'PUT',
             body: JSON.stringify({ id: playerId, ...updatedData, currentElo: newElo }),
        });
        await fetchData();
    };

    const deletePlayer = async (playerId: string): Promise<void> => {
        await apiRequest(`/api/players`, {
            method: 'DELETE',
            body: JSON.stringify({ id: playerId }),
        });
        await fetchData();
    };

    const addMatch = async (matchData: Omit<Match, 'id'>): Promise<void> => {
        await apiRequest('/api/matches', {
            method: 'POST',
            body: JSON.stringify(matchData),
        });
        await fetchData(); // The backend will have recalculated ELOs, so refetch everything.
    };
    
    const addMultipleMatches = async (matchDataList: Omit<Match, 'id'>[], newTournamentData: Omit<Tournament, 'id'>): Promise<void> => {
        console.log('🔄 addMultipleMatches called with:', { matchesCount: matchDataList.length, tournament: newTournamentData.name });
        try {
            const response = await apiRequest('/api/tournaments/bulk-matches', {
                method: 'POST',
                body: JSON.stringify({ matches: matchDataList, tournament: newTournamentData }),
            });
            console.log('✅ addMultipleMatches API response:', response);
            await fetchData();
            console.log('✅ addMultipleMatches completed successfully');
        } catch (error) {
            console.error('❌ addMultipleMatches failed:', error);
            throw error;
        }
    };

    const updateTournamentMatches = async (matchUpdates: Array<{ matchId: string; sets: SetScore[] }>): Promise<void> => {
         await apiRequest('/api/matches', {
            method: 'PUT',
            body: JSON.stringify({ matchUpdates }),
        });
        await fetchData();
    };

    const addTournament = async (tournamentData: Omit<Tournament, 'id'>): Promise<Tournament> => {
        // This is now slightly different. We call the bulk endpoint which handles everything.
        // We'll return a temporary object since the real one will be fetched.
        const tempTournament = { ...tournamentData, id: crypto.randomUUID(), matchIds: [] };
        // The actual logic is handled by addMultipleMatches, so this function is now more of a placeholder
        // in the context of the tournament flow. The main call is the bulk one.
        return tempTournament;
    };
    
    const deleteMatch = async (matchId: string): Promise<void> => {
        await apiRequest(`/api/matches`, {
            method: 'DELETE',
            body: JSON.stringify({ id: matchId }),
        });
        await fetchData();
    };

    const updateTournament = async (tournamentId: string, updatedData: Pick<Tournament, 'club' | 'date' | 'name'>): Promise<void> => {
        await apiRequest(`/api/tournaments`, {
            method: 'PUT',
            body: JSON.stringify({ id: tournamentId, ...updatedData }),
        });
        await fetchData();
    };
    
    const deleteTournament = async (tournamentId: string): Promise<void> => {
        await apiRequest(`/api/tournaments`, {
            method: 'DELETE',
            body: JSON.stringify({ id: tournamentId }),
        });
        await fetchData();
    };

    const getPlayerById = (id: string) => players.find(p => p.id === id);

    return (
        <PadelStoreContext.Provider value={{
            players,
            matches,
            tournaments,
            eloHistory,
            loading,
            addPlayer,
            updatePlayerAndElo,
            deletePlayer,
            addMatch,
            addMultipleMatches,
            deleteMatch,
            updateTournamentMatches,
            addTournament,
            updateTournament,
            deleteTournament,
            getPlayerById
        }}>
            {children}
        </PadelStoreContext.Provider>
    );
};

export const usePadelStore = (): PadelStore => {
    const context = useContext(PadelStoreContext);
    if (!context) {
        throw new Error('usePadelStore must be used within a PadelStoreProvider');
    }
    return context;
};