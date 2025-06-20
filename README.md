# Logger Utility (Winston-based)

A powerful, flexible logging utility built on [winston](https://github.com/winstonjs/winston), with support for:

* JSON or human-readable output
* Dynamic log levels per module
* Multiple transport types (daily rotation, static files, HTTP, etc.)
* Request-scoped context via `AsyncLocalStorage` (e.g., requestId)
* Exception handling and masking sensitive data

---

## 🔧 Setup

Install dependencies:

```bash
npm install winston winston-daily-rotate-file
```

Ensure your environment contains the logger config:

```bash
export LOGGER_CONFIG='{
  "levels": { "default": "debug", "auth.js": "info" },
  "format": "pretty",
  "transports": [
    { "type": "daily", "options": { "filename": "app", "datePattern": "YYYY-MM-DD", "maxFiles": "14d" } },
    { "type": "static", "options": { "filename": "combined.log" } }
  ]
}'
```
```bash
export LOGGER_CONFIG='{
  "levels": { "default": "info", "auth.js": "debug" },
  "format": "pretty",
  "transports": [
    { "type": "daily", "options": { "filename": "app", "datePattern": "YYYY-MM-DD", "maxFiles": "14d" } },
    { "type": "static", "options": { "filename": "combined.log", "maxSize": 5242880, "maxFiles": 5 } },
    { "type": "http", "options": { "host": "logserver.example.com", "port": 9000, "path": "/logs", "ssl": false } },
    { "type": "file", "options": { "filename": "errors.log", "level": "error" } },
    { "type": "file", "options": { "filename": "silly.log", "level": "silly" } }
  ]
}'
```

---

## 🧪 Example Test App

See `logger-test-app.js` for a basic Express server that demonstrates logging.

```bash
node logger-test-app.js
```

Visit:

* [http://localhost:3000](http://localhost:3000) → Basic log messages
* [http://localhost:3000/error](http://localhost:3000/error) → Logs exception with stack trace

---

## 🧱 API

### `createLogger(fileName: string)`

Returns a configured Winston logger instance tagged with the provided filename/module name.

### `requestContext.run({ requestId }, () => fn)`

Run code with a request ID attached to logs using AsyncLocalStorage. Use inside middleware.

---

## 📁 Logs Structure

* `/logs/app-YYYY-MM-DD.log` → Rotating daily logs
* `/logs/combined.log` → Static log file
* `/logs/exceptions.log` → Uncaught exceptions
* `/logs/errors.log` → Error-level logs only

---

## 💡 Tips

* Use `logger.debug/info/warn/error()` depending on severity.
* Sensitive values like `password` or `token` are masked in pretty logs.
* Easily plug into any framework like Express, Koa, etc.

---

## 📜 License

MIT License
© 2025 @vijevira (Vijendra Kumar)
