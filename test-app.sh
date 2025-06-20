export LOGGER_CONFIG='{
  "levels": { "default": "verbose" },
  "transports": [
    { "type": "daily", "options": { "filename": "logger", "datePattern": "YYYY-MM-DD", "maxFiles": "30d" } },
    { "type": "static", "options": { "filename": "static.log" } }
  ]
}'

node logger-app-test.js