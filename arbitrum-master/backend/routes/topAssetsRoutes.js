const express = require('express');
const TopAssetsController = require('../controllers/topAssetsController');

const router = express.Router();
const topAssetsController = new TopAssetsController();

/**
 * @route GET /api/top-assets/dex-data
 * @desc Get comprehensive DEX data including top assets and valid trading pairs
 * @access Public
 */
router.get('/dex-data', (req, res) => {
    topAssetsController.getDEXData(req, res);
});

/**
 * @route GET /api/top-assets/assets
 * @desc Get top 20 assets by volume
 * @access Public
 */
router.get('/assets', (req, res) => {
    topAssetsController.getTopAssets(req, res);
});

/**
 * @route GET /api/top-assets/pairs
 * @desc Get valid trading pairs with sufficient liquidity
 * @access Public
 */
router.get('/pairs', (req, res) => {
    topAssetsController.getValidTradingPairs(req, res);
});

/**
 * @route GET /api/top-assets/liquidity/:baseAsset/:counterAsset
 * @desc Check liquidity for a specific trading pair
 * @access Public
 */
router.get('/liquidity/:baseAsset/:counterAsset', (req, res) => {
    topAssetsController.checkPairLiquidity(req, res);
});

/**
 * @route GET /api/top-assets/asset/:assetCode
 * @desc Get information about a specific asset
 * @access Public
 */
router.get('/asset/:assetCode', (req, res) => {
    topAssetsController.getAssetInfo(req, res);
});

/**
 * @route GET /api/top-assets/overview
 * @desc Get market overview with summary statistics
 * @access Public
 */
router.get('/overview', (req, res) => {
    topAssetsController.getMarketOverview(req, res);
});

/**
 * @route GET /api/top-assets/cache/stats
 * @desc Get cache statistics
 * @access Public
 */
router.get('/cache/stats', (req, res) => {
    topAssetsController.getCacheStats(req, res);
});

/**
 * @route DELETE /api/top-assets/cache
 * @desc Clear cache (optional type parameter)
 * @access Public
 */
router.delete('/cache', (req, res) => {
    topAssetsController.clearCache(req, res);
});

/**
 * @route GET /api/top-assets/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', (req, res) => {
    topAssetsController.healthCheck(req, res);
});

module.exports = router;
