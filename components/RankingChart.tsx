import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { usePadelStore } from '../hooks/usePadelStore.tsx';
import Card from './ui/Card.tsx';
import Button from './ui/Button.tsx';
import { printChart } from '../services/printService.ts';
import { PrintIcon } from './ui/Icons.tsx';

const CustomTooltip: React.FC<any> = ({ active, payload, label, theme }) => {
    if (active && payload && payload.length) {
        return (
            <div className={`p-3 rounded-md shadow-lg ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border border-gray-200 text-gray-700'}`}>
                <p className="label">{`Event #${label + 1}`}</p>
                {payload.map((pld: any, index: number) => (
                    <div key={index} style={{ color: pld.color }}>
                        {`${pld.name}: ${pld.value.toFixed(2)}`}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const COLORS = ['#38bdf8', '#818cf8', '#f87171', '#fbbf24', '#4ade80', '#a78bfa', '#f472b6', '#2dd4bf'];

interface RankingChartProps {
    theme: 'light' | 'dark';
    selectedSeriesKey?: string | null; // giornataName || name
}

const CHART_CONTAINER_ID = 'elo-chart-container';

const RankingChart: React.FC<RankingChartProps> = ({ theme, selectedSeriesKey }) => {
    const { players, eloHistory, tournaments } = usePadelStore();
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
    const [isPrinting, setIsPrinting] = useState(false);

    const playersWithHistory = useMemo(() => 
        players.filter(p => eloHistory.some(h => h.playerId === p.id)), 
        [players, eloHistory]
    );

    const handlePrintChart = async () => {
        const originalSelected = [...selectedPlayerIds];
        // Temporarily select all players with history for printing
        setSelectedPlayerIds(playersWithHistory.map(p => p.id));
        setIsPrinting(true); // Enable printing mode
        
        // Wait for complete re-render using requestAnimationFrame
        await new Promise(resolve => requestAnimationFrame(() => {
            setTimeout(resolve, 200); // small margin after the frame
        }));
        
        printChart(CHART_CONTAINER_ID);
        // Restore original selection and printing mode
        setSelectedPlayerIds(originalSelected);
        setIsPrinting(false);
    };

    const handlePlayerSelection = (playerId: string) => {
        setSelectedPlayerIds(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    };

    const chartData = useMemo(() => {
        if (selectedPlayerIds.length === 0) return [];
        
        // Filter ELO history by selected series key if provided
        const allowedEventIds = selectedSeriesKey
            ? new Set(
                tournaments
                    .filter(t => (t.giornataName || t.name) === selectedSeriesKey)
                    .map(t => t.id)
              )
            : null;

        const playerEvents = eloHistory.filter(e => 
            selectedPlayerIds.includes(e.playerId) && (!allowedEventIds || allowedEventIds.has(e.eventId))
        );
        const uniqueEventIds = [...new Set(playerEvents.map(e => e.eventId))];
        const eventDates = new Map<string, string>();
        eloHistory.forEach(e => { if(!eventDates.has(e.eventId)) eventDates.set(e.eventId, e.date) });
        
        const sortedEventIds = uniqueEventIds.sort((a, b) => new Date(eventDates.get(a)!).getTime() - new Date(eventDates.get(b)!).getTime());
        
        const data: any[] = [];
        
        const initialPoint: any = { eventIndex: -1 };
        selectedPlayerIds.forEach(id => {
            const player = players.find(p => p.id === id);
            if (player) initialPoint[id] = player.initialElo;
        });
        data.push(initialPoint);

        sortedEventIds.forEach((eventId, index) => {
            const point: any = { eventIndex: index };
            const prevPoint = data[data.length - 1];
            
            selectedPlayerIds.forEach(id => {
                const historyEntry = playerEvents.find(e => e.eventId === eventId && e.playerId === id);
                point[id] = historyEntry ? historyEntry.eloAfter : prevPoint[id];
            });
            data.push(point);
        });
    
        return data;
    }, [selectedPlayerIds, players, eloHistory]);
    
    const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));
    
    const gridStrokeColor = theme === 'dark' ? '#4b5563' : '#e5e7eb';
    const axisStrokeColor = theme === 'dark' ? '#9ca3af' : '#6b7280';

    return (
        <Card title={
            <div className="flex justify-between items-center">
                <span>ELO History</span>
                <Button onClick={handlePrintChart} size="sm" variant="secondary" disabled={playersWithHistory.length === 0}>
                    <PrintIcon /> Stampa Grafico ELO
                </Button>
            </div>
        } className="mt-8">
            <div id={CHART_CONTAINER_ID}>
                <div className="mb-4 player-select-wrapper no-print">
                    <h4 className="font-semibold mb-2">Seleziona Grafico Giocatore:</h4>
                    <div className="flex flex-wrap gap-2">
                        {sortedPlayers.map(player => (
                            <label key={player.id} className="flex items-center space-x-2 cursor-pointer bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
                                <input
                                    type="checkbox"
                                    checked={selectedPlayerIds.includes(player.id)}
                                    onChange={() => handlePlayerSelection(player.id)}
                                    className="form-checkbox h-4 w-4 rounded text-sky-500 bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-sky-500"
                                />
                                <span>{player.name} {player.surname}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {selectedPlayerIds.length > 0 && chartData.length > 1 ? (
                    <>
                        <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer>
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                                    <XAxis 
                                        dataKey="eventIndex" 
                                        tickFormatter={(tick) => 
                                            isPrinting 
                                            ? (tick >= 0 ? `Day ${tick + 1}` : 'Start')
                                            : (tick >= 0 ? `E${tick + 1}`: 'Start')
                                        } 
                                        stroke={axisStrokeColor}
                                        domain={isPrinting ? [0, chartData.length - 1] : undefined}
                                        allowDecimals={false}
                                    />
                                    <YAxis 
                                        type="number" 
                                        domain={['dataMin - 20', 'dataMax + 20']} 
                                        stroke={axisStrokeColor}
                                        tickFormatter={(tick) => String(Math.round(tick))}
                                    />
                                    <Tooltip content={<CustomTooltip theme={theme} />} />
                                    {!isPrinting && (
                                        <Legend 
                                            verticalAlign="bottom" 
                                            wrapperStyle={{ paddingTop: '20px' }}
                                        />
                                    )}
                                    {isPrinting && chartData.slice(1).map((entry) => (
                                        <ReferenceLine 
                                            key={`ref-${entry.eventIndex}`} 
                                            x={entry.eventIndex}
                                            stroke={gridStrokeColor} 
                                            strokeDasharray="3 3" 
                                        />
                                    ))}
                                    {selectedPlayerIds.map((id, index) => {
                                        const player = players.find(p => p.id === id);
                                        if (!player) return null;
                                        return (
                                            <Line
                                                key={id}
                                                type="monotone"
                                                dataKey={id}
                                                name={`${player.name} ${player.surname}`}
                                                stroke={COLORS[index % COLORS.length]}
                                                strokeWidth={2}
                                                dot={{ r: 2 }}
                                                activeDot={{ r: 6 }}
                                                isAnimationActive={!isPrinting}
                                            />
                                        );
                                    })}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        
                        {/* Legenda personalizzata per stampa */}
                        {isPrinting && (
                            <div className="mt-4 print-only">
                                <table className="w-full border-collapse">
                                    <tbody>
                                        {Array.from({ length: Math.ceil(selectedPlayerIds.length / 5) }, (_, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {Array.from({ length: 5 }, (_, colIndex) => {
                                                    const playerIndex = rowIndex * 5 + colIndex;
                                                    const playerId = selectedPlayerIds[playerIndex];
                                                    const player = playerId ? players.find(p => p.id === playerId) : null;
                                                    
                                                    if (!player) {
                                                        return <td key={colIndex} className="px-2 py-1"></td>;
                                                    }
                                                    
                                                    return (
                                                        <td key={colIndex} className="px-2 py-1">
                                                            <div className="flex items-center gap-2">
                                                                <div 
                                                                    className="w-4 h-4 rounded-full" 
                                                                    style={{ backgroundColor: COLORS[playerIndex % COLORS.length] }}
                                                                ></div>
                                                                <span 
                                                                    className="text-base font-bold"
                                                                    style={{ color: COLORS[playerIndex % COLORS.length] }}
                                                                >
                                                                    {player.name} {player.surname}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="h-96 flex items-center justify-center text-gray-500">
                        {selectedPlayerIds.length === 0 
                            ? "Seleziona uno o più giocatori per visualizzare la progressione ELO."
                            : "No ELO history available for the selected players."
                        }
                    </div>
                )}
            </div>
        </Card>
    );
};

export default RankingChart;