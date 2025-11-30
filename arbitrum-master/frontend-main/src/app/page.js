'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusIndicator from '../components/StatusIndicator';

const HomePage = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading time for better UX
        const timer = setTimeout(() => {
            setIsLoaded(true);
            setIsLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                <LoadingSpinner 
                    size="xlarge" 
                    text="Initializing Stellar Arbitrage Bot..." 
                    className="text-center"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            {/* Navigation */}
            <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <div className="text-2xl">🤖</div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Stellar Arbitrage Bot</h1>
                                <div className="flex items-center space-x-2 mt-1">
                                    <StatusIndicator status="active" size="small" showText={false} />
                                    <span className="text-xs text-white/60">Live Trading System</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <Link href="/dashboard" className="text-white/70 hover:text-white transition-colors font-medium">
                                📊 Dashboard
                            </Link>
                            <Link href="/mvp" className="text-white/70 hover:text-white transition-colors font-medium">
                                🚀 MVP Demo
                            </Link>
                            <Link href="/math-mode" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg">
                                🚀 Start Trading
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center">
                    <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="mb-6">
                            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 mb-4">
                                <StatusIndicator status="active" size="small" showText={false} />
                                <span className="text-sm text-white/80 font-medium">Live Trading System</span>
                            </div>
                        </div>
                        
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                            Advanced Stellar
                            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent block">
                                Arbitrage Bot
                            </span>
                        </h1>
                        
                        <p className="text-xl text-white/70 mb-8 max-w-3xl mx-auto leading-relaxed">
                            Complete end-to-end arbitrage trading system with real-time analysis, 
                            smart contract execution, and advanced risk management for Stellar DEX.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <Link href="/mvp" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all duration-200 transform hover:scale-105 shadow-xl">
                                🚀 Try MVP Demo
                            </Link>
                            
                            <Link href="/math-mode" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all duration-200 border border-white/20 backdrop-blur-md">
                                🚀 Start Trading
                            </Link>
                            
                            <Link href="/dashboard" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all duration-200 border border-white/20 backdrop-blur-md">
                                📊 View Dashboard
                            </Link>
                        </div>
                        
                        {/* Live Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                <div className="text-2xl font-bold text-green-400">20+</div>
                                <div className="text-sm text-white/70">Active Pairs</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                <div className="text-2xl font-bold text-blue-400">&lt;1s</div>
                                <div className="text-sm text-white/70">Analysis Speed</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                <div className="text-2xl font-bold text-purple-400">99.9%</div>
                                <div className="text-sm text-white/70">Uptime</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-white mb-4">Powerful Features</h2>
                    <p className="text-white/70 text-lg">
                        Everything you need for successful arbitrage trading on Stellar
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            icon: '🔍',
                            title: 'Real-time Analysis',
                            description: 'Advanced arbitrage detection with 3-step loop analysis and profit optimization'
                        },
                        {
                            icon: '⚡',
                            title: 'Smart Contract Execution',
                            description: 'Automated trade execution via Soroban smart contracts with slippage protection'
                        },
                        {
                            icon: '📊',
                            title: 'Live Market Data',
                            description: 'Real-time order book data and liquidity analysis from Stellar DEX'
                        },
                        {
                            icon: '🛡️',
                            title: 'Risk Management',
                            description: 'Built-in risk controls, slippage protection, and balance validation'
                        },
                        {
                            icon: '💼',
                            title: 'Wallet Integration',
                            description: 'Seamless Rabet wallet integration for secure transaction signing'
                        },
                        {
                            icon: '📈',
                            title: 'Performance Tracking',
                            description: 'Comprehensive analytics and profit tracking with detailed trade history'
                        }
                    ].map((feature, index) => (
                        <div
                            key={index}
                            className={`bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 transition-all duration-500 ${
                                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div className="text-4xl mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                            <p className="text-white/70">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* How It Works */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
                    <p className="text-white/70 text-lg">
                        Simple 4-step process to start arbitrage trading
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        {
                            step: '01',
                            title: 'Connect Wallet',
                            description: 'Connect your Rabet wallet to the Stellar testnet'
                        },
                        {
                            step: '02',
                            title: 'Discover Opportunities',
                            description: 'Run analysis to find profitable arbitrage opportunities'
                        },
                        {
                            step: '03',
                            title: 'Execute Trades',
                            description: 'Execute trades automatically via smart contracts'
                        },
                        {
                            step: '04',
                            title: 'Track Profits',
                            description: 'Monitor your performance and track profits in real-time'
                        }
                    ].map((step, index) => (
                        <div
                            key={index}
                            className={`text-center transition-all duration-500 ${
                                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}
                            style={{ transitionDelay: `${index * 150}ms` }}
                        >
                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                                {step.step}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                            <p className="text-white/70">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-white/5 backdrop-blur-sm border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                        {[
                            { number: '20+', label: 'Supported Assets' },
                            { number: '< 1s', label: 'Analysis Speed' },
                            { number: '99.9%', label: 'Uptime' },
                            { number: '0.1%', label: 'Min Profit' }
                        ].map((stat, index) => (
                            <div
                                key={index}
                                className={`transition-all duration-500 ${
                                    isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                                }`}
                                style={{ transitionDelay: `${index * 100}ms` }}
                            >
                                <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                                <div className="text-white/70">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Ready to Start Trading?
                    </h2>
                    <p className="text-white/70 text-lg mb-8">
                        Join the future of automated arbitrage trading on Stellar
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/mvp" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all duration-200 transform hover:scale-105">
                            🚀 Try MVP Demo
                        </Link>
                        
                        <Link href="/math-mode" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all duration-200 border border-white/20">
                            🚀 Start Trading Now
                        </Link>
                        
                        <a
                            href="https://github.com/your-repo/stellar-arbitrage-bot"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all duration-200 border border-white/20"
                        >
                            📚 View Documentation
                        </a>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-4 mb-4 md:mb-0">
                            <div className="text-2xl">🤖</div>
                            <div>
                                <div className="text-white font-bold">Stellar Arbitrage Bot</div>
                                <div className="text-white/50 text-sm">Advanced Trading System</div>
                            </div>
                        </div>
                        
                        <div className="text-white/50 text-sm">
                            © 2024 Stellar Arbitrage Bot. Built for educational purposes.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;