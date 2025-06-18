const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");
const util = require("util");

/**
 * Creates a logger instance with a specified filename for structured logging.
 *
 * @param {string} fileName - The name of the file/module where the logger is used.
 * @returns {winston.Logger} - Configured Winston logger instance.
 *
 * Features:
 * - Supports console logging in a human-readable format.
 * - Logs to a daily rotating file (../logs/SVC_NAME-YYY-MM-DD.log).
 * - Also writes logs to a static file (../logs/log.txt) without rotation.
 * - Captures unhandled exceptions separately (../logs/exceptions.log).
 * - Different log level DEBUG, INFO, WARN, ERROR
 * - Example logger.debug(), logger.info() etc.
 *
 * ## Example Usage:
 * ```javascript
 * const logger = require("./logger")("app.js");
 * logger.info("Application started");
 * logger.error("Something went wrong", { error: new Error("Critical failure") });
 * ```
 *
 * ## Example Log Output:
 * - **Console Log (Human-readable)**
 *   ```
 *   2025-03-31 14:30:00 : [INFO] - [app.js] :- Application started
 *   2025-03-31 14:30:05 : [ERROR] - [app.js] :- Something went wrong { error: [Error: Critical failure] }
 *   ```
 */
const logLevel = process.env.LOG_LEVEL || "info";
const svcName = process.env.LOG_FILE || path.basename(process.cwd());

const transports = [];
const transportNames = JSON.parse(process.env.LOG_TRANSPORTS || '{}');
if (transportNames.includes("dailyRotateFile")) {
    transports.push(
        new DailyRotateFile({
            filename: path.join(".", "logs", `${svcName}-%DATE%.log`),
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "30d"
        })
    );
}
if (transportNames.includes("staticFile")) {
    transports.push(
        new winston.transports.File({
            filename: path.join(".", "logs", "log.txt"),
            level: logLevel
        })
    );
}


const createLogger = (fileName) => {
    return winston.createLogger({
        level: logLevel,
        format: winston.format.combine(
            winston.format.timestamp(),
            // Custom format to include file name and structured message
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
                const extra = meta[Symbol.for("splat")] || [];
                return `${timestamp} [${level.toUpperCase()}] : [${fileName}] - ${util.format(
                    message,
                    ...extra.map((arg) => util.inspect(arg, { depth: null }))
                )}`;
            })
        ),
        transports: [
            new winston.transports.Console({
                level: logLevel,
                colorize: true
            }),
            ...transports
        ],
        exceptionHandlers: [
            new winston.transports.File({ filename: "../logs/exceptions.log" })
        ],
        exitOnError: false
    });
};

module.exports = createLogger;
// Usage example
// const logger = require('./logger')('example.js');
// logger.info('This is an info message');
// logger.error('This is an error message', { error: new Error('Test error') });
// logger.warn('This is a warning message', { warning: 'Test warning' });
// logger.debug('This is a debug message', { debugInfo: 'Test debug info' });
// logger.verbose('This is a verbose message', { verboseInfo: 'Test verbose info' });
// logger.silly('This is a silly message', { sillyInfo: 'Test silly info' });
// logger.http('This is an HTTP message', { httpInfo: 'Test HTTP info' });
// logger.log('info', 'This is a log message', { logInfo: 'Test log info' });
// logger.log('error', 'This is an error log message', { errorLogInfo: 'Test error log info' });
// logger.log('warn', 'This is a warning log message', { warnLogInfo: 'Test warn log info' });
// logger.log('debug', 'This is a debug log message', { debugLogInfo: 'Test debug log info' });
// logger.log('verbose', 'This is a verbose log message', { verboseLogInfo: 'Test verbose log info' });
// logger.log('silly', 'This is a silly log message', { sillyLogInfo: 'Test silly log info' });
// logger.log('http', 'This is an HTTP log message', { httpLogInfo: 'Test HTTP log info' });