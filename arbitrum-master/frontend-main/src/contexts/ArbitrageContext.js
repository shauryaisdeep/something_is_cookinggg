'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import apiService from '../utils/apiService';

const ArbitrageContext = createContext();

export const useArbitrage = () => {
    const context = useContext(ArbitrageContext);
    if (!context) {
        throw new Error('useArbitrage must be used within an ArbitrageProvider');
    }
    return context;
};

export const ArbitrageProvider = ({ children }) => {
    const [dexData, setDexData] = useState(null);
    const [arbitrageData, setArbitrageData] = useState(null);
    const [selectedOpportunity, setSelectedOpportunity] = useState(null);
    const [executionStatus, setExecutionStatus] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [error, setError] = useState(null);
    const [analysisHistory, setAnalysisHistory] = useState([]);
    const [executionHistory, setExecutionHistory] = useState([]);

    /**
     * Fetch DEX data
     */
    const fetchDEXData = useCallback(async () => {
        try {
            setError(null);
            const data = await apiService.fetchDEXData();
            setDexData(data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching DEX data:', error);
            setError(error.message);
            throw error;
        }
    }, []);

    /**
     * Run arbitrage analysis
     */
    const runArbitrageAnalysis = useCallback(async () => {
        try {
            setIsAnalyzing(true);
            setError(null);
            
            const analysisData = await apiService.runArbitrageAnalysis();
            setArbitrageData(analysisData);
            
            // Add to history
            setAnalysisHistory(prev => [analysisData, ...prev.slice(0, 9)]); // Keep last 10
            
            return analysisData;
        } catch (error) {
            console.error('❌ Error running arbitrage analysis:', error);
            setError(error.message);
            throw error;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    /**
     * Execute arbitrage trade
     */
    const executeTrade = useCallback(async (opportunity, walletAddress) => {
        try {
            setIsExecuting(true);
            setError(null);
            setExecutionStatus({ status: 'preparing', message: 'Preparing transaction...' });
            
            // Step 1: Validate opportunity
            setExecutionStatus({ status: 'validating', message: 'Validating opportunity...' });
            const validationResult = await apiService.validateOpportunity(opportunity, walletAddress);
            if (!validationResult.canExecute) {
                throw new Error(validationResult.message || 'Opportunity validation failed');
            }
            
            // Step 2: Build transaction
            setExecutionStatus({ status: 'building', message: 'Building transaction...' });
            const buildResult = await apiService.buildTransaction(opportunity, walletAddress);
            
            // Step 3: Sign transaction (this would be handled by wallet)
            setExecutionStatus({ status: 'signing', message: 'Please sign the transaction in your wallet...' });
            
            // Return transaction data for wallet signing
            return {
                transaction: buildResult.transaction,
                opportunity: buildResult.opportunity,
                fees: buildResult.fees
            };
            
        } catch (error) {
            console.error('❌ Error executing trade:', error);
            setError(error.message);
            setExecutionStatus({ status: 'failed', message: error.message });
            throw error;
        } finally {
            setIsExecuting(false);
        }
    }, []);

    /**
     * Submit signed transaction
     */
    const submitTransaction = useCallback(async (signedTransaction) => {
        try {
            setExecutionStatus({ status: 'submitting', message: 'Submitting transaction...' });
            
            const result = await apiService.submitTransaction(signedTransaction);
            
            setExecutionStatus({ 
                status: 'submitted', 
                message: 'Transaction submitted successfully',
                txHash: result.transactionHash
            });
            
            // Start monitoring
            monitorTransaction(result.transactionHash);
            
            return result;
            
        } catch (error) {
            console.error('❌ Error submitting transaction:', error);
            setError(error.message);
            setExecutionStatus({ status: 'failed', message: error.message });
            throw error;
        }
    }, []);

    /**
     * Monitor transaction execution
     */
    const monitorTransaction = useCallback(async (txHash) => {
        try {
            setExecutionStatus({ status: 'monitoring', message: 'Monitoring transaction...' });
            
            const maxAttempts = 30; // 60 seconds max
            let attempts = 0;
            
            const checkStatus = async () => {
                try {
                    const result = await apiService.monitorTransaction(txHash);
                    
                    const status = result.status;
                    
                    if (status === 'success') {
                        setExecutionStatus({ 
                            status: 'success', 
                            message: 'Transaction executed successfully!',
                            txHash,
                            result: result
                        });
                        
                        // Add to execution history
                        setExecutionHistory(prev => [result, ...prev.slice(0, 49)]); // Keep last 50
                        
                        return;
                    } else if (status === 'failed') {
                        setExecutionStatus({ 
                            status: 'failed', 
                            message: 'Transaction failed',
                            txHash,
                            error: result.error
                        });
                        return;
                    } else if (status === 'timeout') {
                        setExecutionStatus({ 
                            status: 'timeout', 
                            message: 'Transaction monitoring timed out',
                            txHash
                        });
                        return;
                    }
                    
                    // Continue monitoring
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(checkStatus, 2000); // Check every 2 seconds
                    } else {
                        setExecutionStatus({ 
                            status: 'timeout', 
                            message: 'Transaction monitoring timed out',
                            txHash
                        });
                    }
                    
                } catch (error) {
                    console.error('❌ Error monitoring transaction:', error);
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(checkStatus, 2000);
                    } else {
                        setExecutionStatus({ 
                            status: 'error', 
                            message: 'Error monitoring transaction',
                            txHash,
                            error: error.message
                        });
                    }
                }
            };
            
            checkStatus();
            
        } catch (error) {
            console.error('❌ Error starting transaction monitoring:', error);
            setError(error.message);
        }
    }, []);

    /**
     * Select opportunity
     */
    const selectOpportunity = useCallback((opportunity) => {
        setSelectedOpportunity(opportunity);
    }, []);

    /**
     * Clear selected opportunity
     */
    const clearSelectedOpportunity = useCallback(() => {
        setSelectedOpportunity(null);
    }, []);

    /**
     * Clear execution status
     */
    const clearExecutionStatus = useCallback(() => {
        setExecutionStatus(null);
    }, []);

    /**
     * Clear error
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Get analysis statistics
     */
    const getAnalysisStats = useCallback(() => {
        if (!arbitrageData) return null;
        
        return {
            totalOpportunities: arbitrageData.opportunities?.length || 0,
            profitableOpportunities: arbitrageData.opportunities?.filter(opp => opp.isProfitableAfterFees).length || 0,
            averageProfit: arbitrageData.opportunities?.reduce((sum, opp) => sum + opp.profitPercent, 0) / (arbitrageData.opportunities?.length || 1) || 0,
            analysisTime: arbitrageData.analysisTime,
            timestamp: arbitrageData.timestamp
        };
    }, [arbitrageData]);

    /**
     * Get execution statistics
     */
    const getExecutionStats = useCallback(() => {
        const successful = executionHistory.filter(exec => exec.status === 'success').length;
        const failed = executionHistory.filter(exec => exec.status === 'failed').length;
        const total = executionHistory.length;
        
        return {
            total,
            successful,
            failed,
            successRate: total > 0 ? (successful / total) * 100 : 0,
            totalProfit: executionHistory
                .filter(exec => exec.status === 'success')
                .reduce((sum, exec) => sum + (exec.profit || 0), 0)
        };
    }, [executionHistory]);

    /**
     * Reset all data
     */
    const reset = useCallback(() => {
        setDexData(null);
        setArbitrageData(null);
        setSelectedOpportunity(null);
        setExecutionStatus(null);
        setError(null);
        setAnalysisHistory([]);
        setExecutionHistory([]);
    }, []);

    const value = {
        // State
        dexData,
        arbitrageData,
        selectedOpportunity,
        executionStatus,
        isAnalyzing,
        isExecuting,
        error,
        analysisHistory,
        executionHistory,
        
        // Actions
        fetchDEXData,
        runArbitrageAnalysis,
        executeTrade,
        submitTransaction,
        monitorTransaction,
        selectOpportunity,
        clearSelectedOpportunity,
        clearExecutionStatus,
        clearError,
        reset,
        
        // Utilities
        getAnalysisStats,
        getExecutionStats
    };

    return (
        <ArbitrageContext.Provider value={value}>
            {children}
        </ArbitrageContext.Provider>
    );
};

export default ArbitrageContext;
