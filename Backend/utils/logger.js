const winston = require('winston');
require('winston-daily-rotate-file');

// Set up the daily rotating file transport
const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/%DATE%-combined.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d', // Keep logs for 14 days
});

// Set up the console transport
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
  ),
});

// Create the logger instance
const logger = winston.createLogger({
  level: 'info', // Default log level (you can change it to 'debug', 'warn', etc.)
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    dailyRotateFileTransport, // Log to files
    consoleTransport,         // Log to the console
  ],
});

module.exports = logger;
