
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${className}`}>
            {title && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{title}</div>
                </div>
            )}
            <div className="p-4 md:p-6">
                {children}
            </div>
        </div>
    );
};

export default Card;
