const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    // Basic information
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    
    // Authentication
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    
    // Wallet information
    wallets: [{
        address: {
            type: String,
            required: true
        },
        network: {
            type: String,
            default: 'testnet'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        connectedAt: {
            type: Date,
            default: Date.now
        },
        lastUsed: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Trading preferences
    preferences: {
        riskTolerance: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        maxSlippage: {
            type: Number,
            default: 0.01 // 1%
        },
        minProfitThreshold: {
            type: Number,
            default: 0.001 // 0.1%
        },
        maxTradeAmount: {
            type: Number,
            default: 1000 // XLM
        },
        autoExecute: {
            type: Boolean,
            default: false
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: false
            },
            trades: {
                type: Boolean,
                default: true
            },
            opportunities: {
                type: Boolean,
                default: false
            }
        }
    },
    
    // Trading statistics
    stats: {
        totalTrades: {
            type: Number,
            default: 0
        },
        successfulTrades: {
            type: Number,
            default: 0
        },
        totalProfit: {
            type: Number,
            default: 0
        },
        totalVolume: {
            type: Number,
            default: 0
        },
        averageProfit: {
            type: Number,
            default: 0
        },
        successRate: {
            type: Number,
            default: 0
        },
        lastTradeAt: Date,
        joinedAt: {
            type: Date,
            default: Date.now
        }
    },
    
    // Account status
    status: {
        type: String,
        enum: ['active', 'suspended', 'banned'],
        default: 'active'
    },
    
    // Security
    security: {
        twoFactorEnabled: {
            type: Boolean,
            default: false
        },
        lastLoginAt: Date,
        lastLoginIP: String,
        loginAttempts: {
            type: Number,
            default: 0
        },
        lockUntil: Date,
        passwordChangedAt: {
            type: Date,
            default: Date.now
        }
    },
    
    // API access
    apiAccess: {
        enabled: {
            type: Boolean,
            default: false
        },
        apiKey: String,
        apiSecret: String,
        rateLimit: {
            type: Number,
            default: 100 // requests per minute
        },
        lastApiCall: Date
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
    collection: 'users'
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ 'wallets.address': 1 });
UserSchema.index({ 'apiAccess.apiKey': 1 });
UserSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware
UserSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Update success rate
    if (this.stats.totalTrades > 0) {
        this.stats.successRate = (this.stats.successfulTrades / this.stats.totalTrades) * 100;
    }
    
    next();
});

// Pre-save middleware for password hashing
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        this.security.passwordChangedAt = new Date();
        next();
    } catch (error) {
        next(error);
    }
});

// Instance methods
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.addWallet = function(address, network = 'testnet') {
    // Check if wallet already exists
    const existingWallet = this.wallets.find(w => w.address === address);
    if (existingWallet) {
        existingWallet.lastUsed = new Date();
        return this.save();
    }
    
    // Add new wallet
    this.wallets.push({
        address,
        network,
        connectedAt: new Date(),
        lastUsed: new Date()
    });
    
    return this.save();
};

UserSchema.methods.removeWallet = function(address) {
    this.wallets = this.wallets.filter(w => w.address !== address);
    return this.save();
};

UserSchema.methods.updateStats = function(tradeResult) {
    this.stats.totalTrades += 1;
    
    if (tradeResult.success) {
        this.stats.successfulTrades += 1;
        this.stats.totalProfit += tradeResult.profit || 0;
    }
    
    this.stats.totalVolume += tradeResult.volume || 0;
    this.stats.lastTradeAt = new Date();
    
    // Calculate average profit
    if (this.stats.successfulTrades > 0) {
        this.stats.averageProfit = this.stats.totalProfit / this.stats.successfulTrades;
    }
    
    return this.save();
};

UserSchema.methods.incrementLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { 'security.lockUntil': 1 },
            $set: { 'security.loginAttempts': 1 }
        });
    }
    
    const updates = { $inc: { 'security.loginAttempts': 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.security.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { 'security.lockUntil': Date.now() + 2 * 60 * 60 * 1000 };
    }
    
    return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { 'security.loginAttempts': 1, 'security.lockUntil': 1 }
    });
};

UserSchema.methods.generateApiKey = function() {
    const apiKey = require('crypto').randomBytes(32).toString('hex');
    const apiSecret = require('crypto').randomBytes(32).toString('hex');
    
    this.apiAccess.apiKey = apiKey;
    this.apiAccess.apiSecret = apiSecret;
    this.apiAccess.enabled = true;
    
    return this.save();
};

// Virtual fields
UserSchema.virtual('isLocked').get(function() {
    return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

UserSchema.virtual('activeWallet').get(function() {
    return this.wallets.find(w => w.isActive);
});

UserSchema.virtual('walletCount').get(function() {
    return this.wallets.length;
});

// Static methods
UserSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByUsername = function(username) {
    return this.findOne({ username: username.toLowerCase() });
};

UserSchema.statics.findByWallet = function(address) {
    return this.findOne({ 'wallets.address': address });
};

UserSchema.statics.findByApiKey = function(apiKey) {
    return this.findOne({ 'apiAccess.apiKey': apiKey, 'apiAccess.enabled': true });
};

UserSchema.statics.getTopTraders = function(limit = 10) {
    return this.find({ status: 'active' })
        .sort({ 'stats.totalProfit': -1 })
        .limit(limit);
};

UserSchema.statics.getRecentUsers = function(days = 7, limit = 100) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return this.find({ 'createdAt': { $gte: since } })
        .sort({ 'createdAt': -1 })
        .limit(limit);
};

UserSchema.statics.getUserStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                activeUsers: {
                    $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                },
                totalTrades: { $sum: '$stats.totalTrades' },
                totalProfit: { $sum: '$stats.totalProfit' },
                averageSuccessRate: { $avg: '$stats.successRate' }
            }
        }
    ]);
};

// JSON transformation
UserSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.apiAccess.apiSecret;
        return ret;
    }
});

module.exports = mongoose.model('User', UserSchema);
