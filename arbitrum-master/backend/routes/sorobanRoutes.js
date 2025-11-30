const express = require('express');
const SorobanController = require('../controllers/sorobanController');

const router = express.Router();
const sorobanController = new SorobanController();

/**
 * @route POST /api/soroban/build-transaction
 * @desc Build arbitrage transaction for Soroban contract
 * @access Public
 */
router.post('/build-transaction', (req, res) => {
    sorobanController.buildTransaction(req, res);
});

/**
 * @route POST /api/soroban/submit-transaction
 * @desc Submit signed transaction to network
 * @access Public
 */
router.post('/submit-transaction', (req, res) => {
    sorobanController.submitTransaction(req, res);
});

/**
 * @route GET /api/soroban/monitor/:txHash
 * @desc Monitor transaction execution
 * @access Public
 */
router.get('/monitor/:txHash', (req, res) => {
    sorobanController.monitorTransaction(req, res);
});

/**
 * @route GET /api/soroban/balance/:walletAddress
 * @desc Get wallet balance
 * @access Public
 */
router.get('/balance/:walletAddress', (req, res) => {
    sorobanController.getWalletBalance(req, res);
});

/**
 * @route POST /api/soroban/estimate-fees
 * @desc Estimate transaction fees
 * @access Public
 */
router.post('/estimate-fees', (req, res) => {
    sorobanController.estimateFees(req, res);
});

/**
 * @route POST /api/soroban/validate-opportunity
 * @desc Validate opportunity for execution
 * @access Public
 */
router.post('/validate-opportunity', (req, res) => {
    sorobanController.validateOpportunity(req, res);
});

/**
 * @route POST /api/soroban/test-transaction
 * @desc Create test transaction
 * @access Public
 */
router.post('/test-transaction', (req, res) => {
    sorobanController.createTestTransaction(req, res);
});

/**
 * @route GET /api/soroban/network-status
 * @desc Get network status
 * @access Public
 */
router.get('/network-status', (req, res) => {
    sorobanController.getNetworkStatus(req, res);
});

/**
 * @route GET /api/soroban/trades
 * @desc Get trade execution history
 * @access Public
 */
router.get('/trades', (req, res) => {
    sorobanController.getTradeHistory(req, res);
});

/**
 * @route GET /api/soroban/trade/:txHash
 * @desc Get specific trade execution
 * @access Public
 */
router.get('/trade/:txHash', (req, res) => {
    sorobanController.getTradeExecution(req, res);
});

/**
 * @route GET /api/soroban/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', (req, res) => {
    sorobanController.healthCheck(req, res);
});

module.exports = router;
