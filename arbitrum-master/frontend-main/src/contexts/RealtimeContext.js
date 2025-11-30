"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const RealtimeContext = createContext();

export const useRealtime = () => {
    const context = useContext(RealtimeContext);
    if (!context) {
        throw new Error('useRealtime must be used within a RealtimeProvider');
    }
    return context;
};

export const RealtimeProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isRealtimeActive, setIsRealtimeActive] = useState(false);
    const [marketData, setMarketData] = useState({});
    const [arbitrageOpportunities, setArbitrageOpportunities] = useState([]);
    const [tradeExecutions, setTradeExecutions] = useState([]);
    const [cacheStats, setCacheStats] = useState(null);
    const [error, setError] = useState(null);
    const [lastMessage, setLastMessage] = useState(null);
    
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000;

    /**
     * Connect to WebSocket
     */
    const connectWebSocket = useCallback(() => {
        try {
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws';
            const ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log('🔌 WebSocket connected');
                setIsConnected(true);
                setError(null);
                reconnectAttempts.current = 0;
                
                // Start heartbeat
                startHeartbeat();
                
                // Subscribe to default channels
                subscribeToChannels(['market_data', 'arbitrage', 'trades']);
            };
            
            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    setLastMessage(message);
                    handleWebSocketMessage(message);
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                }
            };
            
            ws.onclose = (event) => {
                console.log('🔌 WebSocket disconnected:', event.code, event.reason);
                setIsConnected(false);
                stopHeartbeat();
                
                // Attempt to reconnect if not a manual close
                if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
                    scheduleReconnect();
                }
            };
            
            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                setError('WebSocket connection error');
            };
            
            wsRef.current = ws;
            
        } catch (error) {
            console.error('❌ WebSocket connection error:', error);
            setError('Failed to connect to WebSocket');
        }
    }, []);

    /**
     * Disconnect WebSocket
     */
    const disconnectWebSocket = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close(1000, 'Manual disconnect');
            wsRef.current = null;
        }
        setIsConnected(false);
        stopHeartbeat();
        clearReconnectTimeout();
    }, []);

    /**
     * Handle WebSocket messages
     */
    const handleWebSocketMessage = useCallback((message) => {
        switch (message.type) {
            case 'market_data':
                setMarketData(prev => ({
                    ...prev,
                    [message.data.pair]: {
                        ...message.data,
                        timestamp: new Date().toISOString()
                    }
                }));
                break;
                
            case 'arbitrage_update':
                setArbitrageOpportunities(message.data.opportunities || []);
                break;
                
            case 'trade_execution':
                setTradeExecutions(prev => [message.data, ...prev.slice(0, 49)]); // Keep last 50
                break;
                
            case 'cache_stats':
                setCacheStats(message.data);
                break;
                
            case 'heartbeat':
                // Respond to heartbeat
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        type: 'heartbeat',
                        message: 'pong',
                        timestamp: new Date().toISOString()
                    }));
                }
                break;
                
            case 'error':
                setError(message.message);
                break;
                
            default:
                console.log('📨 Unknown message type:', message.type);
        }
    }, []);

    /**
     * Subscribe to channels
     */
    const subscribeToChannels = useCallback((channels) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            channels.forEach(channel => {
                wsRef.current.send(JSON.stringify({
                    type: 'subscribe',
                    channel,
                    timestamp: new Date().toISOString()
                }));
            });
        }
    }, []);

    /**
     * Unsubscribe from channels
     */
    const unsubscribeFromChannels = useCallback((channels) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            channels.forEach(channel => {
                wsRef.current.send(JSON.stringify({
                    type: 'unsubscribe',
                    channel,
                    timestamp: new Date().toISOString()
                }));
            });
        }
    }, []);

    /**
     * Start real-time updates
     */
    const startRealtimeUpdates = useCallback(async () => {
        try {
            if (!isConnected) {
                connectWebSocket();
            }
            
            setIsRealtimeActive(true);
            
            // Subscribe to all channels
            subscribeToChannels(['market_data', 'arbitrage', 'trades']);
            
            console.log('🚀 Real-time updates started');
            
        } catch (error) {
            console.error('❌ Error starting real-time updates:', error);
            setError('Failed to start real-time updates');
        }
    }, [isConnected, connectWebSocket, subscribeToChannels]);

    /**
     * Stop real-time updates
     */
    const stopRealtimeUpdates = useCallback(async () => {
        try {
            setIsRealtimeActive(false);
            
            // Unsubscribe from all channels
            unsubscribeFromChannels(['market_data', 'arbitrage', 'trades']);
            
            console.log('🛑 Real-time updates stopped');
            
        } catch (error) {
            console.error('❌ Error stopping real-time updates:', error);
            setError('Failed to stop real-time updates');
        }
    }, [unsubscribeFromChannels]);

    /**
     * Start heartbeat
     */
    const startHeartbeat = useCallback(() => {
        heartbeatIntervalRef.current = setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'heartbeat',
                    message: 'ping',
                    timestamp: new Date().toISOString()
                }));
            }
        }, 30000); // 30 seconds
    }, []);

    /**
     * Stop heartbeat
     */
    const stopHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
    }, []);

    /**
     * Schedule reconnect
     */
    const scheduleReconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectAttempts.current += 1;
        const delay = reconnectDelay * Math.pow(2, reconnectAttempts.current - 1); // Exponential backoff
        
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
        }, delay);
    }, [connectWebSocket]);

    /**
     * Clear reconnect timeout
     */
    const clearReconnectTimeout = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    }, []);

    /**
     * Get market data for a specific pair
     */
    const getMarketData = useCallback((pair) => {
        return marketData[pair] || null;
    }, [marketData]);

    /**
     * Get latest arbitrage opportunities
     */
    const getLatestOpportunities = useCallback((limit = 10) => {
        return arbitrageOpportunities.slice(0, limit);
    }, [arbitrageOpportunities]);

    /**
     * Get latest trade executions
     */
    const getLatestTrades = useCallback((limit = 10) => {
        return tradeExecutions.slice(0, limit);
    }, [tradeExecutions]);

    /**
     * Clear error
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Get connection status
     */
    const getConnectionStatus = useCallback(() => {
        return {
            isConnected,
            isRealtimeActive,
            reconnectAttempts: reconnectAttempts.current,
            maxReconnectAttempts,
            lastMessage: lastMessage?.timestamp,
            error
        };
    }, [isConnected, isRealtimeActive, reconnectAttempts, lastMessage, error]);

    /**
     * Initialize WebSocket connection on mount
     */
    useEffect(() => {
        // Auto-connect on mount
        connectWebSocket();
        
        return () => {
            disconnectWebSocket();
        };
    }, [connectWebSocket, disconnectWebSocket]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            stopHeartbeat();
            clearReconnectTimeout();
        };
    }, [stopHeartbeat, clearReconnectTimeout]);

    const value = {
        // State
        isConnected,
        isRealtimeActive,
        marketData,
        arbitrageOpportunities,
        tradeExecutions,
        cacheStats,
        error,
        lastMessage,
        
        // Actions
        connectWebSocket,
        disconnectWebSocket,
        startRealtimeUpdates,
        stopRealtimeUpdates,
        subscribeToChannels,
        unsubscribeFromChannels,
        clearError,
        
        // Utilities
        getMarketData,
        getLatestOpportunities,
        getLatestTrades,
        getConnectionStatus
    };

    return (
        <RealtimeContext.Provider value={value}>
            {children}
        </RealtimeContext.Provider>
    );
};

export default RealtimeContext;
