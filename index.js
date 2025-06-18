const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");
const util = require("util");
const fileNameFromPath = path.basename(__filename, path.extname(__filename));

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
if (process.env.LOG_TRANSPORTS.includes("dailyRotateFile")) {
    transports.push(
        new winston.transports.DailyRotateFile({
            filename: path.join(".", "logs", `${svcName}-%DATE%.log`),
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "30d"
        })
    );
}
if (process.env.LOG_TRANSPORTS.includes("staticFile")) {
    transports.push(
        new winston.transports.File({
            filename: path.join(".", "logs", "log.txt"),
            level: logLevel
        })
    );
}


const createLogger = (fileName) => {
    console.log(`File name from path: ${fileNameFromPath}`);
    
    return winston.createLogger({
        level: logLevel,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
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
