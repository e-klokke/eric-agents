/**
 * Test Environment Validation
 *
 * Run: npx tsx test-env-validation.ts
 */

// Clear critical env vars to test validation
delete process.env.ANTHROPIC_API_KEY;
delete process.env.OPENAI_API_KEY;

console.log("Testing environment validation with missing required variables...\n");

import { validateEnvironment } from "./src/shared/env.js";

try {
  validateEnvironment();
  console.log("❌ Test FAILED - should have exited with error");
} catch (error) {
  console.log("✅ Test PASSED - validation caught missing variables");
}
