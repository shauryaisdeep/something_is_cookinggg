'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useArbitrage } from '../../contexts/ArbitrageContext';
import WalletConnection from '../../components/WalletConnection';
import ProfitTracker from '../../components/ProfitTracker';

const Dashboard = () => {
    const { isConnected, walletAddress, balance } = useWallet();
    const { isConnected: wsConnected, isRealtimeActive, marketData } = useRealtime();
    const { executionHistory, getExecutionStats } = useArbitrage();
    
    const [activeTab, setActiveTab] = useState('overview');
    const [timeRange, setTimeRange] = useState('24h');

    const executionStats = getExecutionStats();

    const formatAddress = (address) => {
        if (!address) return 'Not Connected';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    const formatBalance = (balance) => {
        if (!balance || Object.keys(balance).length === 0) return '0.00';
        const xlmBalance = balance.XLM || 0;
        return xlmBalance.toFixed(2);
    };

    const getTotalProfit = () => {
        return executionHistory
            .filter(exec => exec.status === 'success')
            .reduce((sum, exec) => sum + (exec.profit || 0), 0);
    };

    const getSuccessRate = () => {
        const successful = executionHistory.filter(exec => exec.status === 'success').length;
        const total = executionHistory.length;
        return total > 0 ? (successful / total) * 100 : 0;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white">📊 Trading Dashboard</h1>
                            <p className="text-white/70 mt-1">Monitor your arbitrage trading performance</p>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <div className="text-sm text-white/70">Wallet Balance</div>
                                <div className="text-xl font-bold text-white">
                                    {formatBalance(balance)} XLM
                                </div>
                            </div>
                            <WalletConnection />
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Indicators */}
            <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-3">
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                <span className="text-sm text-white/70">
                                    WebSocket: {wsConnected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${isRealtimeActive ? 'bg-blue-400' : 'bg-gray-400'}`}></div>
                                <span className="text-sm text-white/70">
                                    Real-time: {isRealtimeActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-purple-400' : 'bg-gray-400'}`}></div>
                                <span className="text-sm text-white/70">
                                    Wallet: {formatAddress(walletAddress)}
                                </span>
                            </div>
                        </div>
                        
                        <div className="text-sm text-white/50">
                            Network: Testnet | Last Update: {new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'overview', label: 'Overview', icon: '📊' },
                            { id: 'performance', label: 'Performance', icon: '📈' },
                            { id: 'trades', label: 'Trade History', icon: '📋' },
                            { id: 'settings', label: 'Settings', icon: '⚙️' }
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
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-bold text-green-400">
                                            +{getTotalProfit().toFixed(4)}
                                        </div>
                                        <div className="text-sm text-white/70">Total Profit (XLM)</div>
                                    </div>
                                    <div className="text-3xl">💰</div>
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-bold text-blue-400">
                                            {executionStats.total}
                                        </div>
                                        <div className="text-sm text-white/70">Total Trades</div>
                                    </div>
                                    <div className="text-3xl">📊</div>
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-bold text-purple-400">
                                            {getSuccessRate().toFixed(1)}%
                                        </div>
                                        <div className="text-sm text-white/70">Success Rate</div>
                                    </div>
                                    <div className="text-3xl">🎯</div>
                                </div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-bold text-yellow-400">
                                            {formatBalance(balance)}
                                        </div>
                                        <div className="text-sm text-white/70">Wallet Balance</div>
                                    </div>
                                    <div className="text-3xl">💳</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <a
                                    href="/math-mode"
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-4 rounded-lg text-center font-medium transition-all duration-200 transform hover:scale-105"
                                >
                                    <div className="text-2xl mb-2">🤖</div>
                                    <div>Open Arbitrage Bot</div>
                                </a>
                                
                                <button
                                    onClick={() => setActiveTab('performance')}
                                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white p-4 rounded-lg text-center font-medium transition-all duration-200 transform hover:scale-105"
                                >
                                    <div className="text-2xl mb-2">📈</div>
                                    <div>View Performance</div>
                                </button>
                                
                                <button
                                    onClick={() => setActiveTab('trades')}
                                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white p-4 rounded-lg text-center font-medium transition-all duration-200 transform hover:scale-105"
                                >
                                    <div className="text-2xl mb-2">📋</div>
                                    <div>Trade History</div>
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                            <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                            {executionHistory.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">📊</div>
                                    <p className="text-white/70">No trading activity yet</p>
                                    <a
                                        href="/math-mode"
                                        className="text-purple-400 hover:text-purple-300 underline mt-2 inline-block"
                                    >
                                        Start trading →
                                    </a>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {executionHistory.slice(0, 5).map((execution, index) => (
                                        <div
                                            key={index}
                                            className="bg-white/5 rounded-lg p-4 border border-white/10"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-3 h-3 rounded-full ${
                                                        execution.status === 'success' ? 'bg-green-400' :
                                                        execution.status === 'failed' ? 'bg-red-400' :
                                                        'bg-yellow-400'
                                                    }`}></div>
                                                    <div>
                                                        <div className="text-white font-medium">
                                                            {execution.status === 'success' ? 'Successful Trade' :
                                                             execution.status === 'failed' ? 'Failed Trade' : 'Pending Trade'}
                                                        </div>
                                                        <div className="text-sm text-white/50">
                                                            {new Date(execution.timestamp).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {execution.profit && (
                                                    <div className={`text-sm font-bold ${
                                                        execution.profit > 0 ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                        {execution.profit > 0 ? '+' : ''}{execution.profit.toFixed(4)} XLM
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'performance' && (
                    <div className="space-y-6">
                        <ProfitTracker />
                    </div>
                )}

                {activeTab === 'trades' && (
                    <div className="space-y-6">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Trade History</h3>
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                                >
                                    <option value="1h">Last Hour</option>
                                    <option value="24h">Last 24 Hours</option>
                                    <option value="7d">Last 7 Days</option>
                                    <option value="30d">Last 30 Days</option>
                                </select>
                            </div>
                            
                            {executionHistory.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">📋</div>
                                    <p className="text-white/70">No trades found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/20">
                                                <th className="text-left py-3 px-4 text-white/70 font-medium">Status</th>
                                                <th className="text-left py-3 px-4 text-white/70 font-medium">Time</th>
                                                <th className="text-left py-3 px-4 text-white/70 font-medium">Amount</th>
                                                <th className="text-left py-3 px-4 text-white/70 font-medium">Profit</th>
                                                <th className="text-left py-3 px-4 text-white/70 font-medium">TX Hash</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {executionHistory.map((execution, index) => (
                                                <tr key={index} className="border-b border-white/10">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center space-x-2">
                                                            <div className={`w-2 h-2 rounded-full ${
                                                                execution.status === 'success' ? 'bg-green-400' :
                                                                execution.status === 'failed' ? 'bg-red-400' :
                                                                'bg-yellow-400'
                                                            }`}></div>
                                                            <span className="text-white text-sm">
                                                                {execution.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-white text-sm">
                                                        {new Date(execution.timestamp).toLocaleString()}
                                                    </td>
                                                    <td className="py-3 px-4 text-white text-sm">
                                                        {execution.amount ? execution.amount.toFixed(2) : 'N/A'} XLM
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {execution.profit ? (
                                                            <span className={`text-sm font-bold ${
                                                                execution.profit > 0 ? 'text-green-400' : 'text-red-400'
                                                            }`}>
                                                                {execution.profit > 0 ? '+' : ''}{execution.profit.toFixed(4)} XLM
                                                            </span>
                                                        ) : (
                                                            <span className="text-white/50 text-sm">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {execution.txHash ? (
                                                            <a
                                                                href={`https://horizon-testnet.stellar.org/transactions/${execution.txHash}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-400 hover:text-blue-300 text-sm"
                                                            >
                                                                {execution.txHash.substring(0, 20)}...
                                                            </a>
                                                        ) : (
                                                            <span className="text-white/50 text-sm">N/A</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                            <h3 className="text-xl font-bold text-white mb-4">Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white/70 text-sm font-medium mb-2">
                                        Default Time Range
                                    </label>
                                    <select className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white">
                                        <option value="24h">Last 24 Hours</option>
                                        <option value="7d">Last 7 Days</option>
                                        <option value="30d">Last 30 Days</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="flex items-center space-x-2">
                                        <input type="checkbox" className="rounded" />
                                        <span className="text-white/70">Enable notifications</span>
                                    </label>
                                </div>
                                
                                <div>
                                    <label className="flex items-center space-x-2">
                                        <input type="checkbox" className="rounded" />
                                        <span className="text-white/70">Auto-refresh data</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
