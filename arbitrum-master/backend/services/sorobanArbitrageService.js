const { 
    Horizon, 
    Keypair, 
    TransactionBuilder, 
    Operation, 
    Networks,
    Asset,
    BASE_FEE,
    TimeoutInfinite
} = require('stellar-sdk');
const axios = require('axios');

class SorobanArbitrageService {
    constructor() {
        this.HORIZON_API = 'https://horizon-testnet.stellar.org';
        this.NETWORK_PASSPHRASE = Networks.TESTNET;
        this.server = new Horizon.Server(this.HORIZON_API);
        
        // Contract configuration
        this.CONTRACT_ADDRESS = process.env.ARBITRAGE_CONTRACT_ADDRESS || 
            'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3X3E'; // Example testnet address
        
        // Fee configuration
        this.BASE_FEE = BASE_FEE;
        this.SOROBAN_FEE = 100000; // 0.1 XLM for Soroban operations
        this.TIMEOUT = 30; // 30 seconds timeout
        
        // Slippage and risk management
        this.MAX_SLIPPAGE = 0.01; // 1% maximum slippage
        this.MIN_PROFIT_THRESHOLD = 0.001; // 0.1% minimum profit
    }

    /**
     * Build arbitrage transaction for Soroban contract
     */
    async buildArbitrageTransaction(opportunity, walletAddress) {
        try {
            console.log(`🔨 Building arbitrage transaction for ${walletAddress}...`);
            
            // 1. Validate opportunity is still profitable
            const isValid = await this.validateOpportunity(opportunity);
            if (!isValid) {
                throw new Error('Opportunity is no longer profitable');
            }
            
            // 2. Get account information
            const account = await this.server.loadAccount(walletAddress);
            
            // 3. Calculate optimal trade amounts
            const tradeAmounts = this.calculateOptimalAmounts(opportunity);
            
            // 4. Build Soroban transaction
            const transaction = new TransactionBuilder(account, {
                fee: this.SOROBAN_FEE,
                networkPassphrase: this.NETWORK_PASSPHRASE,
                timebounds: {
                    minTime: Math.floor(Date.now() / 1000),
                    maxTime: Math.floor(Date.now() / 1000) + this.TIMEOUT
                }
            });
            
            // 5. Add contract function call
            const contractCall = this.buildContractCall(opportunity, tradeAmounts);
            transaction.addOperation(contractCall);
            
            // 6. Build and return unsigned transaction
            const builtTransaction = transaction.build();
            
            const result = {
                transaction: builtTransaction.toXDR(),
                opportunity: {
                    ...opportunity,
                    tradeAmounts
                },
                fees: {
                    stellar: this.SOROBAN_FEE,
                    estimated: this.SOROBAN_FEE / 10000000 // Convert to XLM
                },
                timestamp: new Date().toISOString()
            };
            
            console.log(`✅ Transaction built successfully`);
            return result;
            
        } catch (error) {
            console.error('❌ Error building arbitrage transaction:', error.message);
            throw error;
        }
    }

    /**
     * Build contract function call
     */
    buildContractCall(opportunity, tradeAmounts) {
        const { loop, maxExecutableAmount } = opportunity;
        
        // Convert assets to contract format
        const assets = loop.map(assetCode => this.assetToContractFormat(assetCode));
        
        // Calculate amounts for each step
        const amounts = this.calculateStepAmounts(tradeAmounts, opportunity);
        
        // Calculate minimum profit threshold
        const minProfit = maxExecutableAmount * this.MIN_PROFIT_THRESHOLD;
        
        return Operation.invokeContractFunction({
            contract: this.CONTRACT_ADDRESS,
            function: 'execute_arbitrage_with_slippage',
            parameters: [
                // Path: array of assets
                {
                    type: 'vec',
                    value: assets.map(asset => ({ type: 'address', value: asset }))
                },
                // Amounts: array of amounts for each step
                {
                    type: 'vec',
                    value: amounts.map(amount => ({ 
                        type: 'i128', 
                        value: Math.floor(amount * 10000000) // Convert to stroops
                    }))
                },
                // Minimum profit threshold
                {
                    type: 'i128',
                    value: Math.floor(minProfit * 10000000)
                },
                // Maximum slippage (1% = 100 basis points)
                {
                    type: 'i128',
                    value: 100
                }
            ]
        });
    }

    /**
     * Convert asset code to contract format
     */
    assetToContractFormat(assetCode) {
        if (assetCode === 'XLM') {
            return 'native';
        }
        
        // For other assets, we need the asset contract address
        // This would typically be stored in a mapping or database
        const assetContracts = {
            'USDC': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3X3E',
            'USDT': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3X3E',
            'BTC': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3X3E',
            'ETH': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3X3E',
            'AQUA': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHXCN3X3E'
        };
        
        return assetContracts[assetCode] || assetCode;
    }

    /**
     * Calculate optimal trade amounts
     */
    calculateOptimalAmounts(opportunity) {
        const { maxExecutableAmount, path } = opportunity;
        
        // Start with maximum executable amount
        let currentAmount = maxExecutableAmount;
        const amounts = [currentAmount];
        
        // Calculate amounts for each step
        for (let i = 0; i < path.length - 1; i++) {
            const step = path[i];
            const nextAmount = currentAmount * step.price;
            amounts.push(nextAmount);
            currentAmount = nextAmount;
        }
        
        return amounts;
    }

    /**
     * Calculate step amounts with slippage protection
     */
    calculateStepAmounts(tradeAmounts, opportunity) {
        const { path } = opportunity;
        const stepAmounts = [];
        
        for (let i = 0; i < path.length; i++) {
            const step = path[i];
            const baseAmount = tradeAmounts[i];
            
            // Apply slippage protection (reduce amount by max slippage)
            const protectedAmount = baseAmount * (1 - this.MAX_SLIPPAGE);
            stepAmounts.push(protectedAmount);
        }
        
        return stepAmounts;
    }

    /**
     * Submit signed transaction to network
     */
    async submitTransaction(signedTransaction) {
        try {
            console.log('📤 Submitting transaction to Stellar network...');
            
            // Submit to Horizon
            const response = await this.server.submitTransaction(signedTransaction);
            
            const result = {
                transactionHash: response.hash,
                status: response.status,
                ledger: response.ledger,
                feeCharged: response.fee_charged,
                timestamp: new Date().toISOString()
            };
            
            console.log(`✅ Transaction submitted: ${response.hash}`);
            return result;
            
        } catch (error) {
            console.error('❌ Error submitting transaction:', error.message);
            
            // Extract more detailed error information
            const errorDetails = this.extractErrorDetails(error);
            throw new Error(`Transaction submission failed: ${errorDetails}`);
        }
    }

    /**
     * Monitor transaction execution
     */
    async monitorTransaction(txHash) {
        try {
            console.log(`👀 Monitoring transaction: ${txHash}`);
            
            const startTime = Date.now();
            const maxWaitTime = 60000; // 60 seconds max wait
            
            while (Date.now() - startTime < maxWaitTime) {
                try {
                    const response = await this.server.transactions().transaction(txHash).call();
                    
                    if (response.status === 'success') {
                        return {
                            status: 'success',
                            transactionHash: txHash,
                            ledger: response.ledger,
                            feeCharged: response.fee_charged,
                            operations: response.operations,
                            timestamp: new Date().toISOString()
                        };
                    } else if (response.status === 'failed') {
                        return {
                            status: 'failed',
                            transactionHash: txHash,
                            error: response.result_codes,
                            timestamp: new Date().toISOString()
                        };
                    }
                    
                    // Wait 2 seconds before next check
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                } catch (error) {
                    if (error.message.includes('not found')) {
                        // Transaction not yet in ledger, continue waiting
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        continue;
                    }
                    throw error;
                }
            }
            
            return {
                status: 'timeout',
                transactionHash: txHash,
                message: 'Transaction monitoring timed out',
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Error monitoring transaction:', error.message);
            return {
                status: 'error',
                transactionHash: txHash,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Validate opportunity is still profitable
     */
    async validateOpportunity(opportunity) {
        try {
            // Check if opportunity is within acceptable time window (5 minutes)
            const opportunityAge = Date.now() - new Date(opportunity.timestamp).getTime();
            if (opportunityAge > 300000) { // 5 minutes
                return false;
            }
            
            // Re-validate profit threshold
            if (opportunity.netProfitPercent < this.MIN_PROFIT_THRESHOLD) {
                return false;
            }
            
            // Check if still profitable after fees
            if (!opportunity.isProfitableAfterFees) {
                return false;
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Error validating opportunity:', error.message);
            return false;
        }
    }

    /**
     * Get wallet balance for validation
     */
    async getWalletBalance(walletAddress) {
        try {
            const account = await this.server.loadAccount(walletAddress);
            
            const balances = {};
            account.balances.forEach(balance => {
                if (balance.asset_type === 'native') {
                    balances.XLM = parseFloat(balance.balance);
                } else {
                    balances[balance.asset_code] = parseFloat(balance.balance);
                }
            });
            
            return balances;
            
        } catch (error) {
            console.error('❌ Error fetching wallet balance:', error.message);
            throw error;
        }
    }

    /**
     * Estimate transaction fees
     */
    async estimateTransactionFees(opportunity) {
        const baseFee = this.SOROBAN_FEE;
        const operationCount = opportunity.path.length;
        const estimatedFees = baseFee * operationCount;
        
        return {
            stellar: estimatedFees,
            xlm: estimatedFees / 10000000,
            operations: operationCount,
            breakdown: {
                baseFee: this.SOROBAN_FEE,
                operationCount,
                total: estimatedFees
            }
        };
    }

    /**
     * Extract detailed error information
     */
    extractErrorDetails(error) {
        if (error.response && error.response.data) {
            const data = error.response.data;
            if (data.extras && data.extras.result_codes) {
                return `Operation failed: ${JSON.stringify(data.extras.result_codes)}`;
            }
            return data.detail || data.title || 'Unknown error';
        }
        return error.message;
    }

    /**
     * Create test transaction for validation
     */
    async createTestTransaction(walletAddress) {
        try {
            const account = await this.server.loadAccount(walletAddress);
            
            const transaction = new TransactionBuilder(account, {
                fee: this.BASE_FEE,
                networkPassphrase: this.NETWORK_PASSPHRASE
            })
            .addOperation(Operation.accountMerge({
                destination: walletAddress // Self-merge (no-op)
            }))
            .setTimeout(TimeoutInfinite)
            .build();
            
            return {
                transaction: transaction.toXDR(),
                message: 'Test transaction created successfully',
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Error creating test transaction:', error.message);
            throw error;
        }
    }

    /**
     * Get network status
     */
    async getNetworkStatus() {
        try {
            const response = await axios.get(`${this.HORIZON_API}/`);
            
            return {
                network: 'testnet',
                horizonVersion: response.data.horizon_version,
                coreVersion: response.data.core_version,
                networkPassphrase: this.NETWORK_PASSPHRASE,
                baseFee: this.BASE_FEE,
                sorobanFee: this.SOROBAN_FEE,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Error fetching network status:', error.message);
            throw error;
        }
    }
}

module.exports = SorobanArbitrageService;
