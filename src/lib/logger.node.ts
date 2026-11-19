/**
 * Production Logger with File Output (Node.js only)
 * 
 * Console + file logging for debugging production issues on cPanel
 */

import fs from 'fs';
import path from 'path';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
}

// In-memory log buffer for API endpoint access
const logBuffer: LogEntry[] = [];
const MAX_BUFFER_SIZE = 1000;

// Log file path - in the app directory for easy access
const LOG_FILE = path.join(process.cwd(), 'logs', `app-${new Date().toISOString().split('T')[0]}.log`);

// Ensure log directory exists
function ensureLogDir(): void {
  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir, { recursive: true });
    } catch (e) {
      // May fail on some hosts, continue without file logging
    }
  }
}

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

function writeToFile(entry: string): void {
  ensureLogDir();
  try {
    fs.appendFileSync(LOG_FILE, entry);
  } catch (e) {
    // Silently fail if file write fails
  }
}

const logger = {
  info(message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      meta,
    };
    logBuffer.push(entry);
    if (logBuffer.length > MAX_BUFFER_SIZE) {
      logBuffer.shift();
    }
    const formatted = formatLog('info', message, meta);
    console.log(formatted);
    writeToFile(formatted + '\n');
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      meta,
    };
    logBuffer.push(entry);
    if (logBuffer.length > MAX_BUFFER_SIZE) {
      logBuffer.shift();
    }
    const formatted = formatLog('warn', message, meta);
    console.warn(formatted);
    writeToFile(formatted + '\n');
  },

  error(message: string, meta?: Record<string, unknown> & { error?: Error }): void {
    const errorMeta = meta?.error 
      ? { ...meta, error: meta.error.message, stack: meta.error.stack }
      : meta;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      meta: errorMeta,
    };
    logBuffer.push(entry);
    if (logBuffer.length > MAX_BUFFER_SIZE) {
      logBuffer.shift();
    }
    const formatted = formatLog('error', message, errorMeta);
    console.error(formatted);
    writeToFile(formatted + '\n');
  },

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        meta,
      };
      logBuffer.push(entry);
      if (logBuffer.length > MAX_BUFFER_SIZE) {
        logBuffer.shift();
      }
      const formatted = formatLog('debug', message, meta);
      console.log(formatted);
      writeToFile(formatted + '\n');
    }
  },

  getRecentLogs(count: number = 100): LogEntry[] {
    return logBuffer.slice(-count);
  },

  getAllLogs(): LogEntry[] {
    return [...logBuffer];
  },

  getLogFilePath(): string {
    return LOG_FILE;
  },

  clear(): void {
    logBuffer.length = 0;
  },
};

export { logger };
export type { LogEntry };
export default logger;
