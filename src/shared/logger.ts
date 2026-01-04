/**
 * Structured Logging with Pino
 *
 * Provides consistent logging across all agents and services
 */

import pino from "pino";

// Configure logger based on environment
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        }
      : undefined, // Use JSON in production
});

export default logger;

/**
 * Create a child logger for specific context
 *
 * @param context - Context object (e.g., { agentName: 'personal-lead-research' })
 * @returns Child logger with context
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}
