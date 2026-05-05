const fs = require('fs');
const path = require('path');

// Ensure log file directory exists (in this case, it's the same directory)
const logFile = path.join(__dirname, 'logs', 'app.log');
const logDir = path.dirname(logFile);

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Custom logger that writes to a file.
 * Prevents use of console.log as per requirements.
 */
const writeLog = (level, message) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    try {
        fs.appendFileSync(logFile, logEntry);
    } catch (err) {
        // Silently fail or handle error if needed
    }
};

const logger = {
    info: (msg) => writeLog('INFO', msg),
    error: (msg) => writeLog('ERROR', msg),
    warn: (msg) => writeLog('WARN', msg),
};

/**
 * Express Middleware to log incoming requests.
 */
const loggingMiddleware = (req, res, next) => {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        logger.info(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    });

    next();
};

module.exports = {
    logger,
    loggingMiddleware
};
