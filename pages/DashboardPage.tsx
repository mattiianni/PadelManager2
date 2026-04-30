
import React, { useMemo } from 'react';
import { usePadelStore } from '../hooks/usePadelStore.tsx';
import Card from '../components/ui/Card.tsx';
import { ArrowUpIcon, ArrowDownIcon, ArrowStableIcon, ChevronDownIcon, InfoIcon, PrintIcon } from '../components/ui/Icons.tsx';
import Button from '../components/ui/Button.tsx';
import PlayerProfileModal from '../components/PlayerProfileModal.tsx';
import { Player, TournamentType } from '../types.ts';
import { groupMatchesByPlayerSets } from '../services/beatTheBoxService.ts';
import { printPlayerProfiles } from '../services/printService.ts';
import { getTournamentDisplayName } from '../utils/tournamentLabels.ts';

interface DashboardPageProps {
    onNavigateToResults: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToResults }) => {
    const { players, matches, tournaments, eloHistory, getPlayerById } = usePadelStore();
    const [profilePlayer, setProfilePlayer] = React.useState<Player | null>(null);
    const [recentOpen, setRecentOpen] = React.useState<boolean>(() => {
        try {
            if (typeof window === 'undefined') return true;
            const v = window.localStorage.getItem('dashboard_recent_open');
            if (v === null) return false;
            return v === '1';
        } catch {
            return false;
        }
    });
    const [lastDayOpen, setLastDayOpen] = React.useState<boolean>(() => {
        try {
            if (typeof window === 'undefined') return false;
            const v = window.localStorage.getItem('dashboard_lastday_open');
            if (v === null) return false;
            return v === '1';
        } catch {
            return false;
        }
    });

    const stats = useMemo(() => {
        const activePlayers = players.length;
        const totalMatches = matches.length;
        const completedTournaments = tournaments.filter(t => t.status === 'completed').length;
        const avgElo = players.length > 0
            ? players.reduce((sum, p) => sum + p.currentElo, 0) / players.length
            : 0;

        return { activePlayers, totalMatches, completedTournaments, avgElo };
    }, [players, matches, tournaments]);

    const top5 = useMemo(() => {
        const sorted = [...players].sort((a, b) => b.currentElo - a.currentElo).slice(0, 5);
        return sorted.map(p => {
            const playerHistory = eloHistory
                .filter(e => e.playerId === p.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const lastDelta = playerHistory.length > 0 ? playerHistory[0].delta : 0;
            return { ...p, lastDelta };
        });
    }, [players, eloHistory]);

    const lastGiornata = useMemo(() => {
        const completed = tournaments
            .filter(t => t.status === 'completed')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (completed.length === 0) return null;

        const tournament = completed[0];
        const tournamentMatches = matches.filter(m => m.tournamentId === tournament.id);

        let top3: { label: string }[] = [];

        if (tournament.type === TournamentType.BeatTheBox) {
            // Beat the Box: use groupMatchesByPlayerSets to find finals
            const { phaseMatches } = groupMatchesByPlayerSets(tournamentMatches);
            const numBoxes = groupMatchesByPlayerSets(tournamentMatches).boxes.size;

            let finalMatches: typeof tournamentMatches = [];
            if (numBoxes >= 4 && phaseMatches.length >= 2) {
                // Has semifinals: first 2 are semis, rest are finals
                finalMatches = phaseMatches.slice(2);
            } else {
                finalMatches = phaseMatches;
            }

            // Finals: match[0] = 1st vs 2nd, match[1] = 3rd vs 4th
            const standings: { team: string[] }[] = [];
            if (finalMatches.length > 0 && finalMatches[0].winner) {
                const fm = finalMatches[0];
                standings.push({ team: fm.winner === 'team1' ? [...fm.team1] : [...fm.team2] }); // 1st
                standings.push({ team: fm.winner === 'team1' ? [...fm.team2] : [...fm.team1] }); // 2nd
            }
            if (finalMatches.length > 1 && finalMatches[1].winner) {
                const fm = finalMatches[1];
                standings.push({ team: fm.winner === 'team1' ? [...fm.team1] : [...fm.team2] }); // 3rd
            }

            top3 = standings.slice(0, 3).map(s => ({
                label: s.team.map(id => {
                    const p = getPlayerById(id);
                    return p ? `${p.name} ${p.surname}` : '?';
                }).join(' & ')
            }));
        } else {
            // Other tournament types: pair standings from all matches
            const pairStats = new Map<string, { wins: number; gamesWon: number; gamesLost: number; team: string[] }>();
            tournamentMatches.forEach(m => {
                if (!m.winner || m.winner === 'draw') return;
                const key1 = [...m.team1].sort().join('||');
                const key2 = [...m.team2].sort().join('||');
                if (!pairStats.has(key1)) pairStats.set(key1, { wins: 0, gamesWon: 0, gamesLost: 0, team: [...m.team1] });
                if (!pairStats.has(key2)) pairStats.set(key2, { wins: 0, gamesWon: 0, gamesLost: 0, team: [...m.team2] });

                const s1 = pairStats.get(key1)!;
                const s2 = pairStats.get(key2)!;
                m.sets.forEach(set => {
                    s1.gamesWon += set.team1;
                    s1.gamesLost += set.team2;
                    s2.gamesWon += set.team2;
                    s2.gamesLost += set.team1;
                });
                if (m.winner === 'team1') s1.wins++;
                else s2.wins++;
            });

            top3 = [...pairStats.values()]
                .sort((a, b) => b.wins - a.wins || (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost))
                .slice(0, 3)
                .map(s => ({
                    label: s.team.map(id => {
                        const p = getPlayerById(id);
                        return p ? `${p.name} ${p.surname}` : '?';
                    }).join(' & ')
                }));
        }

        return {
            name: getTournamentDisplayName(tournament, tournaments),
            type: tournament.type,
            date: new Date(tournament.date).toLocaleDateString('it-IT'),
            club: tournament.club,
            top3,
        };
    }, [tournaments, matches, getPlayerById]);

    const recentMatches = useMemo(() => {
        const sorted = [...matches]
            .filter(m => m.winner && m.winner !== 'draw')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

        return sorted.map(m => {
            const t1 = m.team1.map(id => {
                const p = getPlayerById(id);
                return p ? `${p.name} ${p.surname[0]}.` : '?';
            }).join(' & ');
            const t2 = m.team2.map(id => {
                const p = getPlayerById(id);
                return p ? `${p.name} ${p.surname[0]}.` : '?';
            }).join(' & ');
            const t1Score = m.sets.reduce((sum, s) => sum + s.team1, 0);
            const t2Score = m.sets.reduce((sum, s) => sum + s.team2, 0);
            const date = new Date(m.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
            return { date, t1, t2, t1Score, t2Score, winner: m.winner };
        });
    }, [matches, getPlayerById]);

    const medals = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
    const medalEmoji = ['🥇', '🥈', '🥉'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="stitch-kpi">
                    <div className="section-kicker">Giocatori</div>
                    <div className="mt-3 text-3xl font-black text-sky-500 dark:text-sky-300">{stats.activePlayers}</div>
                    <div className="mt-1 text-sm text-app-muted dark:text-slate-400">Roster attivo</div>
                </div>
                <div className="stitch-kpi">
                    <div className="section-kicker">Partite</div>
                    <div className="mt-3 text-3xl font-black text-sky-500 dark:text-sky-300">{stats.totalMatches}</div>
                    <div className="mt-1 text-sm text-app-muted dark:text-slate-400">Storico registrato</div>
                </div>
                <div className="stitch-kpi">
                    <div className="section-kicker">Giornate</div>
                    <div className="mt-3 text-3xl font-black text-sky-500 dark:text-sky-300">{stats.completedTournaments}</div>
                    <div className="mt-1 text-sm text-app-muted dark:text-slate-400">Completate</div>
                </div>
                <div className="stitch-kpi">
                    <div className="section-kicker">Avg ELO</div>
                    <div className="mt-3 text-3xl font-black text-sky-500 dark:text-sky-300">{stats.avgElo.toFixed(0)}</div>
                    <div className="mt-1 text-sm text-app-muted dark:text-slate-400">Equilibrio medio</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title={
                    <div className="flex items-center justify-between">
                        <span className="text-sky-500 dark:text-sky-300">Top 5 Giocatori</span>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => printPlayerProfiles(
                                players.map(p => p.id),
                                players,
                                matches,
                                eloHistory,
                                tournaments
                            )}
                            disabled={players.length === 0}
                        >
                            <span className="flex items-center gap-1"><PrintIcon /> Stampa</span>
                        </Button>
                    </div>
                }>
                    {top5.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nessun giocatore registrato.</p>
                    ) : (
                        <div className="space-y-3">
                            {top5.map((p, i) => (
                                <div key={p.id} className="flex items-center justify-between rounded-2xl border border-slate-200/55 bg-slate-50/70 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] dark:border-white/5 dark:bg-white/[0.03]">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-gray-400 dark:text-gray-500 w-6 text-right">{i + 1}.</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {p.name} {p.surname}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setProfilePlayer(p)}
                                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                                            aria-label="Profilo giocatore"
                                        >
                                            <InfoIcon />
                                        </button>
                                        <span className="font-bold text-sky-600 dark:text-sky-400">{p.currentElo.toFixed(0)}</span>
                                        {p.lastDelta > 0 && <ArrowUpIcon className="h-4 w-4 text-green-500" />}
                                        {p.lastDelta < 0 && <ArrowDownIcon className="h-4 w-4 text-red-500" />}
                                        {p.lastDelta === 0 && <ArrowStableIcon className="h-4 w-4 text-gray-400" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card
                    title={
                        <button
                            type="button"
                            className="flex w-full items-center justify-between gap-2 text-sky-500 dark:text-sky-300"
                            onClick={() => {
                                setLastDayOpen(prev => {
                                    const next = !prev;
                                    try {
                                        window.localStorage.setItem('dashboard_lastday_open', next ? '1' : '0');
                                    } catch {
                                        // ignore
                                    }
                                    return next;
                                });
                            }}
                            aria-expanded={lastDayOpen}
                            aria-label={lastDayOpen ? 'Collassa ultima giornata' : 'Espandi ultima giornata'}
                        >
                            <span>Ultima Giornata</span>
                            <span className={`shrink-0 transition-transform ${lastDayOpen ? 'rotate-180' : ''}`}>
                                <ChevronDownIcon className="h-5 w-5" />
                            </span>
                        </button>
                    }
                    bodyClassName={lastDayOpen ? '' : 'hidden'}
                >
                    {!lastGiornata ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nessuna giornata completata.</p>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white text-lg">{lastGiornata.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {lastGiornata.type} &middot; {lastGiornata.date} &middot; {lastGiornata.club}
                                </div>
                            </div>
                            {lastGiornata.top3.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    {lastGiornata.top3.map((entry, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="text-lg">{medalEmoji[i]}</span>
                                            <span className={`font-medium ${medals[i]}`}>{entry.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button
                                onClick={onNavigateToResults}
                                className="text-sm text-sky-600 dark:text-sky-400 hover:underline font-medium mt-2"
                            >
                                Vedi dettagli →
                            </button>
                        </div>
                    )}
                </Card>
            </div>

            {/* Attività Recenti */}
            <Card
                title={
                    <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 text-sky-600 dark:text-sky-400"
                        onClick={() => {
                            setRecentOpen(prev => {
                                const next = !prev;
                                try {
                                    window.localStorage.setItem('dashboard_recent_open', next ? '1' : '0');
                                } catch {
                                    // ignore
                                }
                                return next;
                            });
                        }}
                        aria-expanded={recentOpen}
                        aria-label={recentOpen ? 'Collassa attività recenti' : 'Espandi attività recenti'}
                    >
                        <span>Attività Recenti</span>
                        <span className={`shrink-0 transition-transform ${recentOpen ? 'rotate-180' : ''}`}>
                            <ChevronDownIcon className="h-5 w-5" />
                        </span>
                    </button>
                }
                bodyClassName={recentOpen ? '' : 'hidden'}
            >
                {recentMatches.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nessuna partita registrata.</p>
                ) : (
                    <div className="space-y-1">
                        {recentMatches.map((m, i) => (
                            <div key={i} className="py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono shrink-0 w-10">{m.date}</span>
                                    <span className={`text-sm truncate flex-1 ${m.winner === 'team1' ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{m.t1}</span>
                                    <span className={`shrink-0 w-7 text-center py-0.5 rounded text-xs font-bold text-white ${m.winner === 'team1' ? 'bg-green-600' : 'bg-gray-400 dark:bg-gray-600'}`}>{m.t1Score}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-10 shrink-0"></span>
                                    <span className={`text-sm truncate flex-1 ${m.winner === 'team2' ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{m.t2}</span>
                                    <span className={`shrink-0 w-7 text-center py-0.5 rounded text-xs font-bold text-white ${m.winner === 'team2' ? 'bg-green-600' : 'bg-gray-400 dark:bg-gray-600'}`}>{m.t2Score}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
            <PlayerProfileModal player={profilePlayer} onClose={() => setProfilePlayer(null)} />
        </div>
    );
};

export default DashboardPage;
