import React, { useState, useEffect } from 'react';
import { useArbitrage } from '../contexts/ArbitrageContext';
import { useWallet } from '../contexts/WalletContext';
import { useRealtime } from '../contexts/RealtimeContext';
import OpportunityCard from './OpportunityCard';
import ExecutionMonitor from './ExecutionMonitor';
import ProfitTracker from './ProfitTracker';
import DEXOverview from './DEXOverview';
import LoadingSpinner from './LoadingSpinner';
import StatusIndicator from './StatusIndicator';

const ArbitrageBot = () => {
    const {
        dexData,
        arbitrageData,
        selectedOpportunity,
        executionStatus,
        isAnalyzing,
        isExecuting,
        error,
        fetchDEXData,
        runArbitrageAnalysis,
        executeTrade,
        selectOpportunity,
        clearError,
        getAnalysisStats,
        getExecutionStats
    } = useArbitrage();

    const { isConnected, walletAddress, signTransaction, submitTransaction } = useWallet();
    const { isRealtimeActive, startRealtimeUpdates, stopRealtimeUpdates } = useRealtime();

    const [activeTab, setActiveTab] = useState('overview');
    const [autoRefresh, setAutoRefresh] = useState(false);

    // Fetch DEX data on component mount
    useEffect(() => {
        fetchDEXData();
    }, [fetchDEXData]);

    // Auto-refresh functionality
    useEffect(() => {
        let interval;
        if (autoRefresh && isRealtimeActive) {
            interval = setInterval(() => {
                fetchDEXData();
            }, 30000); // Refresh every 30 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh, isRealtimeActive, fetchDEXData]);

    const handleRunAnalysis = async () => {
        try {
            await runArbitrageAnalysis();
        } catch (error) {
            console.error('Analysis failed:', error);
        }
    };

    const handleExecuteTrade = async (opportunity) => {
        if (!isConnected) {
            alert('Please connect your wallet first');
            return;
        }

        try {
            selectOpportunity(opportunity);
            
            // Execute trade
            const transactionData = await executeTrade(opportunity, walletAddress);
            
            // Sign transaction
            const signedTransaction = await signTransaction(transactionData.transaction);
            
            // Submit transaction
            await submitTransaction(signedTransaction);
            
        } catch (error) {
            console.error('Trade execution failed:', error);
        }
    };

    const handleToggleRealtime = () => {
        if (isRealtimeActive) {
            stopRealtimeUpdates();
        } else {
            startRealtimeUpdates();
        }
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
                                    🤖 Stellar Arbitrage Bot
                                </h1>
                                <div className="flex items-center space-x-2 mt-1">
                                    <StatusIndicator 
                                        status={isRealtimeActive ? 'active' : 'inactive'} 
                                        size="small" 
                                        showText={false} 
                                    />
                                    <span className="text-sm text-white/80">
                                        {isRealtimeActive ? 'Live Trading' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleToggleRealtime}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    isRealtimeActive
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                            >
                                {isRealtimeActive ? 'Stop Live' : 'Start Live'}
                            </button>
                            
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

            {/* Navigation Tabs */}
            <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'overview', label: 'DEX Overview', icon: '📊' },
                            { id: 'analysis', label: 'Arbitrage Analysis', icon: '🔍' },
                            { id: 'execution', label: 'Trade Execution', icon: '⚡' },
                            { id: 'history', label: 'History', icon: '📈' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-purple-400 text-purple-400'
                                        : 'border-transparent text-white/70 hover:text-white hover:border-white/30'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
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

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <DEXOverview dexData={dexData} />
                    </div>
                )}

                {activeTab === 'analysis' && (
                    <div className="space-y-6">
                        {/* Analysis Controls */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Advanced Arbitrage Analysis</h2>
                                    <p className="text-sm text-white/70 mt-1">Real-time market analysis and opportunity detection</p>
                                </div>
                                <button
                                    onClick={handleRunAnalysis}
                                    disabled={isAnalyzing}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg"
                                >
                                    {isAnalyzing ? (
                                        <span className="flex items-center">
                                            <LoadingSpinner size="small" showText={false} />
                                            <span className="ml-2">Analyzing...</span>
                                        </span>
                                    ) : (
                                        '🔍 Run Complete Analysis'
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
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {arbitrageData.opportunities.map((opportunity, index) => (
                                    <OpportunityCard
                                        key={index}
                                        opportunity={opportunity}
                                        onExecute={() => handleExecuteTrade(opportunity)}
                                        isConnected={isConnected}
                                        isExecuting={isExecuting}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-bold text-white mb-2">No Opportunities Found</h3>
                                <p className="text-white/70 mb-6">
                                    Run an analysis to discover arbitrage opportunities in the market.
                                </p>
                                <button
                                    onClick={handleRunAnalysis}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                                >
                                    🔍 Run Analysis
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'execution' && (
                    <div className="space-y-6">
                        <ExecutionMonitor 
                            status={executionStatus}
                            selectedOpportunity={selectedOpportunity}
                        />
                        
                        {executionStats && (
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                                <h3 className="text-lg font-bold text-white mb-4">Execution Statistics</h3>
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
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-6">
                        <ProfitTracker />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArbitrageBot;
