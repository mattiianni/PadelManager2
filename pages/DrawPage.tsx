
import React, { useState, useEffect } from 'react';
import { usePadelStore } from '../hooks/usePadelStore.tsx';
import { Player } from '../types.ts';
import { generatePairs, DrawMode } from '../services/drawService.ts';
import Card from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import TournamentFlow from '../components/TournamentFlow.tsx';
import ShuffleAnimation from '../components/ui/ShuffleAnimation.tsx';
import { ShuffleIcon, ChevronDownIcon } from '../components/ui/Icons.tsx';

interface DrawPageProps {
    setActivePage: (page: 'Ranking' | 'Players' | 'Matches' | 'Draw' | 'Tournaments') => void;
}

const ParticipantListSkeleton = () => (
    <div className="space-y-2 animate-pulse pr-2 max-h-96 overflow-y-auto">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-2">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
        ))}
    </div>
);

const DrawPage: React.FC<DrawPageProps> = ({ setActivePage }) => {
    const { players, loading } = usePadelStore();
    const [participants, setParticipants] = useState<string[]>([]);
    const [seeds, setSeeds] = useState<string[]>([]);
    const [mode, setMode] = useState<DrawMode>('Normal');
    const [numPairs, setNumPairs] = useState(2);
    const [drawnPairs, setDrawnPairs] = useState<[Player, Player][] | null>(null);
    const [manualPairs, setManualPairs] = useState<[string, string][]>([]);
    const [isShuffling, setIsShuffling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTournamentFlow, setShowTournamentFlow] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const sortedPlayers = [...players].sort((a,b) => a.name.localeCompare(b.name));
    const participantPlayers = players.filter(p => participants.includes(p.id));

    const requiredParticipants = numPairs * 2;
    const canSelectMore = participants.length < requiredParticipants;

    const filteredSortedPlayers = sortedPlayers.filter(p => 
        `${p.name} ${p.surname}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Auto-select seeds for Seeded mode
    useEffect(() => {
        if (mode === 'Seeded' && participants.length > 0) {
            const topSeeds = players
                .filter(p => participants.includes(p.id))
                .sort((a, b) => b.currentElo - a.currentElo)
                .slice(0, numPairs)
                .map(p => p.id);
            setSeeds(topSeeds);
        } else {
            setSeeds([]);
        }
    }, [participants, mode, numPairs, players]);

    // Reset everything when mode changes
    useEffect(() => {
        setParticipants([]);
        setSeeds([]);
        setDrawnPairs(null);
        setError(null);
        if (mode === 'Manual') {
            setManualPairs(Array.from({ length: numPairs }, () => ['', '']));
        } else {
            setManualPairs([]);
        }
    }, [mode]); // Only trigger on mode change, NOT numPairs!
    
    // Handle numPairs changes separately to preserve manual pairs
    useEffect(() => {
        // Always reset drawn pairs when numPairs changes
        setDrawnPairs(null);
        
        if (mode === 'Manual') {
            setManualPairs(currentPairs => {
                const newSize = numPairs;
                const oldSize = currentPairs.length;
                if (newSize > oldSize) {
                    return [
                        ...currentPairs,
                        ...Array.from({ length: newSize - oldSize }, () => ['', ''] as [string, string])
                    ];
                }
                return currentPairs.slice(0, newSize);
            });
        }
    }, [numPairs, mode]);

    const handleParticipantToggle = (playerId: string) => {
        setParticipants(prev => {
            if (prev.includes(playerId)) {
                return prev.filter(id => id !== playerId);
            }
            if (prev.length < requiredParticipants) {
                return [...prev, playerId];
            }
            return prev;
        });
    };

    const handleSeedToggle = (playerId: string) => {
        setSeeds(prev =>
            prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
        );
    };
    
    const handleManualPairChange = (pairIndex: number, playerIndex: 0 | 1, playerId: string) => {
        setManualPairs(currentPairs => {
            const newPairs = [...currentPairs];
            const newPair = [...newPairs[pairIndex]] as [string, string];
            newPair[playerIndex] = playerId;
            newPairs[pairIndex] = newPair;
            return newPairs;
        });
    };

    const handleDraw = () => {
        console.log('handleDraw called', { mode, participants: participants.length, requiredParticipants, manualPairs });
        setError(null);
        setDrawnPairs(null);
        setShowTournamentFlow(false);
        
        if (mode !== 'Manual' && participants.length < requiredParticipants) {
            setError(`Not enough participants selected. Required: ${requiredParticipants}, Selected: ${participants.length}.`);
            return;
        }

        if (mode === 'Manual') {
            const selectedManualPlayers = manualPairs.flat().filter(Boolean);
            if (selectedManualPlayers.length < requiredParticipants) {
                setError('Please fill all player slots.');
                return;
            }
            if (new Set(selectedManualPlayers).size !== selectedManualPlayers.length) {
                setError('Each player can only be selected once across all manual pairs.');
                return;
            }
            
            // No shuffling animation for manual mode - just confirm the pairs
            try {
                const pairs: [Player, Player][] = manualPairs.map(pairIds => {
                    console.log('Processing pair:', pairIds, 'Available players:', players.length);
                    const p1 = players.find(p => p.id === pairIds[0]);
                    const p2 = players.find(p => p.id === pairIds[1]);
                    console.log('Found players:', { p1: p1?.name, p2: p2?.name });
                    if (!p1 || !p2) {
                        throw new Error(`Player not found in pair: ${pairIds[0]} or ${pairIds[1]}`);
                    }
                    return [p1, p2];
                });
                setDrawnPairs(pairs);
            } catch (e: any) {
                setError(e.message);
            }
        } else {
            setIsShuffling(true);
            setTimeout(() => {
                try {
                    const pairs = generatePairs(participantPlayers, mode, numPairs, seeds);
                    setDrawnPairs(pairs);
                } catch (e: any) {
                    setError(e.message);
                } finally {
                    setIsShuffling(false);
                }
            }, 3000);
        }
    };
    
    if (showTournamentFlow && drawnPairs) {
        return <TournamentFlow pairs={drawnPairs} onFinish={() => {
            setShowTournamentFlow(false);
            setDrawnPairs(null);
            setActivePage('Ranking');
        }} />;
    }

    const isFull = participants.length === requiredParticipants;

    const participantsTitle = (
        <div className="flex justify-between items-center w-full">
            <span>Seleziona Partecipanti</span>
            <span className={`font-mono text-base font-bold px-3 py-1 rounded-full transition-colors ${
                isFull 
                ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' 
                : 'bg-green-100 dark:bg-green-800/50 text-green-600 dark:text-green-400'
            }`}>
                {String(participants.length).padStart(2, '0')}/{String(requiredParticipants).padStart(2, '0')}
            </span>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isShuffling && <ShuffleAnimation />}
            <div className="md:col-span-1 space-y-6">
                <Card title="Opzioni Sorteggio Coppie">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Numero Coppie da Sorteggiare</label>
                             <div className="mt-1 flex items-center flex-wrap gap-2">
                                {Array.from({ length: 11 }, (_, i) => i + 2).map(num => (
                                    <Button
                                        key={num}
                                        type="button"
                                        variant={numPairs === num ? 'primary' : 'secondary'}
                                        size="sm"
                                        onClick={() => setNumPairs(num)}
                                        className="!px-4"
                                    >
                                        {num}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Modalità di Sorteggio</label>
                            <select value={mode} onChange={e => setMode(e.target.value as DrawMode)} className="mt-1 block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
                                <option value="Normal">Casuale</option>
                                <option value="Balanced">Bilanciato</option>
                                <option value="Seeded">Teste di Serie</option>
                                <option value="Manual">Manuale</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {mode !== 'Manual' && (
                    <Card title={participantsTitle}>
                        <div className="space-y-2">
                             <input
                                type="text"
                                placeholder="Search players..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                            />
                             {loading ? (
                                <ParticipantListSkeleton />
                             ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                    {filteredSortedPlayers.map(p => (
                                        <label key={p.id} className={`flex items-center space-x-3 p-2 rounded-md ${!participants.includes(p.id) && !canSelectMore ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                            <input type="checkbox" checked={participants.includes(p.id)} onChange={() => handleParticipantToggle(p.id)} disabled={!participants.includes(p.id) && !canSelectMore} className="form-checkbox h-4 w-4 rounded text-sky-500 bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-sky-500" />
                                            <span>{p.name} {p.surname} ({p.currentElo.toFixed(2)})</span>
                                        </label>
                                    ))}
                                </div>
                             )}
                        </div>
                    </Card>
                )}


                {mode === 'Seeded' && (
                    <Card title="Seleziona Teste di Serie">
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {participantPlayers.sort((a,b) => b.currentElo - a.currentElo).map(p => (
                                <label key={p.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <input type="checkbox" checked={seeds.includes(p.id)} onChange={() => handleSeedToggle(p.id)} className="form-checkbox h-4 w-4 rounded text-sky-500 bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-sky-500" />
                                    <span>{p.name} {p.surname} ({p.currentElo.toFixed(2)})</span>
                                </label>
                            ))}
                        </div>
                    </Card>
                )}
                
                <div className="mt-4">
                    <Button onClick={handleDraw} className="w-full" disabled={isShuffling}>
                        <ShuffleIcon /> <span className="ml-2">{isShuffling ? 'Sorteggiando...' : (mode === 'Manual' ? 'Conferma Coppie' : 'Sorteggia Coppie')}</span>
                    </Button>
                    {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>}
                </div>
            </div>

            <div className="md:col-span-2">
                {mode === 'Manual' && !drawnPairs ? (
                     <Card title="Manual Pair Selection">
                        <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto">
                            {manualPairs.map((pair, pairIndex) => {
                                const selectedInManual = manualPairs.flat();
                                return (
                                    <div key={pairIndex} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <p className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Pair {pairIndex + 1}</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            <select
                                                value={pair[0]}
                                                onChange={(e) => handleManualPairChange(pairIndex, 0, e.target.value)}
                                                className="block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                            >
                                                <option value="">Select Player 1</option>
                                                {sortedPlayers.map(p => (
                                                    <option 
                                                        key={p.id} 
                                                        value={p.id} 
                                                        disabled={selectedInManual.includes(p.id) && p.id !== pair[0]}
                                                    >
                                                        {p.name} {p.surname}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                value={pair[1]}
                                                onChange={(e) => handleManualPairChange(pairIndex, 1, e.target.value)}
                                                className="block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                            >
                                                <option value="">Select Player 2</option>
                                                {sortedPlayers.map(p => (
                                                    <option 
                                                        key={p.id} 
                                                        value={p.id} 
                                                        disabled={selectedInManual.includes(p.id) && p.id !== pair[1]}
                                                    >
                                                        {p.name} {p.surname}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                ) : (
                    <Card title={mode === 'Manual' ? "Coppie Confermate" : "Risultati Sorteggio"}>
                        {!isShuffling && drawnPairs && (
                            <div className="space-y-4">
                                {drawnPairs.map((pair, index) => (
                                    <div key={index} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-lg">{pair[0].name} {pair[0].surname} & {pair[1].name} {pair[1].surname}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sky-600 dark:text-sky-400">{((pair[0].currentElo + pair[1].currentElo) / 2).toFixed(2)}</p>
                                            <p className="text-xs text-gray-500">Avg ELO</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex gap-3 mt-6">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setDrawnPairs(null)}
                                        className="flex-1"
                                    >
                                        {mode === 'Manual' ? 'Modifica Coppie' : 'Ripeti Sorteggio'}
                                    </Button>
                                    <Button 
                                        onClick={() => setShowTournamentFlow(true)}
                                        className="flex-1"
                                    >
                                        Avanti - Scelta Torneo
                                    </Button>
                                </div>
                            </div>
                        )}
                        {!isShuffling && !drawnPairs && (
                            <div className="flex justify-center items-center h-64 text-gray-500">
                                <p>Configura i tuoi parametri e clicca "Sorteggia Coppie" per vedere i risultati.</p>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
};

export default DrawPage;
