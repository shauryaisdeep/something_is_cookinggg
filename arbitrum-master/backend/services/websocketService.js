const WebSocket = require('ws');
const EventEmitter = require('events');

class WebSocketService extends EventEmitter {
    constructor(server) {
        super();
        this.server = server;
        this.wss = null;
        this.clients = new Map();
        this.heartbeatInterval = null;
        this.isRunning = false;
        
        // Configuration
        this.HEARTBEAT_INTERVAL = 30000; // 30 seconds
        this.CLIENT_TIMEOUT = 60000; // 60 seconds
        this.MAX_CLIENTS = 100;
        
        // Message types
        this.MESSAGE_TYPES = {
            HEARTBEAT: 'heartbeat',
            MARKET_DATA: 'market_data',
            ARBITRAGE_UPDATE: 'arbitrage_update',
            TRADE_EXECUTION: 'trade_execution',
            ERROR: 'error',
            SUBSCRIBE: 'subscribe',
            UNSUBSCRIBE: 'unsubscribe'
        };
    }

    /**
     * Initialize WebSocket server
     */
    initialize() {
        try {
            console.log('🔌 Initializing WebSocket server...');
            
            this.wss = new WebSocket.Server({
                server: this.server,
                path: '/ws',
                perMessageDeflate: false
            });

            this.wss.on('connection', (ws, req) => {
                this.handleConnection(ws, req);
            });

            this.wss.on('error', (error) => {
                console.error('❌ WebSocket server error:', error);
                this.emit('error', error);
            });

            // Start heartbeat
            this.startHeartbeat();
            
            this.isRunning = true;
            console.log('✅ WebSocket server initialized on /ws');
            
        } catch (error) {
            console.error('❌ Error initializing WebSocket server:', error);
            throw error;
        }
    }

    /**
     * Handle new WebSocket connection
     */
    handleConnection(ws, req) {
        const clientId = this.generateClientId();
        const clientInfo = {
            id: clientId,
            ws,
            ip: req.socket.remoteAddress,
            connectedAt: new Date(),
            lastHeartbeat: new Date(),
            subscriptions: new Set(),
            isAlive: true
        };

        // Check client limit
        if (this.clients.size >= this.MAX_CLIENTS) {
            console.warn(`⚠️ Max clients reached (${this.MAX_CLIENTS}), rejecting connection`);
            ws.close(1008, 'Server at capacity');
            return;
        }

        this.clients.set(clientId, clientInfo);
        console.log(`🔗 Client connected: ${clientId} (${clientInfo.ip})`);

        // Send welcome message
        this.sendToClient(clientId, {
            type: 'connection',
            message: 'Connected to Stellar Arbitrage Bot WebSocket',
            clientId,
            timestamp: new Date().toISOString()
        });

        // Handle messages
        ws.on('message', (data) => {
            this.handleMessage(clientId, data);
        });

        // Handle close
        ws.on('close', (code, reason) => {
            this.handleDisconnection(clientId, code, reason);
        });

        // Handle errors
        ws.on('error', (error) => {
            console.error(`❌ WebSocket error for client ${clientId}:`, error);
            this.handleDisconnection(clientId, 1006, 'Connection error');
        });

        // Handle pong (heartbeat response)
        ws.on('pong', () => {
            const client = this.clients.get(clientId);
            if (client) {
                client.lastHeartbeat = new Date();
                client.isAlive = true;
            }
        });

        this.emit('clientConnected', clientInfo);
    }

    /**
     * Handle incoming WebSocket message
     */
    handleMessage(clientId, data) {
        try {
            const message = JSON.parse(data.toString());
            const client = this.clients.get(clientId);
            
            if (!client) {
                console.warn(`⚠️ Message from unknown client: ${clientId}`);
                return;
            }

            console.log(`📨 Message from ${clientId}:`, message.type);

            switch (message.type) {
                case this.MESSAGE_TYPES.HEARTBEAT:
                    this.handleHeartbeat(clientId, message);
                    break;
                    
                case this.MESSAGE_TYPES.SUBSCRIBE:
                    this.handleSubscription(clientId, message);
                    break;
                    
                case this.MESSAGE_TYPES.UNSUBSCRIBE:
                    this.handleUnsubscription(clientId, message);
                    break;
                    
                default:
                    console.warn(`⚠️ Unknown message type: ${message.type}`);
                    this.sendToClient(clientId, {
                        type: this.MESSAGE_TYPES.ERROR,
                        message: `Unknown message type: ${message.type}`,
                        timestamp: new Date().toISOString()
                    });
            }
            
        } catch (error) {
            console.error(`❌ Error handling message from ${clientId}:`, error);
            this.sendToClient(clientId, {
                type: this.MESSAGE_TYPES.ERROR,
                message: 'Invalid message format',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Handle client heartbeat
     */
    handleHeartbeat(clientId, message) {
        const client = this.clients.get(clientId);
        if (client) {
            client.lastHeartbeat = new Date();
            client.isAlive = true;
            
            this.sendToClient(clientId, {
                type: this.MESSAGE_TYPES.HEARTBEAT,
                message: 'pong',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Handle client subscription
     */
    handleSubscription(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client) return;

        const { channel } = message;
        if (!channel) {
            this.sendToClient(clientId, {
                type: this.MESSAGE_TYPES.ERROR,
                message: 'Subscription channel required',
                timestamp: new Date().toISOString()
            });
            return;
        }

        client.subscriptions.add(channel);
        console.log(`📡 Client ${clientId} subscribed to: ${channel}`);

        this.sendToClient(clientId, {
            type: 'subscription_confirmed',
            channel,
            message: `Subscribed to ${channel}`,
            timestamp: new Date().toISOString()
        });

        this.emit('clientSubscribed', { clientId, channel });
    }

    /**
     * Handle client unsubscription
     */
    handleUnsubscription(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client) return;

        const { channel } = message;
        if (channel) {
            client.subscriptions.delete(channel);
            console.log(`📡 Client ${clientId} unsubscribed from: ${channel}`);
        } else {
            client.subscriptions.clear();
            console.log(`📡 Client ${clientId} unsubscribed from all channels`);
        }

        this.sendToClient(clientId, {
            type: 'unsubscription_confirmed',
            channel: channel || 'all',
            message: `Unsubscribed from ${channel || 'all channels'}`,
            timestamp: new Date().toISOString()
        });

        this.emit('clientUnsubscribed', { clientId, channel });
    }

    /**
     * Handle client disconnection
     */
    handleDisconnection(clientId, code, reason) {
        const client = this.clients.get(clientId);
        if (client) {
            console.log(`🔌 Client disconnected: ${clientId} (${code}: ${reason})`);
            this.clients.delete(clientId);
            this.emit('clientDisconnected', { clientId, code, reason });
        }
    }

    /**
     * Send message to specific client
     */
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client || !client.ws || client.ws.readyState !== WebSocket.OPEN) {
            return false;
        }

        try {
            const messageStr = JSON.stringify(message);
            client.ws.send(messageStr);
            return true;
        } catch (error) {
            console.error(`❌ Error sending message to ${clientId}:`, error);
            return false;
        }
    }

    /**
     * Broadcast message to all clients
     */
    broadcast(message, channel = null) {
        let sentCount = 0;
        
        this.clients.forEach((client, clientId) => {
            if (channel && !client.subscriptions.has(channel)) {
                return; // Skip if client not subscribed to channel
            }
            
            if (this.sendToClient(clientId, message)) {
                sentCount++;
            }
        });
        
        console.log(`📢 Broadcasted to ${sentCount} clients${channel ? ` (channel: ${channel})` : ''}`);
        return sentCount;
    }

    /**
     * Broadcast to clients subscribed to specific channel
     */
    broadcastToChannel(channel, message) {
        return this.broadcast(message, channel);
    }

    /**
     * Send market data update
     */
    sendMarketDataUpdate(data) {
        const message = {
            type: this.MESSAGE_TYPES.MARKET_DATA,
            data,
            timestamp: new Date().toISOString()
        };
        
        return this.broadcastToChannel('market_data', message);
    }

    /**
     * Send arbitrage opportunity update
     */
    sendArbitrageUpdate(opportunities) {
        const message = {
            type: this.MESSAGE_TYPES.ARBITRAGE_UPDATE,
            data: {
                opportunities,
                count: opportunities.length
            },
            timestamp: new Date().toISOString()
        };
        
        return this.broadcastToChannel('arbitrage', message);
    }

    /**
     * Send trade execution update
     */
    sendTradeExecutionUpdate(execution) {
        const message = {
            type: this.MESSAGE_TYPES.TRADE_EXECUTION,
            data: execution,
            timestamp: new Date().toISOString()
        };
        
        return this.broadcastToChannel('trades', message);
    }

    /**
     * Start heartbeat mechanism
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.clients.forEach((client, clientId) => {
                if (!client.isAlive) {
                    console.log(`💔 Terminating dead connection: ${clientId}`);
                    client.ws.terminate();
                    this.clients.delete(clientId);
                    return;
                }

                client.isAlive = false;
                client.ws.ping();
            });
        }, this.HEARTBEAT_INTERVAL);
    }

    /**
     * Stop heartbeat mechanism
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Generate unique client ID
     */
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get connected clients info
     */
    getClientsInfo() {
        const clients = [];
        
        this.clients.forEach((client, clientId) => {
            clients.push({
                id: clientId,
                ip: client.ip,
                connectedAt: client.connectedAt,
                lastHeartbeat: client.lastHeartbeat,
                subscriptions: Array.from(client.subscriptions),
                isAlive: client.isAlive
            });
        });
        
        return {
            total: clients.length,
            maxClients: this.MAX_CLIENTS,
            clients
        };
    }

    /**
     * Get server statistics
     */
    getStats() {
        return {
            isRunning: this.isRunning,
            totalClients: this.clients.size,
            maxClients: this.MAX_CLIENTS,
            uptime: this.isRunning ? Date.now() - this.startTime : 0,
            messageTypes: Object.keys(this.MESSAGE_TYPES)
        };
    }

    /**
     * Shutdown WebSocket server
     */
    shutdown() {
        console.log('🔌 Shutting down WebSocket server...');
        
        this.isRunning = false;
        this.stopHeartbeat();
        
        // Close all client connections
        this.clients.forEach((client, clientId) => {
            client.ws.close(1001, 'Server shutting down');
        });
        
        this.clients.clear();
        
        if (this.wss) {
            this.wss.close();
        }
        
        console.log('✅ WebSocket server shutdown complete');
    }
}

module.exports = WebSocketService;
