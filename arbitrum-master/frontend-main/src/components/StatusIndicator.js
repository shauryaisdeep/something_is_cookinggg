import React from 'react';

const StatusIndicator = ({ 
    status, 
    size = 'medium', 
    showText = true, 
    className = '' 
}) => {
    const statusConfig = {
        connected: {
            color: 'bg-green-400',
            text: 'Connected',
            textColor: 'text-green-400'
        },
        disconnected: {
            color: 'bg-red-400',
            text: 'Disconnected',
            textColor: 'text-red-400'
        },
        connecting: {
            color: 'bg-yellow-400 animate-pulse',
            text: 'Connecting',
            textColor: 'text-yellow-400'
        },
        active: {
            color: 'bg-blue-400',
            text: 'Active',
            textColor: 'text-blue-400'
        },
        inactive: {
            color: 'bg-gray-400',
            text: 'Inactive',
            textColor: 'text-gray-400'
        },
        loading: {
            color: 'bg-purple-400 animate-pulse',
            text: 'Loading',
            textColor: 'text-purple-400'
        },
        error: {
            color: 'bg-red-500',
            text: 'Error',
            textColor: 'text-red-500'
        },
        success: {
            color: 'bg-green-500',
            text: 'Success',
            textColor: 'text-green-500'
        },
        warning: {
            color: 'bg-yellow-500',
            text: 'Warning',
            textColor: 'text-yellow-500'
        }
    };

    const sizeClasses = {
        small: 'w-2 h-2',
        medium: 'w-3 h-3',
        large: 'w-4 h-4'
    };

    const textSizeClasses = {
        small: 'text-xs',
        medium: 'text-sm',
        large: 'text-base'
    };

    const config = statusConfig[status] || statusConfig.disconnected;

    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <div className={`${sizeClasses[size]} ${config.color} rounded-full`}></div>
            {showText && (
                <span className={`${textSizeClasses[size]} ${config.textColor} font-medium`}>
                    {config.text}
                </span>
            )}
        </div>
    );
};

export default StatusIndicator;
