#!/usr/bin/env tsx
/**
 * Test PDC Social/Content Agent
 */

import "dotenv/config";
import { runPDCSocialContent } from "../src/agents/pdc/social-content.js";

async function testPDCContent() {
  console.log("🧪 Testing PDC Social/Content Agent\n");

  try {
    console.log("1️⃣  Testing content generation...");
    const result = await runPDCSocialContent({
      action: "generate",
      topic: "NIL opportunities for college athletes",
      platform: "instagram",
      contentType: "educational",
    });

    console.log("✅ Content generated");
    console.log(`   Platform: ${result.platform}`);
    console.log(`   Content type: ${result.contentType}`);
    console.log(`   Preview: ${result.content?.substring(0, 100)}...`);
    console.log(`   Hashtags: ${result.hashtags?.length || 0}`);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 PDC Content Agent Test PASSED!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testPDCContent().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
