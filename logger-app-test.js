// logger-test-app.js
const express = require("express");
const createLogger = require("./logger");
const { requestContext } = createLogger;
const { v4: uuidv4 } = require("uuid");

const app = express();
const logger = createLogger("test-app");

// Middleware to attach request ID to context
app.use((req, res, next) => {
  requestContext.run({ requestId: uuidv4() }, () => {
    logger.info("Request started", { method: req.method, url: req.url });
    next();
  });
});

app.get("/", (req, res) => {
  logger.info('Starting logger test...');
  logger.error('This is an error message', { error: new Error('Test error') });
  logger.warn('This is a warning message', { warning: 'Test warning' });
  logger.debug('This is a debug message', { debugInfo: 'Test debug info' });
  logger.verbose('This is a verbose message', { verboseInfo: 'Test verbose info' });

  logger.silly('This is a silly message', { sillyInfo: 'Test silly info' });
  logger.http('This is an HTTP message', { httpInfo: 'Test HTTP info' });
  logger.log('info', 'This is a log message', { logInfo: 'Test log info' });
  logger.log('error', 'This is an error log message', { errorLogInfo: 'Test error log info' });
  logger.log('warn', 'This is a warning log message', { warnLogInfo: 'Test warn log info' });
  logger.log('debug', 'This is a debug log message', { debugLogInfo: 'Test debug log info' });
  logger.log('verbose', 'This is a verbose log message', { verboseLogInfo: 'Test verbose log info' });
  logger.log('silly', 'This is a silly log message', { sillyLogInfo: 'Test silly log info' });
  logger.log('http', 'This is an HTTP log message', { httpLogInfo: 'Test HTTP log info' });
  logger.log('silly', 'This is a silly log message with splat', { splat: ['arg1', 'arg2'] });
  logger.log('info', 'This is a log message with splat', { splat: ['arg1', 'arg2'] });
  res.send("Logger test completed. Check your logs.");
});

app.get("/error", (req, res) => {
  try {
    throw new Error("Simulated error");
  } catch (err) {
    logger.error("Caught exception", err);
    res.status(500).send("Error logged.");
  }
});

app.listen(3000, () => {
  logger.info("Logger test server started on http://localhost:3000");
});
