import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';
import logger from './utils/logger.js';

const INITIAL_ELO = 1500;

// K factors for different tournament types
const K_FACTORS = {
    'TorneOtto 30\'': 16,
    'Americano': 24,
    'Round Robin + Finali': 28,
    'Friendly Match': 20,
    'Beat the Box': 16,
};

// K factors for Round Robin + Finali phases (ASYMMETRIC)
const K_FACTORS_ROUND_ROBIN_FINALI = {
    roundRobin: 10,
    finals1st2ndWinner: 32,
    finals1st2ndLoser: 10,
    finals3rd4thWinner: 4,
    finals3rd4thLoser: 24,
};

/**
 * Calculates the change in ELO rating for both teams (supports asymmetric K-factors).
 */
function calculateEloChange(elo1, elo2, score1, tournamentType = 'TorneOtto 30\'', phase) {
    const expectedScore1 = 1 / (1 + Math.pow(10, (elo2 - elo1) / 400));
    const expectedScore2 = 1 - expectedScore1;
    const score2 = 1 - score1;
    
    let kFactor1;
    let kFactor2;
    
    // For Round Robin + Finali, use phase-specific K factors (potentially asymmetric)
    if (tournamentType === 'Round Robin + Finali' && phase) {
        if (phase === 'roundRobin') {
            kFactor1 = K_FACTORS_ROUND_ROBIN_FINALI.roundRobin;
            kFactor2 = K_FACTORS_ROUND_ROBIN_FINALI.roundRobin;
        } else if (phase === 'finals1st2nd') {
            // Asymmetric: winner gets high K, loser gets low K
            kFactor1 = score1 === 1 ? K_FACTORS_ROUND_ROBIN_FINALI.finals1st2ndWinner : K_FACTORS_ROUND_ROBIN_FINALI.finals1st2ndLoser;
            kFactor2 = score2 === 1 ? K_FACTORS_ROUND_ROBIN_FINALI.finals1st2ndWinner : K_FACTORS_ROUND_ROBIN_FINALI.finals1st2ndLoser;
        } else if (phase === 'finals3rd4th') {
            // Asymmetric: winner gets low K, loser gets high K
            kFactor1 = score1 === 1 ? K_FACTORS_ROUND_ROBIN_FINALI.finals3rd4thWinner : K_FACTORS_ROUND_ROBIN_FINALI.finals3rd4thLoser;
            kFactor2 = score2 === 1 ? K_FACTORS_ROUND_ROBIN_FINALI.finals3rd4thWinner : K_FACTORS_ROUND_ROBIN_FINALI.finals3rd4thLoser;
        } else {
            kFactor1 = K_FACTORS['Round Robin + Finali'];
            kFactor2 = K_FACTORS['Round Robin + Finali'];
        }
    } else {
        const k = K_FACTORS[tournamentType] || K_FACTORS['TorneOtto 30\''];
        kFactor1 = k;
        kFactor2 = k;
    }
    
    const delta1 = kFactor1 * (score1 - expectedScore1);
    const delta2 = kFactor2 * (score2 - expectedScore2);
    
    return { delta1, delta2 };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint for platform probes
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Database connection - ALWAYS USE NEON (dev and prod)
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    logger.error('DATABASE_URL environment variable is not set');
    process.exit(1);
}

const sql = neon(DATABASE_URL);
const dbUrl = new URL(DATABASE_URL);
logger.info('Database connected', { 
    host: dbUrl.host, 
    database: dbUrl.pathname.replace('/', ''),
    ssl: 'enabled'
});

// Helper function to create tables if they don't exist
async function ensureTablesExist() {
    // Ensure pgcrypto is available for gen_random_uuid()
    try {
        await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
    } catch (error) {
        logger.warn('Failed to create pgcrypto extension (may already exist or not permitted)', { message: error.message });
    }
    await sql`
        CREATE TABLE IF NOT EXISTS players (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            surname VARCHAR(255) NOT NULL,
            position VARCHAR(50) NOT NULL,
            initial_elo REAL NOT NULL DEFAULT 1500,
            current_elo REAL NOT NULL DEFAULT 1500
        );
    `;
    await sql`
        CREATE TABLE IF NOT EXISTS tournaments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            type VARCHAR(100) NOT NULL,
            date TIMESTAMPTZ NOT NULL,
            club VARCHAR(255) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
        );
    `;
    
    // Add status column if it doesn't exist (for existing databases)
    try {
        await sql`ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed'`;
        // Update existing tournaments to 'completed' status
        await sql`UPDATE tournaments SET status = 'completed' WHERE status IS NULL`;
    } catch (error) {
        logger.debug('Status column update attempt', { message: error.message });
    }
    
    // Add Americano-specific columns if they don't exist
    try {
        await sql`ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS americano_fields INTEGER`;
        await sql`ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS americano_scoring_type VARCHAR(20)`;
    } catch (error) {
        logger.debug('Americano columns update attempt', { message: error.message });
    }
    
    // Add final_standings column for Beat the Box (and other tournaments)
    try {
        await sql`ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS final_standings JSONB`;
    } catch (error) {
        logger.debug('Final standings column update attempt', { message: error.message });
    }
    
    // Add giornata_name column if it doesn't exist
    try {
        await sql`ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS giornata_name VARCHAR(255)`;
    } catch (error) {
        logger.debug('Giornata name column update attempt', { message: error.message });
    }
    await sql`
        CREATE TABLE IF NOT EXISTS matches (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            date TIMESTAMPTZ NOT NULL,
            team1_p1_id UUID REFERENCES players(id) ON DELETE CASCADE,
            team1_p2_id UUID REFERENCES players(id) ON DELETE CASCADE,
            team2_p1_id UUID REFERENCES players(id) ON DELETE CASCADE,
            team2_p2_id UUID REFERENCES players(id) ON DELETE CASCADE,
            sets JSONB NOT NULL,
            winner VARCHAR(10),
            tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE
        );
    `;
    
    // Fix winner column constraint (allow NULL for scheduled matches)
    try {
        await sql`ALTER TABLE matches ALTER COLUMN winner DROP NOT NULL`;
    } catch (error) {
        logger.debug('Winner column constraint update attempt', { message: error.message });
    }
    await sql`
        CREATE TABLE IF NOT EXISTS elo_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_id UUID NOT NULL,
            player_id UUID REFERENCES players(id) ON DELETE CASCADE,
            elo_before REAL NOT NULL,
            elo_after REAL NOT NULL,
            delta REAL NOT NULL,
            date TIMESTAMPTZ NOT NULL,
            type VARCHAR(50) NOT NULL
        );
    `;
}

// Initialize tables on startup
ensureTablesExist().catch(err => logger.error('Failed to ensure tables exist', err));

// API Routes

// GET /api/data - Fetch all data
app.get('/api/data', async (req, res) => {
    try {
        await ensureTablesExist();

        const [playersResult, matchesResult, tournamentsResult, eloHistoryResult] = await Promise.all([
            sql`SELECT * FROM players;`,
            sql`SELECT id, date, team1_p1_id, team1_p2_id, team2_p1_id, team2_p2_id, sets, winner, tournament_id FROM matches;`,
            sql`SELECT id, name, type, date, club, status, americano_fields, americano_scoring_type, final_standings, giornata_name FROM tournaments;`,
            sql`SELECT event_id, player_id, elo_before, elo_after, delta, date, type FROM elo_history;`
        ]);

        const players = playersResult.map(p => ({
            id: p.id,
            name: p.name,
            surname: p.surname,
            position: p.position,
            initialElo: p.initial_elo,
            currentElo: p.current_elo,
        }));

        const tournaments = tournamentsResult.map(t => ({
            id: t.id,
            name: t.name,
            type: t.type,
            date: t.date,
            club: t.club,
            matchIds: [], // This can be populated if needed by another query
            status: t.status || 'scheduled',
            americanoFields: t.americano_fields,
            americanoScoringType: t.americano_scoring_type,
            finalStandings: t.final_standings || null,
            giornataName: t.giornata_name || null
        }));

        const matches = matchesResult.map(m => ({
            id: m.id,
            date: m.date,
            team1: [m.team1_p1_id, m.team1_p2_id],
            team2: [m.team2_p1_id, m.team2_p2_id],
            sets: m.sets,
            winner: m.winner,
            tournamentId: m.tournament_id,
        }));
        
        
        const eloHistory = eloHistoryResult.map(h => ({
            eventId: h.event_id,
            playerId: h.player_id,
            eloBefore: h.elo_before,
            eloAfter: h.elo_after,
            delta: h.delta,
            date: h.date,
            type: h.type
        }));

        res.json({ players, matches, tournaments, eloHistory });
    } catch (error) {
        logger.error('Failed to fetch data', error);
        res.status(500).json({ message: 'Failed to fetch data', error: error.message });
    }
});

// POST /api/players - Add player
app.post('/api/players', async (req, res) => {
    try {
        const { name, surname, position } = req.body;
        if (!name || !surname || !position) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        await sql`
            INSERT INTO players (name, surname, position, initial_elo, current_elo)
            VALUES (${name}, ${surname}, ${position}, 1500, 1500);
        `;

        logger.info('Player added successfully', { name, surname, position });
        res.json({ message: 'Player added successfully' });
    } catch (error) {
        logger.error('Failed to add player', error);
        res.status(500).json({ message: 'Failed to add player', error: error.message });
    }
});

// PUT /api/players - Update player
app.put('/api/players', async (req, res) => {
    try {
        const { id, name, surname, position, currentElo } = req.body;
        if (!id || !name || !surname || !position || currentElo === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        const playerResult = await sql`SELECT current_elo FROM players WHERE id = ${id}`;
        if (playerResult.length === 0) {
            return res.status(404).json({ message: 'Player not found' });
        }
        const oldElo = playerResult[0].current_elo;

        await sql`
            UPDATE players 
            SET name = ${name}, surname = ${surname}, position = ${position}, current_elo = ${currentElo} 
            WHERE id = ${id}
        `;

        if (oldElo !== currentElo) {
            const delta = currentElo - oldElo;
            logger.eloChange(id, oldElo, currentElo, delta, 'manual update');
            await sql`
                INSERT INTO elo_history (event_id, player_id, elo_before, elo_after, delta, date, type)
                VALUES (gen_random_uuid(), ${id}, ${oldElo}, ${currentElo}, ${delta}, NOW(), 'manual')
            `;
        }

        logger.info('Player updated successfully', { id, name, surname });
        res.json({ message: 'Player updated successfully' });
    } catch (error) {
        logger.error('Failed to update player', error);
        res.status(500).json({ message: 'Failed to update player', error: error.message });
    }
});

// DELETE /api/players - Delete player
app.delete('/api/players', async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ message: 'Player ID is required' });
        }
        
        // The ON DELETE CASCADE constraint will handle deleting related matches and history
        await sql`DELETE FROM players WHERE id = ${id};`;

        logger.info('Player deleted successfully', { id });
        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        logger.error('Failed to delete player', error);
        res.status(500).json({ message: 'Failed to delete player', error: error.message });
    }
});

// POST /api/matches - Add match
app.post('/api/matches', async (req, res) => {
    try {
        const { date, team1, team2, sets, winner, tournamentId } = req.body;
        if (!date || !team1 || !team2 || !sets || !winner) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const result = await sql`
            INSERT INTO matches (date, team1_p1_id, team1_p2_id, team2_p1_id, team2_p2_id, sets, winner, tournament_id)
            VALUES (${date}, ${team1[0]}, ${team1[1]}, ${team2[0]}, ${team2[1]}, ${JSON.stringify(sets)}, ${winner}, ${tournamentId || null})
            RETURNING id
        `;
        const matchId = result[0].id;

        // Skip ELO calculation if this match is part of a tournament
        // (ELO will be calculated by /api/tournaments/complete)
        if (tournamentId) {
            logger.match('create', matchId, { tournamentId, status: 'ELO pending' });
            return res.json({ matchId, message: 'Match added to tournament (ELO pending)' });
        }

        // Simple ELO calculation (you can implement the full logic here)
        const allPlayerIds = [...team1, ...team2];
        const playersResult = await sql`SELECT id, current_elo FROM players WHERE id = ANY(${allPlayerIds}::uuid[])`;
        const playersData = playersResult.reduce((acc, row) => ({ ...acc, [row.id]: row.current_elo }), {});

        const team1EloAvg = (playersData[team1[0]] + playersData[team1[1]]) / 2;
        const team2EloAvg = (playersData[team2[0]] + playersData[team2[1]]) / 2;
        const score1 = winner === 'team1' ? 1 : 0;
        
        // ELO calculation using configured K-factors for Friendly Match
        const { delta1, delta2 } = calculateEloChange(team1EloAvg, team2EloAvg, score1, 'Friendly Match');
        
        logger.match('create', matchId, { 
            type: 'Friendly Match',
            team1Delta: delta1.toFixed(2), 
            team2Delta: delta2.toFixed(2),
            kFactor: 20
        });
        
        // Update player ELOs
        for (const playerId of team1) {
            const playerResult = await sql`SELECT current_elo FROM players WHERE id = ${playerId}`;
            const oldElo = playerResult[0].current_elo;
            const newElo = oldElo + delta1;

            logger.eloChange(playerId, oldElo, newElo, delta1, 'friendly match - team1');
            await sql`UPDATE players SET current_elo = ${newElo} WHERE id = ${playerId}`;
            await sql`
                INSERT INTO elo_history (event_id, player_id, elo_before, elo_after, delta, date, type)
                VALUES (${matchId}, ${playerId}, ${oldElo}, ${newElo}, ${delta1}, ${date}, 'match')
            `;
        }
        
        for (const playerId of team2) {
            const playerResult = await sql`SELECT current_elo FROM players WHERE id = ${playerId}`;
            const oldElo = playerResult[0].current_elo;
            const newElo = oldElo + delta2;

            logger.eloChange(playerId, oldElo, newElo, delta2, 'friendly match - team2');
            await sql`UPDATE players SET current_elo = ${newElo} WHERE id = ${playerId}`;
            await sql`
                INSERT INTO elo_history (event_id, player_id, elo_before, elo_after, delta, date, type)
                VALUES (${matchId}, ${playerId}, ${oldElo}, ${newElo}, ${delta2}, ${date}, 'match')
            `;
        }

        res.json({ message: 'Match added and ELO updated successfully', matchId });
    } catch (error) {
        logger.error('Failed to add match', error);
        res.status(500).json({ message: 'Failed to add match', error: error.message });
    }
});

// DELETE /api/matches - Delete match
// PUT /api/matches - Update match scores
app.put('/api/matches', async (req, res) => {
    try {
        const { matchUpdates } = req.body;
        if (!matchUpdates || !Array.isArray(matchUpdates)) {
            return res.status(400).json({ message: 'Match updates array is required' });
        }
        
        logger.info('Updating match scores', { count: matchUpdates.length });
        
        for (const update of matchUpdates) {
            const { matchId, sets } = update;
            if (!matchId || !sets || !Array.isArray(sets)) {
                logger.warn('Invalid match update data', { matchId });
                continue;
            }
            
            // Calculate winner based on sets
            const team1Games = sets.reduce((sum, set) => sum + set.team1, 0);
            const team2Games = sets.reduce((sum, set) => sum + set.team2, 0);
            
            let winner;
            if (team1Games === team2Games) {
                winner = 'draw';
            } else {
                winner = team1Games > team2Games ? 'team1' : 'team2';
            }
            
            // Update match with sets and winner
            await sql`
                UPDATE matches 
                SET sets = ${JSON.stringify(sets)}, winner = ${winner}
                WHERE id = ${matchId}
            `;
            
            logger.match('update', matchId, { winner, team1Games, team2Games });
        }
        
        logger.info('Matches updated successfully', { count: matchUpdates.length });
        res.json({ message: 'Matches updated successfully' });
    } catch (error) {
        logger.error('Failed to update matches', error);
        res.status(500).json({ message: 'Failed to update matches', error: error.message });
    }
});

app.delete('/api/matches', async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ message: 'Match ID is required' });
        }
        
        logger.match('delete', id, { action: 'reverting ELO changes' });
        
        // First, get the ELO history for this match to revert the changes
        const eloHistoryResult = await sql`
            SELECT player_id, elo_before, elo_after, delta 
            FROM elo_history 
            WHERE event_id = ${id} AND type = 'match'
        `;
        
        logger.debug('ELO history records found', { matchId: id, count: eloHistoryResult.length });
        
        // Revert ELO changes for each player
        for (const history of eloHistoryResult) {
            // Get current ELO of the player
            const currentPlayerResult = await sql`
                SELECT current_elo FROM players WHERE id = ${history.player_id}
            `;
            const currentElo = currentPlayerResult[0].current_elo;
            
            // Calculate new ELO by subtracting the delta from this match
            const newElo = currentElo - history.delta;
            
            logger.eloChange(history.player_id, currentElo, newElo, -history.delta, 'match deletion (revert)');
            
            await sql`
                UPDATE players 
                SET current_elo = ${newElo} 
                WHERE id = ${history.player_id}
            `;
        }
        
        // Delete ELO history associated with this match
        await sql`DELETE FROM elo_history WHERE event_id = ${id}`;
        
        // Delete the match itself
        await sql`DELETE FROM matches WHERE id = ${id}`;

        logger.match('delete', id, { revertedPlayers: eloHistoryResult.length, status: 'completed' });
        res.json({ 
            message: 'Match deleted and ELO ratings reverted successfully.',
            revertedPlayers: eloHistoryResult.length
        });
    } catch (error) {
        logger.error('Failed to delete match', error);
        res.status(500).json({ message: 'Failed to delete match', error: error.message });
    }
});

// PUT /api/tournaments - Update tournament
app.put('/api/tournaments', async (req, res) => {
    try {
        const { id, name, club, date } = req.body;
        if (!id || !name || !club || !date) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        await sql`
            UPDATE tournaments SET name = ${name}, club = ${club}, date = ${date}
            WHERE id = ${id};
        `;

        logger.tournament('update', id, { name, club });
        res.json({ message: 'Tournament updated successfully' });
    } catch (error) {
        logger.error('Failed to update tournament', error);
        res.status(500).json({ message: 'Failed to update tournament', error: error.message });
    }
});

// DELETE /api/tournaments - Delete tournament
app.delete('/api/tournaments', async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ message: 'Tournament ID is required' });
        }
        
        logger.tournament("delete", id, { action: "deleting" });
        
        // First, get all matches in this tournament to revert their ELO changes
        const matchesResult = await sql`
            SELECT id FROM matches WHERE tournament_id = ${id}
        `;
        
        logger.debug("Tournament matches found", { tournamentId: id, count: matchesResult.length });
        
        let totalReverted = 0;
        
        // Revert ELO changes for tournament (all matches use tournamentId as event_id)
        const eloHistoryResult = await sql`
            SELECT player_id, elo_before, elo_after, delta 
            FROM elo_history 
            WHERE event_id = ${id} AND type = 'tournament'
        `;
        
        logger.debug("ELO history records found for tournament", { tournamentId: id, count: eloHistoryResult.length });
        
        // Revert ELO changes for each player in the tournament
        for (const history of eloHistoryResult) {
            // Get current ELO of the player
            const currentPlayerResult = await sql`
                SELECT current_elo FROM players WHERE id = ${history.player_id}
            `;
            const currentElo = currentPlayerResult[0].current_elo;
            
            // Calculate new ELO by subtracting the delta from this tournament
            const newElo = currentElo - history.delta;
            
            logger.eloChange(history.player_id, currentElo, newElo, -history.delta, "tournament deletion (revert)");
            
            await sql`
                UPDATE players 
                SET current_elo = ${newElo} 
                WHERE id = ${history.player_id}
            `;
            totalReverted++;
        }
        
        // Delete ELO history for the tournament (all records use tournamentId as event_id)
        await sql`DELETE FROM elo_history WHERE event_id = ${id} AND type = 'tournament'`;
        
        // Using ON DELETE CASCADE on the matches table will automatically delete them
        await sql`DELETE FROM tournaments WHERE id = ${id};`;

        logger.tournament("delete", id, { revertedPlayers: totalReverted, status: "completed" });
        res.json({ 
            message: 'Tournament deleted and all ELO ratings reverted successfully',
            revertedPlayers: totalReverted
        });
    } catch (error) {
        logger.error("Failed to delete tournament", error);
        res.status(500).json({ message: 'Failed to delete tournament', error: error.message });
    }
});

// POST /api/tournaments/bulk-matches - Add tournament with multiple matches
app.post('/api/tournaments/bulk-matches', async (req, res) => {
    try {
        const { tournament, matches } = req.body;
        if (!tournament || !matches || !Array.isArray(matches)) {
            return res.status(400).json({ message: 'Missing or invalid tournament/matches data' });
        }

        const tournamentResult = await sql`
            INSERT INTO tournaments (name, type, date, club, status, giornata_name, final_standings) 
            VALUES (${tournament.name}, ${tournament.type}, ${tournament.date}, ${tournament.club}, ${tournament.status || 'scheduled'}, ${tournament.giornataName || null}, ${tournament.finalStandings ? JSON.stringify(tournament.finalStandings) : null})
            RETURNING id
        `;
        const tournamentId = tournamentResult[0].id;

        const allPlayerIds = new Set();
        matches.forEach((match) => {
            match.team1.forEach(id => allPlayerIds.add(id));
            match.team2.forEach(id => allPlayerIds.add(id));
        });

        // Get their starting ELOs for this tournament (isolated ELO system)
        const playerIdsArray = Array.from(allPlayerIds);
        
        // Find previous giornate of the same tournament (by name)
        const previousGiornate = await sql`
            SELECT id, date 
            FROM tournaments 
            WHERE name = ${tournament.name} 
            AND date < ${tournament.date}
            AND status = 'completed'
            ORDER BY date DESC
        `;
        
        logger.debug("Previous giornate found", { tournament: tournament.name, count: previousGiornate.length });
        
        // Calculate starting ELO for each player in this tournament (sistema isolato)
        const playersData = {};
        for (const playerId of playerIdsArray) {
            if (previousGiornate.length > 0) {
                // Get ELO from the most recent previous giornata of this tournament
                const lastGiornataId = previousGiornate[0].id;
                const eloHistoryResult = await sql`
                    SELECT elo_after 
                    FROM elo_history 
                    WHERE player_id = ${playerId} 
                    AND event_id = ${lastGiornataId} 
                    AND type = 'tournament'
                `;
                if (eloHistoryResult.length > 0) {
                    playersData[playerId] = eloHistoryResult[0].elo_after;
                    logger.debug("Player ELO starting point", { playerId, elo: eloHistoryResult[0].elo_after, source: "previous giornata" });
                } else {
                    playersData[playerId] = 1500;
                    logger.debug("Player ELO starting point", { playerId, elo: 1500, source: "first time" });
                }
            } else {
                // First giornata of this tournament series, start from 1500
                playersData[playerId] = 1500;
                logger.debug("Player ELO starting point", { playerId, elo: 1500, source: "first giornata" });
            }
        }

        // Track ELO changes for each player across all matches
        const playerEloChanges = new Map();
        
        // Determine if this is Round Robin + Finali to use phase-specific K factors
        const isRoundRobinFinali = tournament.type === 'Round Robin + Finali';
        const totalMatches = matches.length;
        const roundRobinMatchCount = isRoundRobinFinali ? totalMatches - 2 : totalMatches;
        
        // Process matches sequentially
        for (let matchIndex = 0; matchIndex < matches.length; matchIndex++) {
            const match = matches[matchIndex];
            const result = await sql`
                INSERT INTO matches (date, team1_p1_id, team1_p2_id, team2_p1_id, team2_p2_id, sets, winner, tournament_id)
                VALUES (${match.date}, ${match.team1[0]}, ${match.team1[1]}, ${match.team2[0]}, ${match.team2[1]}, ${JSON.stringify(match.sets)}, ${match.winner || null}, ${tournamentId})
                RETURNING id
            `;
            const matchId = result[0].id;

            // Only calculate ELO if tournament is completed and match has a winner
            if (tournament.status === 'completed' && match.winner) {
                // Use tournament-specific ELOs (updated as we process matches)
                const team1P1Elo = playersData[match.team1[0]];
                const team1P2Elo = playersData[match.team1[1]];
                const team2P1Elo = playersData[match.team2[0]];
                const team2P2Elo = playersData[match.team2[1]];

                const team1EloAvg = (team1P1Elo + team1P2Elo) / 2;
                const team2EloAvg = (team2P1Elo + team2P2Elo) / 2;
                let score1;
                if (match.winner === 'team1') {
                    score1 = 1;
                } else if (match.winner === 'team2') {
                    score1 = 0;
                } else { // draw
                    score1 = 0.5;
                }
                
                // Determine phase for Round Robin + Finali
                let phase;
                if (isRoundRobinFinali) {
                    if (matchIndex < roundRobinMatchCount) {
                        phase = 'roundRobin';
                    } else if (matchIndex === roundRobinMatchCount) {
                        phase = 'finals1st2nd'; // First final is for 1st-2nd place
                    } else {
                        phase = 'finals3rd4th'; // Second final is for 3rd-4th place
                    }
                }
                
                const { delta1, delta2 } = calculateEloChange(team1EloAvg, team2EloAvg, score1, tournament.type, phase);
                
                logger.debug("Match ELO calculation", { match: matchIndex + 1, team1Avg: team1EloAvg.toFixed(2), team2Avg: team2EloAvg.toFixed(2), delta1: delta1.toFixed(2), delta2: delta2.toFixed(2) });
                
                // Update tournament-specific ELO (in memory, not in DB current_elo)
                for (const playerId of match.team1) {
                    const oldElo = playersData[playerId];
                    const newElo = oldElo + delta1;
                    playersData[playerId] = newElo; // Update for next match in this tournament
                    
                    // Track total change for this player
                    if (!playerEloChanges.has(playerId)) {
                        playerEloChanges.set(playerId, { oldElo, totalDelta: 0 });
                    }
                    playerEloChanges.get(playerId).totalDelta += delta1;
                }
                
                for (const playerId of match.team2) {
                    const oldElo = playersData[playerId];
                    const newElo = oldElo + delta2;
                    playersData[playerId] = newElo; // Update for next match in this tournament
                    
                    // Track total change for this player
                    if (!playerEloChanges.has(playerId)) {
                        playerEloChanges.set(playerId, { oldElo, totalDelta: 0 });
                    }
                    playerEloChanges.get(playerId).totalDelta += delta2;
                }
            }
        }
        
        // Create SINGLE ELO history record per player for the entire tournament (only if completed)
        // Also update global current_elo as sum of all tournament deltas
        if (tournament.status === 'completed') {
            for (const [playerId, { oldElo, totalDelta }] of playerEloChanges) {
                if (totalDelta !== 0) {
                    const newElo = oldElo + totalDelta;
                    await sql`
                        INSERT INTO elo_history (event_id, player_id, elo_before, elo_after, delta, date, type)
                        VALUES (${tournamentId}, ${playerId}, ${oldElo}, ${newElo}, ${totalDelta}, ${tournament.date}, 'tournament')
                    `;
                    
                    // Update global current_elo by adding this tournament's delta
                    const currentGlobalElo = (await sql`SELECT current_elo FROM players WHERE id = ${playerId}`)[0].current_elo;
                    const newGlobalElo = currentGlobalElo + totalDelta;
                    await sql`UPDATE players SET current_elo = ${newGlobalElo} WHERE id = ${playerId}`;
                    logger.eloChange(playerId, currentGlobalElo, newGlobalElo, totalDelta, 'tournament (global update)');
                }
            }
        }

        res.json({ message: 'Tournament and matches added successfully', tournamentId });
    } catch (error) {
        logger.error("Failed to bulk add matches", error);
        res.status(500).json({ message: 'Failed to bulk add matches', error: error.message });
    }
});

// PUT /api/tournaments/complete - Complete a tournament (update status and calculate ELO)
app.put('/api/tournaments/complete', async (req, res) => {
    try {
        const { tournamentId } = req.body;
        if (!tournamentId) {
            return res.status(400).json({ message: 'Tournament ID is required' });
        }
        
        logger.tournament("complete", tournamentId, { action: "starting completion" });
        
        // Update tournament status to completed
        logger.debug("Updating tournament status", { tournamentId, newStatus: "completed" });
        const updateResult = await sql`
            UPDATE tournaments SET status = 'completed' WHERE id = ${tournamentId}
        `;
        logger.debug("Tournament status updated", { rows: updateResult.length });
        
        // Verify the update
        const verifyResult = await sql`
            SELECT status FROM tournaments WHERE id = ${tournamentId}
        `;
        logger.debug("Tournament status verified", { status: verifyResult[0]?.status });
        
        // Get all matches for this tournament
        const matchesResult = await sql`
            SELECT id, team1_p1_id, team1_p2_id, team2_p1_id, team2_p2_id, sets, winner 
            FROM matches WHERE tournament_id = ${tournamentId}
        `;
        
        logger.info("Processing tournament matches", { tournamentId, matchCount: matchesResult.length });
        
        // Get tournament info
        const tournamentInfo = await sql`SELECT name, type, date FROM tournaments WHERE id = ${tournamentId}`;
        const tournamentName = tournamentInfo[0].name;
        const tournamentType = tournamentInfo[0].type;
        const tournamentDate = tournamentInfo[0].date;
        
        // Get all player IDs involved
        const allPlayerIds = new Set();
        matchesResult.forEach(m => {
            allPlayerIds.add(m.team1_p1_id);
            allPlayerIds.add(m.team1_p2_id);
            allPlayerIds.add(m.team2_p1_id);
            allPlayerIds.add(m.team2_p2_id);
        });
        
        // Get starting ELOs for this tournament (isolated ELO system)
        const playerIdsArray = Array.from(allPlayerIds);
        
        // Find previous giornate of the same tournament (by name)
        const previousGiornate = await sql`
            SELECT id, date 
            FROM tournaments 
            WHERE name = ${tournamentName} 
            AND date < ${tournamentDate}
            AND status = 'completed'
            ORDER BY date DESC
        `;
        
        logger.debug("Previous giornate found", { tournament: tournamentName, count: previousGiornate.length });
        
        // Calculate starting ELO for each player in this tournament (sistema isolato)
        const playersData = {};
        for (const playerId of playerIdsArray) {
            if (previousGiornate.length > 0) {
                const lastGiornataId = previousGiornate[0].id;
                const eloHistoryResult = await sql`
                    SELECT elo_after 
                    FROM elo_history 
                    WHERE player_id = ${playerId} 
                    AND event_id = ${lastGiornataId} 
                    AND type = 'tournament'
                `;
                if (eloHistoryResult.length > 0) {
                    playersData[playerId] = eloHistoryResult[0].elo_after;
                    logger.debug("Player ELO starting point", { playerId: playerId.substring(0, 8), elo: eloHistoryResult[0].elo_after, source: "previous giornata" });
                } else {
                    playersData[playerId] = 1500;
                    logger.debug("Player ELO starting point", { playerId: playerId.substring(0, 8), elo: 1500, source: "first time" });
                }
            } else {
                playersData[playerId] = 1500;
                logger.debug("Player ELO starting point", { playerId: playerId.substring(0, 8), elo: 1500, source: "first giornata" });
            }
        }
        
        const playerEloChanges = new Map();
        
        // Determine if this is Round Robin + Finali to use phase-specific K factors
        const isRoundRobinFinali = tournamentType === 'Round Robin + Finali';
        const totalMatches = matchesResult.length;
        const roundRobinMatchCount = isRoundRobinFinali ? totalMatches - 2 : totalMatches;
        
        // Process each match using tournament-specific ELO
        for (let matchIndex = 0; matchIndex < matchesResult.length; matchIndex++) {
            const match = matchesResult[matchIndex];
            
            if (!match.winner) {
                logger.warn("Match has no winner, skipping ELO calculation", { matchId: match.id });
                continue;
            }
            
            // Use tournament-specific ELOs (updated as we process matches)
            const team1P1Elo = playersData[match.team1_p1_id];
            const team1P2Elo = playersData[match.team1_p2_id];
            const team2P1Elo = playersData[match.team2_p1_id];
            const team2P2Elo = playersData[match.team2_p2_id];

            const team1EloAvg = (team1P1Elo + team1P2Elo) / 2;
            const team2EloAvg = (team2P1Elo + team2P2Elo) / 2;
            const score1 = match.winner === 'team1' ? 1 : 0;
            
            // Determine phase for Round Robin + Finali
            let phase;
            if (isRoundRobinFinali) {
                if (matchIndex < roundRobinMatchCount) {
                    phase = 'roundRobin';
                } else if (matchIndex === roundRobinMatchCount) {
                    phase = 'finals1st2nd';
                } else {
                    phase = 'finals3rd4th';
                }
            }
            
            // ELO calculation using configured K-factors (with phase support)
            const { delta1, delta2 } = calculateEloChange(team1EloAvg, team2EloAvg, score1, tournamentType, phase);
            
            logger.debug('Match ELO calculation', { 
                match: matchIndex + 1, 
                team1Avg: team1EloAvg.toFixed(2), 
                team2Avg: team2EloAvg.toFixed(2), 
                delta1: delta1.toFixed(2), 
                delta2: delta2.toFixed(2), 
                phase: phase || null 
            });
            
            // Update tournament-specific ELO (in memory)
            for (const playerId of [match.team1_p1_id, match.team1_p2_id]) {
                const oldElo = playersData[playerId];
                const newElo = oldElo + delta1;
                playersData[playerId] = newElo;
                
                // Track total change for this player
                if (!playerEloChanges.has(playerId)) {
                    playerEloChanges.set(playerId, { oldElo, totalDelta: 0 });
                }
                playerEloChanges.get(playerId).totalDelta += delta1;
            }
            
            for (const playerId of [match.team2_p1_id, match.team2_p2_id]) {
                const oldElo = playersData[playerId];
                const newElo = oldElo + delta2;
                playersData[playerId] = newElo;
                
                // Track total change for this player
                if (!playerEloChanges.has(playerId)) {
                    playerEloChanges.set(playerId, { oldElo, totalDelta: 0 });
                }
                playerEloChanges.get(playerId).totalDelta += delta2;
            }
        }
        
        // Create SINGLE ELO history record per player for the entire tournament
        // Also update global current_elo as sum of all tournament deltas
        for (const [playerId, { oldElo, totalDelta }] of playerEloChanges) {
            if (totalDelta !== 0) {
                const newElo = oldElo + totalDelta;
                await sql`
                    INSERT INTO elo_history (event_id, player_id, elo_before, elo_after, delta, date, type)
                    VALUES (${tournamentId}, ${playerId}, ${oldElo}, ${newElo}, ${totalDelta}, ${tournamentDate}, 'tournament')
                `;
                
                // Update global current_elo by adding this tournament's delta
                const currentGlobalElo = (await sql`SELECT current_elo FROM players WHERE id = ${playerId}`)[0].current_elo;
                const newGlobalElo = currentGlobalElo + totalDelta;
                await sql`UPDATE players SET current_elo = ${newGlobalElo} WHERE id = ${playerId}`;
                logger.eloChange(playerId, currentGlobalElo, newGlobalElo, totalDelta, 'tournament (global update)');
            }
        }
        
        logger.tournament("complete", tournamentId, { updatedPlayers: playerEloChanges.size, status: "success" });
        res.json({ 
            message: 'Tournament completed successfully',
            updatedPlayers: playerEloChanges.size
        });
    } catch (error) {
        logger.error("Failed to complete tournament", error);
        res.status(500).json({ message: 'Failed to complete tournament', error: error.message });
    }
});

// ATOMIC RESET: Reset all ELO to 1500 and clear all history
app.post('/api/reset-all-elo', async (req, res) => {
    try {
        logger.warn("ATOMIC RESET initiated: Setting all ELO to 1500 and clearing history");
        
        // Reset all players to 1500 ELO
        await sql`UPDATE players SET current_elo = 1500`;
        
        // Clear all ELO history
        await sql`DELETE FROM elo_history`;
        
        // Clear all matches
        await sql`DELETE FROM matches`;
        
        // Clear all tournaments
        await sql`DELETE FROM tournaments`;
        
        logger.warn('ATOMIC RESET: All ELO reset to 1500, all history cleared');
        res.json({ message: 'All ELO reset to 1500 and all history cleared successfully' });
    } catch (error) {
        logger.error('Failed atomic reset', error);
        res.status(500).json({ message: 'Failed atomic reset', error: error.message });
    }
});

// Serve static files from dist directory (Vite build output)
app.use(express.static(path.join(__dirname, 'dist')));

// Serve the React app for all non-API routes (SPA fallback)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    logger.banner();
    logger.info(`Server started successfully`, {
        port: PORT,
        url: `http://localhost:${PORT}`,
        database: 'Neon PostgreSQL',
        environment: process.env.NODE_ENV || 'development',
        mode: 'Full-stack (Frontend + API)'
    });
});
