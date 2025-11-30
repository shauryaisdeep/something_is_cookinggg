const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.ensureLogDirectory();
        
        // Log levels
        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        
        this.currentLevel = this.levels.INFO;
        this.colors = {
            ERROR: '\x1b[31m', // Red
            WARN: '\x1b[33m',  // Yellow
            INFO: '\x1b[36m',  // Cyan
            DEBUG: '\x1b[37m', // White
            RESET: '\x1b[0m'   // Reset
        };
    }

    /**
     * Ensure log directory exists
     */
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Get current timestamp
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Format log message
     */
    formatMessage(level, message, data = null) {
        const timestamp = this.getTimestamp();
        const formattedMessage = `[${timestamp}] [${level}] ${message}`;
        
        if (data) {
            return `${formattedMessage} ${JSON.stringify(data, null, 2)}`;
        }
        
        return formattedMessage;
    }

    /**
     * Write to log file
     */
    writeToFile(level, message, data = null) {
        const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
        const formattedMessage = this.formatMessage(level, message, data) + '\n';
        
        try {
            fs.appendFileSync(logFile, formattedMessage);
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }

    /**
     * Log error message
     */
    error(message, data = null) {
        if (this.currentLevel >= this.levels.ERROR) {
            const coloredMessage = `${this.colors.ERROR}${this.formatMessage('ERROR', message, data)}${this.colors.RESET}`;
            console.error(coloredMessage);
            this.writeToFile('ERROR', message, data);
        }
    }

    /**
     * Log warning message
     */
    warn(message, data = null) {
        if (this.currentLevel >= this.levels.WARN) {
            const coloredMessage = `${this.colors.WARN}${this.formatMessage('WARN', message, data)}${this.colors.RESET}`;
            console.warn(coloredMessage);
            this.writeToFile('WARN', message, data);
        }
    }

    /**
     * Log info message
     */
    info(message, data = null) {
        if (this.currentLevel >= this.levels.INFO) {
            const coloredMessage = `${this.colors.INFO}${this.formatMessage('INFO', message, data)}${this.colors.RESET}`;
            console.log(coloredMessage);
            this.writeToFile('INFO', message, data);
        }
    }

    /**
     * Log debug message
     */
    debug(message, data = null) {
        if (this.currentLevel >= this.levels.DEBUG) {
            const coloredMessage = `${this.colors.DEBUG}${this.formatMessage('DEBUG', message, data)}${this.colors.RESET}`;
            console.log(coloredMessage);
            this.writeToFile('DEBUG', message, data);
        }
    }

    /**
     * Set log level
     */
    setLevel(level) {
        if (typeof level === 'string') {
            this.currentLevel = this.levels[level.toUpperCase()] || this.levels.INFO;
        } else {
            this.currentLevel = level;
        }
    }

    /**
     * Get current log level
     */
    getLevel() {
        return Object.keys(this.levels).find(key => this.levels[key] === this.currentLevel);
    }

    /**
     * Log API request
     */
    logRequest(req, res, responseTime) {
        const message = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`;
        const data = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        };
        
        if (res.statusCode >= 400) {
            this.error(message, data);
        } else {
            this.info(message, data);
        }
    }

    /**
     * Log trade execution
     */
    logTrade(tradeData) {
        const message = `Trade executed: ${tradeData.txHash}`;
        const data = {
            txHash: tradeData.txHash,
            status: tradeData.status,
            profit: tradeData.profit,
            path: tradeData.path,
            amount: tradeData.amount,
            fees: tradeData.fees
        };
        
        this.info(message, data);
    }

    /**
     * Log arbitrage opportunity
     */
    logArbitrage(opportunity) {
        const message = `Arbitrage opportunity found: ${opportunity.loop.join(' → ')}`;
        const data = {
            loop: opportunity.loop,
            profitPercent: opportunity.profitPercent,
            maxExecutableAmount: opportunity.maxExecutableAmount,
            liquidity: opportunity.liquidity
        };
        
        this.info(message, data);
    }

    /**
     * Log system event
     */
    logSystem(event, data = null) {
        const message = `System event: ${event}`;
        this.info(message, data);
    }

    /**
     * Log performance metrics
     */
    logPerformance(operation, duration, data = null) {
        const message = `Performance: ${operation} completed in ${duration}ms`;
        const perfData = {
            operation,
            duration,
            ...data
        };
        
        this.info(message, perfData);
    }

    /**
     * Get log statistics
     */
    getLogStats() {
        const logFiles = fs.readdirSync(this.logDir).filter(file => file.endsWith('.log'));
        const today = new Date().toISOString().split('T')[0];
        const todayLogFile = path.join(this.logDir, `${today}.log`);
        
        let todayLogSize = 0;
        if (fs.existsSync(todayLogFile)) {
            const stats = fs.statSync(todayLogFile);
            todayLogSize = stats.size;
        }
        
        return {
            logDirectory: this.logDir,
            totalLogFiles: logFiles.length,
            todayLogSize,
            currentLevel: this.getLevel(),
            uptime: process.uptime()
        };
    }

    /**
     * Clean old log files
     */
    cleanOldLogs(daysToKeep = 7) {
        const logFiles = fs.readdirSync(this.logDir).filter(file => file.endsWith('.log'));
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        let deletedCount = 0;
        
        logFiles.forEach(file => {
            const filePath = path.join(this.logDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.mtime < cutoffDate) {
                fs.unlinkSync(filePath);
                deletedCount++;
            }
        });
        
        if (deletedCount > 0) {
            this.info(`Cleaned ${deletedCount} old log files`);
        }
        
        return deletedCount;
    }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
