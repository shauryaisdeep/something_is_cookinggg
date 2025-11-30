import React, { useState, useEffect } from 'react';

const ExecutionMonitor = ({ status, selectedOpportunity }) => {
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('');

    useEffect(() => {
        if (!status) {
            setProgress(0);
            setCurrentStep('');
            return;
        }

        // Update progress based on status
        switch (status.status) {
            case 'preparing':
                setProgress(10);
                setCurrentStep('Preparing transaction...');
                break;
            case 'validating':
                setProgress(20);
                setCurrentStep('Validating opportunity...');
                break;
            case 'building':
                setProgress(40);
                setCurrentStep('Building transaction...');
                break;
            case 'signing':
                setProgress(60);
                setCurrentStep('Waiting for wallet signature...');
                break;
            case 'submitting':
                setProgress(80);
                setCurrentStep('Submitting to network...');
                break;
            case 'monitoring':
                setProgress(90);
                setCurrentStep('Monitoring execution...');
                break;
            case 'success':
                setProgress(100);
                setCurrentStep('Transaction successful!');
                break;
            case 'failed':
                setProgress(0);
                setCurrentStep('Transaction failed');
                break;
            case 'timeout':
                setProgress(0);
                setCurrentStep('Transaction timeout');
                break;
            default:
                setProgress(0);
                setCurrentStep('');
        }
    }, [status]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'success':
                return 'text-green-400';
            case 'failed':
            case 'timeout':
                return 'text-red-400';
            case 'monitoring':
            case 'submitting':
                return 'text-blue-400';
            default:
                return 'text-yellow-400';
        }
    };

    const getProgressColor = (status) => {
        switch (status) {
            case 'success':
                return 'bg-green-400';
            case 'failed':
            case 'timeout':
                return 'bg-red-400';
            default:
                return 'bg-blue-400';
        }
    };

    if (!status && !selectedOpportunity) {
        return (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
                <div className="text-6xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-white mb-2">No Active Execution</h3>
                <p className="text-white/70">
                    Select an arbitrage opportunity to start trading
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Execution Status */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Trade Execution</h3>
                    {status?.txHash && (
                        <a
                            href={`https://horizon-testnet.stellar.org/transactions/${status.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                            View on Explorer →
                        </a>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-white/70">Progress</span>
                        <span className="text-sm text-white/70">{progress}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(status?.status)}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Current Step */}
                <div className="mb-4">
                    <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                            status?.status === 'success' ? 'bg-green-400' :
                            status?.status === 'failed' || status?.status === 'timeout' ? 'bg-red-400' :
                            'bg-blue-400 animate-pulse'
                        }`}></div>
                        <span className={`font-medium ${getStatusColor(status?.status)}`}>
                            {currentStep}
                        </span>
                    </div>
                    {status?.message && (
                        <p className="text-sm text-white/70 mt-1 ml-6">
                            {status.message}
                        </p>
                    )}
                </div>

                {/* Transaction Hash */}
                {status?.txHash && (
                    <div className="bg-white/10 rounded-lg p-3 mb-4">
                        <div className="text-sm text-white/70 mb-1">Transaction Hash</div>
                        <div className="font-mono text-sm text-white break-all">
                            {status.txHash}
                        </div>
                    </div>
                )}

                {/* Error Details */}
                {status?.error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                        <div className="text-sm text-red-200">
                            <strong>Error:</strong> {status.error}
                        </div>
                    </div>
                )}
            </div>

            {/* Selected Opportunity Details */}
            {selectedOpportunity && (
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    <h3 className="text-lg font-bold text-white mb-4">Selected Opportunity</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm text-white/70 mb-2">Trading Path</div>
                            <div className="font-mono text-sm bg-white/10 p-2 rounded">
                                {selectedOpportunity.loop.join(' → ')} → {selectedOpportunity.loop[0]}
                            </div>
                        </div>
                        
                        <div>
                            <div className="text-sm text-white/70 mb-2">Expected Profit</div>
                            <div className="text-lg font-bold text-green-400">
                                +{selectedOpportunity.profitPercent.toFixed(2)}%
                            </div>
                        </div>
                        
                        <div>
                            <div className="text-sm text-white/70 mb-2">Max Trade Amount</div>
                            <div className="text-sm text-white">
                                {selectedOpportunity.maxExecutableAmount.toFixed(2)} XLM
                            </div>
                        </div>
                        
                        <div>
                            <div className="text-sm text-white/70 mb-2">Estimated Fees</div>
                            <div className="text-sm text-white">
                                {selectedOpportunity.totalFees.toFixed(4)} XLM
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Execution Steps */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">Execution Steps</h3>
                
                <div className="space-y-3">
                    {[
                        { id: 'preparing', label: 'Prepare Transaction', description: 'Validate opportunity and prepare transaction data' },
                        { id: 'validating', label: 'Validate Opportunity', description: 'Check if opportunity is still profitable' },
                        { id: 'building', label: 'Build Transaction', description: 'Create Soroban transaction with contract call' },
                        { id: 'signing', label: 'Sign Transaction', description: 'User signs transaction in wallet' },
                        { id: 'submitting', label: 'Submit to Network', description: 'Submit signed transaction to Stellar network' },
                        { id: 'monitoring', label: 'Monitor Execution', description: 'Track transaction status and execution' },
                        { id: 'success', label: 'Execution Complete', description: 'Transaction executed successfully' }
                    ].map((step, index) => {
                        const isActive = status?.status === step.id;
                        const isCompleted = [
                            'preparing', 'validating', 'building', 'signing', 'submitting', 'monitoring', 'success'
                        ].indexOf(status?.status) > index;
                        const isFailed = status?.status === 'failed' || status?.status === 'timeout';
                        
                        return (
                            <div
                                key={step.id}
                                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                                    isActive ? 'bg-blue-500/20 border border-blue-500/50' :
                                    isCompleted ? 'bg-green-500/20 border border-green-500/50' :
                                    isFailed ? 'bg-red-500/20 border border-red-500/50' :
                                    'bg-white/5 border border-white/10'
                                }`}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isActive ? 'bg-blue-500 text-white' :
                                    isCompleted ? 'bg-green-500 text-white' :
                                    isFailed ? 'bg-red-500 text-white' :
                                    'bg-white/20 text-white/50'
                                }`}>
                                    {isCompleted ? '✓' : index + 1}
                                </div>
                                
                                <div className="flex-1">
                                    <div className={`font-medium ${
                                        isActive ? 'text-blue-400' :
                                        isCompleted ? 'text-green-400' :
                                        isFailed ? 'text-red-400' :
                                        'text-white/70'
                                    }`}>
                                        {step.label}
                                    </div>
                                    <div className="text-sm text-white/50">
                                        {step.description}
                                    </div>
                                </div>
                                
                                {isActive && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Real-time Updates */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4">Real-time Updates</h3>
                
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-white/70">Status</span>
                        <span className={`font-medium ${getStatusColor(status?.status)}`}>
                            {status?.status || 'Idle'}
                        </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                        <span className="text-white/70">Last Update</span>
                        <span className="text-white">
                            {status?.timestamp ? new Date(status.timestamp).toLocaleTimeString() : 'N/A'}
                        </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                        <span className="text-white/70">Progress</span>
                        <span className="text-white">{progress}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExecutionMonitor;
