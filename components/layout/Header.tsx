
import React from 'react';
import { MenuIcon } from '../ui/Icons.tsx';
import ThemeToggle from '../ui/ThemeToggle.tsx';

interface HeaderProps {
    toggleSidebar: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, theme, toggleTheme }) => {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-md dark:border-b dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center">
                <button
                    onClick={toggleSidebar}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none md:hidden mr-4"
                    aria-label="Toggle sidebar"
                >
                    <MenuIcon />
                </button>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Padel ELO Manager</h1>
            </div>
            <div className="flex items-center">
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
        </header>
    );
};

export default Header;