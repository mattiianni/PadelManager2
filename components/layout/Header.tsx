
import React from 'react';
import ThemeToggle from '../ui/ThemeToggle.tsx';
import { useAuth } from '../../hooks/useAuth.tsx';
import { APP_VERSION } from '../../constants.ts';

interface HeaderProps {
    toggleSidebar: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, theme, toggleTheme }) => {
    const { logout, workspace } = useAuth();

    return (
        <header className="sticky top-0 z-20 px-4 pt-[calc(env(safe-area-inset-top,0px)+0.25rem)] md:px-6 lg:px-8 lg:pt-[calc(env(safe-area-inset-top,0px)+0.45rem)]">
            <div className="rounded-[24px] border border-white/10 bg-[#0f172a]/88 px-4 py-3 shadow-[0_20px_45px_rgba(2,6,23,0.35)] backdrop-blur-[30px] md:px-6 md:py-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start">
                        <button
                            onClick={toggleSidebar}
                            className="mr-4 rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 focus:outline-none md:hidden"
                            aria-label="Toggle sidebar"
                        >
                            <span className="material-symbols-outlined text-[22px]">menu</span>
                        </button>
                        <div className="min-w-0 flex-1">
                            <div className="mb-1">
                                <h1 className="text-[1.62rem] font-black leading-none tracking-tight text-sky-500 dark:text-sky-300 sm:text-[1.78rem] md:text-[2.25rem]">
                                    Padel Elo Manager
                                </h1>
                            </div>
                            <div className="grid grid-cols-1 gap-1 text-xs leading-tight text-slate-400 md:grid-cols-[auto_auto] md:items-center md:gap-3">
                                <p>v{APP_VERSION} / Apr 2026</p>
                                {workspace && (
                                    <p className="truncate text-sky-300">
                                        {workspace.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                        <ThemeToggle theme={theme} onToggle={toggleTheme} />
                        <button
                            onClick={logout}
                            className="rounded-xl border border-white/10 bg-white/5 p-[0.55rem] text-slate-400 transition-colors hover:bg-red-500/12 hover:text-red-300"
                            title="Esci"
                            aria-label="Logout"
                        >
                            <span className="flex h-[1.125rem] w-[1.125rem] items-center justify-center">
                                <span className="material-symbols-outlined text-[1.125rem]">logout</span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
