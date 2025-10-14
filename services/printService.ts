import { RankingEntry, Tournament, TournamentStandingEntry, Match, Player, TournamentType, EloHistoryEntry } from '../types.ts';

const getTournamentTypeDisplayName = (type: TournamentType): string => {
    switch (type) {
        case TournamentType.TorneOtto:
            return "TorneOtto 30'";
        case TournamentType.Americano:
            return "Americano";
        case TournamentType.RoundRobinFinali:
            return "Round Robin + Finali";
        case TournamentType.TorneoLibero:
            return "Torneo Libero";
        case TournamentType.GironiFaseFinale:
            return "Gironi + Fase Finale";
        case TournamentType.BeatTheBox:
            return "Beat the Box";
        default:
            return type;
    }
};

const getPrintStyles = (fontImport: boolean = true) => `
    ${fontImport ? '<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&display=swap" rel="stylesheet">' : ''}
    <style>
        @media screen {
            body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                line-height: 1.4; 
                color: #111; 
                font-size: 10px;
            }
        }
        @media print {
            body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
                font-family: 'Manrope', sans-serif;
            }
            .no-print { display: none !important; }
        }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; font-size: 9px; }
        th, td { border: 1px solid #ddd; padding: 5px; text-align: left; vertical-align: top; }
        th { background-color: #f2f2f2; }
        h1, h2, h3 { color: #333; margin: 0; padding: 0; font-family: 'Manrope', sans-serif; }
        h1 { font-size: 18px; margin-bottom: 8px; }
        h2 { font-size: 16px; margin-bottom: 8px; }
        h3 { font-size: 14px; margin-top: 12px; margin-bottom: 4px; border-bottom: 1px solid #eee; padding-bottom: 2px; }
        .delta-positive { color: green !important; }
        .delta-negative { color: red !important; }
        .player-name-cell { vertical-align: middle; }
        .score-box {
            display: inline-block;
            width: 30px;
            height: 20px;
            border: 1px solid #333;
            margin: 0 5px;
        }
    </style>
`;

const openPrintWindow = (title: string, content: string, pageStyles = "") => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>@page { size: A4; margin: 12mm 10mm; } ${pageStyles}</style>
                ${getPrintStyles()}
            </head>
            <body>
                ${content}
                <script>
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 250);
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
};

export const printChart = (chartContainerId: string) => {
    const chartContainer = document.getElementById(chartContainerId);
    if (!chartContainer) {
        console.error('Chart container not found');
        return;
    }
    const chartHtml = chartContainer.innerHTML;
    console.log('🎯 Printing ELO History Chart with HTML length:', chartHtml.length);
    
    const pageStyles = `
        @page { 
            size: A4 landscape; 
            margin: 7.5mm; 
        }
        @media print {
            @page { 
                size: A4 landscape; 
                margin: 7.5mm; 
            }
            body { 
                font-size: 8px; 
                width: 100%;
                height: 100%;
            }
            h1 { 
                font-size: 16px; 
                margin-bottom: 10px; 
            }
            #elo-chart-container {
                width: 100% !important;
                height: 80vh !important;
            }
            #elo-chart-container svg {
                width: 100% !important;
                height: 100% !important;
                overflow: visible !important;
            }
            /* Nasconde la legenda di Recharts nel PDF */
            #elo-chart-container .recharts-legend-wrapper {
                display: none !important;
            }
            /* Stile per la legenda personalizzata */
            .print-only table {
                border: none !important;
                margin: 10px 0 !important;
                width: 100% !important;
            }
            .print-only td {
                border: none !important;
                padding: 6px 8px !important;
                vertical-align: middle !important;
            }
            .print-only span {
                font-size: 12px !important;
                font-weight: bold !important;
            }
        }
        body { 
            font-size: 8px; 
        }
        h1 { 
            font-size: 16px; 
            margin-bottom: 10px; 
        }
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Grafico Andamento Storico ELO</title>
                ${getPrintStyles(true)}
                <style>${pageStyles}</style>
            </head>
            <body>
                <h1>Grafico Andamento Storico ELO</h1>
                <div id="${chartContainerId}">
                    ${chartHtml}
                </div>
                <script>
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 500);
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
};


const getDeltaArrow = (delta: number | null) => {
    if (delta === null || delta === 0) return '<span>-</span>';
    if (delta > 0) return `<span class="delta-positive">▲</span>`;
    return `<span class="delta-negative">▼</span>`;
};

export const printRanking = (
    rankingData: RankingEntry[],
    eloHistory: EloHistoryEntry[],
    matches: Match[],
    tournaments: Tournament[],
    selectedTournamentId?: string | null,
    presenceThreshold?: number,
    tournamentGiornate?: string[]
) => {
    // Filter ELO history based on selected tournament SERIES (seriesKey = giornataName || name)
    const filteredEloHistory = selectedTournamentId
        ? (() => {
            const tournamentIds = tournaments.filter(t => (t.giornataName || t.name) === selectedTournamentId).map(t => t.id);
            return eloHistory.filter(entry => tournamentIds.includes(entry.eventId));
        })()
        : eloHistory;

    // Include ALL players of the selected ranking (even if ELO delta is 0)
    // Players without history will still be shown with '-' details
    const playersForReport = rankingData;

    const tableRows = playersForReport.map(player => {
        const playerHistory = filteredEloHistory
            .filter(entry => entry.playerId === player.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const historyList = playerHistory.length > 0 ? `
            <div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid #f0f0f0;">
                ${playerHistory.map(entry => {
                    let description = '';
                    if (entry.type === 'manual') {
                        description = 'Manual Update';
                    } else if (entry.type === 'tournament') {
                        const tournament = tournaments.find(t => t.id === entry.eventId);
                        if (tournament) {
                            // Se è filtrato per torneo, mostra solo il tipo (senza nome torneo)
                            if (selectedTournamentId) {
                                description = tournament.type;
                            } else {
                                // Classifica generale: tipo + nome torneo tra parentesi
                                description = `${tournament.type} (${tournament.name})`;
                            }
                        } else {
                            description = 'Tournament Day';
                        }
                    } else {
                        description = 'Friendly Match';
                    }
                    const deltaSign = entry.delta >= 0 ? '+' : '';
                    return `<div style="font-size: 8px; padding: 2px 0; display: flex; justify-content: space-between;">
                                <span>
                                    <span style="color: #777;">${description} il ${new Date(entry.date).toLocaleDateString()}:</span>
                                </span>
                                <strong style="white-space: nowrap; padding-left: 10px;" class="${entry.delta >= 0 ? 'delta-positive' : 'delta-negative'}">
                                    ${deltaSign}${entry.delta.toFixed(2)}
                                </strong>
                            </div>`;
                }).join('')}
            </div>
        ` : '';
        
        return `
            <tr style="background-color: #fff;">
                <td style="text-align: center;">${player.rank}</td>
                <td>
                    <div style="font-weight: bold; font-size: 11px;">${player.name} ${player.surname}</div>
                    ${historyList}
                </td>
                <td style="vertical-align: top; font-weight: bold; font-size: 11px;">${player.currentElo.toFixed(2)}</td>
                <td style="vertical-align: top; text-align: center;">${getDeltaArrow(player.lastDelta)}</td>
                <td style="vertical-align: top; text-align: center;">${player.matchesPlayed}</td>
                <td style="vertical-align: top; text-align: center;">${player.matchesWon}</td>
                <td style="vertical-align: top; text-align: center;">${player.gamesWon} - ${player.gamesLost}</td>
                <td style="vertical-align: top; text-align: center;">${player.winPercentage.toFixed(1)}%</td>
            </tr>
        `;
    }).join('');

    // Get tournament info if filtered (by SERIES KEY)
    const selectedTournament = selectedTournamentId 
        ? tournaments.find(t => (t.giornataName || t.name) === selectedTournamentId)
        : null;

    // Generate table rows with separator
    let tableRowsWithSeparator = '';
    playersForReport.forEach((player, idx) => {
        const prevPlayer = idx > 0 ? playersForReport[idx - 1] : null;
        const showSeparator = selectedTournamentId && presenceThreshold && presenceThreshold > 0 &&
            prevPlayer &&
            prevPlayer.presencePercentage && player.presencePercentage &&
            prevPlayer.presencePercentage >= presenceThreshold &&
            player.presencePercentage < presenceThreshold;

        if (showSeparator && tournamentGiornate) {
            const minGiornate = Math.ceil(presenceThreshold * tournamentGiornate.length / 100);
            tableRowsWithSeparator += `
                <tr style="background-color: #dbeafe; border-top: 3px solid #2563eb; border-bottom: 3px solid #2563eb;">
                    <td colspan="8" style="text-align: center; padding: 8px; font-weight: bold; color: #1e40af; font-size: 10px;">
                        ⬇️ SOGLIA ${presenceThreshold}% (${minGiornate} giornate su ${tournamentGiornate.length}) ⬇️
                    </td>
                </tr>
            `;
        }
        tableRowsWithSeparator += tableRows.split('</tr>')[idx] + '</tr>';
    });

    const content = `
        <style>
            body { 
                font-family: 'Manrope', 'Aptos Narrow', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                font-size: 11px; 
                line-height: 1.4;
                margin: 0;
                padding: 20px;
                background: white;
            }
            h1 { 
                font-size: 24px; 
                margin: 0; 
                color: #16a34a; /* Verde più chiaro */
                font-weight: bold;
            }
            .separator {
                border-bottom: 3px solid #2563eb; /* Blu più chiaro */
                margin: 16px 0;
            }
            .date-info {
                color: #666;
                font-size: 9px;
            }
            .filter-info {
                background-color: #f0f9ff;
                border-left: 4px solid #2563eb;
                padding: 8px 12px;
                margin: 12px 0;
                font-size: 10px;
                color: #1e40af;
            }
            .filter-info strong {
                color: #1e3a8a;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 8px 0 16px 0;
                font-size: 11px;
            }
            th { 
                background-color: #2563eb; /* Blu più chiaro */
                color: white; 
                padding: 8px 4px; 
                text-align: left; 
                font-weight: bold;
                font-size: 10px;
            }
            td { 
                padding: 8px 4px; 
                border-bottom: 1px solid #e5e7eb; 
                vertical-align: top;
                font-size: 11px;
                line-height: 1.3;
                min-height: 20px;
            }
            .court-cell {
                font-size: 9px;
                white-space: nowrap;
            }
            tr:nth-child(even) {
                background-color: #f8fafc;
            }
            .delta-positive {
                color: #16a34a; /* Verde più chiaro */
            }
            .delta-negative {
                color: #dc2626; /* Rosso per perdite */
            }
            .footer {
                margin-top: 24px;
                padding-top: 16px;
                border-top: 1px solid #e5e7eb;
                font-size: 9px;
                color: #666;
            }
        </style>

        <div style="text-align: center; margin-bottom: 20px;">
            <h1>Classifica Giocatori</h1>
            <div class="date-info">Aggiornata al: ${new Date().toLocaleDateString('it-IT')}</div>
        </div>

        ${selectedTournament ? `
            <div class="filter-info" style="text-align: center;">
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">${selectedTournament.name}</div>
                <div style="font-size: 12px;">${selectedTournament.club}</div>
                ${tournamentGiornate && tournamentGiornate.length > 1 ? `<div style="font-size: 10px; margin-top: 4px;">Giornate: ${tournamentGiornate.length}</div>` : ''}
            </div>
        ` : `
            <div class="filter-info" style="text-align: center;">
                <div style="font-size: 14px; font-weight: bold;">Classifica Generale</div>
                <div style="font-size: 11px;">Tutti i tornei completati</div>
            </div>
        `}

        ${presenceThreshold && presenceThreshold > 0 && tournamentGiornate ? `
            <div class="filter-info" style="text-align: center; background-color: #fef3c7; border-left-color: #f59e0b; color: #92400e;">
                <strong>Filtro Presenza:</strong> ≥${presenceThreshold}% (almeno ${Math.ceil(presenceThreshold * tournamentGiornate.length / 100)} giornate su ${tournamentGiornate.length})
                <br/>
                <em style="font-size: 9px;">I giocatori sotto questa soglia sono elencati dopo quelli che la superano</em>
            </div>
        ` : ''}

        <div class="separator"></div>

        <table>
            <thead>
                <tr>
                    <th style="text-align: center;">Rank</th>
                    <th>Player & ELO History</th>
                    <th>ELO</th>
                    <th style="text-align: center;">Last Δ</th>
                    <th style="text-align: center;">Played</th>
                    <th style="text-align: center;">Won</th>
                    <th style="text-align: center;">Games (W-L)</th>
                    <th style="text-align: center;">Win %</th>
                </tr>
            </thead>
            <tbody>
                ${tableRowsWithSeparator || tableRows}
            </tbody>
        </table>

        <div class="footer">
            <div style="text-align: left; margin-bottom: 4px;">
                Padel ELO Manager - Versione 2.0.1 @ Mattia Ianniello, 2025
            </div>
            <div style="text-align: right; font-size: 8px;">
                ${new Date().toLocaleDateString('it-IT')}, ${new Date().toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})} - Pagina 1 di 1
            </div>
        </div>
    `;

    openPrintWindow("Player Ranking", content);
};

export const printTournamentReport = (
    tournament: Tournament, 
    standings: TournamentStandingEntry[], 
    matches: Match[], 
    getPlayerById: (id: string) => Player | undefined,
    americanoFields?: number,
    americanoScoringType?: 'games-diff' | 'points',
    roundRobinMatchCount?: number  // Numero di partite del round robin (se presente)
) => {
    const isAmericano = tournament.type === TournamentType.Americano;
    const isRoundRobinFinali = tournament.type === TournamentType.RoundRobinFinali;
    const isGironiFaseFinale = tournament.type === TournamentType.GironiFaseFinale;
    
    // Teams section (only for non-Americano tournaments)
    let teamsContent = '';
    if (!isAmericano) {
        const teams = standings.map(s => s.team);
        teamsContent = teams.map((pair, index) => `
            <div class="team-box">
                <div class="team-number">Squadra ${index + 1}</div>
                <div style="color: #000;">${pair[0].name} ${pair[0].surname}</div>
                <div style="color: #000; margin: 2px 0;">&</div>
                <div style="color: #000;">${pair[1].name} ${pair[1].surname}</div>
            </div>
        `).join('');
    }

    // Helper function to generate match row HTML
    const generateMatchRow = (match: Match, index: number, isFinal: boolean = false, finalsIndex: number = -1) => {
        const t1p1 = getPlayerById(match.team1[0]);
        const t1p2 = getPlayerById(match.team1[1]);
        const t2p1 = getPlayerById(match.team2[0]);
        const t2p2 = getPlayerById(match.team2[1]);
        if (!t1p1 || !t1p2 || !t2p1 || !t2p2) return '';

        const score = tournament.status === 'scheduled' ? '□-□' : match.sets.map(s => `${s.team1}-${s.team2}`).join(', ');
        
        if (isAmericano) {
            // Americano: show individual players, not teams
            const team1Name = `${t1p1.name} ${t1p1.surname} & ${t1p2.name} ${t1p2.surname}`;
            const team2Name = `${t2p1.name} ${t2p1.surname} & ${t2p2.name} ${t2p2.surname}`;
            const maxCourts = americanoFields || 2; // Use provided fields or default to 2
            const court = `Campo ${(index % maxCourts) + 1}`;
            
            return `
                <tr style="height: 20px;">
                    <td style="text-align: center; width: 10%; font-size: 10px; padding: 3px 4px; height: 20px; line-height: 1.2;">${court}</td>
                    <td style="width: 37%; text-align: right; ${match.winner === 'team1' ? 'font-weight: bold;' : ''} font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${team1Name}</td>
                    <td style="text-align: center; width: 16%; font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">
                        ${tournament.status === 'scheduled' ? 
                            '<span style="border: 1px solid #ccc; padding: 3px 8px; display: inline-block; font-size: 11px;">&nbsp;</span> - <span style="border: 1px solid #ccc; padding: 3px 8px; display: inline-block; font-size: 11px;">&nbsp;</span>' : 
                            `<span style="background-color: #16a34a; color: white; padding: 3px 8px; border-radius: 2px; font-weight: bold; font-size: 11px; display: inline-block;">${score}</span>`
                        }
                    </td>
                    <td style="width: 37%; text-align: left; ${match.winner === 'team2' ? 'font-weight: bold;' : ''} font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${team2Name}</td>
                </tr>
            `;
        } else {
            // Regular tournaments: show teams
            const team1Name = `${t1p1.name} ${t1p1.surname} / ${t1p2.name} ${t1p2.surname}`;
            const team2Name = `${t2p1.name} ${t2p1.surname} / ${t2p2.name} ${t2p2.surname}`;
            
            let court = '-';
            if (isFinal && finalsIndex >= 0) {
                // Per le finali, mostra il tipo di finale
                court = finalsIndex === 0 ? 'Finale 1°-2°' : 'Finale 3°-4°';
            } else if (tournament.type === TournamentType.TorneOtto) {
                court = `Campo ${(index % 2) + 1}`;
            }

            return `
                <tr style="height: 20px;">
                    <td style="text-align: center; width: 10%; font-size: 10px; padding: 3px 4px; height: 20px; line-height: 1.2;">${court}</td>
                    <td style="width: 37%; text-align: right; ${match.winner === 'team1' ? 'font-weight: bold;' : ''} font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${team1Name}</td>
                    <td style="text-align: center; width: 16%; font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">
                        ${tournament.status === 'scheduled' ? 
                            '<span style="border: 1px solid #ccc; padding: 3px 8px; display: inline-block; font-size: 11px;">&nbsp;</span> - <span style="border: 1px solid #ccc; padding: 3px 8px; display: inline-block; font-size: 11px;">&nbsp;</span>' : 
                            `<span style="background-color: #16a34a; color: white; padding: 3px 8px; border-radius: 2px; font-weight: bold; font-size: 11px; display: inline-block;">${score}</span>`
                        }
                    </td>
                    <td style="width: 37%; text-align: left; ${match.winner === 'team2' ? 'font-weight: bold;' : ''} font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${team2Name}</td>
                </tr>
            `;
        }
    };
    
    // Split matches into Round Robin and Finals if applicable
    const roundRobinMatches = isRoundRobinFinali && roundRobinMatchCount 
        ? matches.slice(0, roundRobinMatchCount) 
        : matches;
    const finalsMatches = isRoundRobinFinali && roundRobinMatchCount 
        ? matches.slice(roundRobinMatchCount) 
        : [];
    
    const roundRobinContent = roundRobinMatches.map((match, index) => generateMatchRow(match, index, false, -1)).join('');
    const finalsContent = finalsMatches.map((match, index) => generateMatchRow(match, index, true, index)).join('');
    
    // For Gironi + Fase Finale tournaments, split matches into gironi, semifinals, and finals
    let gironiContent = '';
    let gironiStandingsContent = '';
    let gironiSemifinalsContent = '';
    let gironiFinals34Content = '';
    let gironiFinalsContent = '';
    
    if (isGironiFaseFinale && matches.length >= 4) {
        // Last 4 matches are: semifinal A, semifinal B, finale 3-4, finalissima
        const gironiMatches = matches.slice(0, -4);
        const semifinalMatches = matches.slice(-4, -2);
        const finalMatches = matches.slice(-2);
        
        // Calculate number of gironi (each girone has 6 matches for 4 teams)
        const numGironi = Math.ceil(gironiMatches.length / 6);
        
        // Store girone standings
        const gironiStandings: Map<string, { pair: [Player, Player], punti: number, gamesWon: number, gamesLost: number }[]> = new Map();
        
        // Create content for each girone
        for (let i = 0; i < numGironi; i++) {
            const gironeName = String.fromCharCode(65 + i); // A, B, C, D
            const gironeMatches = gironiMatches.slice(i * 6, (i + 1) * 6);
            const gironeMatchesHtml = gironeMatches.map((match, idx) => {
                const t1p1 = getPlayerById(match.team1[0]);
                const t1p2 = getPlayerById(match.team1[1]);
                const t2p1 = getPlayerById(match.team2[0]);
                const t2p2 = getPlayerById(match.team2[1]);
                if (!t1p1 || !t1p2 || !t2p1 || !t2p2) return '';
                
                const team1Name = `${t1p1.name} ${t1p1.surname} / ${t1p2.name} ${t1p2.surname}`;
                const team2Name = `${t2p1.name} ${t2p1.surname} / ${t2p2.name} ${t2p2.surname}`;
                const score = tournament.status === 'scheduled' ? '□-□' : match.sets.map(s => `${s.team1}-${s.team2}`).join(', ');
                
                return `
                    <tr style="height: 16px;">
                        <td style="width: 42%; text-align: right; ${match.winner === 'team1' ? 'font-weight: bold;' : ''} font-size: 9px; padding: 2px 3px; height: 16px; line-height: 1.0;">${team1Name}</td>
                        <td style="text-align: center; width: 16%; font-size: 9px; padding: 2px 3px; height: 16px; line-height: 1.0;">
                            ${tournament.status === 'scheduled' ? 
                                '<span style="border: 1px solid #ccc; padding: 2px 8px; display: inline-block; font-size: 9px;">&nbsp;</span> - <span style="border: 1px solid #ccc; padding: 2px 8px; display: inline-block; font-size: 9px;">&nbsp;</span>' : 
                                `<span style="background-color: #16a34a; color: white; padding: 2px 8px; border-radius: 2px; font-weight: bold; font-size: 9px; display: inline-block;">${score}</span>`
                            }
                        </td>
                        <td style="width: 42%; text-align: left; ${match.winner === 'team2' ? 'font-weight: bold;' : ''} font-size: 9px; padding: 2px 3px; height: 16px; line-height: 1.0;">${team2Name}</td>
                    </tr>
                `;
            }).join('');
            
            gironiContent += `
                <h3 style="font-size: 11px; font-weight: bold; margin: 12px 0 2px 0; padding: 1px 2px; background: #f0f0f0;">PARTITE E RISULTATI GIRONE ${gironeName}</h3>
                <table style="margin-bottom: 2px;">
                    <tbody>
                        ${gironeMatchesHtml}
                    </tbody>
                </table>
            `;
            
            // Calculate standings for this girone
            const gironeTeams = new Map<string, { pair: [Player, Player], punti: number, gamesWon: number, gamesLost: number }>();
            
            // Get all unique teams from girone matches
            gironeMatches.forEach(match => {
                const team1Key = `${match.team1[0]}-${match.team1[1]}`;
                const team2Key = `${match.team2[0]}-${match.team2[1]}`;
                
                if (!gironeTeams.has(team1Key)) {
                    const p1 = getPlayerById(match.team1[0]);
                    const p2 = getPlayerById(match.team1[1]);
                    if (p1 && p2) {
                        gironeTeams.set(team1Key, { pair: [p1, p2], punti: 0, gamesWon: 0, gamesLost: 0 });
                    }
                }
                if (!gironeTeams.has(team2Key)) {
                    const p1 = getPlayerById(match.team2[0]);
                    const p2 = getPlayerById(match.team2[1]);
                    if (p1 && p2) {
                        gironeTeams.set(team2Key, { pair: [p1, p2], punti: 0, gamesWon: 0, gamesLost: 0 });
                    }
                }
                
                // Calculate stats
                const team1Games = match.sets.reduce((sum, set) => sum + set.team1, 0);
                const team2Games = match.sets.reduce((sum, set) => sum + set.team2, 0);
                
                const team1Stat = gironeTeams.get(team1Key);
                const team2Stat = gironeTeams.get(team2Key);
                
                if (team1Stat) {
                    team1Stat.gamesWon += team1Games;
                    team1Stat.gamesLost += team2Games;
                    if (team1Games > team2Games) team1Stat.punti += 3;
                }
                
                if (team2Stat) {
                    team2Stat.gamesWon += team2Games;
                    team2Stat.gamesLost += team1Games;
                    if (team2Games > team1Games) team2Stat.punti += 3;
                }
            });
            
            // Sort standings
            const sortedStandings = Array.from(gironeTeams.values()).sort((a, b) => {
                if (b.punti !== a.punti) return b.punti - a.punti;
                return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
            });
            
            gironiStandings.set(gironeName, sortedStandings);
        }
        
        // Create standings tables side by side
        const standingsTables = Array.from(gironiStandings.entries()).map(([gironeName, standings]) => {
            const standingsRows = standings.map((entry, idx) => `
                <tr style="height: 14px;">
                    <td style="text-align: center; width: 15%; font-size: 8px; padding: 1px 2px; height: 14px; line-height: 1.0;">${idx + 1}°</td>
                    <td style="width: 55%; font-size: 8px; padding: 1px 2px; height: 14px; line-height: 1.0;">${entry.pair[0].name} ${entry.pair[0].surname} / ${entry.pair[1].name} ${entry.pair[1].surname}</td>
                    <td style="text-align: center; width: 15%; font-size: 8px; padding: 1px 2px; height: 14px; line-height: 1.0;">${entry.punti}</td>
                    <td style="text-align: center; width: 15%; font-size: 8px; padding: 1px 2px; height: 14px; line-height: 1.0;">${entry.gamesWon - entry.gamesLost >= 0 ? '+' : ''}${entry.gamesWon - entry.gamesLost}</td>
                </tr>
            `).join('');
            
            return `
                <div style="flex: 1; min-width: 0;">
                    <h3 style="font-size: 10px; font-weight: bold; margin: 12px 0 2px 0; padding: 1px 2px; background: #e8f5e9; text-align: center;">CLASSIFICA GIRONE ${gironeName}</h3>
                    <table style="margin-bottom: 2px; font-size: 8px;">
                        <thead>
                            <tr>
                                <th style="text-align: center; font-size: 8px; padding: 1px 2px;">Pos</th>
                                <th style="font-size: 8px; padding: 1px 2px;">Coppia</th>
                                <th style="text-align: center; font-size: 8px; padding: 1px 2px;">Pt</th>
                                <th style="text-align: center; font-size: 8px; padding: 1px 2px;">Diff</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${standingsRows}
                        </tbody>
                    </table>
                </div>
            `;
        }).join('');
        
        gironiStandingsContent = `
            <div style="display: flex; gap: 4px; margin: 12px 0;">
                ${standingsTables}
            </div>
        `;
        
        // Semifinals content
        if (semifinalMatches.length > 0) {
            const generateSemifinalRow = (match: Match) => {
                const t1p1 = getPlayerById(match.team1[0]);
                const t1p2 = getPlayerById(match.team1[1]);
                const t2p1 = getPlayerById(match.team2[0]);
                const t2p2 = getPlayerById(match.team2[1]);
                if (!t1p1 || !t1p2 || !t2p1 || !t2p2) return '';
                
                const team1Name = `${t1p1.name} ${t1p1.surname} / ${t1p2.name} ${t1p2.surname}`;
                const team2Name = `${t2p1.name} ${t2p1.surname} / ${t2p2.name} ${t2p2.surname}`;
                const score = tournament.status === 'scheduled' ? '□-□' : match.sets.map(s => `${s.team1}-${s.team2}`).join(', ');
                
                return `
                    <tr style="height: 16px;">
                        <td style="width: 42%; text-align: right; ${match.winner === 'team1' ? 'font-weight: bold;' : ''} font-size: 9px; padding: 2px 3px; height: 16px; line-height: 1.0;">${team1Name}</td>
                        <td style="text-align: center; width: 16%; font-size: 9px; padding: 2px 3px; height: 16px; line-height: 1.0;">
                            ${tournament.status === 'scheduled' ? 
                                '<span style="border: 1px solid #ccc; padding: 2px 8px; display: inline-block; font-size: 9px;">&nbsp;</span> - <span style="border: 1px solid #ccc; padding: 2px 8px; display: inline-block; font-size: 9px;">&nbsp;</span>' : 
                                `<span style="background-color: #16a34a; color: white; padding: 2px 8px; border-radius: 2px; font-weight: bold; font-size: 9px; display: inline-block;">${score}</span>`
                            }
                        </td>
                        <td style="width: 42%; text-align: left; ${match.winner === 'team2' ? 'font-weight: bold;' : ''} font-size: 9px; padding: 2px 3px; height: 16px; line-height: 1.0;">${team2Name}</td>
                    </tr>
                `;
            };
            
            gironiSemifinalsContent = `
                <h3 style="font-size: 11px; font-weight: bold; margin: 16px 0 2px 0; padding: 1px 2px; background: #e3f2fd;">SEMIFINALE A</h3>
                <table style="margin-bottom: 2px;">
                    <tbody>
                        ${generateSemifinalRow(semifinalMatches[0])}
                    </tbody>
                </table>
                ${semifinalMatches.length > 1 ? `
                <h3 style="font-size: 11px; font-weight: bold; margin: 12px 0 2px 0; padding: 1px 2px; background: #e3f2fd;">SEMIFINALE B</h3>
                <table style="margin-bottom: 2px;">
                    <tbody>
                        ${generateSemifinalRow(semifinalMatches[1])}
                    </tbody>
                </table>
                ` : ''}
            `;
        }
        
        // Finals content
        if (finalMatches.length > 0) {
            const generateFinalRow = (match: Match) => {
                const t1p1 = getPlayerById(match.team1[0]);
                const t1p2 = getPlayerById(match.team1[1]);
                const t2p1 = getPlayerById(match.team2[0]);
                const t2p2 = getPlayerById(match.team2[1]);
                if (!t1p1 || !t1p2 || !t2p1 || !t2p2) return '';
                
                const team1Name = `${t1p1.name} ${t1p1.surname} / ${t1p2.name} ${t1p2.surname}`;
                const team2Name = `${t2p1.name} ${t2p1.surname} / ${t2p2.name} ${t2p2.surname}`;
                const score = tournament.status === 'scheduled' ? '□-□' : match.sets.map(s => `${s.team1}-${s.team2}`).join(', ');
                
                return `
                    <tr style="height: 16px;">
                        <td style="width: 42%; text-align: right; ${match.winner === 'team1' ? 'font-weight: bold;' : ''} font-size: 9px; padding: 2px 3px; height: 16px; line-height: 1.0;">${team1Name}</td>
                        <td style="text-align: center; width: 16%; font-size: 9px; padding: 2px 3px; height: 16px; line-height: 1.0;">
                            ${tournament.status === 'scheduled' ? 
                                '<span style="border: 1px solid #ccc; padding: 2px 8px; display: inline-block; font-size: 9px;">&nbsp;</span> - <span style="border: 1px solid #ccc; padding: 2px 8px; display: inline-block; font-size: 9px;">&nbsp;</span>' : 
                                `<span style="background-color: #16a34a; color: white; padding: 2px 8px; border-radius: 2px; font-weight: bold; font-size: 9px; display: inline-block;">${score}</span>`
                            }
                        </td>
                        <td style="width: 42%; text-align: left; ${match.winner === 'team2' ? 'font-weight: bold;' : ''} font-size: 9px; padding: 2px 3px; height: 16px; line-height: 1.0;">${team2Name}</td>
                    </tr>
                `;
            };
            
            gironiFinals34Content = `
                <h3 style="font-size: 11px; font-weight: bold; margin: 16px 0 2px 0; padding: 1px 2px; background: #ffe0b2;">FINALE 3° E 4° POSTO</h3>
                <table style="margin-bottom: 2px;">
                    <tbody>
                        ${generateFinalRow(finalMatches[0])}
                    </tbody>
                </table>
            `;
            
            if (finalMatches.length > 1) {
                gironiFinalsContent = `
                    <h3 style="font-size: 11px; font-weight: bold; margin: 12px 0 2px 0; padding: 1px 2px; background: #ffd700;">FINALISSIMA</h3>
                    <table style="margin-bottom: 2px;">
                        <tbody>
                            ${generateFinalRow(finalMatches[1])}
                        </tbody>
                    </table>
                `;
            }
        }
    }
    
    // For non-RoundRobinFinali and non-GironiFaseFinale tournaments, use all matches
    const matchesContent = !isRoundRobinFinali && !isGironiFaseFinale ? roundRobinContent : '';

    // Standings content - different for Americano vs regular tournaments
    const standingsContent = standings.map((entry, index) => {
        if (isAmericano) {
            // Americano: individual standings
            const player = entry.team[0]; // In Americano, each entry has only one player
            if (americanoScoringType === 'points') {
                // For "points" scoring: only show Punti Fatti and Punti Subiti
                return `
                    <tr style="height: 20px;">
                        <td style="text-align: center; font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${index + 1}</td>
                        <td style="font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${player.name} ${player.surname}</td>
                        <td style="text-align: center; font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${entry.gamesWon}</td>
                        <td style="text-align: center; font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${entry.gamesLost}</td>
                    </tr>
                `;
            } else {
                // For "games-diff" scoring: show Games W, Games L, Differenza
                return `
                    <tr style="height: 20px;">
                        <td style="text-align: center; font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${index + 1}</td>
                        <td style="font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${player.name} ${player.surname}</td>
                        <td style="text-align: center; font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${entry.gamesWon}</td>
                        <td style="text-align: center; font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${entry.gamesLost}</td>
                        <td style="text-align: center; font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${entry.gameDifference}</td>
                    </tr>
                `;
            }
        } else {
            // Regular tournaments: team standings
            return `
                <tr style="height: 20px;">
                    <td style="text-align: center; font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${index + 1}</td>
                    <td style="font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${entry.team[0].name} ${entry.team[0].surname} & ${entry.team[1].name} ${entry.team[1].surname}</td>
                    <td style="text-align: center; font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${entry.points}</td>
                    <td style="text-align: center; font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${entry.gamesWon}</td>
                    <td style="text-align: center; font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${entry.gamesLost}</td>
                    <td style="text-align: center; font-size: 11px; padding: 3px 4px; height: 20px; line-height: 1.2;">${entry.gameDifference}</td>
                </tr>
            `;
        }
    }).join('');

    const content = `
        <style>
            @page { 
                size: A4;
                margin: 7mm 6mm;
            }
            body { 
                font-family: 'Manrope', 'Aptos Narrow', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                font-size: 11px; 
                line-height: 1.3;
                margin: 0;
                padding: 0;
                background: white;
            }
            h1 { 
                font-size: 17px; 
                margin: 0 0 3px 0; 
                color: #16a34a;
                font-weight: bold;
            }
            h2 { 
                font-size: 12px; 
                margin: 0 0 2px 0; 
                color: #666;
                font-weight: normal;
            }
            h3 { 
                font-size: 13px; 
                margin: 10px 0 3px 0; 
                color: #000; 
                font-weight: bold;
            }
            .separator {
                border-bottom: 1px solid #2563eb;
                margin: 5px 0;
            }
            .date-info {
                color: #16a34a;
                font-size: 11px;
                font-weight: bold;
                margin: 2px 0 0 0;
            }
            .team-box {
                text-align: center; 
                font-weight: bold; 
                padding: 2px 3px; 
                background-color: #f8fafc; 
                border: 1px solid #3b82f6;
                border-radius: 3px; 
                font-size: 10px;
                line-height: 1.1;
                height: 60px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .team-number {
                color: #2563eb;
                font-weight: bold;
                margin-bottom: 1px;
                font-size: 10px;
            }
            .score-box {
                background-color: #16a34a;
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                border: none;
                font-weight: bold;
                font-size: 12px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 24px;
            }
            .score-box-blank {
                background-color: white;
                border: 1px solid #3b82f6;
                border-radius: 3px;
                padding: 5px 8px;
                margin: 0 1px;
                width: 30px;
                height: 30px;
                display: inline;
                font-size: 14px;
                font-weight: bold;
                color: #3b82f6;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 3px 0 6px 0;
                font-size: 11px;
            }
            th { 
                background-color: #2563eb;
                color: white; 
                padding: 5px 6px; 
                text-align: left; 
                font-weight: bold;
                font-size: 11px;
                height: 24px;
            }
            td { 
                padding: 5px 6px; 
                border-bottom: 1px solid #e5e7eb; 
                vertical-align: middle;
                font-size: 11px;
                line-height: 1.3;
                height: 24px;
            }
            .court-cell {
                font-size: 10px;
                white-space: nowrap;
                width: 10%;
            }
            .team-name {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            tr:nth-child(even) {
                background-color: #f8fafc;
            }
            /* Force UNIFORM row height 24px for ALL tables and ALL sections */
            table tbody tr {
                height: 24px !important;
            }
            table tbody td {
                height: 24px !important;
                padding: 5px 6px !important;
                font-size: 11px !important;
                line-height: 1.3 !important;
            }
            table thead tr {
                height: 24px !important;
            }
            table thead th {
                height: 24px !important;
                padding: 5px 6px !important;
                font-size: 11px !important;
            }
            .footer {
                margin-top: 10px;
                padding-top: 5px;
                border-top: 1px solid #e5e7eb;
                font-size: 8px;
                color: #666;
            }
        </style>

        <div style="text-align: center; margin-bottom: 3px;">
            <h1>${tournament.name}</h1>
            <h2>${tournament.club} - ${getTournamentTypeDisplayName(tournament.type)}</h2>
            <div class="date-info">Giornata del ${new Date(tournament.date).toLocaleDateString('it-IT')}</div>
        </div>

        <div class="separator"></div>

        ${!isAmericano ? `
        <h3 style="font-size: ${isGironiFaseFinale ? '11px' : '13px'}; font-weight: bold; margin: ${isGironiFaseFinale ? '8px' : '10px'} 0 3px 0;">SQUADRE</h3>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: ${isGironiFaseFinale ? '12px' : '12px'};">
            ${teamsContent}
        </div>
        ` : ''}

        ${isGironiFaseFinale ? `
        ${gironiContent}
        ${gironiStandingsContent}
        ${gironiSemifinalsContent}
        ${gironiFinals34Content}
        ${gironiFinalsContent}
        ` : isRoundRobinFinali && roundRobinMatchCount ? `
        <h3 style="margin-top: 12px;">Partite Round Robin</h3>
        <table>
            <thead>
                <tr>
                    <th style="text-align: center;">Campo</th>
                    <th>Squadra A</th>
                    <th style="text-align: center;">Risultato</th>
                    <th>Squadra B</th>
                </tr>
            </thead>
            <tbody>
                ${roundRobinContent}
            </tbody>
        </table>

        <h3 style="margin-top: 12px;">Finali</h3>
        <table>
            <thead>
                <tr>
                    <th style="text-align: center;">Tipo</th>
                    <th>Squadra A</th>
                    <th style="text-align: center;">Risultato</th>
                    <th>Squadra B</th>
                </tr>
            </thead>
            <tbody>
                ${finalsContent}
            </tbody>
        </table>
        ` : `
        <h3 style="margin-top: 12px;">Partite e Risultati</h3>
        <table>
            <thead>
                <tr>
                    <th style="text-align: center;">Campo</th>
                    <th>Squadra A</th>
                    <th style="text-align: center;">Risultato</th>
                    <th>Squadra B</th>
                </tr>
            </thead>
            <tbody>
                ${matchesContent}
            </tbody>
        </table>
        `}

        ${tournament.status === 'completed' ? `
        <h3 style="font-size: ${isGironiFaseFinale ? '11px' : '13px'}; font-weight: bold; margin: ${isGironiFaseFinale ? '16px' : '14px'} 0 3px 0;">${isGironiFaseFinale ? 'CLASSIFICA' : 'Classifica Giornata'}</h3>
        <table style="margin-bottom: 2px;">
            <thead>
                <tr>
                    <th style="text-align: center;">Pos</th>
                    <th>Squadra</th>
                    ${isAmericano && americanoScoringType === 'points' ? `
                        <th style="text-align: center;">Punti Fatti</th>
                        <th style="text-align: center;">Punti Subiti</th>
                    ` : isAmericano ? `
                        <th style="text-align: center;">Games W</th>
                        <th style="text-align: center;">Games L</th>
                        <th style="text-align: center;">Differenza</th>
                    ` : `
                        <th style="text-align: center;">Punti</th>
                        <th style="text-align: center;">Games W</th>
                        <th style="text-align: center;">Games L</th>
                        <th style="text-align: center;">Differenza</th>
                    `}
                </tr>
            </thead>
            <tbody>
                ${standingsContent}
            </tbody>
        </table>
        ` : ''}

        <div class="footer">
            <div style="text-align: left; margin-bottom: 4px;">
                Padel ELO Manager - Versione 2.0.1 @ Mattia Ianniello, 2025
            </div>
            <div style="text-align: right; font-size: 8px;">
                ${new Date().toLocaleDateString('it-IT')}, ${new Date().toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})} - Pagina 1 di 1
            </div>
        </div>
    `;

    openPrintWindow(`Tournament Report - ${tournament.name}`, content);
};

export const printBlankScoreSheet = (
    tournamentDetails: Pick<Tournament, 'name' | 'club' | 'date' | 'type'>,
    pairs: [Player, Player][],
    matches: Omit<Match, 'id' | 'date' | 'winner' | 'sets'>[],
    getPlayerById: (id: string) => Player | undefined,
    americanoFields?: number
) => {
    const isAmericano = tournamentDetails.type === TournamentType.Americano;
    const numPairs = pairs.length;
    // For 6 pairs, create 2 rows of 3. For 4 or less, create one row. For more, cap at 4 per row.
    const gridCols = numPairs <= 4 ? numPairs : (numPairs === 6 ? 3 : 4);

    let teamsContent = '';
    if (!isAmericano) {
        teamsContent = pairs.map((pair, index) => `
            <div class="team-box">
                <div class="team-number">Squadra ${index + 1}</div>
                <div style="color: #000;">${pair[0].name} ${pair[0].surname}</div>
                <div style="color: #000; margin: 2px 0;">&</div>
                <div style="color: #000;">${pair[1].name} ${pair[1].surname}</div>
            </div>
        `).join('');
    }

    const matchesContent = matches.map((match, index) => {
        const t1p1 = getPlayerById(match.team1[0]);
        const t1p2 = getPlayerById(match.team1[1]);
        const t2p1 = getPlayerById(match.team2[0]);
        const t2p2 = getPlayerById(match.team2[1]);
        if (!t1p1 || !t1p2 || !t2p1 || !t2p2) return '';

        const team1Name = `${t1p1.name} ${t1p1.surname} / ${t1p2.name} ${t1p2.surname}`;
        const team2Name = `${t2p1.name} ${t2p1.surname} / ${t2p2.name} ${t2p2.surname}`;
        let court = '-';
        if (tournamentDetails.type === TournamentType.TorneOtto) {
            court = `Campo ${(index % 2) + 1}`;
        } else if (tournamentDetails.type === TournamentType.Americano) {
            const maxCourts = americanoFields || 2;
            court = `Campo ${(index % maxCourts) + 1}`;
        }

        return `
                <tr style="height: 22px;">
                    <td style="text-align: center; width: 15%; font-size: 11px; padding: 4px 5px; height: 22px; line-height: 1.2;">${court}</td>
                    <td style="width: 32.5%; font-size: 12px; padding: 4px 5px; height: 22px; line-height: 1.2;">${team1Name}</td>
                    <td style="text-align: center; width: 20%; font-size: 12px; padding: 4px 5px; height: 22px; line-height: 1.2;">
                        <span style="border: 1px solid #ccc; padding: 4px 10px; display: inline-block; font-size: 13px;">&nbsp;</span> - <span style="border: 1px solid #ccc; padding: 4px 10px; display: inline-block; font-size: 13px;">&nbsp;</span>
                    </td>
                    <td style="width: 32.5%; font-size: 12px; padding: 4px 5px; height: 22px; line-height: 1.2;">${team2Name}</td>
                </tr>
        `;
    }).join('');
    
    const content = `
        <style>
            @page { 
                size: A4;
                margin: 7mm 6mm;
            }
            body { 
                font-family: 'Manrope', 'Aptos Narrow', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                font-size: 13px; 
                line-height: 1.4;
                margin: 0;
                padding: 18px;
                background: white;
            }
            h1 { 
                font-size: 28px; 
                margin: 0 0 10px 0; 
                color: #16a34a; /* Verde più chiaro */
                font-weight: bold;
            }
            h2 { 
                font-size: 17px; 
                margin: 0 0 6px 0; 
                color: #666; /* Grigio chiaro */
                font-weight: normal;
            }
            h3 { 
                font-size: 19px; 
                margin: 18px 0 8px 0; 
                color: #000; 
                font-weight: bold;
            }
            .separator {
                border-bottom: 3px solid #2563eb; /* Blu più chiaro */
                margin: 16px 0;
            }
            .date-info {
                color: #16a34a; /* Verde più chiaro */
                font-size: 15px;
                font-weight: bold;
                margin: 6px 0 0 0;
            }
            .team-box {
                text-align: center; 
                font-weight: bold; 
                padding: 6px; 
                background-color: #f8fafc; 
                border: 2px solid #3b82f6; /* Blu chiaro */
                border-radius: 8px; 
                font-size: 12px;
                height: 66px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                line-height: 1.2;
            }
            .team-number {
                color: #2563eb; /* Blu più chiaro */
                font-weight: bold;
                margin-bottom: 3px;
            }
            .score-box-blank {
                background-color: white;
                border: 1px solid #3b82f6; /* Blu più chiaro */
                border-radius: 4px;
                padding: 8px 11px;
                margin: 0 2px;
                width: 34px;
                height: 34px;
                display: inline;
                font-size: 16px;
                font-weight: bold;
                color: #3b82f6;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 8px 0 16px 0;
                font-size: 13px;
            }
            th { 
                background-color: #2563eb; /* Blu più chiaro */
                color: white; 
                padding: 6px 7px; 
                text-align: left; 
                font-weight: bold;
                font-size: 12px;
                height: 26px;
            }
            td { 
                padding: 6px 7px; 
                border-bottom: 1px solid #e5e7eb; 
                vertical-align: middle;
                font-size: 12px;
                line-height: 1.3;
                height: 26px;
            }
            .court-cell {
                font-size: 11px;
                white-space: nowrap;
            }
            .team-name {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            tr:nth-child(even) {
                background-color: #f8fafc;
            }
            /* Force UNIFORM row height 26px for ALL tables */
            table tbody tr {
                height: 26px !important;
            }
            table tbody td {
                height: 26px !important;
                padding: 6px 7px !important;
                font-size: 12px !important;
                line-height: 1.3 !important;
            }
            table thead tr {
                height: 26px !important;
            }
            table thead th {
                height: 26px !important;
                padding: 6px 7px !important;
                font-size: 12px !important;
            }
            .footer {
                margin-top: 20px;
                padding-top: 14px;
                border-top: 1px solid #e5e7eb;
                font-size: 10px;
                color: #666;
            }
        </style>

        <div style="text-align: center; margin-bottom: 20px;">
            <h1>${tournamentDetails.name} - Score Sheet</h1>
            <h2>${tournamentDetails.club} - ${getTournamentTypeDisplayName(tournamentDetails.type)}</h2>
            <div class="date-info">Giornata del ${new Date(tournamentDetails.date).toLocaleDateString('it-IT')}</div>
        </div>

        <div class="separator"></div>

        ${!isAmericano ? `
        <h3 style="margin-top: 16px;">SQUADRE</h3>
        <div style="display: grid; grid-template-columns: repeat(${gridCols}, 1fr); gap: 12px; margin-bottom: 18px;">
            ${teamsContent}
        </div>
        ` : ''}

        <h3 style="margin-top: 18px;">Partite e Risultati</h3>
        <table>
            <thead>
                <tr>
                    <th style="text-align: center;">Campo</th>
                    <th>Squadra A</th>
                    <th style="text-align: center;">Risultato</th>
                    <th>Squadra B</th>
                </tr>
            </thead>
            <tbody>
                ${matchesContent}
            </tbody>
        </table>

        <div class="footer">
            <div style="text-align: left; margin-bottom: 4px;">
                Padel ELO Manager - Versione 2.0.1 @ Mattia Ianniello, 2025
            </div>
            <div style="text-align: right; font-size: 8px;">
                ${new Date().toLocaleDateString('it-IT')}, ${new Date().toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})} - Pagina 1 di 1
            </div>
        </div>
    `;
    
    openPrintWindow(`Score Sheet - ${tournamentDetails.name}`, content);
};

export const printGironiTournament = (
    tournament: Tournament,
    gironi: [Player, Player][][],
    gironiMatches: Match[][],
    semifinalsMatches: Match[],
    finalsMatches: Match[],
    getPlayerById: (id: string) => Player | undefined
) => {
    // Helper per generare riga partita
    const generateMatchRow = (match: Match, label: string = '') => {
        const t1p1 = getPlayerById(match.team1[0]);
        const t1p2 = getPlayerById(match.team1[1]);
        const t2p1 = getPlayerById(match.team2[0]);
        const t2p2 = getPlayerById(match.team2[1]);
        if (!t1p1 || !t1p2 || !t2p1 || !t2p2) return '';

        const team1Name = `${t1p1.name} ${t1p1.surname} / ${t1p2.name} ${t1p2.surname}`;
        const team2Name = `${t2p1.name} ${t2p1.surname} / ${t2p2.name} ${t2p2.surname}`;
        const score = tournament.status === 'scheduled' ? '' : match.sets.map(s => `${s.team1}-${s.team2}`).join(', ');

        return `
            <tr>
                <td style="text-align: center; width: 15%; font-size: 8px; padding: 3px;">${label}</td>
                <td style="width: 35%; text-align: right; ${match.winner === 'team1' ? 'font-weight: bold;' : ''} font-size: 8px; padding: 3px;">${team1Name}</td>
                <td style="text-align: center; width: 15%; font-size: 8px; padding: 3px;">
                    ${tournament.status === 'scheduled' ? 
                        '<span style="border: 1px solid #ccc; padding: 4px 12px; display: inline-block;">&nbsp;</span>' : 
                        `<span style="font-weight: bold;">${score}</span>`
                    }
                </td>
                <td style="width: 35%; text-align: left; ${match.winner === 'team2' ? 'font-weight: bold;' : ''} font-size: 8px; padding: 3px;">${team2Name}</td>
            </tr>
        `;
    };

    // Squadre
    const allPairs = gironi.flat();
    const teamsContent = allPairs.map((pair, index) => `
        <div style="display: inline-block; margin: 3px; padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 8px;">
            <strong>Squadra ${index + 1}:</strong> ${pair[0].name} ${pair[0].surname} / ${pair[1].name} ${pair[1].surname}
        </div>
    `).join('');

    // Partite per girone
    const gironiContent = gironi.map((gironePairs, idx) => {
        const gironeName = String.fromCharCode(65 + idx);
        const gironeMatchesHtml = gironiMatches[idx].map((match, matchIdx) => 
            generateMatchRow(match, `G${gironeName}${matchIdx + 1}`)
        ).join('');
        
        return `
            <div style="margin: 8px 0;">
                <h3 style="font-size: 11px; font-weight: bold; margin: 4px 0; padding: 3px; background: #f0f0f0;">PARTITE E RISULTATI GIRONE ${gironeName}</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 2px 0;">
                    <tbody>
                        ${gironeMatchesHtml}
                    </tbody>
                </table>
            </div>
        `;
    }).join('');

    // Semifinali - separate sections
    const semifinalA = semifinalsMatches.length > 0 ? `
        <div style="margin: 8px 0;">
            <h3 style="font-size: 11px; font-weight: bold; margin: 4px 0; padding: 3px; background: #e3f2fd;">SEMIFINALE A</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 2px 0;">
                <tbody>
                    ${generateMatchRow(semifinalsMatches[0], '')}
                </tbody>
            </table>
        </div>
    ` : '';

    const semifinalB = semifinalsMatches.length > 1 ? `
        <div style="margin: 8px 0;">
            <h3 style="font-size: 11px; font-weight: bold; margin: 4px 0; padding: 3px; background: #e3f2fd;">SEMIFINALE B</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 2px 0;">
                <tbody>
                    ${generateMatchRow(semifinalsMatches[1], '')}
                </tbody>
            </table>
        </div>
    ` : '';

    // Finali - separate sections
    const finale34 = finalsMatches.length > 0 ? `
        <div style="margin: 8px 0;">
            <h3 style="font-size: 11px; font-weight: bold; margin: 4px 0; padding: 3px; background: #ffe0b2;">FINALE 3° E 4° POSTO</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 2px 0;">
                <tbody>
                    ${generateMatchRow(finalsMatches[0], '')}
                </tbody>
            </table>
        </div>
    ` : '';

    const finalissima = finalsMatches.length > 1 ? `
        <div style="margin: 8px 0;">
            <h3 style="font-size: 11px; font-weight: bold; margin: 4px 0; padding: 3px; background: #ffd700;">FINALISSIMA</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 2px 0;">
                <tbody>
                    ${generateMatchRow(finalsMatches[1], '')}
                </tbody>
            </table>
        </div>
    ` : '';

    // Classifica finale
    const allMatches = [...gironiMatches.flat(), ...semifinalsMatches, ...finalsMatches];
    const pairStats = new Map();
    
    allPairs.forEach(pair => {
        const key = `${pair[0].id}-${pair[1].id}`;
        pairStats.set(key, {
            pair,
            punti: 0,
            gamesWon: 0,
            gamesLost: 0
        });
    });
    
    allMatches.forEach(match => {
        const team1Key = `${match.team1[0]}-${match.team1[1]}`;
        const team2Key = `${match.team2[0]}-${match.team2[1]}`;
        const team1Games = match.sets.reduce((sum, set) => sum + set.team1, 0);
        const team2Games = match.sets.reduce((sum, set) => sum + set.team2, 0);
        
        const team1Stat = pairStats.get(team1Key);
        const team2Stat = pairStats.get(team2Key);
        
        if (team1Stat) {
            team1Stat.gamesWon += team1Games;
            team1Stat.gamesLost += team2Games;
            if (team1Games > team2Games) team1Stat.punti += 3;
        }
        
        if (team2Stat) {
            team2Stat.gamesWon += team2Games;
            team2Stat.gamesLost += team1Games;
            if (team2Games > team1Games) team2Stat.punti += 3;
        }
    });
    
    const standings = Array.from(pairStats.values()).sort((a, b) => {
        if (b.punti !== a.punti) return b.punti - a.punti;
        return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
    });
    
    const standingsContent = standings.map((entry, idx) => {
        const isTopFour = idx < 4;
        const bgColor = isTopFour ? '#fffbcc' : '#fff';
        const fontWeight = isTopFour ? 'bold' : 'normal';
        
        return `
            <tr style="background: ${bgColor};">
                <td style="text-align: center; width: 10%; font-size: 8px; padding: 3px; font-weight: ${fontWeight};">${idx + 1}°</td>
                <td style="width: 50%; font-size: 8px; padding: 3px; font-weight: ${fontWeight};">
                    ${entry.pair[0].name} ${entry.pair[0].surname} / ${entry.pair[1].name} ${entry.pair[1].surname}
                </td>
                <td style="text-align: center; width: 15%; font-size: 8px; padding: 3px; font-weight: ${fontWeight};">${entry.punti}</td>
                <td style="text-align: center; width: 25%; font-size: 8px; padding: 3px; font-weight: ${fontWeight};">
                    ${entry.gamesWon}-${entry.gamesLost} (${entry.gamesWon - entry.gamesLost >= 0 ? '+' : ''}${entry.gamesWon - entry.gamesLost})
                </td>
            </tr>
        `;
    }).join('');

    const content = `
        ${getPrintStyles()}
        
        <div class="header">
            <h1>Tournament Report - ${tournament.name}</h1>
            <p>${tournament.type} - ${new Date(tournament.date).toLocaleDateString('it-IT')} - ${tournament.club}</p>
        </div>

        <div style="margin: 10px 0;">
            <h2 style="font-size: 12px; font-weight: bold; margin: 6px 0;">SQUADRE</h2>
            <div style="display: flex; flex-wrap: wrap;">
                ${teamsContent}
            </div>
        </div>

        ${gironiContent}

        ${semifinalA}

        ${semifinalB}

        ${finale34}

        ${finalissima}

        <div style="margin: 10px 0;">
            <h2 style="font-size: 12px; font-weight: bold; margin: 6px 0;">CLASSIFICA</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th style="text-align: center; font-size: 9px; padding: 4px;">Pos</th>
                        <th style="text-align: left; font-size: 9px; padding: 4px;">Coppia</th>
                        <th style="text-align: center; font-size: 9px; padding: 4px;">Punti</th>
                        <th style="text-align: center; font-size: 9px; padding: 4px;">Games (Diff)</th>
                    </tr>
                </thead>
                <tbody>
                    ${standingsContent}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <div style="text-align: left; margin-bottom: 4px; font-size: 8px;">
                Padel ELO Manager - Versione 2.0.1 @ Mattia Ianniello, 2025
            </div>
            <div style="text-align: right; font-size: 8px;">
                ${new Date().toLocaleDateString('it-IT')}, ${new Date().toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})} - Pagina 1 di 1
            </div>
        </div>
    `;

    openPrintWindow(`Tournament Report - ${tournament.name}`, content);
};
// Funzione per stampare le statistiche del torneo
export const printTournamentStatistics = (stats: any) => {
    // Generate top 5 rows
    const top5Rows = stats.top5.map((entry: any, idx: number) => {
        const varColor = entry.variazioneElo >= 0 ? '#059669' : '#dc2626';
        const varSign = entry.variazioneElo >= 0 ? '+' : '';
        return `
            <tr style="height: 22px;">
                <td style="text-align: center; height: 22px; line-height: 1.2;">${idx + 1}°</td>
                <td style="height: 22px; line-height: 1.2;">${entry.player.name} ${entry.player.surname}</td>
                <td style="text-align: center; font-weight: bold; height: 22px; line-height: 1.2;">${entry.player.currentElo.toFixed(0)}</td>
                <td style="text-align: center; font-weight: bold; color: ${varColor}; height: 22px; line-height: 1.2;">
                    ${varSign}${entry.variazioneElo.toFixed(0)}
                </td>
                <td style="text-align: center; height: 22px; line-height: 1.2;">${entry.gamesWon} / ${entry.gamesLost}</td>
            </tr>
        `;
    }).join('');

    // Generate stat cards
    const gamesVintiEntries = stats.giocatoreConPiuGamesVinti.slice(0, 3).map((e: any, i: number) => 
        e.games > 0 
            ? `<div class="stat-card-entry">${i+1}. ${e.player.name} ${e.player.surname} (${e.games})</div>`
            : '<div class="stat-card-entry">(in attesa di dati ulteriori)</div>'
    ).join('');

    const gamesPersiEntries = stats.giocatoreConPiuGamesPersi.slice(0, 3).map((e: any, i: number) => 
        e.games > 0 
            ? `<div class="stat-card-entry">${i+1}. ${e.player.name} ${e.player.surname} (${e.games})</div>`
            : '<div class="stat-card-entry">(in attesa di dati ulteriori)</div>'
    ).join('');

    const coppiaEntries = stats.coppiaFrequente.length > 0 
        ? stats.coppiaFrequente.slice(0, 3).map((c: any, i: number) => 
            `<div class="stat-card-entry">${i+1}. ${c.players[0].name} & ${c.players[1].name} (${c.partite})</div>`
        ).join('')
        : '<div class="stat-card-entry">(in attesa di dati ulteriori)</div>';

    const vittorieEntries = stats.serieVittorie.slice(0, 3).map((s: any, i: number) => 
        s.vittorie > 0 
            ? `<div class="stat-card-entry">${i+1}. ${s.player.name} ${s.player.surname} (${s.vittorie})</div>`
            : '<div class="stat-card-entry">(in attesa di dati ulteriori)</div>'
    ).join('');

    const peakEntries = stats.eloPeak.slice(0, 3).map((e: any, i: number) => 
        e.elo > 0 
            ? `<div class="stat-card-entry">${i+1}. ${e.player.name} ${e.player.surname} (${e.elo.toFixed(0)})</div>`
            : '<div class="stat-card-entry">(in attesa di dati ulteriori)</div>'
    ).join('');

    const upsetEntries = stats.upset[0].count > 0 
        ? `<div class="stat-card-entry">${stats.upset[0].count} upset registrat${stats.upset[0].count > 1 ? 'i' : 'o'}</div>` +
          stats.upset[0].details.slice(0, 2).map((d: string) => `<div class="stat-card-entry" style="font-size: 8px;">${d}</div>`).join('')
        : '<div class="stat-card-entry">Nessun upset</div>';

    const guadagnoEntries = stats.maggiorGuadagnoElo.slice(0, 3).map((e: any, i: number) => 
        e.guadagno > 0 
            ? `<div class="stat-card-entry">${i+1}. ${e.player.name} ${e.player.surname} (+${e.guadagno.toFixed(1)})</div>`
            : '<div class="stat-card-entry">(in attesa di dati ulteriori)</div>'
    ).join('');

    const perditaEntries = stats.peggiorPerditaElo.slice(0, 3).map((e: any, i: number) => 
        e.perdita > 0 
            ? `<div class="stat-card-entry">${i+1}. ${e.player.name} ${e.player.surname} (-${e.perdita.toFixed(1)})</div>`
            : '<div class="stat-card-entry">(in attesa di dati ulteriori)</div>'
    ).join('');

    const mvpEntries = stats.mvp.slice(0, 3).map((m: any) => 
        m.vittorieGiornate > 0 
            ? `<div class="award-entry">${m.player.name} ${m.player.surname}<br/>${m.vittorieGiornate} giornat${m.vittorieGiornate === 1 ? 'a' : 'e'}</div>`
            : '<div class="award-entry" style="font-size: 8px;">(in attesa di dati ulteriori)</div>'
    ).join('');

    const montagneEntries = stats.montagneRusse.slice(0, 3).map((m: any) => 
        m.volatilita > 0 
            ? `<div class="award-entry">${m.player.name} ${m.player.surname}<br/>σ=${m.volatilita.toFixed(1)}</div>`
            : '<div class="award-entry" style="font-size: 8px;">(in attesa di dati ulteriori)</div>'
    ).join('');

    const partenzaEntries = stats.partenzaLenta.length > 0 && stats.partenzaLenta[0].recupero > 0
        ? stats.partenzaLenta.slice(0, 3).map((p: any) => 
            `<div class="award-entry">${p.player.name} ${p.player.surname}<br/>+${p.recupero.toFixed(1)}</div>`
        ).join('')
        : '<div class="award-entry" style="font-size: 8px;">(in attesa di dati ulteriori)</div>';

    const content = `
        <style>
            @page { 
                size: A4;
                margin: 7mm 6mm;
            }
            body { 
                font-family: 'Manrope', 'Aptos Narrow', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                font-size: 11px; 
                line-height: 1.3;
                margin: 0;
                padding: 0;
                background: white;
            }
            h1 { 
                font-size: 20px; 
                margin: 0 0 4px 0; 
                color: #1e40af;
                font-weight: bold;
                text-align: center;
            }
            h2 { 
                font-size: 13px; 
                margin: 0 0 3px 0; 
                color: #666;
                font-weight: normal;
                text-align: center;
            }
            h3 { 
                font-size: 14px; 
                margin: 12px 0 4px 0; 
                color: #000; 
                font-weight: bold;
                background: #f0f0f0;
                padding: 4px 6px;
                border-radius: 3px;
            }
            .separator {
                border-bottom: 2px solid #2563eb;
                margin: 8px 0;
            }
            .info-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
                margin: 10px 0;
            }
            .info-box {
                background: #f8fafc;
                border: 1px solid #e5e7eb;
                border-radius: 4px;
                padding: 6px;
                text-align: center;
            }
            .info-label {
                font-size: 9px;
                color: #666;
                margin-bottom: 2px;
            }
            .info-value {
                font-size: 14px;
                font-weight: bold;
                color: #000;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 6px 0;
                font-size: 10px;
            }
            th { 
                background-color: #2563eb;
                color: white; 
                padding: 4px 5px; 
                text-align: left; 
                font-weight: bold;
                font-size: 10px;
                height: 22px;
            }
            td { 
                padding: 4px 5px; 
                border-bottom: 1px solid #e5e7eb; 
                vertical-align: middle;
                font-size: 10px;
                line-height: 1.2;
                height: 22px;
            }
            tr:nth-child(even) {
                background-color: #f8fafc;
            }
            .stat-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
                margin: 8px 0;
            }
            .stat-card {
                background: #f8fafc;
                border: 1px solid #e5e7eb;
                border-radius: 4px;
                padding: 6px;
            }
            .stat-card-title {
                font-size: 11px;
                font-weight: bold;
                margin-bottom: 4px;
                color: #000;
            }
            .stat-card-entry {
                font-size: 9px;
                color: #333;
                margin: 2px 0;
            }
            .award-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
                margin: 8px 0;
            }
            .award-card {
                border: 2px solid;
                border-radius: 6px;
                padding: 8px;
                text-align: center;
            }
            .award-gold {
                background: #fef3c7;
                border-color: #d97706;
            }
            .award-purple {
                background: #e0e7ff;
                border-color: #6366f1;
            }
            .award-green {
                background: #dcfce7;
                border-color: #16a34a;
            }
            .award-title {
                font-size: 13px;
                font-weight: bold;
                margin-bottom: 2px;
            }
            .award-subtitle {
                font-size: 8px;
                color: #666;
                margin-bottom: 4px;
            }
            .award-entry {
                font-size: 10px;
                font-weight: bold;
                margin: 3px 0;
            }
            .footer {
                margin-top: 12px;
                padding-top: 6px;
                border-top: 1px solid #e5e7eb;
                font-size: 8px;
                color: #666;
                text-align: center;
            }
        </style>

        <div style="margin-bottom: 6px;">
            <h1>🏆 Riepilogo Torneo</h1>
            <h2>${stats.tournament.name}</h2>
            <div style="font-size: 10px; color: #1e40af; font-weight: bold; text-align: center;">
                ${stats.tournament.club}
            </div>
        </div>

        <div class="separator"></div>

        <h3>📋 Informazioni Generali</h3>
        <div class="info-grid">
            <div class="info-box">
                <div class="info-label">Periodo</div>
                <div class="info-value" style="font-size: 10px;">${stats.periodo.inizio}<br/>${stats.periodo.fine}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Giornate</div>
                <div class="info-value">${stats.numeroGiornate}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Partite Totali</div>
                <div class="info-value">${stats.totalePartite}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Games Disputati</div>
                <div class="info-value">${stats.totaleGamesDisputati}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Media Games/Partita</div>
                <div class="info-value">${stats.mediaGamesPerPartita.toFixed(1)}</div>
            </div>
            <div class="info-box">
                <div class="info-label">Giocatori</div>
                <div class="info-value">${stats.giocatoriPartecipanti}</div>
            </div>
        </div>

        <h3>🏆 Top 5 Classifica</h3>
        <table>
            <thead>
                <tr>
                    <th style="text-align: center; width: 10%;">Pos</th>
                    <th style="width: 40%;">Giocatore</th>
                    <th style="text-align: center; width: 15%;">ELO</th>
                    <th style="text-align: center; width: 15%;">Var. ELO</th>
                    <th style="text-align: center; width: 20%;">Games W/L</th>
                </tr>
            </thead>
            <tbody>
                ${top5Rows}
            </tbody>
        </table>

        <h3>📊 Statistiche Avanzate</h3>
        <div class="stat-grid">
            <div class="stat-card">
                <div class="stat-card-title">🎯 Più Games Vinti</div>
                ${gamesVintiEntries}
            </div>
            <div class="stat-card">
                <div class="stat-card-title">😓 Più Games Persi</div>
                ${gamesPersiEntries}
            </div>
            <div class="stat-card">
                <div class="stat-card-title">👥 Coppia Più Frequente</div>
                ${coppiaEntries}
            </div>
            <div class="stat-card">
                <div class="stat-card-title">🔥 Serie Vittorie</div>
                ${vittorieEntries}
            </div>
            <div class="stat-card">
                <div class="stat-card-title">⭐ ELO Peak</div>
                ${peakEntries}
            </div>
            <div class="stat-card">
                <div class="stat-card-title">🎲 UPSET</div>
                <div class="stat-card-entry" style="font-size: 8px; font-style: italic; margin-bottom: 3px;">
                    (Vittorie contro avversari superiori... sulla carta!)
                </div>
                ${upsetEntries}
            </div>
            <div class="stat-card">
                <div class="stat-card-title">📈 Maggior Guadagno ELO</div>
                ${guadagnoEntries}
            </div>
            <div class="stat-card">
                <div class="stat-card-title">📉 Peggior Perdita ELO</div>
                ${perditaEntries}
            </div>
        </div>

        <h3>🏅 Premi Simbolici</h3>
        <div class="award-grid">
            <div class="award-card award-gold">
                <div class="award-title">🏆 MVP</div>
                <div class="award-subtitle">Più giornate vinte</div>
                ${mvpEntries}
            </div>
            <div class="award-card award-purple">
                <div class="award-title">🎢 Montagne Russe</div>
                <div class="award-subtitle">ELO più altalenante</div>
                ${montagneEntries}
            </div>
            <div class="award-card award-green">
                <div class="award-title">🐢 Partenza Lenta</div>
                <div class="award-subtitle">Inizia male, finisce bene</div>
                ${partenzaEntries}
            </div>
        </div>

        <div class="footer">
            <div>Padel ELO Manager - Riepilogo Statistiche @ Mattia Ianniello, 2025</div>
            <div style="margin-top: 4px;">
                ${new Date().toLocaleDateString('it-IT')}, ${new Date().toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})}
            </div>
        </div>
    `;

    // Import openPrintWindow from main printService file
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Statistiche - ${stats.tournament.name}</title>
                <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&display=swap" rel="stylesheet">
            </head>
            <body>
                ${content}
                <script>
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 250);
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
};

/**
 * Stampa il tabellone vuoto per Beat the Box (senza risultati)
 */
export const printBeatTheBoxBlank = (
    tournamentDetails: Pick<Tournament, 'name' | 'club' | 'date' | 'type'>,
    boxes: { boxNumber: number; players: Player[]; matches: Omit<Match, 'id' | 'tournamentId'>[] }[],
    getPlayerById: (id: string) => Player | undefined
) => {
    const boxesContent = boxes.map((box) => {
        const matchesHtml = box.matches.map((match, matchIdx) => {
            const t1p1 = getPlayerById(match.team1[0]);
            const t1p2 = getPlayerById(match.team1[1]);
            const t2p1 = getPlayerById(match.team2[0]);
            const t2p2 = getPlayerById(match.team2[1]);
            
            if (!t1p1 || !t1p2 || !t2p1 || !t2p2) return '';
            
            const team1Name = `${t1p1.name} ${t1p1.surname} / ${t1p2.name} ${t1p2.surname}`;
            const team2Name = `${t2p1.name} ${t2p1.surname} / ${t2p2.name} ${t2p2.surname}`;
            
            return `
                <tr style="height: 22px;">
                    <td style="width: 42%; text-align: right; font-size: 11px; padding: 4px 5px; height: 22px; line-height: 1.2;">${team1Name}</td>
                    <td style="text-align: center; width: 16%; font-size: 11px; padding: 4px 5px; height: 22px; line-height: 1.2;">
                        <span style="border: 1px solid #ccc; padding: 4px 10px; display: inline-block; font-size: 12px;">&nbsp;</span> - <span style="border: 1px solid #ccc; padding: 4px 10px; display: inline-block; font-size: 12px;">&nbsp;</span>
                    </td>
                    <td style="width: 42%; text-align: left; font-size: 11px; padding: 4px 5px; height: 22px; line-height: 1.2;">${team2Name}</td>
                </tr>
            `;
        }).join('');
        
        const playersHtml = box.players.map((player, idx) => `
            <div style="font-size: 10px; color: #555; margin: 2px 0;">
                ${idx + 1}. ${player.name} ${player.surname} <span style="color: #999;">(ELO: ${player.currentElo.toFixed(0)})</span>
            </div>
        `).join('');
        
        return `
            <div style="page-break-inside: avoid; margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin: 12px 0 4px 0; padding: 4px 6px; background: #e3f2fd; border-left: 4px solid #2196f3;">
                    📦 BOX ${box.boxNumber} - CAMPO ${box.boxNumber}
                </h3>
                <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    ${playersHtml}
                </div>
                <table style="margin-bottom: 2px; font-size: 11px;">
                    <tbody>
                        ${matchesHtml}
                    </tbody>
                </table>
            </div>
        `;
    }).join('');
    
    const content = `
        <style>
            @page { 
                size: A4;
                margin: 7mm 6mm;
            }
            body { 
                font-family: 'Manrope', 'Aptos Narrow', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                font-size: 12px; 
                line-height: 1.4;
                margin: 0;
                padding: 18px;
                background: white;
            }
            h1 { 
                font-size: 24px; 
                margin: 0 0 8px 0; 
                color: #2196f3;
                font-weight: bold;
            }
            h2 { 
                font-size: 16px; 
                margin: 0 0 6px 0; 
                color: #666;
                font-weight: normal;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 6px 0;
                font-size: 11px;
            }
            td { 
                padding: 6px 7px; 
                border-bottom: 1px solid #e5e7eb; 
                vertical-align: middle;
                font-size: 11px;
                line-height: 1.3;
            }
            tr:nth-child(even) {
                background-color: #f8fafc;
            }
            .footer {
                margin-top: 20px;
                padding-top: 14px;
                border-top: 1px solid #e5e7eb;
                font-size: 9px;
                color: #666;
            }
        </style>

        <div style="text-align: center; margin-bottom: 16px;">
            <h1>📦 ${tournamentDetails.name} - Score Sheet</h1>
            <h2>${tournamentDetails.club} - Beat the Box</h2>
            <div style="color: #2196f3; font-size: 13px; font-weight: bold; margin: 4px 0 0 0;">
                ${new Date(tournamentDetails.date).toLocaleDateString('it-IT')}
            </div>
        </div>

        <div style="border-bottom: 2px solid #2196f3; margin: 12px 0;"></div>

        ${boxesContent}

        <div class="footer">
            <div style="text-align: left; margin-bottom: 4px;">
                Padel ELO Manager - Beat the Box @ Mattia Ianniello, 2025
            </div>
            <div style="text-align: right; font-size: 8px;">
                ${new Date().toLocaleDateString('it-IT')}, ${new Date().toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})}
            </div>
        </div>
    `;
    
    openPrintWindow(`Beat the Box - ${tournamentDetails.name}`, content);
};

/**
 * Stampa il report completo per Beat the Box (con risultati)
 * UNIFORMITÀ: font-size 10px, height 20px per TUTTE le righe, margin 20px tra sezioni
 */
export const printBeatTheBoxComplete = (
    tournament: Tournament,
    boxes: { boxNumber: number; players: Player[]; matches: Match[] }[],
    boxStandings: { boxNumber: number; standings: any[] }[],
    semifinalMatches: Match[],
    finalMatches: Match[],
    individualStandings: { player: Player; eloChange: number; rank: number; gamesWon: number; gamesLost: number; winPercentage: number }[],
    getPlayerById: (id: string) => Player | undefined
) => {
    const generateMatchRow = (match: Match) => {
        const t1p1 = getPlayerById(match.team1[0]);
        const t1p2 = getPlayerById(match.team1[1]);
        const t2p1 = getPlayerById(match.team2[0]);
        const t2p2 = getPlayerById(match.team2[1]);
        
        if (!t1p1 || !t1p2 || !t2p1 || !t2p2) return '';
        
        const team1Name = `${t1p1.name} ${t1p1.surname} / ${t1p2.name} ${t1p2.surname}`;
        const team2Name = `${t2p1.name} ${t2p1.surname} / ${t2p2.name} ${t2p2.surname}`;
        const score = match.sets.map(s => `${s.team1}-${s.team2}`).join(', ');
        
        return `
            <tr style="height: 20px;">
                <td style="width: 42%; text-align: right; ${match.winner === 'team1' ? 'font-weight: bold;' : ''} font-size: 10px; padding: 4px 5px; height: 20px; line-height: 1.2;">${team1Name}</td>
                <td style="text-align: center; width: 16%; font-size: 10px; padding: 4px 5px; height: 20px; line-height: 1.2;">
                    <span style="background-color: #16a34a; color: white; padding: 2px 6px; border-radius: 2px; font-weight: bold; font-size: 10px; display: inline-block;">${score}</span>
                </td>
                <td style="width: 42%; text-align: left; ${match.winner === 'team2' ? 'font-weight: bold;' : ''} font-size: 10px; padding: 4px 5px; height: 20px; line-height: 1.2;">${team2Name}</td>
            </tr>
        `;
    };
    
    const boxesContent = boxes.map((box, boxIdx) => {
        const matchesHtml = box.matches.map(match => generateMatchRow(match)).join('');
        
        const boxStanding = boxStandings.find(bs => bs.boxNumber === box.boxNumber);
        const standingsHtml = boxStanding ? boxStanding.standings.map((entry: any, idx: number) => `
            <tr style="height: 20px;">
                <td style="text-align: center; width: 10%; font-size: 10px; padding: 4px 5px; height: 20px;">${idx + 1}°</td>
                <td style="width: 55%; font-size: 10px; padding: 4px 5px; height: 20px;">${entry.player.name} ${entry.player.surname}</td>
                <td style="text-align: center; width: 15%; font-size: 10px; padding: 4px 5px; height: 20px;">${entry.points}</td>
                <td style="text-align: center; width: 20%; font-size: 10px; padding: 4px 5px; height: 20px;">${entry.gameDifference >= 0 ? '+' : ''}${entry.gameDifference}</td>
            </tr>
        `).join('') : '';
        
        return `
            <div style="page-break-inside: avoid; margin-bottom: 24px;">
                <h3 style="font-size: 12px; font-weight: bold; margin: 20px 0 6px 0; padding: 4px 6px; background: #e3f2fd; border-left: 4px solid #2196f3;">
                    📦 BOX ${box.boxNumber} - CAMPO ${box.boxNumber}
                </h3>
                <table style="margin-bottom: 6px; font-size: 10px;">
                    <tbody>
                        ${matchesHtml}
                    </tbody>
                </table>
                <h4 style="font-size: 11px; font-weight: bold; margin: 12px 0 4px 0; background: #f0f9ff; padding: 3px 5px;">CLASSIFICA BOX ${box.boxNumber}</h4>
                <table style="margin-bottom: 6px; font-size: 10px;">
                    <thead>
                        <tr style="height: 20px;">
                            <th style="text-align: center; font-size: 10px; padding: 4px 5px; height: 20px;">Pos</th>
                            <th style="font-size: 10px; padding: 4px 5px; height: 20px;">Giocatore</th>
                            <th style="text-align: center; font-size: 10px; padding: 4px 5px; height: 20px;">Pt</th>
                            <th style="text-align: center; font-size: 10px; padding: 4px 5px; height: 20px;">Diff</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${standingsHtml}
                    </tbody>
                </table>
            </div>
        `;
    }).join('');
    
    let semifinalsContent = '';
    if (semifinalMatches.length > 0) {
        semifinalsContent = `
            <h3 style="font-size: 12px; font-weight: bold; margin: 24px 0 6px 0; padding: 4px 6px; background: #e8eaf6; border-left: 4px solid #5c6bc0;">SEMIFINALI</h3>
            <table style="margin-bottom: 6px;">
                <tbody>
                    ${semifinalMatches.map((match, idx) => `
                        <tr style="height: 20px;">
                            <td colspan="3" style="background: #f5f5f5; padding: 4px 5px; font-size: 10px; font-weight: bold; height: 20px;">Semifinale ${idx + 1}</td>
                        </tr>
                        ${generateMatchRow(match)}
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    const finalsContent = finalMatches.map((match, idx) => {
        let matchTitle = '';
        let bgColor = '#fff9c4';
        
        if (idx === 0) {
            matchTitle = 'FINALE 1° - 2° POSTO';
            bgColor = '#ffd54f';
        } else if (idx === 1) {
            matchTitle = 'FINALINA 3° - 4° POSTO';
            bgColor = '#ffe0b2';
        } else if (idx === 2) {
            matchTitle = 'PARTITA CONSOLAZIONE';
            bgColor = '#f5f5f5';
        }
        
        return `
            <tr style="height: 20px;">
                <td colspan="3" style="background: ${bgColor}; padding: 4px 5px; font-size: 10px; font-weight: bold; text-align: center; height: 20px;">${matchTitle}</td>
            </tr>
            ${generateMatchRow(match)}
        `;
    }).join('');
    
    const finalsHtml = finalMatches.length > 0 ? `
        <h3 style="font-size: 12px; font-weight: bold; margin: 24px 0 6px 0; padding: 4px 6px; background: #fff9c4; border-left: 4px solid #fbc02d;">FINALI</h3>
        <table style="margin-bottom: 6px;">
            <tbody>
                ${finalsContent}
            </tbody>
        </table>
    ` : '';
    
    // Calcola classifica di squadra finale basata sui risultati delle finali
    let teamStandingsHtml = '';
    if (finalMatches.length > 0 && tournament.status === 'completed') {
        const teamStandings: Array<{ position: number; team: string; medal: string; bgColor: string }> = [];
        
        // Finale 1°-2° (primo match)
        const finale1_2 = finalMatches[0];
        if (finale1_2 && finale1_2.winner) {
            const winner1_2Team = finale1_2.winner === 'team1' ? finale1_2.team1 : finale1_2.team2;
            const loser1_2Team = finale1_2.winner === 'team1' ? finale1_2.team2 : finale1_2.team1;
            
            const w1p1 = getPlayerById(winner1_2Team[0]);
            const w1p2 = getPlayerById(winner1_2Team[1]);
            const l1p1 = getPlayerById(loser1_2Team[0]);
            const l1p2 = getPlayerById(loser1_2Team[1]);
            
            if (w1p1 && w1p2) {
                teamStandings.push({
                    position: 1,
                    team: `${w1p1.name} ${w1p1.surname} / ${w1p2.name} ${w1p2.surname}`,
                    medal: '🥇',
                    bgColor: '#ffd700'
                });
            }
            if (l1p1 && l1p2) {
                teamStandings.push({
                    position: 2,
                    team: `${l1p1.name} ${l1p1.surname} / ${l1p2.name} ${l1p2.surname}`,
                    medal: '🥈',
                    bgColor: '#c0c0c0'
                });
            }
        }
        
        // Finalina 3°-4° (secondo match se presente)
        if (finalMatches.length > 1) {
            const finalina3_4 = finalMatches[1];
            if (finalina3_4 && finalina3_4.winner) {
                const winner3_4Team = finalina3_4.winner === 'team1' ? finalina3_4.team1 : finalina3_4.team2;
                const loser3_4Team = finalina3_4.winner === 'team1' ? finalina3_4.team2 : finalina3_4.team1;
                
                const w3p1 = getPlayerById(winner3_4Team[0]);
                const w3p2 = getPlayerById(winner3_4Team[1]);
                const l3p1 = getPlayerById(loser3_4Team[0]);
                const l3p2 = getPlayerById(loser3_4Team[1]);
                
                if (w3p1 && w3p2) {
                    teamStandings.push({
                        position: 3,
                        team: `${w3p1.name} ${w3p1.surname} / ${w3p2.name} ${w3p2.surname}`,
                        medal: '🥉',
                        bgColor: '#cd7f32'
                    });
                }
                if (l3p1 && l3p2) {
                    teamStandings.push({
                        position: 4,
                        team: `${l3p1.name} ${l3p1.surname} / ${l3p2.name} ${l3p2.surname}`,
                        medal: '',
                        bgColor: '#f5f5f5'
                    });
                }
            }
        }
        
        if (teamStandings.length > 0) {
            teamStandingsHtml = `
                <h3 style="font-size: 12px; font-weight: bold; margin: 24px 0 6px 0; padding: 4px 6px; background: #fff3e0; border-left: 4px solid #ff9800;">🏆 CLASSIFICA SQUADRE FINALE</h3>
                <table style="margin-bottom: 6px;">
                    <thead>
                        <tr style="height: 20px;">
                            <th style="text-align: center; font-size: 10px; padding: 4px 5px; width: 15%; height: 20px;">Posizione</th>
                            <th style="font-size: 10px; padding: 4px 5px; height: 20px;">Coppia</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teamStandings.map(entry => `
                            <tr style="background-color: ${entry.bgColor}; height: 20px;">
                                <td style="text-align: center; font-size: 10px; font-weight: bold; padding: 4px 5px; height: 20px;">
                                    ${entry.medal} ${entry.position}°
                                </td>
                                <td style="font-size: 10px; font-weight: bold; padding: 4px 5px; height: 20px;">
                                    ${entry.team}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }
    
    const individualStandingsHtml = individualStandings.map(entry => {
        return `
            <tr style="height: 20px;">
                <td style="text-align: center; width: 10%; font-size: 10px; padding: 4px 5px; height: 20px;">${entry.rank}°</td>
                <td style="width: 50%; font-size: 10px; padding: 4px 5px; height: 20px;">${entry.player.name} ${entry.player.surname}</td>
                <td style="text-align: center; width: 15%; font-size: 10px; padding: 4px 5px; height: 20px;">${entry.gamesWon}</td>
                <td style="text-align: center; width: 15%; font-size: 10px; padding: 4px 5px; height: 20px;">${entry.gamesLost}</td>
                <td style="text-align: center; width: 10%; font-size: 10px; padding: 4px 5px; height: 20px;">${entry.winPercentage.toFixed(1)}%</td>
            </tr>
        `;
    }).join('');
    
    const content = `
        <style>
            @page { size: A4; margin: 7mm 6mm; }
            body { font-family: 'Manrope', sans-serif; font-size: 10px; margin: 0; padding: 0; }
            h1 { font-size: 18px; margin: 0 0 4px 0; color: #2196f3; font-weight: bold; }
            h2 { font-size: 13px; margin: 0 0 3px 0; color: #666; }
            h3 { font-size: 12px; font-weight: bold; margin: 24px 0 6px 0; padding: 4px 6px; }
            table { width: 100%; border-collapse: collapse; margin: 6px 0 12px 0; font-size: 10px; }
            th { background-color: #2196f3; color: white; padding: 4px 5px; font-weight: bold; font-size: 10px; height: 20px; }
            td { padding: 4px 5px; border-bottom: 1px solid #e5e7eb; font-size: 10px; height: 20px; }
            tr { height: 20px; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 8px; color: #666; }
        </style>

        <div style="text-align: center; margin-bottom: 12px;">
            <h1>📦 ${tournament.name}</h1>
            <h2>${tournament.club} - Beat the Box</h2>
            <div style="color: #2196f3; font-size: 11px; font-weight: bold; margin: 3px 0 0 0;">
                ${new Date(tournament.date).toLocaleDateString('it-IT')}
            </div>
        </div>

        <div style="border-bottom: 2px solid #2196f3; margin: 10px 0 20px 0;"></div>

        ${boxesContent}
        
        ${semifinalsContent}
        
        ${finalsHtml}
        
        ${teamStandingsHtml}
        
        <h3 style="font-size: 12px; font-weight: bold; margin: 24px 0 6px 0; padding: 4px 6px; background: #e8f5e9; border-left: 4px solid #4caf50;">📊 CLASSIFICA INDIVIDUALE</h3>
        <table style="margin-bottom: 6px;">
            <thead>
                <tr style="height: 20px;">
                    <th style="text-align: center; font-size: 10px; padding: 4px 5px; height: 20px;">Pos</th>
                    <th style="font-size: 10px; padding: 4px 5px; height: 20px;">Giocatore</th>
                    <th style="text-align: center; font-size: 10px; padding: 4px 5px; height: 20px;">Games W</th>
                    <th style="text-align: center; font-size: 10px; padding: 4px 5px; height: 20px;">Games L</th>
                    <th style="text-align: center; font-size: 10px; padding: 4px 5px; height: 20px;">% Vitt.</th>
                </tr>
            </thead>
            <tbody>
                ${individualStandingsHtml}
            </tbody>
        </table>

        <div class="footer">
            <div style="text-align: left; margin-bottom: 4px;">
                Padel ELO Manager - Beat the Box @ Mattia Ianniello, 2025
            </div>
            <div style="text-align: right; font-size: 8px;">
                ${new Date().toLocaleDateString('it-IT')}, ${new Date().toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})}
            </div>
        </div>
    `;
    
    openPrintWindow(`Beat the Box Report - ${tournament.name}`, content);
};
