import React from 'react';

interface ProgressBarProps {
    progress: number;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = "" }) => {
    return (
        <div className={`w-full bg-[var(--color-paper-4)] rounded-full h-2.5 overflow-hidden shadow-inner ${className}`}>
            <div
                className="bg-[var(--color-accent)] h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
};
