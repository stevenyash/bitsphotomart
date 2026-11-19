/**
 * Minimal logger for Edge Runtime (no Node.js APIs)
 * This is the shim that gets imported - the real logger is loaded dynamically
 */
declare const EdgeRuntime: string | undefined;

const edgeLogger = {
  info(message: string, meta?: Record<string, unknown>): void {
    console.log(`[${new Date().toISOString()}] [INFO] ${message}`, meta || '');
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[${new Date().toISOString()}] [WARN] ${message}`, meta || '');
  },
  error(message: string, meta?: Record<string, unknown> & { error?: Error }): void {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, meta || '');
  },
  debug(message: string, meta?: Record<string, unknown>): void {
    console.log(`[${new Date().toISOString()}] [DEBUG] ${message}`, meta || '');
  },
};

// Check if we're in Edge Runtime at module load time
const isEdgeRuntime = typeof EdgeRuntime !== 'undefined' || typeof process === 'undefined';

/**
 * Get the appropriate logger based on runtime environment
 */
function getLogger() {
  if (isEdgeRuntime) {
    return edgeLogger;
  }
  
  try {
    // Dynamic require to load the real Node.js logger
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const realLogger = require("./logger.node");
    return realLogger.logger;
  } catch {
    return edgeLogger;
  }
}

export { getLogger };
export default isEdgeRuntime ? edgeLogger : null;
