/**
 * Mock API Service for MVP Arbitrage Bot
 * Provides mock implementations of all API methods for testing and demonstration
 */

import mockDataService from './mockDataService';

class MockApiService {
    constructor() {
        this.baseURL = 'mock://api';
        this.timeout = 30000;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    /**
     * Sleep utility for simulating network delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Simulate network delay
     */
    async simulateNetworkDelay(min = 500, max = 2000) {
        const delay = Math.random() * (max - min) + min;
        await this.sleep(delay);
    }

    /**
     * Simulate API response structure
     */
    createResponse(success, data, message = null) {
        return {
            success,
            data,
            message,
            timestamp: new Date().toISOString()
        };
    }

    // ===== ARBITRAGE API METHODS =====

    /**
     * Fetch DEX data
     */
    async fetchDEXData() {
        try {
            await this.simulateNetworkDelay(300, 800);
            const data = mockDataService.getDEXData();
            return this.createResponse(true, data);
        } catch (error) {
            console.error('❌ Error fetching DEX data:', error);
            return this.createResponse(false, null, error.message);
        }
    }

    /**
     * Run arbitrage analysis
     */
    async runArbitrageAnalysis() {
        try {
            await this.simulateNetworkDelay(1000, 3000);
            const data = mockDataService.getArbitrageAnalysis();
            return this.createResponse(true, data);
        } catch (error) {
            console.error('❌ Error running arbitrage analysis:', error);
            return this.createResponse(false, null, error.message);
        }
    }

    /**
     * Validate arbitrage opportunity
     */
    async validateOpportunity(opportunity, walletAddress) {
        try {
            await this.simulateNetworkDelay(200, 500);
            
            // Very lenient mock validation logic for demo purposes
            const canExecute = opportunity.isProfitableAfterFees && 
                              opportunity.maxExecutableAmount > 0.5 && // Min 0.5 XLM (very low)
                              opportunity.liquidity.score > 0.05 && // Min liquidity score (very lenient)
                              opportunity.profitPercent > 0.01; // Min 0.01% profit (extremely small)
            
            const message = canExecute ? 
                'Opportunity validated successfully' : 
                `Opportunity validation failed: ${!opportunity.isProfitableAfterFees ? 'Not profitable after fees' : 
                  opportunity.maxExecutableAmount <= 0.5 ? 'Amount too small' :
                  opportunity.liquidity.score <= 0.05 ? 'Insufficient liquidity' :
                  opportunity.profitPercent <= 0.01 ? 'Profit too low' : 'Unknown validation error'}`;
            
            return this.createResponse(canExecute, {
                canExecute,
                message,
                opportunity,
                walletAddress,
                validatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Error validating opportunity:', error);
            return this.createResponse(false, null, error.message);
        }
    }

    /**
     * Build transaction
     */
    async buildTransaction(opportunity, walletAddress) {
        try {
            await this.simulateNetworkDelay(500, 1500);
            
            // Mock transaction building
            const transaction = {
                id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                operations: opportunity.loop.map((asset, index) => ({
                    type: 'payment',
                    from: index === 0 ? walletAddress : 'DEX_POOL',
                    to: index === opportunity.loop.length - 1 ? walletAddress : 'DEX_POOL',
                    asset: asset,
                    amount: opportunity.maxExecutableAmount * (index === 0 ? 1 : 0.95), // Simulate slippage
                    sequence: index + 1
                })),
                fee: '0.00001', // 0.00001 XLM base fee
                memo: `Arbitrage: ${opportunity.loop.join('→')}`,
                network: 'testnet',
                builtAt: new Date().toISOString()
            };
            
            return this.createResponse(true, {
                transaction,
                opportunity,
                fees: {
                    stellar: 0.00001 * opportunity.loop.length,
                    dex: opportunity.fees.dex,
                    total: opportunity.totalFees
                },
                estimatedGas: 100000,
                estimatedTime: '5-10 seconds'
            });
        } catch (error) {
            console.error('❌ Error building transaction:', error);
            return this.createResponse(false, null, error.message);
        }
    }

    /**
     * Submit transaction
     */
    async submitTransaction(signedTransaction) {
        try {
            await this.simulateNetworkDelay(1000, 3000);
            
            // Simulate transaction submission
            const transactionHash = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const success = Math.random() > 0.1; // 90% success rate
            
            if (success) {
                return this.createResponse(true, {
                    transactionHash,
                    status: 'submitted',
                    submittedAt: new Date().toISOString(),
                    estimatedConfirmationTime: '5-10 seconds'
                });
            } else {
                throw new Error('Transaction submission failed: Network congestion');
            }
        } catch (error) {
            console.error('❌ Error submitting transaction:', error);
            return this.createResponse(false, null, error.message);
        }
    }

    /**
     * Monitor transaction
     */
    async monitorTransaction(txHash) {
        try {
            await this.simulateNetworkDelay(200, 500);
            
            // Simulate transaction monitoring
            const statuses = ['pending', 'success', 'failed'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            // For demo purposes, make most transactions successful
            const finalStatus = Math.random() > 0.15 ? 'success' : randomStatus;
            
            const result = {
                transactionHash: txHash,
                status: finalStatus,
                confirmedAt: new Date().toISOString(),
                blockNumber: Math.floor(Math.random() * 1000000) + 5000000,
                gasUsed: Math.floor(Math.random() * 50000) + 50000,
                gasPrice: '0.00001'
            };
            
            if (finalStatus === 'success') {
                result.profit = Math.random() * 2 + 0.1; // 0.1-2.1 XLM profit (realistic)
                result.fees = Math.random() * 0.1 + 0.05; // 0.05-0.15 XLM fees (realistic)
            } else if (finalStatus === 'failed') {
                result.error = 'Transaction failed: Insufficient liquidity';
            }
            
            return this.createResponse(true, result);
        } catch (error) {
            console.error('❌ Error monitoring transaction:', error);
            return this.createResponse(false, null, error.message);
        }
    }

    // ===== UTILITY METHODS =====

    /**
     * Check API health
     */
    async checkHealth() {
        try {
            await this.simulateNetworkDelay(100, 300);
            return true;
        } catch (error) {
            console.error('❌ API health check failed:', error);
            return false;
        }
    }

    /**
     * Get API status
     */
    async getStatus() {
        try {
            await this.simulateNetworkDelay(200, 500);
            return {
                status: 'healthy',
                version: '1.0.0-mvp',
                uptime: Math.floor(Math.random() * 86400) + 3600, // 1-24 hours
                lastUpdate: new Date().toISOString(),
                mockMode: true
            };
        } catch (error) {
            console.error('❌ Error getting API status:', error);
            throw new Error(`Failed to get API status: ${error.message}`);
        }
    }

    // ===== MOCK-SPECIFIC METHODS =====

    /**
     * Get mock execution history
     */
    async getExecutionHistory() {
        try {
            await this.simulateNetworkDelay(200, 500);
            const history = mockDataService.getExecutionHistory();
            return this.createResponse(true, history);
        } catch (error) {
            console.error('❌ Error getting execution history:', error);
            return this.createResponse(false, null, error.message);
        }
    }

    /**
     * Simulate wallet connection
     */
    async connectWallet() {
        try {
            await this.simulateNetworkDelay(500, 1500);
            
            // Mock wallet connection
            const mockWallet = {
                publicKey: `G${Math.random().toString(36).substr(2, 55)}`,
                network: 'testnet',
                connectedAt: new Date().toISOString()
            };
            
            return this.createResponse(true, mockWallet);
        } catch (error) {
            console.error('❌ Error connecting wallet:', error);
            return this.createResponse(false, null, error.message);
        }
    }

    /**
     * Simulate transaction signing
     */
    async signTransaction(transaction) {
        try {
            await this.simulateNetworkDelay(1000, 3000);
            
            // Mock transaction signing
            const signedTransaction = {
                ...transaction,
                signature: `sig_${Math.random().toString(36).substr(2, 64)}`,
                signedAt: new Date().toISOString()
            };
            
            return this.createResponse(true, signedTransaction);
        } catch (error) {
            console.error('❌ Error signing transaction:', error);
            return this.createResponse(false, null, error.message);
        }
    }
}

// Create singleton instance
const mockApiService = new MockApiService();

export default mockApiService;
