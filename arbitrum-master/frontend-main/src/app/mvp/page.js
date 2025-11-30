'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import mockDataService from '../../utils/mockDataService';
import mockApiService from '../../utils/mockApiService';
import OpportunityCard from '../../components/OpportunityCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusIndicator from '../../components/StatusIndicator';

const MVPPage = () => {
    const { isConnected, walletAddress, connectWallet, signTransaction, submitTransaction } = useWallet();
    
    // State management
    const [dexData, setDexData] = useState(null);
    const [arbitrageData, setArbitrageData] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionStatus, setExecutionStatus] = useState(null);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [executionHistory, setExecutionHistory] = useState([]);
    const [selectedOpportunity, setSelectedOpportunity] = useState(null);

    // Load initial data
    useEffect(() => {
        loadDEXData();
        loadExecutionHistory();
    }, []);

    // Auto-refresh functionality
    useEffect(() => {
        let interval;
        if (autoRefresh) {
            interval = setInterval(() => {
                loadDEXData();
                runArbitrageAnalysis();
            }, 30000); // Refresh every 30 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    const loadDEXData = async () => {
        try {
            setError(null);
            const data = mockDataService.getDEXData();
            setDexData(data || null);
        } catch (error) {
            console.error('Error loading DEX data:', error);
            setError('Failed to load DEX data');
            setDexData(null);
        }
    };

    const loadExecutionHistory = async () => {
        try {
            const history = mockDataService.getExecutionHistory();
            setExecutionHistory(history || []);
        } catch (error) {
            console.error('Error loading execution history:', error);
            setExecutionHistory([]);
        }
    };

    const runArbitrageAnalysis = async () => {
        try {
            setIsAnalyzing(true);
            setError(null);
            
            // Simulate analysis delay
            await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
            
            const analysisData = mockDataService.getArbitrageAnalysis();
            setArbitrageData(analysisData || null);
            
        } catch (error) {
            console.error('Error running arbitrage analysis:', error);
            setError('Analysis failed');
            setArbitrageData(null);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const executeTrade = async (opportunity) => {
        if (!isConnected) {
            alert('Please connect your wallet first');
            return;
        }

        try {
            setIsExecuting(true);
            setSelectedOpportunity(opportunity);
            setExecutionStatus({ status: 'preparing', message: 'Preparing transaction...' });
            
            // Step 1: Validate opportunity
            setExecutionStatus({ status: 'validating', message: 'Validating opportunity...' });
            const validationResult = await mockApiService.validateOpportunity(opportunity, walletAddress);
            if (!validationResult.success || !validationResult.data.canExecute) {
                throw new Error(validationResult.data?.message || 'Opportunity validation failed');
            }
            
            // Step 2: Build transaction
            setExecutionStatus({ status: 'building', message: 'Building transaction...' });
            const buildResult = await mockApiService.buildTransaction(opportunity, walletAddress);
            if (!buildResult.success) {
                throw new Error(buildResult.message || 'Failed to build transaction');
            }
            
            // Step 3: Sign transaction
            setExecutionStatus({ status: 'signing', message: 'Please sign the transaction in your wallet...' });
            const signResult = await mockApiService.signTransaction(buildResult.data.transaction);
            if (!signResult.success) {
                throw new Error(signResult.message || 'Failed to sign transaction');
            }
            
            // Step 4: Submit transaction
            setExecutionStatus({ status: 'submitting', message: 'Submitting transaction...' });
            const submitResult = await mockApiService.submitTransaction(signResult.data);
            if (!submitResult.success) {
                throw new Error(submitResult.message || 'Failed to submit transaction');
            }
            
            // Step 5: Monitor transaction
            setExecutionStatus({ status: 'monitoring', message: 'Monitoring transaction...' });
            const monitorResult = await mockApiService.monitorTransaction(submitResult.data.transactionHash);
            if (!monitorResult.success) {
                throw new Error(monitorResult.message || 'Failed to monitor transaction');
            }
            
            const finalResult = monitorResult.data;
            
            if (finalResult.status === 'success') {
                setExecutionStatus({ 
                    status: 'success', 
                    message: 'Transaction executed successfully!',
                    txHash: finalResult.transactionHash,
                    profit: finalResult.profit
                });
                
                // Add to execution history
                setExecutionHistory(prev => [finalResult, ...prev.slice(0, 49)]);
                
                // Refresh data
                await loadDEXData();
                await runArbitrageAnalysis();
            } else {
                throw new Error(finalResult.error || 'Transaction failed');
            }
            
        } catch (error) {
            console.error('Trade execution failed:', error);
            setError(error.message);
            setExecutionStatus({ status: 'failed', message: error.message });
        } finally {
            setIsExecuting(false);
        }
    };

    const clearError = () => {
        setError(null);
    };

    const clearExecutionStatus = () => {
        setExecutionStatus(null);
        setSelectedOpportunity(null);
    };

    // Calculate statistics
    const getAnalysisStats = () => {
        if (!arbitrageData || !arbitrageData.opportunities) return null;
        
        return {
            totalOpportunities: arbitrageData.opportunities.length || 0,
            profitableOpportunities: arbitrageData.opportunities.filter(opp => opp && opp.isProfitableAfterFees).length || 0,
            averageProfit: arbitrageData.opportunities.reduce((sum, opp) => sum + (opp?.profitPercent || 0), 0) / (arbitrageData.opportunities.length || 1) || 0,
            analysisTime: arbitrageData.analysisTime || 0,
            timestamp: arbitrageData.timestamp
        };
    };

    const getExecutionStats = () => {
        if (!executionHistory || !Array.isArray(executionHistory)) {
            return {
                total: 0,
                successful: 0,
                failed: 0,
                successRate: 0,
                totalProfit: 0
            };
        }
        
        const successful = executionHistory.filter(exec => exec && exec.status === 'success').length;
        const failed = executionHistory.filter(exec => exec && exec.status === 'failed').length;
        const total = executionHistory.length;
        
        return {
            total,
            successful,
            failed,
            successRate: total > 0 ? (successful / total) * 100 : 0,
            totalProfit: executionHistory
                .filter(exec => exec && exec.status === 'success')
                .reduce((sum, exec) => sum + (exec.profit || 0), 0)
        };
    };

    const analysisStats = getAnalysisStats();
    const executionStats = getExecutionStats();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    🚀 MVP Arbitrage Bot
                                </h1>
                                <div className="flex items-center space-x-2 mt-1">
                                    <StatusIndicator 
                                        status={autoRefresh ? 'active' : 'inactive'} 
                                        size="small" 
                                        showText={false} 
                                    />
                                    <span className="text-sm text-white/80">
                                        {autoRefresh ? 'Auto-refresh ON' : 'Manual Mode'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            {!isConnected ? (
                                <button
                                    onClick={connectWallet}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                                >
                                    🔗 Connect Wallet
                                </button>
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <div className="text-sm text-white/80">
                                        {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
                                    </div>
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                </div>
                            )}
                            
                            <label className="flex items-center space-x-2 text-white">
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm">Auto-refresh</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Error Display */}
                {error && (
                    <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <p className="text-red-200">{error}</p>
                            <button
                                onClick={clearError}
                                className="text-red-300 hover:text-red-100"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Execution Status */}
                {executionStatus && (
                    <div className={`mb-6 rounded-lg p-4 ${
                        executionStatus.status === 'success' 
                            ? 'bg-green-500/20 border border-green-500/50' 
                            : executionStatus.status === 'failed'
                            ? 'bg-red-500/20 border border-red-500/50'
                            : 'bg-blue-500/20 border border-blue-500/50'
                    }`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className={`${
                                    executionStatus.status === 'success' 
                                        ? 'text-green-200' 
                                        : executionStatus.status === 'failed'
                                        ? 'text-red-200'
                                        : 'text-blue-200'
                                }`}>
                                    {executionStatus.message}
                                </p>
                                {executionStatus.txHash && (
                                    <p className="text-sm text-white/70 mt-1">
                                        TX: {executionStatus.txHash}
                                    </p>
                                )}
                                {executionStatus.profit && (
                                    <p className="text-sm text-green-300 mt-1">
                                        Profit: +{executionStatus.profit.toFixed(4)} XLM
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={clearExecutionStatus}
                                className="text-white/70 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* DEX Overview */}
                {dexData && (
                    <div className="mb-8 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                        <h2 className="text-xl font-bold text-white mb-4">📊 DEX Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl font-bold text-white">{dexData.assets.length}</div>
                                <div className="text-sm text-white/70">Total Assets</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl font-bold text-white">{dexData.pools.length}</div>
                                <div className="text-sm text-white/70">Trading Pairs</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl font-bold text-white">{(dexData.totalLiquidity / 1000000).toFixed(1)}M</div>
                                <div className="text-sm text-white/70">Total Liquidity (XLM)</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl font-bold text-white">{(dexData.totalVolume24h / 1000000).toFixed(1)}M</div>
                                <div className="text-sm text-white/70">24h Volume (XLM)</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analysis Controls */}
                <div className="mb-8 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-white">🔍 Arbitrage Analysis</h2>
                            <p className="text-sm text-white/70 mt-1">Real-time market analysis and opportunity detection</p>
                        </div>
                        <button
                            onClick={runArbitrageAnalysis}
                            disabled={isAnalyzing}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg"
                        >
                            {isAnalyzing ? (
                                <span className="flex items-center">
                                    <LoadingSpinner size="small" showText={false} />
                                    <span className="ml-2">Analyzing...</span>
                                </span>
                            ) : (
                                '🔍 Run Analysis'
                            )}
                        </button>
                    </div>
                    
                    {analysisStats && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl font-bold text-white">{analysisStats.totalOpportunities}</div>
                                <div className="text-sm text-white/70">Total Opportunities</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl font-bold text-green-400">{analysisStats.profitableOpportunities}</div>
                                <div className="text-sm text-white/70">Profitable</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl font-bold text-blue-400">{analysisStats.averageProfit.toFixed(2)}%</div>
                                <div className="text-sm text-white/70">Avg Profit</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl font-bold text-purple-400">{analysisStats.analysisTime}ms</div>
                                <div className="text-sm text-white/70">Analysis Time</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Opportunities Grid */}
                {isAnalyzing ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner 
                            size="large" 
                            text="Analyzing market opportunities..." 
                            className="text-center"
                        />
                    </div>
                ) : arbitrageData?.opportunities && arbitrageData.opportunities.length > 0 ? (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white">💰 Arbitrage Opportunities</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {arbitrageData.opportunities.map((opportunity, index) => (
                                <OpportunityCard
                                    key={index}
                                    opportunity={opportunity}
                                    onExecute={() => executeTrade(opportunity)}
                                    isConnected={isConnected}
                                    isExecuting={isExecuting}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-bold text-white mb-2">No Opportunities Found</h3>
                        <p className="text-white/70 mb-6">
                            Run an analysis to discover arbitrage opportunities in the market.
                        </p>
                        <button
                            onClick={runArbitrageAnalysis}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                        >
                            🔍 Run Analysis
                        </button>
                    </div>
                )}

                {/* Execution Statistics */}
                {executionStats && executionStats.total > 0 && (
                    <div className="mt-8 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                        <h3 className="text-lg font-bold text-white mb-4">📈 Execution Statistics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl font-bold text-white">{executionStats.total}</div>
                                <div className="text-sm text-white/70">Total Trades</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl font-bold text-green-400">{executionStats.successful}</div>
                                <div className="text-sm text-white/70">Successful</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl font-bold text-blue-400">{executionStats.successRate.toFixed(1)}%</div>
                                <div className="text-sm text-white/70">Success Rate</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-2xl font-bold text-purple-400">{executionStats.totalProfit.toFixed(2)}</div>
                                <div className="text-sm text-white/70">Total Profit (XLM)</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Trades */}
                {executionHistory && executionHistory.length > 0 && (
                    <div className="mt-8 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                        <h3 className="text-lg font-bold text-white mb-4">📋 Recent Trades</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {executionHistory.slice(0, 10).map((trade, index) => (
                                <div key={index} className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-2 h-2 rounded-full ${
                                            trade.status === 'success' ? 'bg-green-400' : 'bg-red-400'
                                        }`}></div>
                                        <div>
                                            <div className="text-sm text-white">
                                                {trade.opportunity && trade.opportunity.loop ? 
                                                    trade.opportunity.loop.join(' → ') : 
                                                    'Unknown Trade'
                                                }
                                            </div>
                                            <div className="text-xs text-white/50">
                                                {trade.timestamp ? new Date(trade.timestamp).toLocaleString() : 'Unknown Time'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-semibold ${
                                            trade.status === 'success' ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                            {trade.status === 'success' ? 
                                                `+${(trade.profit || 0).toFixed(4)} XLM` : 
                                                'Failed'
                                            }
                                        </div>
                                        <div className="text-xs text-white/50">
                                            Fees: {(trade.fees || 0).toFixed(4)} XLM
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MVPPage;
