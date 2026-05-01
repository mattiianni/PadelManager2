
import React from 'react';
import { MaterialIcon } from '../ui/Icons.tsx';
import { useAuth } from '../../hooks/useAuth.tsx';

type Page = 'Dashboard' | 'Ranking' | 'Players' | 'Matches' | 'Draw' | 'Tournaments' | 'Statistiche' | 'Admin' | 'TeamMatchday';

interface SidebarProps {
    activePage: Page;
    setActivePage: (page: Page) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
    icon: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
    const itemClassName = isActive
        ? 'bg-sky-500/12 text-sky-300 border-sky-300/30 font-semibold shadow-[0_18px_35px_rgba(14,165,233,0.14)] md:border-sky-300/90 md:bg-[linear-gradient(135deg,rgba(137,206,255,0.22),rgba(255,255,255,0.72))] md:text-sky-700 md:shadow-[0_18px_38px_rgba(137,206,255,0.22)] dark:md:border-sky-300/30 dark:md:bg-sky-500/12 dark:md:text-sky-300 dark:md:shadow-[0_18px_35px_rgba(14,165,233,0.14)]'
        : 'text-slate-400 border-transparent hover:border-white/10 hover:bg-white/5 hover:text-white md:text-app-soft md:hover:border-[var(--app-border-strong)] md:hover:bg-white/45 md:hover:text-app dark:md:text-slate-400 dark:md:hover:border-white/10 dark:md:hover:bg-white/5 dark:md:hover:text-white';

    const iconClassName = isActive
        ? 'bg-sky-400/10 md:bg-sky-100 dark:md:bg-sky-400/10'
        : 'bg-white/5 md:bg-slate-100/85 dark:md:bg-white/5';

    return (
        <li>
            <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    onClick();
                }}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 ${itemClassName}`}
            >
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconClassName}`}>
                    <MaterialIcon name={icon} filled={isActive} className="text-[22px]" />
                </span>
                <span>{label}</span>
            </a>
        </li>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isOpen, setIsOpen }) => {
    const { isAdmin } = useAuth();

    const navItems: { id: Page; label: string; icon: string }[] = [
        { id: 'Dashboard', label: 'Home', icon: 'home' },
        { id: 'Tournaments', label: 'Tornei', icon: 'emoji_events' },
        { id: 'Ranking', label: 'Classifiche', icon: 'leaderboard' },
        { id: 'Players', label: 'Giocatori', icon: 'groups' },
        { id: 'Matches', label: 'Risultati', icon: 'sports_score' },
        { id: 'Draw', label: 'Sorteggi', icon: 'shuffle' },
        { id: 'Statistiche', label: 'Statistiche', icon: 'query_stats' },
        ...(isAdmin ? [{ id: 'Admin' as Page, label: 'Admin', icon: 'admin_panel_settings' }] : []),
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
                className={`fixed inset-0 z-30 bg-[#020817]/75 backdrop-blur-sm md:hidden transition-opacity ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsOpen(false)}
            ></div>

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 flex h-full w-[min(82vw,300px)] flex-col border-r border-white/10 bg-[#020817]/96 text-app shadow-2xl backdrop-blur-[28px] transform transition-transform md:relative md:m-3 md:mr-0 md:w-72 md:translate-x-0 md:rounded-[26px] md:border md:border-[var(--app-border)] md:bg-[var(--app-surface)] md:shadow-[var(--app-shadow-soft)] ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between border-b border-white/10 px-5 pb-5 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] md:border-[var(--app-border)] md:p-5">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-sky-300 md:text-sky-400 dark:md:text-sky-300">Elo Manager</p>
                        <h2 className="text-2xl font-black tracking-tight text-white md:text-app dark:md:text-white">Menu</h2>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="md:hidden rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white">
                        <MaterialIcon name="close" className="text-[20px]" />
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
