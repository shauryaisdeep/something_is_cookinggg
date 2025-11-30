import React from 'react';
import { useWallet } from '../contexts/WalletContext';

const WalletConnection = () => {
    const {
        isConnected,
        walletAddress,
        balance,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        isWalletInstalled,
        getWalletInfo
    } = useWallet();

    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    const formatBalance = (balance) => {
        if (!balance || Object.keys(balance).length === 0) return '0.00';
        
        const xlmBalance = balance.XLM || 0;
        return xlmBalance.toFixed(2);
    };

    if (!isWalletInstalled()) {
        return (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                    <div className="text-2xl">⚠️</div>
                    <div>
                        <h3 className="text-red-200 font-semibold">Rabet Wallet Not Found</h3>
                        <p className="text-red-300 text-sm">
                            Please install the Rabet wallet extension to connect your wallet.
                        </p>
                        <a
                            href="https://rabet.io/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-200 hover:text-red-100 underline text-sm"
                        >
                            Install Rabet →
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    if (isConnected) {
        return (
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <div>
                            <div className="text-white font-semibold">
                                {formatAddress(walletAddress)}
                            </div>
                            <div className="text-white/70 text-sm">
                                {formatBalance(balance)} XLM
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={disconnectWallet}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                            Disconnect
                        </button>
                    </div>
                </div>
                
                {error && (
                    <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <div>
                        <div className="text-white font-semibold">Wallet Not Connected</div>
                        <div className="text-white/70 text-sm">
                            Connect your Rabet wallet to start trading
                        </div>
                    </div>
                </div>
                
                <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100"
                >
                    {isConnecting ? (
                        <span className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Connecting...
                        </span>
                    ) : (
                        'Connect Wallet'
                    )}
                </button>
            </div>
            
            {error && (
                <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
};

export default WalletConnection;
