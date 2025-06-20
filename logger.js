/**
 * @file logger.js
 * @author Vijendra Kumar
 * @version 1.0.0
 * @description
 * This file implements a Winston-based logger with support for multiple transports,
 * including daily rotating files, static files, and HTTP transports. It also supports
 * request context management using AsyncLocalStorage for capturing request IDs and other
 * runtime context information.
 *
 * © 2025 @vijevira (Vijendra Kumar)
 * All rights reserved.
 *
 * This file contains documentation for the logging directory structure
 * and usage instructions for the Winston-based logger configuration.
 * Unauthorized copying, distribution, or modification of this file is prohibited.
 */

const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");
const util = require("util");
const { AsyncLocalStorage } = require("async_hooks");

// For runtime context (e.g., request ID)
const asyncLocalStorage = new AsyncLocalStorage();

// === Parse and validate LOGGER_CONFIG ===
let loggerConfig;
try {
    loggerConfig = JSON.parse(process.env.LOGGER_CONFIG || '{}');
} catch (err) {
    console.error("Invalid LOGGER_CONFIG. Falling back to defaults.", err);
    loggerConfig = {};
}

const defaultLevel = loggerConfig.levels?.default || "info";
const globalFormat = loggerConfig.format === "json" ? "json" : "pretty";
const levelOverrides = loggerConfig.levels || {};

// === Build transports based on config ===
const configuredTransports = [];

for (const transport of loggerConfig.transports || []) {
    const { type, options = {} } = transport;

    switch (type) {
        case "daily":
            configuredTransports.push(
                new DailyRotateFile({
                    filename: path.join(".", "logs", `${options.filename || path.basename(process.cwd())}-%DATE%.log`),
                    datePattern: options.datePattern || "YYYY-MM-DD",
                    zippedArchive: options.zippedArchive || false,
                    maxSize: options.maxSize || "20m",
                    maxFiles: options.maxFiles || "30d",
                    level: options.level || defaultLevel
                })
            );
            break;
        case "static":
            configuredTransports.push(
                new winston.transports.File({
                    filename: path.join(".", "logs", options.filename || "static.log"),
                    level: options.level || defaultLevel,
                    maxsize: options.maxSize || 5 * 1024 * 1024, // 5MB
                    maxFiles: options.maxFiles || 5
                })
            );
            break;
        case "file":
            configuredTransports.push(
                new winston.transports.File({
                    filename: path.join(".", "logs", options.filename || "log.log"),
                    level: options.level || defaultLevel
                })
            );
            break;
        case "http":
            configuredTransports.push(
                new winston.transports.Http({
                    host: options.host,
                    port: options.port,
                    path: options.path,
                    ssl: options.ssl || false,
                    level: options.level || defaultLevel
                })
            );
            break;
        default:
            console.warn(`Unknown transport type: ${type}. Skipping.`);
            break;
    }
}


// === Create logger ===
const createLogger = (fileName = "app") => {
    const effectiveLevel = levelOverrides[fileName] || defaultLevel;

    const prettyFormatter = winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
            const requestId = asyncLocalStorage.getStore?.()?.requestId;
            const extra = meta[Symbol.for("splat")] || [];

            // Example masking - you can expand this
            const maskedMessage = typeof message === "string"
                ? message.replace(/(password|token)\s*[:=]\s*\S+/gi, "$1: ***")
                : message;

            const requestIdPart = requestId ? `[${requestId}] ` : "";
            return `${timestamp} [${level.toUpperCase()}] ${requestIdPart}[${fileName}] - ${util.format(
                maskedMessage,
                ...extra.map(arg => util.inspect(arg, { depth: null }))
            )}`;
        })
    );

    return winston.createLogger({
        level: effectiveLevel,
        format: globalFormat === "json"
            ? winston.format.json()
            : prettyFormatter,
        transports: [
            new winston.transports.Console({ level: effectiveLevel }),
            ...configuredTransports
        ],
        exceptionHandlers: [
            new winston.transports.File({ filename: path.join(".", "logs", "exceptions.log") })
        ],
        exitOnError: false
    });
};

// === Export logger creator and optional request context helper ===
module.exports = createLogger;
module.exports.requestContext = asyncLocalStorage;
