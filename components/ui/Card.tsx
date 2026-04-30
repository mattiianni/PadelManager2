
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: React.ReactNode;
    bodyClassName?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, bodyClassName = '' }) => {
    return (
        <div className={`app-panel stitch-card rounded-[24px] overflow-hidden ${className}`}>
            {title && (
                <div className="border-b border-[var(--app-border)] px-4 py-4 md:px-6 md:py-5">
                    <div className="text-lg font-semibold tracking-tight text-app">{title}</div>
                </div>
            )}
            <div className={`p-4 md:p-6 ${bodyClassName}`}>
                {children}
            </div>
        </div>
    );
};

export default Card;
