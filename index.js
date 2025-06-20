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
const defaultConfig = {
    levels: { default: "info" },
    transports: []
};

let loggerConfig;
try {
    loggerConfig = JSON.parse(process.env.LOGGER_CONFIG || '{}');
} catch (err) {
    console.error("Invalid LOGGER_CONFIG. Falling back to defaults.", err);
    loggerConfig = defaultConfig;
}

const logLevel = loggerConfig.levels?.default || "info";
const configuredTransports = [];

for (const transport of loggerConfig.transports || []) {
    const type = transport.type;
    const options = transport.options || {};

    if (type === "daily") {
        configuredTransports.push(
            new DailyRotateFile({
                filename: path.join(".", "logs", `${options.filename || "app"}-%DATE%.log`),
                datePattern: options.datePattern || "YYYY-MM-DD",
                zippedArchive: options.zippedArchive || false,
                maxSize: options.maxSize || "20m",
                maxFiles: options.maxFiles || "30d",
                level: logLevel
            })
        );
    } else if (type === "static") {
        configuredTransports.push(
            new winston.transports.File({
                filename: path.join(".", "logs", options.filename || "static.log"),
                level: logLevel
            })
        );
    }
}

const createLogger = (fileName) => {
    return winston.createLogger({
        level: logLevel,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
                const extra = meta[Symbol.for("splat")] || [];
                return `${timestamp} [${level.toUpperCase()}] : [${fileName}] - ${util.format(
                    message,
                    ...extra.map(arg => util.inspect(arg, { depth: null }))
                )}`;
            })
        ),
        transports: [
            new winston.transports.Console({ level: logLevel }),
            ...configuredTransports
        ],
        exceptionHandlers: [
            new winston.transports.File({ filename: path.join(".", "logs", "exceptions.log") })
        ],
        exitOnError: false
    });
};

module.exports = createLogger;
