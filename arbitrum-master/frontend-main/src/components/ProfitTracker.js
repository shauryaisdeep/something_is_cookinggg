import React, { useState, useEffect } from 'react';
import { useArbitrage } from '../contexts/ArbitrageContext';

const ProfitTracker = () => {
    const { executionHistory, getExecutionStats } = useArbitrage();
    const [timeRange, setTimeRange] = useState('24h');
    const [filteredHistory, setFilteredHistory] = useState([]);

    const executionStats = getExecutionStats();

    useEffect(() => {
        const now = new Date();
        let cutoffTime;

        switch (timeRange) {
            case '1h':
                cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '24h':
                cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                cutoffTime = new Date(0);
        }

        const filtered = executionHistory.filter(execution => {
            const executionTime = new Date(execution.timestamp);
            return executionTime >= cutoffTime;
        });

        setFilteredHistory(filtered);
    }, [executionHistory, timeRange]);

    const getTotalProfit = () => {
        return filteredHistory
            .filter(exec => exec.status === 'success')
            .reduce((sum, exec) => sum + (exec.profit || 0), 0);
    };

    const getTotalVolume = () => {
        return filteredHistory
            .reduce((sum, exec) => sum + (exec.amount || 0), 0);
    };

    const getSuccessRate = () => {
        const successful = filteredHistory.filter(exec => exec.status === 'success').length;
        const total = filteredHistory.length;
        return total > 0 ? (successful / total) * 100 : 0;
    };

    const getAverageProfit = () => {
        const successful = filteredHistory.filter(exec => exec.status === 'success');
        return successful.length > 0 ? 
            successful.reduce((sum, exec) => sum + (exec.profit || 0), 0) / successful.length : 0;
    };

    const getProfitChart = () => {
        const chartData = [];
        const now = new Date();
        const intervals = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
        const intervalMs = timeRange === '1h' ? 5 * 60 * 1000 : 
                          timeRange === '24h' ? 60 * 60 * 1000 : 
                          timeRange === '7d' ? 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

        for (let i = intervals - 1; i >= 0; i--) {
            const intervalStart = new Date(now.getTime() - (i + 1) * intervalMs);
            const intervalEnd = new Date(now.getTime() - i * intervalMs);
            
            const intervalProfit = filteredHistory
                .filter(exec => {
                    const execTime = new Date(exec.timestamp);
                    return execTime >= intervalStart && execTime < intervalEnd && exec.status === 'success';
                })
                .reduce((sum, exec) => sum + (exec.profit || 0), 0);

            chartData.push({
                time: intervalStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                profit: intervalProfit
            });
        }

        return chartData;
    };

    const chartData = getProfitChart();
    const maxProfit = Math.max(...chartData.map(d => d.profit), 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Profit Tracker</h2>
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

            {/* Statistics Cards */}
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
                                {getTotalVolume().toFixed(2)}
                            </div>
                            <div className="text-sm text-white/70">Total Volume (XLM)</div>
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
                                +{getAverageProfit().toFixed(4)}
                            </div>
                            <div className="text-sm text-white/70">Avg Profit (XLM)</div>
                        </div>
                        <div className="text-3xl">📈</div>
                    </div>
                </div>
            </div>

            {/* Profit Chart */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">Profit Over Time</h3>
                <div className="h-64 flex items-end justify-between space-x-1">
                    {chartData.map((data, index) => (
                        <div key={index} className="flex flex-col items-center flex-1">
                            <div
                                className="bg-gradient-to-t from-green-500 to-green-400 rounded-t w-full transition-all duration-500"
                                style={{
                                    height: `${(data.profit / maxProfit) * 200}px`,
                                    minHeight: '4px'
                                }}
                            ></div>
                            <div className="text-xs text-white/50 mt-2 transform -rotate-45 origin-left">
                                {data.time}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trade History */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">Recent Trades</h3>
                
                {filteredHistory.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-2">📊</div>
                        <p className="text-white/70">No trades found for the selected time range</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredHistory.slice(0, 10).map((execution, index) => (
                            <div
                                key={index}
                                className="bg-white/5 rounded-lg p-4 border border-white/10"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div className={`w-3 h-3 rounded-full ${
                                                execution.status === 'success' ? 'bg-green-400' :
                                                execution.status === 'failed' ? 'bg-red-400' :
                                                'bg-yellow-400'
                                            }`}></div>
                                            <span className="text-sm font-medium text-white">
                                                {execution.status === 'success' ? 'Successful' :
                                                 execution.status === 'failed' ? 'Failed' : 'Pending'}
                                            </span>
                                            <span className="text-xs text-white/50">
                                                {new Date(execution.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        
                                        {execution.txHash && (
                                            <div className="text-xs text-white/50 mb-1">
                                                TX: {execution.txHash.substring(0, 20)}...
                                            </div>
                                        )}
                                        
                                        {execution.path && (
                                            <div className="text-sm text-white/70">
                                                Path: {execution.path.join(' → ')}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="text-right">
                                        {execution.profit && (
                                            <div className={`text-sm font-bold ${
                                                execution.profit > 0 ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                                {execution.profit > 0 ? '+' : ''}{execution.profit.toFixed(4)} XLM
                                            </div>
                                        )}
                                        
                                        {execution.amount && (
                                            <div className="text-xs text-white/50">
                                                Amount: {execution.amount.toFixed(2)} XLM
                                            </div>
                                        )}
                                        
                                        {execution.fees && (
                                            <div className="text-xs text-white/50">
                                                Fees: {execution.fees.toFixed(4)} XLM
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    <h3 className="text-lg font-bold text-white mb-4">Performance Metrics</h3>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-white/70">Total Trades</span>
                            <span className="text-white font-semibold">{filteredHistory.length}</span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-white/70">Successful Trades</span>
                            <span className="text-green-400 font-semibold">
                                {filteredHistory.filter(exec => exec.status === 'success').length}
                            </span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-white/70">Failed Trades</span>
                            <span className="text-red-400 font-semibold">
                                {filteredHistory.filter(exec => exec.status === 'failed').length}
                            </span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-white/70">Best Trade</span>
                            <span className="text-green-400 font-semibold">
                                +{Math.max(...filteredHistory.filter(exec => exec.status === 'success').map(exec => exec.profit || 0), 0).toFixed(4)} XLM
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    <h3 className="text-lg font-bold text-white mb-4">Risk Metrics</h3>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-white/70">Max Drawdown</span>
                            <span className="text-red-400 font-semibold">
                                -{Math.min(...filteredHistory.map(exec => exec.profit || 0), 0).toFixed(4)} XLM
                            </span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-white/70">Win Rate</span>
                            <span className="text-blue-400 font-semibold">
                                {getSuccessRate().toFixed(1)}%
                            </span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-white/70">Avg Trade Duration</span>
                            <span className="text-white font-semibold">
                                {filteredHistory.length > 0 ? 
                                    (filteredHistory.reduce((sum, exec) => sum + (exec.duration || 0), 0) / filteredHistory.length / 1000).toFixed(1) + 's' :
                                    'N/A'
                                }
                            </span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-white/70">Profit Factor</span>
                            <span className="text-green-400 font-semibold">
                                {(() => {
                                    const wins = filteredHistory.filter(exec => exec.status === 'success' && exec.profit > 0);
                                    const losses = filteredHistory.filter(exec => exec.status === 'success' && exec.profit < 0);
                                    const totalWins = wins.reduce((sum, exec) => sum + exec.profit, 0);
                                    const totalLosses = Math.abs(losses.reduce((sum, exec) => sum + exec.profit, 0));
                                    return totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : '∞';
                                })()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfitTracker;
