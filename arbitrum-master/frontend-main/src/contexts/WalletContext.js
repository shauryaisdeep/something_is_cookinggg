'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as StellarSDK from 'stellar-sdk';

const WalletContext = createContext();

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};

export const WalletProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState(null);
    const [balance, setBalance] = useState({});
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [network, setNetwork] = useState('testnet');

    // Initialize Stellar SDK
    const server = new StellarSDK.Horizon.Server('https://horizon-testnet.stellar.org');

    /**
     * Connect to Rabet wallet
     */
    const connectWallet = useCallback(async () => {
        try {
            setIsConnecting(true);
            setError(null);

            // Check if Rabet is available
            if (typeof window.rabet === 'undefined') {
                throw new Error('Rabet wallet not found. Please install Rabet extension.');
            }

            // Request connection
            const result = await window.rabet.connect();
            
            if (result && result.publicKey) {
                setWalletAddress(result.publicKey);
                setIsConnected(true);
                
                // Fetch initial balance
                await fetchBalance(result.publicKey);
                
                // Store connection in localStorage
                localStorage.setItem('walletAddress', result.publicKey);
                localStorage.setItem('isConnected', 'true');
                
                console.log('✅ Wallet connected:', result.publicKey);
            } else {
                throw new Error('Failed to connect to wallet');
            }

        } catch (error) {
            console.error('❌ Wallet connection error:', error);
            setError(error.message);
            setIsConnected(false);
            setWalletAddress(null);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    /**
     * Disconnect wallet
     */
    const disconnectWallet = useCallback(() => {
        setIsConnected(false);
        setWalletAddress(null);
        setBalance({});
        setError(null);
        
        // Clear localStorage
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('isConnected');
        
        console.log('🔌 Wallet disconnected');
    }, []);

    /**
     * Fetch wallet balance
     */
    const fetchBalance = useCallback(async (address) => {
        try {
            if (!address) return;

            const account = await server.loadAccount(address);
            const balances = {};

            account.balances.forEach(balance => {
                if (balance.asset_type === 'native') {
                    balances.XLM = parseFloat(balance.balance);
                } else {
                    balances[balance.asset_code] = parseFloat(balance.balance);
                }
            });

            setBalance(balances);
            return balances;

        } catch (error) {
            console.error('❌ Error fetching balance:', error);
            setError('Failed to fetch wallet balance');
            return {};
        }
    }, [server]);

    /**
     * Sign transaction
     */
    const signTransaction = useCallback(async (transactionXDR) => {
        try {
            if (!isConnected || !walletAddress) {
                throw new Error('Wallet not connected');
            }

            if (typeof window.rabet === 'undefined') {
                throw new Error('Rabet wallet not available');
            }

            // Sign transaction
            const result = await window.rabet.sign(transactionXDR);
            
            if (result && result.xdr) {
                console.log('✅ Transaction signed successfully');
                return result.xdr;
            } else {
                throw new Error('Failed to sign transaction');
            }

        } catch (error) {
            console.error('❌ Transaction signing error:', error);
            setError(error.message);
            throw error;
        }
    }, [isConnected, walletAddress]);

    /**
     * Create and sign a simple transaction
     */
    const createTransaction = useCallback(async (operations, memo = null) => {
        try {
            if (!isConnected || !walletAddress) {
                throw new Error('Wallet not connected');
            }

            // Load account
            const account = await server.loadAccount(walletAddress);
            
            // Create transaction builder
            const transaction = new StellarSDK.TransactionBuilder(account, {
                fee: StellarSDK.BASE_FEE,
                networkPassphrase: StellarSDK.Networks.TESTNET,
            });

            // Add operations
            operations.forEach(operation => {
                transaction.addOperation(operation);
            });

            // Add memo if provided
            if (memo) {
                transaction.addMemo(StellarSDK.Memo.text(memo));
            }

            // Set timeout
            transaction.setTimeout(30);

            // Build transaction
            const builtTransaction = transaction.build();
            
            // Convert to XDR
            const transactionXDR = builtTransaction.toXDR();
            
            // Sign transaction
            const signedXDR = await signTransaction(transactionXDR);
            
            return signedXDR;

        } catch (error) {
            console.error('❌ Transaction creation error:', error);
            setError(error.message);
            throw error;
        }
    }, [isConnected, walletAddress, server, signTransaction]);

    /**
     * Submit transaction to network
     */
    const submitTransaction = useCallback(async (signedXDR) => {
        try {
            // Parse signed transaction
            const transaction = StellarSDK.TransactionBuilder.fromXDR(signedXDR, StellarSDK.Networks.TESTNET);
            
            // Submit to network
            const result = await server.submitTransaction(transaction);
            
            console.log('✅ Transaction submitted:', result.hash);
            return result;

        } catch (error) {
            console.error('❌ Transaction submission error:', error);
            setError(error.message);
            throw error;
        }
    }, [server]);

    /**
     * Check if wallet is installed
     */
    const isWalletInstalled = useCallback(() => {
        return typeof window.rabet !== 'undefined';
    }, []);

    /**
     * Get wallet info
     */
    const getWalletInfo = useCallback(() => {
        return {
            isConnected,
            walletAddress,
            balance,
            network,
            isWalletInstalled: isWalletInstalled(),
            error
        };
    }, [isConnected, walletAddress, balance, network, isWalletInstalled, error]);

    /**
     * Refresh balance
     */
    const refreshBalance = useCallback(async () => {
        if (walletAddress) {
            await fetchBalance(walletAddress);
        }
    }, [walletAddress, fetchBalance]);

    /**
     * Initialize wallet connection on mount
     */
    useEffect(() => {
        const initializeWallet = async () => {
            try {
                const savedAddress = localStorage.getItem('walletAddress');
                const savedConnection = localStorage.getItem('isConnected');
                
                if (savedAddress && savedConnection === 'true') {
                    setWalletAddress(savedAddress);
                    setIsConnected(true);
                    await fetchBalance(savedAddress);
                }
            } catch (error) {
                console.error('❌ Wallet initialization error:', error);
                // Clear invalid saved data
                localStorage.removeItem('walletAddress');
                localStorage.removeItem('isConnected');
            }
        };

        initializeWallet();
    }, [fetchBalance]);

    /**
     * Listen for wallet events
     */
    useEffect(() => {
        const handleWalletEvent = (event) => {
            console.log('Wallet event:', event);
            
            switch (event.type) {
                case 'accountChanged':
                    if (event.publicKey !== walletAddress) {
                        disconnectWallet();
                    }
                    break;
                case 'disconnected':
                    disconnectWallet();
                    break;
                default:
                    break;
            }
        };

        if (typeof window.rabet !== 'undefined') {
            window.rabet.on('accountChanged', handleWalletEvent);
            window.rabet.on('disconnected', handleWalletEvent);
        }

        return () => {
            // Note: Rabet wallet API doesn't support removing event listeners
            // The event listeners will be cleaned up when the component unmounts
        };
    }, [walletAddress, disconnectWallet]);

    const value = {
        // State
        isConnected,
        walletAddress,
        balance,
        isConnecting,
        error,
        network,
        
        // Actions
        connectWallet,
        disconnectWallet,
        fetchBalance,
        signTransaction,
        createTransaction,
        submitTransaction,
        refreshBalance,
        
        // Utilities
        isWalletInstalled,
        getWalletInfo,
        
        // Server instance
        server
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};

export default WalletContext;
