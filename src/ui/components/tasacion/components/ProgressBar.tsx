import React from 'react';

interface ProgressBarProps {
    progress: number;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = "" }) => {
    return (
        <div className={`w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner ${className}`}>
            <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
};
