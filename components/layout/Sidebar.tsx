
import React from 'react';
import { ChartBarIcon, UsersIcon, TableIcon, ShuffleIcon, TrophyIcon, StatsIcon, XIcon } from '../ui/Icons.tsx';

type Page = 'Ranking' | 'Players' | 'Matches' | 'Draw' | 'Tournaments' | 'Statistiche';

interface SidebarProps {
    activePage: Page;
    setActivePage: (page: Page) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <li>
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive
                    ? 'bg-sky-600 text-white font-semibold shadow-inner'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
            {icon}
            <span className="ml-3">{label}</span>
        </a>
    </li>
);

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isOpen, setIsOpen }) => {
    const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
        { id: 'Tournaments', label: 'Tornei', icon: <TrophyIcon /> },
        { id: 'Ranking', label: 'Classifiche', icon: <ChartBarIcon /> },
        { id: 'Players', label: 'Giocatori', icon: <UsersIcon /> },
        { id: 'Matches', label: 'Risultati', icon: <TableIcon /> },
        { id: 'Draw', label: 'Sorteggi', icon: <ShuffleIcon /> },
        { id: 'Statistiche', label: 'Statistiche', icon: <StatsIcon /> },
    ];

    const handleNavigation = (page: Page) => {
        setActivePage(page);
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    };

    return (
        <>
            {/* Overlay for mobile */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsOpen(false)}
            ></div>

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex flex-col z-40 transform transition-transform md:relative md:translate-x-0 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold">Menu</h2>
                    <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <XIcon />
                    </button>
                </div>
                <nav className="flex-1 p-4">
                    <ul className="space-y-2">
                        {navItems.map((item) => (
                            <NavItem
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                isActive={activePage === item.id}
                                onClick={() => handleNavigation(item.id)}
                            />
                        ))}
                    </ul>
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;