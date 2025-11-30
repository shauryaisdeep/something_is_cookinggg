const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
    // Transaction details
    txHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Trading details
    opportunity: {
        loop: [{
            type: String,
            required: true
        }],
        profitPercent: {
            type: Number,
            required: true
        },
        maxExecutableAmount: {
            type: Number,
            required: true
        },
        expectedProfit: {
            type: Number,
            required: true
        }
    },
    
    // Execution details
    execution: {
        status: {
            type: String,
            enum: ['pending', 'submitted', 'success', 'failed', 'timeout'],
            default: 'pending'
        },
        submittedAt: {
            type: Date,
            default: Date.now
        },
        completedAt: Date,
        gasUsed: Number,
        gasPrice: Number,
        totalFees: Number
    },
    
    // Results
    results: {
        actualProfit: Number,
        actualProfitPercent: Number,
        slippage: Number,
        finalAmount: Number,
        success: {
            type: Boolean,
            default: false
        }
    },
    
    // Wallet information
    wallet: {
        address: {
            type: String,
            required: true,
            index: true
        },
        balanceBefore: mongoose.Schema.Types.Mixed,
        balanceAfter: mongoose.Schema.Types.Mixed
    },
    
    // Risk management
    risk: {
        maxSlippage: {
            type: Number,
            default: 0.01 // 1%
        },
        minProfitThreshold: {
            type: Number,
            default: 0.001 // 0.1%
        },
        slippageExceeded: {
            type: Boolean,
            default: false
        }
    },
    
    // Metadata
    metadata: {
        network: {
            type: String,
            default: 'testnet'
        },
        contractAddress: String,
        analysisTime: Number,
        executionTime: Number,
        userAgent: String,
        ipAddress: String
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'trades'
});

// Indexes for better query performance
TradeSchema.index({ 'wallet.address': 1, 'createdAt': -1 });
TradeSchema.index({ 'execution.status': 1, 'createdAt': -1 });
TradeSchema.index({ 'results.success': 1, 'createdAt': -1 });
TradeSchema.index({ 'opportunity.profitPercent': -1 });

// Pre-save middleware
TradeSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Instance methods
TradeSchema.methods.calculateActualProfit = function() {
    if (this.wallet.balanceBefore && this.wallet.balanceAfter) {
        const beforeAmount = this.wallet.balanceBefore[this.opportunity.loop[0]] || 0;
        const afterAmount = this.wallet.balanceAfter[this.opportunity.loop[0]] || 0;
        
        this.results.actualProfit = afterAmount - beforeAmount;
        this.results.actualProfitPercent = (this.results.actualProfit / beforeAmount) * 100;
        
        return this.results.actualProfit;
    }
    return null;
};

TradeSchema.methods.calculateSlippage = function() {
    if (this.opportunity.expectedProfit && this.results.actualProfit) {
        this.results.slippage = Math.abs(this.opportunity.expectedProfit - this.results.actualProfit) / this.opportunity.expectedProfit;
        this.risk.slippageExceeded = this.results.slippage > this.risk.maxSlippage;
        
        return this.results.slippage;
    }
    return null;
};

TradeSchema.methods.markAsCompleted = function(success, finalAmount = null) {
    this.execution.status = success ? 'success' : 'failed';
    this.execution.completedAt = new Date();
    this.results.success = success;
    
    if (finalAmount) {
        this.results.finalAmount = finalAmount;
    }
    
    // Calculate actual results
    this.calculateActualProfit();
    this.calculateSlippage();
    
    return this.save();
};

// Static methods
TradeSchema.statics.getSuccessfulTrades = function(limit = 100) {
    return this.find({ 'results.success': true })
        .sort({ 'createdAt': -1 })
        .limit(limit);
};

TradeSchema.statics.getTradesByWallet = function(walletAddress, limit = 50) {
    return this.find({ 'wallet.address': walletAddress })
        .sort({ 'createdAt': -1 })
        .limit(limit);
};

TradeSchema.statics.getTradesByProfitRange = function(minProfit, maxProfit) {
    return this.find({
        'opportunity.profitPercent': {
            $gte: minProfit,
            $lte: maxProfit
        }
    }).sort({ 'opportunity.profitPercent': -1 });
};

TradeSchema.statics.getTradeStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: null,
                totalTrades: { $sum: 1 },
                successfulTrades: {
                    $sum: { $cond: ['$results.success', 1, 0] }
                },
                totalProfit: {
                    $sum: { $cond: ['$results.success', '$results.actualProfit', 0] }
                },
                averageProfit: {
                    $avg: { $cond: ['$results.success', '$results.actualProfitPercent', null] }
                },
                averageExecutionTime: {
                    $avg: '$metadata.executionTime'
                }
            }
        }
    ]);
};

TradeSchema.statics.getRecentTrades = function(hours = 24, limit = 100) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return this.find({ 'createdAt': { $gte: since } })
        .sort({ 'createdAt': -1 })
        .limit(limit);
};

TradeSchema.statics.getTopPerformingAssets = function(limit = 10) {
    return this.aggregate([
        { $match: { 'results.success': true } },
        { $unwind: '$opportunity.loop' },
        {
            $group: {
                _id: '$opportunity.loop',
                tradeCount: { $sum: 1 },
                averageProfit: { $avg: '$results.actualProfitPercent' },
                totalProfit: { $sum: '$results.actualProfit' }
            }
        },
        { $sort: { totalProfit: -1 } },
        { $limit: limit }
    ]);
};

// Virtual fields
TradeSchema.virtual('executionTime').get(function() {
    if (this.execution.submittedAt && this.execution.completedAt) {
        return this.execution.completedAt - this.execution.submittedAt;
    }
    return null;
});

TradeSchema.virtual('isProfitable').get(function() {
    return this.results.actualProfit > 0;
});

TradeSchema.virtual('profitRatio').get(function() {
    if (this.opportunity.expectedProfit && this.results.actualProfit) {
        return this.results.actualProfit / this.opportunity.expectedProfit;
    }
    return null;
});

// JSON transformation
TradeSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Trade', TradeSchema);
