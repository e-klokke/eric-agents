/**
 * Environment Variable Validation
 *
 * Validates required environment variables at startup
 * Fails fast if critical configuration is missing
 */

import logger from "./logger.js";

// Required environment variables
const REQUIRED_ENV_VARS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_KEY",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
] as const;

// Optional but recommended environment variables
const RECOMMENDED_ENV_VARS = [
  "TAVILY_API_KEY", // For web search
  "API_KEY", // For HTTP API authentication
  "TELEGRAM_BOT_TOKEN", // For Telegram bot
] as const;

/**
 * Validate that all required environment variables are set
 * Exits process if any required variables are missing
 */
export function validateEnvironment(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Check recommended variables
  for (const key of RECOMMENDED_ENV_VARS) {
    if (!process.env[key]) {
      warnings.push(key);
    }
  }

  // Log results
  if (missing.length > 0) {
    logger.error(
      { missing },
      `Missing required environment variables: ${missing.join(", ")}`
    );
    logger.error("Please set these variables in your .env file");
    logger.error("See .env.example for reference");
    process.exit(1);
  }

  if (warnings.length > 0) {
    logger.warn(
      { warnings },
      `Missing recommended environment variables: ${warnings.join(", ")}`
    );
    logger.warn("Some features may not work without these variables");
  }

  logger.info("✅ Environment validation passed");
}

/**
 * Get environment variable with type safety
 *
 * @param key - Environment variable key
 * @param defaultValue - Default value if not set
 * @returns Environment variable value
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value || defaultValue!;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return !isProduction();
}
