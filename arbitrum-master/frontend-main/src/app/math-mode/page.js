'use client';

import React, { useState, useEffect } from 'react';
import ArbitrageBot from '../../components/ArbitrageBot';
import WalletConnection from '../../components/WalletConnection';
import { useWallet } from '../../contexts/WalletContext';
import { useRealtime } from '../../contexts/RealtimeContext';

const MathMode = () => {
    const { isConnected, walletAddress } = useWallet();
    const { isConnected: wsConnected, isRealtimeActive } = useRealtime();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading time
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold text-white mb-2">Loading Arbitrage Bot</h2>
                    <p className="text-white/70">Initializing trading system...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            {/* Status Bar */}
            <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-2">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                <span className="text-xs text-white/70">
                                    WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${isRealtimeActive ? 'bg-blue-400' : 'bg-gray-400'}`}></div>
                                <span className="text-xs text-white/70">
                                    Real-time: {isRealtimeActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-purple-400' : 'bg-gray-400'}`}></div>
                                <span className="text-xs text-white/70">
                                    Wallet: {isConnected ? formatAddress(walletAddress) : 'Not Connected'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="text-xs text-white/50">
                            Network: Testnet | Mode: Math Mode
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <ArbitrageBot />

            {/* Floating Wallet Connection */}
            {!isConnected && (
                <div className="fixed bottom-4 right-4 z-50">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-2xl max-w-sm">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="text-2xl">🔗</div>
                            <div>
                                <h3 className="text-white font-semibold">Connect Wallet</h3>
                                <p className="text-white/70 text-sm">Connect your Rabet wallet to start trading</p>
                            </div>
                        </div>
                        <WalletConnection />
                    </div>
                </div>
            )}

            {/* Help Button */}
            <div className="fixed bottom-4 left-4 z-50">
                <button
                    onClick={() => {
                        // Open help modal or documentation
                        window.open('https://github.com/your-repo/stellar-arbitrage-bot#readme', '_blank');
                    }}
                    className="bg-white/10 backdrop-blur-md rounded-full p-3 border border-white/20 hover:bg-white/20 transition-colors"
                    title="Help & Documentation"
                >
                    <div className="text-white text-xl">❓</div>
                </button>
            </div>

            {/* Network Status */}
            <div className="fixed top-4 right-4 z-50">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-white text-sm font-medium">Testnet</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function to format address
const formatAddress = (address) => {
    if (!address) return 'Not Connected';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export default MathMode;
