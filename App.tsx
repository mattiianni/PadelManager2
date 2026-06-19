
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
import DashboardPage from './pages/DashboardPage.tsx';
import AdminPage from './pages/AdminPage.tsx';
import TeamTournamentMatchdayPage from './pages/TeamTournamentMatchdayPage.tsx';
import TeamTournamentSummaryPage from './pages/TeamTournamentSummaryPage.tsx';
import { MaterialIcon } from './components/ui/Icons.tsx';

type Page = 'Dashboard' | 'Ranking' | 'Players' | 'Matches' | 'Draw' | 'Tournaments' | 'Statistiche' | 'Admin' | 'TeamMatchday' | 'TeamSummary';
type Theme = 'light' | 'dark';
type DrawLaunchMode = 'launcher' | null;
const mobileNavPages: Array<{ id: Page; label: string; icon: string }> = [
    { id: 'Dashboard', label: 'Home', icon: 'home' },
    { id: 'Tournaments', label: 'Tornei', icon: 'emoji_events' },
    { id: 'Ranking', label: 'Classifiche', icon: 'leaderboard' },
    { id: 'Players', label: 'Giocatori', icon: 'groups' },
    { id: 'Statistiche', label: 'Statistiche', icon: 'query_stats' },
];

const App: React.FC = () => {
    const [activePage, setActivePage] = useState<Page>('Dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<Theme>('dark');
    const [tournamentToOpen, setTournamentToOpen] = useState<string | null>(null);
    const [newGiornataForTournament, setNewGiornataForTournament] = useState<string | null>(null);
    const [teamTournamentToConfigure, setTeamTournamentToConfigure] = useState<string | null>(null);
    const [teamTournamentRootForNewMatchday, setTeamTournamentRootForNewMatchday] = useState<string | null>(null);
    const [teamTournamentTournamentDayToOpen, setTeamTournamentTournamentDayToOpen] = useState<string | null>(null);
    const [teamTournamentFixtureToOpen, setTeamTournamentFixtureToOpen] = useState<string | null>(null);
    const [teamTournamentRootToSummarize, setTeamTournamentRootToSummarize] = useState<string | null>(null);
    const [drawLaunchMode, setDrawLaunchMode] = useState<DrawLaunchMode>(null);

    useEffect(() => {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDesktop = !(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
        const currentHour = new Date().getHours();
        const isDarkTime = currentHour >= 20 || currentHour < 8;

        let defaultTheme: Theme = prefersDark ? 'dark' : 'light';
        if (isDesktop && isDarkTime) {
            defaultTheme = 'dark';
        }
        setTheme(defaultTheme);
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        if (activePage !== 'Draw' && drawLaunchMode !== null) {
            setDrawLaunchMode(null);
        }
    }, [activePage, drawLaunchMode]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const handleNavigateToTournamentResults = (tournamentId: string) => {
        setTournamentToOpen(tournamentId);
        setActivePage('Matches');
    };

    const handleNavigateToNewGiornata = (tournamentName: string) => {
        setDrawLaunchMode(null);
        setTeamTournamentToConfigure(null);
        setTeamTournamentRootForNewMatchday(null);
        setTeamTournamentTournamentDayToOpen(null);
        setNewGiornataForTournament(tournamentName);
        setActivePage('Draw');
    };

    const handleOpenDrawLauncher = () => {
        setNewGiornataForTournament(null);
        setTeamTournamentToConfigure(null);
        setTeamTournamentRootForNewMatchday(null);
        setTeamTournamentTournamentDayToOpen(null);
        setTeamTournamentFixtureToOpen(null);
        setDrawLaunchMode('launcher');
        setActivePage('Draw');
    };

    const handleNavigateToTeamTournamentConfiguration = (tournamentId: string) => {
        setNewGiornataForTournament(null);
        setDrawLaunchMode(null);
        setTeamTournamentRootForNewMatchday(null);
        setTeamTournamentTournamentDayToOpen(null);
        setTeamTournamentToConfigure(tournamentId);
        setActivePage('Draw');
    };

    const handleNavigateToNewTeamTournamentMatchday = (rootTournamentId: string) => {
        setNewGiornataForTournament(null);
        setTeamTournamentToConfigure(null);
        setTeamTournamentTournamentDayToOpen(null);
        setTeamTournamentFixtureToOpen(null);
        setTeamTournamentRootForNewMatchday(rootTournamentId);
        setActivePage('TeamMatchday');
    };

    const handleNavigateToTeamTournamentFixture = (rootTournamentId: string, fixtureId: string) => {
        setNewGiornataForTournament(null);
        setTeamTournamentToConfigure(null);
        setTeamTournamentTournamentDayToOpen(null);
        setTeamTournamentRootForNewMatchday(rootTournamentId);
        setTeamTournamentFixtureToOpen(fixtureId);
        setActivePage('TeamMatchday');
    };

    const handleNavigateToTeamTournamentMatchdayResults = (tournamentDayId: string) => {
        setNewGiornataForTournament(null);
        setTeamTournamentToConfigure(null);
        setTeamTournamentRootForNewMatchday(null);
        setTeamTournamentTournamentDayToOpen(tournamentDayId);
        setTeamTournamentFixtureToOpen(null);
        setActivePage('TeamMatchday');
    };

    const handleNavigateToTeamTournamentSummary = (rootTournamentId: string) => {
        setNewGiornataForTournament(null);
        setTeamTournamentToConfigure(null);
        setTeamTournamentRootForNewMatchday(null);
        setTeamTournamentTournamentDayToOpen(null);
        setTeamTournamentFixtureToOpen(null);
        setTeamTournamentRootToSummarize(rootTournamentId);
        setActivePage('TeamSummary');
    };

    const handleNavigateToLastTournamentResults = () => {
        setActivePage('Matches');
    };

    const renderPage = () => {
        switch (activePage) {
            case 'Dashboard':
                return <DashboardPage onNavigateToResults={handleNavigateToLastTournamentResults} />;
            case 'Ranking':
                return <RankingPage theme={theme} />;
            case 'Players':
                return <PlayersPage />;
            case 'Matches':
                return (
                    <MatchesPage
                        tournamentToOpen={tournamentToOpen}
                        setTournamentToOpen={setTournamentToOpen}
                        onNavigateToTeamTournamentMatchdayResults={handleNavigateToTeamTournamentMatchdayResults}
                    />
                );
            case 'Draw':
                return (
                    <DrawPage
                        setActivePage={setActivePage}
                        newGiornataForTournament={newGiornataForTournament}
                        setNewGiornataForTournament={setNewGiornataForTournament}
                        teamTournamentToConfigure={teamTournamentToConfigure}
                        clearTeamTournamentToConfigure={() => setTeamTournamentToConfigure(null)}
                        launchMode={drawLaunchMode}
                        clearLaunchMode={() => setDrawLaunchMode(null)}
                    />
                );
            case 'Tournaments':
                return (
                    <TournamentsPage
                        setActivePage={setActivePage}
                        onOpenDrawLauncher={handleOpenDrawLauncher}
                        onNavigateToResults={handleNavigateToTournamentResults}
                        onNavigateToNewGiornata={handleNavigateToNewGiornata}
                        onNavigateToTeamTournamentConfiguration={handleNavigateToTeamTournamentConfiguration}
                        onNavigateToNewTeamTournamentMatchday={handleNavigateToNewTeamTournamentMatchday}
                        onNavigateToTeamTournamentFixture={handleNavigateToTeamTournamentFixture}
                        onNavigateToTeamTournamentMatchdayResults={handleNavigateToTeamTournamentMatchdayResults}
                        onNavigateToTeamTournamentSummary={handleNavigateToTeamTournamentSummary}
                    />
                );
            case 'TeamMatchday':
                return (
                    <TeamTournamentMatchdayPage
                        setActivePage={setActivePage}
                        rootTournamentId={teamTournamentRootForNewMatchday}
                        tournamentDayId={teamTournamentTournamentDayToOpen}
                        fixtureId={teamTournamentFixtureToOpen}
                        onNavigateToTeamTournamentSummary={handleNavigateToTeamTournamentSummary}
                        clearNavigationState={() => {
                            setTeamTournamentRootForNewMatchday(null);
                            setTeamTournamentTournamentDayToOpen(null);
                            setTeamTournamentFixtureToOpen(null);
                        }}
                    />
                );
            case 'TeamSummary':
                return (
                    <TeamTournamentSummaryPage
                        setActivePage={setActivePage}
                        rootTournamentId={teamTournamentRootToSummarize}
                        clearNavigationState={() => setTeamTournamentRootToSummarize(null)}
                    />
                );
            case 'Statistiche':
                return <StatistichePage />;
            case 'Admin':
                return <AdminPage />;
            default:
                return <DashboardPage onNavigateToResults={handleNavigateToLastTournamentResults} />;
        }
    };

    return (
        <PadelStoreProvider>
            <div className="app-shell app-grid flex h-full overflow-hidden">
                <Sidebar
                    activePage={activePage}
                    setActivePage={setActivePage}
                    isOpen={isSidebarOpen}
                    setIsOpen={setSidebarOpen}
                />
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <Header 
                        toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                        theme={theme}
                        toggleTheme={toggleTheme}
                    />
                    <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 pb-24 md:p-6 md:pb-6 lg:p-8 lg:pb-8">
                        <div className="fade-in mx-auto w-full max-w-[1600px]">
                            {renderPage()}
                        </div>
                    </main>
                    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex h-[72px] max-w-[760px] items-center justify-around rounded-t-[26px] border-t border-white/10 bg-[#0f172a]/90 px-3 backdrop-blur-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.35)] md:hidden">
                        {mobileNavPages.map((item) => {
                            const active = activePage === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setActivePage(item.id)}
                                    className={`flex min-w-0 flex-col items-center justify-center gap-1 px-2 text-[10px] font-medium transition-all ${active ? 'text-sky-300' : 'text-slate-500'}`}
                                >
                                    <MaterialIcon name={item.icon} filled={active} className={`text-[22px] ${active ? 'drop-shadow-[0_0_10px_rgba(14,165,233,0.45)]' : ''}`} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </PadelStoreProvider>
    );
};

export default App;
