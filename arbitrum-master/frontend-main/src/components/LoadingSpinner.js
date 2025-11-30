import React from 'react';

const LoadingSpinner = ({ 
    size = 'medium', 
    color = 'white', 
    text = 'Loading...', 
    showText = true,
    className = '' 
}) => {
    const sizeClasses = {
        small: 'h-4 w-4',
        medium: 'h-8 w-8',
        large: 'h-12 w-12',
        xlarge: 'h-16 w-16'
    };

    const textSizeClasses = {
        small: 'text-sm',
        medium: 'text-base',
        large: 'text-lg',
        xlarge: 'text-xl'
    };

    return (
        <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
            <div className={`animate-spin rounded-full border-2 border-transparent border-t-current ${sizeClasses[size]} ${color === 'white' ? 'text-white' : `text-${color}-500`}`}></div>
            {showText && (
                <p className={`${textSizeClasses[size]} ${color === 'white' ? 'text-white/70' : `text-${color}-400`} font-medium`}>
                    {text}
                </p>
            )}
        </div>
    );
};

export default LoadingSpinner;
