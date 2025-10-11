import pino from 'pino';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Create a logger instance
export const logger = pino({
    level: process.env.LOG_MODE || 'info',
    transport: {
      target: 'pino-pretty', // Pretty print logs for the console
      options: {
        colorize: true, // Colorize the logs in the console
      }
    }
});