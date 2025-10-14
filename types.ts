export enum FieldPosition {
    Sinistra = 'Sinistra',
    Destra = 'Destra',
    Indifferente = 'Indifferente',
}

export enum TournamentType {
    TorneOtto = "TorneOtto 30'",
    Americano = "Americano",
    RoundRobinFinali = "Round Robin + Finali",
    TorneoLibero = "Torneo Libero",
    GironiFaseFinale = "Gironi + Fase Finale",
    BeatTheBox = "Beat the Box",
}

export interface Player {
    id: string;
    name: string;
    surname: string;
    position: FieldPosition;
    initialElo: number;
    currentElo: number;
}

export interface Match {
    id: string;
    date: string;
    team1: [string, string];
    team2: [string, string];
    sets: SetScore[];
    winner: 'team1' | 'team2' | 'draw' | null;
    tournamentId?: string;
}

export interface SetScore {
    team1: number;
    team2: number;
}

export interface Tournament {
    id: string;
    name: string;
    type: TournamentType;
    date: string;
    club: string;
    matchIds: string[];
    status: 'scheduled' | 'completed';
    americanoFields?: number; // Numero di campi per tornei Americano
    americanoScoringType?: 'games-diff' | 'points'; // Tipo di scoring per Americano
    giornataName?: string; // Nome della giornata per Torneo Libero
    finalStandings?: any; // Classifiche finali salvate (per Beat the Box e altri tornei)
}

export interface EloHistoryEntry {
    eventId: string;
    playerId: string;
    eloBefore: number;
    eloAfter: number;
    delta: number;
    date: string;
    type: 'match' | 'manual' | 'tournament';
}

export interface RankingEntry extends Player {
    rank: number;
    matchesPlayed: number;
    matchesWon: number;
    gamesWon: number;
    gamesLost: number;
    winPercentage: number;
    lastDelta: number | null;
    presencePercentage?: number;
    playerGiornateCount?: number;
}

export interface TournamentStandingEntry {
    team: [Player, Player];
    teamId: string;
    points: number;
    gamesWon: number;
    gamesLost: number;
    gameDifference: number;
}

// Beat the Box specific types
export interface BeatTheBoxData {
    numBoxes: number;
    boxPlayers: Player[][]; // Array di array (4 giocatori per box)
    currentPhase: 'boxes' | 'semifinals' | 'finals';
    boxMatchCount: number; // Numero di match per box (sempre 3)
    semifinalMatchCount?: number; // Se 8+ coppie
}