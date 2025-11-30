import React, { useState } from 'react';

const OpportunityCard = ({ opportunity, onExecute, isConnected, isExecuting }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [executing, setExecuting] = useState(false);

    const handleExecute = async () => {
        if (!isConnected) {
            alert('Please connect your wallet first');
            return;
        }

        setExecuting(true);
        try {
            await onExecute(opportunity);
        } catch (error) {
            console.error('Execution failed:', error);
        } finally {
            setExecuting(false);
        }
    };

    const getProfitColor = (profit) => {
        if (profit >= 1) return 'text-green-400';
        if (profit >= 0.5) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getRiskLevel = (liquidity) => {
        if (liquidity.score >= 0.8) return { level: 'Low', color: 'text-green-400' };
        if (liquidity.score >= 0.5) return { level: 'Medium', color: 'text-yellow-400' };
        return { level: 'High', color: 'text-red-400' };
    };

    const risk = getRiskLevel(opportunity.liquidity);

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-200 transform hover:scale-105">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className={`text-3xl font-bold ${getProfitColor(opportunity.profitPercent)}`}>
                        +{opportunity.profitPercent.toFixed(2)}%
                    </div>
                    <div className="text-sm text-white/70">
                        {opportunity.loop.length} steps
                    </div>
                </div>
                
                <button
                    onClick={handleExecute}
                    disabled={!isConnected || executing || isExecuting}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                >
                    {executing ? (
                        <span className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Executing...
                        </span>
                    ) : (
                        'Execute Trade'
                    )}
                </button>
            </div>

            {/* Trading Path */}
            <div className="mb-4">
                <div className="text-sm font-medium text-white/80 mb-2">Trading Path</div>
                <div className="font-mono text-sm bg-white/10 p-3 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                        {opportunity.loop.map((asset, index) => (
                            <React.Fragment key={index}>
                                <span className="text-white font-semibold">{asset}</span>
                                {index < opportunity.loop.length - 1 && (
                                    <span className="text-white/50">→</span>
                                )}
                            </React.Fragment>
                        ))}
                        <span className="text-white/50">→</span>
                        <span className="text-white font-semibold">{opportunity.loop[0]}</span>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-xs font-medium text-white/70 mb-1">Max Trade</div>
                    <div className="text-sm font-semibold text-white">
                        {opportunity.maxExecutableAmount.toFixed(2)} XLM
                    </div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-xs font-medium text-white/70 mb-1">Fees</div>
                    <div className="text-sm font-semibold text-white">
                        {opportunity.totalFees.toFixed(4)} XLM
                    </div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-xs font-medium text-white/70 mb-1">Liquidity</div>
                    <div className="text-sm font-semibold text-white">
                        {(opportunity.liquidity.score * 100).toFixed(1)}%
                    </div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-xs font-medium text-white/70 mb-1">Risk</div>
                    <div className={`text-sm font-semibold ${risk.color}`}>
                        {risk.level}
                    </div>
                </div>
            </div>

            {/* Profit Details */}
            <div className="bg-white/10 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-white/70">Expected Profit</span>
                    <span className="text-sm font-semibold text-green-400">
                        +{opportunity.expectedProfit.toFixed(4)} XLM
                    </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-white/70">Net Profit</span>
                    <span className="text-sm font-semibold text-blue-400">
                        +{opportunity.netProfit.toFixed(4)} XLM
                    </span>
                </div>
            </div>

            {/* Expandable Details */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left text-sm text-white/70 hover:text-white transition-colors"
            >
                {isExpanded ? '▼ Hide Details' : '▶ Show Details'}
            </button>

            {isExpanded && (
                <div className="mt-4 space-y-3 border-t border-white/20 pt-4">
                    {/* Step-by-step breakdown */}
                    <div>
                        <div className="text-sm font-medium text-white/80 mb-2">Step-by-step Breakdown</div>
                        <div className="space-y-2">
                            {opportunity.path.map((step, index) => (
                                <div key={index} className="bg-white/5 rounded-lg p-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-white">
                                            {step.from} → {step.to}
                                        </span>
                                        <span className="text-sm text-white/70">
                                            {step.amountIn.toFixed(2)} → {step.amountOut.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-white/50">Price: {step.price.toFixed(6)}</span>
                                        <span className="text-xs text-white/50">Liquidity: {step.liquidity.toFixed(0)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fee breakdown */}
                    <div>
                        <div className="text-sm font-medium text-white/80 mb-2">Fee Breakdown</div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/70">DEX Fees</span>
                                <span className="text-white">{opportunity.fees.dex.toFixed(4)} XLM</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/70">Network Fees</span>
                                <span className="text-white">{opportunity.fees.stellar.toFixed(4)} XLM</span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-white/20 pt-1">
                                <span className="text-white/70">Total Fees</span>
                                <span className="text-white font-semibold">{opportunity.fees.total.toFixed(4)} XLM</span>
                            </div>
                        </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-white/50">
                        Found: {new Date(opportunity.timestamp).toLocaleString()}
                    </div>
                </div>
            )}

            {/* Status indicators */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/20">
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                        opportunity.isProfitableAfterFees ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className="text-xs text-white/70">
                        {opportunity.isProfitableAfterFees ? 'Profitable' : 'Not Profitable'}
                    </span>
                </div>
                
                <div className="text-xs text-white/50">
                    ID: {opportunity.loop.join('-').substring(0, 20)}...
                </div>
            </div>
        </div>
    );
};

export default OpportunityCard;
