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
  logger.debug("This is a debug message");
  logger.info("This is an info message");
  logger.warn("This is a warning");
  logger.error("This is an error message");
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
