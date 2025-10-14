
import React, { useState, useEffect } from 'react';
import { PadelStoreProvider } from './hooks/usePadelStore.tsx';
import Sidebar from './components/layout/Sidebar.tsx';
import Header from './components/layout/Header.tsx';
import RankingPage from './pages/RankingPage.tsx';
import PlayersPage from './pages/PlayersPage.tsx';
import MatchesPage from './pages/MatchesPage.tsx';
import DrawPage from './pages/DrawPage.tsx';
import TournamentsPage from './pages/TournamentsPage.tsx';
import StatistichePage from './pages/StatistichePage.tsx';

type Page = 'Ranking' | 'Players' | 'Matches' | 'Draw' | 'Tournaments' | 'Statistiche';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
    const [activePage, setActivePage] = useState<Page>('Tournaments');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<Theme>('dark');
    const [tournamentToOpen, setTournamentToOpen] = useState<string | null>(null);

    useEffect(() => {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const defaultTheme = prefersDark ? 'dark' : 'light';
        setTheme(defaultTheme);
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const handleNavigateToTournamentResults = (tournamentId: string) => {
        setTournamentToOpen(tournamentId);
        setActivePage('Matches');
    };

    const renderPage = () => {
        switch (activePage) {
            case 'Ranking':
                return <RankingPage theme={theme} />;
            case 'Players':
                return <PlayersPage />;
            case 'Matches':
                return <MatchesPage tournamentToOpen={tournamentToOpen} setTournamentToOpen={setTournamentToOpen} />;
            case 'Draw':
                return <DrawPage setActivePage={setActivePage} />;
            case 'Tournaments':
                return <TournamentsPage setActivePage={setActivePage} onNavigateToResults={handleNavigateToTournamentResults} />;
            case 'Statistiche':
                return <StatistichePage />;
            default:
                return <TournamentsPage setActivePage={setActivePage} onNavigateToResults={handleNavigateToTournamentResults} />;
        }
    };

    return (
        <PadelStoreProvider>
            <div className="flex h-screen">
                <Sidebar
                    activePage={activePage}
                    setActivePage={setActivePage}
                    isOpen={isSidebarOpen}
                    setIsOpen={setSidebarOpen}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header 
                        toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                        theme={theme}
                        toggleTheme={toggleTheme}
                    />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
                        <div className="fade-in">
                            {renderPage()}
                        </div>
                    </main>
                </div>
            </div>
        </PadelStoreProvider>
    );
};

export default App;