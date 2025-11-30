'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((notification) => {
        const id = Date.now() + Math.random();
        const newNotification = {
            id,
            type: 'info', // info, success, warning, error
            title: '',
            message: '',
            duration: 5000, // 5 seconds default
            ...notification
        };

        setNotifications(prev => [...prev, newNotification]);

        // Auto remove notification after duration
        if (newNotification.duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, newNotification.duration);
        }

        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Convenience methods
    const notifySuccess = useCallback((title, message, duration = 5000) => {
        return addNotification({ type: 'success', title, message, duration });
    }, [addNotification]);

    const notifyError = useCallback((title, message, duration = 7000) => {
        return addNotification({ type: 'error', title, message, duration });
    }, [addNotification]);

    const notifyWarning = useCallback((title, message, duration = 6000) => {
        return addNotification({ type: 'warning', title, message, duration });
    }, [addNotification]);

    const notifyInfo = useCallback((title, message, duration = 5000) => {
        return addNotification({ type: 'info', title, message, duration });
    }, [addNotification]);

    const value = {
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        notifySuccess,
        notifyError,
        notifyWarning,
        notifyInfo
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <NotificationContainer />
        </NotificationContext.Provider>
    );
};

const NotificationContainer = () => {
    const { notifications, removeNotification } = useNotification();

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRemove={() => removeNotification(notification.id)}
                />
            ))}
        </div>
    );
};

const NotificationItem = ({ notification, onRemove }) => {
    const { type, title, message } = notification;

    const typeConfig = {
        success: {
            icon: '✅',
            bgColor: 'bg-green-500/90',
            borderColor: 'border-green-400',
            textColor: 'text-white'
        },
        error: {
            icon: '❌',
            bgColor: 'bg-red-500/90',
            borderColor: 'border-red-400',
            textColor: 'text-white'
        },
        warning: {
            icon: '⚠️',
            bgColor: 'bg-yellow-500/90',
            borderColor: 'border-yellow-400',
            textColor: 'text-white'
        },
        info: {
            icon: 'ℹ️',
            bgColor: 'bg-blue-500/90',
            borderColor: 'border-blue-400',
            textColor: 'text-white'
        }
    };

    const config = typeConfig[type] || typeConfig.info;

    return (
        <div className={`${config.bgColor} backdrop-blur-md rounded-lg p-4 border ${config.borderColor} shadow-xl transform transition-all duration-300 ease-in-out animate-slide-in-right`}>
            <div className="flex items-start space-x-3">
                <div className="text-lg">{config.icon}</div>
                <div className="flex-1 min-w-0">
                    {title && (
                        <h4 className={`${config.textColor} font-semibold text-sm mb-1`}>
                            {title}
                        </h4>
                    )}
                    <p className={`${config.textColor} text-sm opacity-90`}>
                        {message}
                    </p>
                </div>
                <button
                    onClick={onRemove}
                    className={`${config.textColor} hover:opacity-70 transition-opacity`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default NotificationProvider;
