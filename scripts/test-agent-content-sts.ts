#!/usr/bin/env tsx
/**
 * Test STS Social/Content Agent
 */

import "dotenv/config";
import { runSTSSocialContent } from "../src/agents/sts/social-content.js";

async function testSTSContent() {
  console.log("🧪 Testing STS Social/Content Agent\n");

  try {
    console.log("1️⃣  Testing content generation...");
    const result = await runSTSSocialContent({
      action: "generate",
      topic: "Cloud migration best practices",
      platform: "linkedin",
      contentType: "thought_leadership",
    });

    console.log("✅ Content generated");
    console.log(`   Platform: ${result.platform}`);
    console.log(`   Content type: ${result.contentType}`);
    console.log(`   Preview: ${result.content?.substring(0, 100)}...`);
    console.log(`   Hashtags: ${result.hashtags?.length || 0}`);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 STS Content Agent Test PASSED!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testSTSContent().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
