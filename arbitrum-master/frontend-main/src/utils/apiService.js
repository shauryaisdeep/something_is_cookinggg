/**
 * Professional API Service for Stellar Arbitrage Bot
 * Centralized API management with error handling, retries, and logging
 */

class ApiService {
    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        this.timeout = 30000; // 30 seconds
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * Create a timeout promise
     */
    createTimeoutPromise(timeout = this.timeout) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), timeout);
        });
    }

    /**
     * Sleep utility for retries
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Make HTTP request with retry logic
     */
    async makeRequest(url, options = {}, retryCount = 0) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            clearTimeout(timeoutId);

            // Retry logic for network errors
            if (retryCount < this.retryAttempts && this.shouldRetry(error)) {
                console.log(`🔄 Retrying request (${retryCount + 1}/${this.retryAttempts}): ${url}`);
                await this.sleep(this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
                return this.makeRequest(url, options, retryCount + 1);
            }

            throw error;
        }
    }

    /**
     * Determine if request should be retried
     */
    shouldRetry(error) {
        return (
            error.name === 'AbortError' ||
            error.message.includes('timeout') ||
            error.message.includes('network') ||
            error.message.includes('fetch')
        );
    }

    /**
     * GET request
     */
    async get(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        return this.makeRequest(url, { method: 'GET', ...options });
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        return this.makeRequest(url, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options,
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        return this.makeRequest(url, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options,
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        return this.makeRequest(url, { method: 'DELETE', ...options });
    }

    // ===== ARBITRAGE API METHODS =====

    /**
     * Fetch DEX data
     */
    async fetchDEXData() {
        try {
            const result = await this.get('/api/top-assets/dex-data');
            if (!result.success) {
                throw new Error(result.message || 'Failed to fetch DEX data');
            }
            return result.data;
        } catch (error) {
            console.error('❌ Error fetching DEX data:', error);
            throw new Error(`Failed to fetch DEX data: ${error.message}`);
        }
    }

    /**
     * Run arbitrage analysis
     */
    async runArbitrageAnalysis() {
        try {
            const startTime = Date.now();
            const result = await this.post('/api/fast-arbitrage/run');
            const analysisTime = Date.now() - startTime;

            if (!result.success) {
                throw new Error(result.message || 'Failed to run arbitrage analysis');
            }

            return {
                ...result.data,
                analysisTime,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error running arbitrage analysis:', error);
            throw new Error(`Failed to run arbitrage analysis: ${error.message}`);
        }
    }

    /**
     * Validate arbitrage opportunity
     */
    async validateOpportunity(opportunity, walletAddress) {
        try {
            const result = await this.post('/api/soroban/validate-opportunity', {
                opportunity,
                walletAddress
            });

            if (!result.success) {
                throw new Error(result.message || 'Opportunity validation failed');
            }

            return result.data;
        } catch (error) {
            console.error('❌ Error validating opportunity:', error);
            throw new Error(`Failed to validate opportunity: ${error.message}`);
        }
    }

    /**
     * Build transaction
     */
    async buildTransaction(opportunity, walletAddress) {
        try {
            const result = await this.post('/api/soroban/build-transaction', {
                opportunity,
                walletAddress
            });

            if (!result.success) {
                throw new Error(result.message || 'Failed to build transaction');
            }

            return result.data;
        } catch (error) {
            console.error('❌ Error building transaction:', error);
            throw new Error(`Failed to build transaction: ${error.message}`);
        }
    }

    /**
     * Submit transaction
     */
    async submitTransaction(signedTransaction) {
        try {
            const result = await this.post('/api/soroban/submit-transaction', {
                signedTransaction
            });

            if (!result.success) {
                throw new Error(result.message || 'Failed to submit transaction');
            }

            return result.data;
        } catch (error) {
            console.error('❌ Error submitting transaction:', error);
            throw new Error(`Failed to submit transaction: ${error.message}`);
        }
    }

    /**
     * Monitor transaction
     */
    async monitorTransaction(txHash) {
        try {
            const result = await this.get(`/api/soroban/monitor/${txHash}`);

            if (!result.success) {
                throw new Error(result.message || 'Failed to monitor transaction');
            }

            return result.data;
        } catch (error) {
            console.error('❌ Error monitoring transaction:', error);
            throw new Error(`Failed to monitor transaction: ${error.message}`);
        }
    }

    // ===== UTILITY METHODS =====

    /**
     * Check API health
     */
    async checkHealth() {
        try {
            const result = await this.get('/api/health');
            return result.success;
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
            const result = await this.get('/api/status');
            return result.data;
        } catch (error) {
            console.error('❌ Error getting API status:', error);
            throw new Error(`Failed to get API status: ${error.message}`);
        }
    }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
