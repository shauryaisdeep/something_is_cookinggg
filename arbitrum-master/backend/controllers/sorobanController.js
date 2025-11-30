const SorobanArbitrageService = require('../services/sorobanArbitrageService');
const RealtimeCacheService = require('../services/realtimeCacheService');

class SorobanController {
    constructor() {
        this.sorobanService = new SorobanArbitrageService();
        this.cacheService = new RealtimeCacheService();
    }

    /**
     * Build arbitrage transaction
     */
    async buildTransaction(req, res) {
        try {
            const { opportunity, walletAddress } = req.body;
            
            if (!opportunity || !walletAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'Opportunity and wallet address are required',
                    timestamp: new Date().toISOString()
                });
            }

            console.log(`🔨 Building transaction for ${walletAddress}...`);
            
            const transaction = await this.sorobanService.buildArbitrageTransaction(opportunity, walletAddress);
            
            res.json({
                success: true,
                data: transaction,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error building transaction:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to build transaction',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Submit signed transaction
     */
    async submitTransaction(req, res) {
        try {
            const { signedTransaction } = req.body;
            
            if (!signedTransaction) {
                return res.status(400).json({
                    success: false,
                    error: 'Signed transaction is required',
                    timestamp: new Date().toISOString()
                });
            }

            console.log('📤 Submitting transaction to network...');
            
            const result = await this.sorobanService.submitTransaction(signedTransaction);
            
            // Store trade execution in cache
            this.cacheService.storeTradeExecution(result.transactionHash, {
                ...result,
                status: 'submitted'
            });
            
            res.json({
                success: true,
                data: result,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error submitting transaction:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to submit transaction',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Monitor transaction execution
     */
    async monitorTransaction(req, res) {
        try {
            const { txHash } = req.params;
            
            if (!txHash) {
                return res.status(400).json({
                    success: false,
                    error: 'Transaction hash is required',
                    timestamp: new Date().toISOString()
                });
            }

            console.log(`👀 Monitoring transaction: ${txHash}...`);
            
            const result = await this.sorobanService.monitorTransaction(txHash);
            
            // Update trade execution in cache
            this.cacheService.storeTradeExecution(txHash, result);
            
            res.json({
                success: true,
                data: result,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error monitoring transaction:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to monitor transaction',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get wallet balance
     */
    async getWalletBalance(req, res) {
        try {
            const { walletAddress } = req.params;
            
            if (!walletAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'Wallet address is required',
                    timestamp: new Date().toISOString()
                });
            }

            console.log(`💰 Fetching balance for ${walletAddress}...`);
            
            const balance = await this.sorobanService.getWalletBalance(walletAddress);
            
            res.json({
                success: true,
                data: {
                    walletAddress,
                    balances: balance,
                    timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching wallet balance:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch wallet balance',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Estimate transaction fees
     */
    async estimateFees(req, res) {
        try {
            const { opportunity } = req.body;
            
            if (!opportunity) {
                return res.status(400).json({
                    success: false,
                    error: 'Opportunity is required',
                    timestamp: new Date().toISOString()
                });
            }

            console.log('💰 Estimating transaction fees...');
            
            const fees = await this.sorobanService.estimateTransactionFees(opportunity);
            
            res.json({
                success: true,
                data: fees,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error estimating fees:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to estimate fees',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Validate opportunity for execution
     */
    async validateOpportunity(req, res) {
        try {
            const { opportunity, walletAddress } = req.body;
            
            if (!opportunity || !walletAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'Opportunity and wallet address are required',
                    timestamp: new Date().toISOString()
                });
            }

            console.log(`🔍 Validating opportunity for ${walletAddress}...`);
            
            // Validate opportunity is still profitable
            const isValid = await this.sorobanService.validateOpportunity(opportunity);
            
            // Get wallet balance
            const balance = await this.sorobanService.getWalletBalance(walletAddress);
            
            // Check if wallet has sufficient balance
            const requiredAsset = opportunity.loop[0]; // First asset in the loop
            const requiredAmount = opportunity.maxExecutableAmount;
            const hasSufficientBalance = balance[requiredAsset] >= requiredAmount;
            
            // Estimate fees
            const fees = await this.sorobanService.estimateTransactionFees(opportunity);
            const hasSufficientXLM = balance.XLM >= fees.xlm;
            
            const validation = {
                isValid,
                hasSufficientBalance,
                hasSufficientXLM,
                requiredAmount,
                availableAmount: balance[requiredAsset] || 0,
                requiredFees: fees.xlm,
                availableXLM: balance.XLM || 0,
                canExecute: isValid && hasSufficientBalance && hasSufficientXLM,
                timestamp: new Date().toISOString()
            };
            
            res.json({
                success: true,
                data: validation,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error validating opportunity:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to validate opportunity',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Create test transaction
     */
    async createTestTransaction(req, res) {
        try {
            const { walletAddress } = req.body;
            
            if (!walletAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'Wallet address is required',
                    timestamp: new Date().toISOString()
                });
            }

            console.log(`🧪 Creating test transaction for ${walletAddress}...`);
            
            const testTransaction = await this.sorobanService.createTestTransaction(walletAddress);
            
            res.json({
                success: true,
                data: testTransaction,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error creating test transaction:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to create test transaction',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get network status
     */
    async getNetworkStatus(req, res) {
        try {
            console.log('🌐 Fetching network status...');
            
            const status = await this.sorobanService.getNetworkStatus();
            
            res.json({
                success: true,
                data: status,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching network status:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch network status',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get trade execution history
     */
    async getTradeHistory(req, res) {
        try {
            const { limit = 50 } = req.query;
            
            console.log(`📊 Fetching trade history (limit: ${limit})...`);
            
            const trades = this.cacheService.getRecentTrades(parseInt(limit));
            
            res.json({
                success: true,
                data: {
                    trades,
                    count: trades.length,
                    limit: parseInt(limit)
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching trade history:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch trade history',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get specific trade execution
     */
    async getTradeExecution(req, res) {
        try {
            const { txHash } = req.params;
            
            if (!txHash) {
                return res.status(400).json({
                    success: false,
                    error: 'Transaction hash is required',
                    timestamp: new Date().toISOString()
                });
            }

            console.log(`📊 Fetching trade execution: ${txHash}...`);
            
            const execution = this.cacheService.getTradeExecution(txHash);
            
            if (!execution) {
                return res.status(404).json({
                    success: false,
                    error: 'Trade execution not found',
                    timestamp: new Date().toISOString()
                });
            }
            
            res.json({
                success: true,
                data: execution,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Error fetching trade execution:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Failed to fetch trade execution',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Health check endpoint
     */
    async healthCheck(req, res) {
        try {
            const health = {
                status: 'healthy',
                service: 'soroban',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                network: 'testnet',
                contractAddress: this.sorobanService.CONTRACT_ADDRESS,
                timestamp: new Date().toISOString()
            };
            
            res.json({
                success: true,
                data: health,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Health check failed:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Health check failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = SorobanController;
