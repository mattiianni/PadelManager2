
export const APP_VERSION = '4.1.5';
export const APP_MONTH = 'Giu 2026';

export const INITIAL_ELO = 1500;

// K factors for different tournament types
export const K_FACTORS = {
    'TorneOtto 30\'': 16,      // Standard tournament
    'Americano': 24,            // Medium volatility for Americano
    'Round Robin + Finali': 28, // Default (not used with phases)
    'Friendly Match': 20,       // Balanced volatility for friendly matches
} as const;

// K factors for Round Robin + Finali phases (ASYMMETRIC)
export const K_FACTORS_ROUND_ROBIN_FINALI = {
    roundRobin: 10,           // Lower K for round robin phase (symmetric)
    finals1st2ndWinner: 32,   // High K for 1st-2nd place final winner
    finals1st2ndLoser: 10,    // Low K for 1st-2nd place final loser
    finals3rd4thWinner: 4,    // Very low K for 3rd-4th place final winner
    finals3rd4thLoser: 24,    // High K for 3rd-4th place final loser - prevents overtaking 2nd place
} as const;
