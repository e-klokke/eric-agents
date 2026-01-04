#!/usr/bin/env tsx
/**
 * Test STS Sales/Nurture Agent
 */

import "dotenv/config";
import { runSTSSalesNurture } from "../src/agents/sts/sales-nurture.js";

async function testSTSSales() {
  console.log("🧪 Testing STS Sales/Nurture Agent\n");

  try {
    // Test 1: Check follow-ups
    console.log("1️⃣  Testing follow-up check...");
    const followupResult = await runSTSSalesNurture({
      action: "check_followups",
    });
    console.log("✅ Follow-ups checked");
    console.log(`   Due follow-ups: ${followupResult.followups?.length || 0}`);

    // Test 2: Pipeline digest
    console.log("\n2️⃣  Testing pipeline digest...");
    const digestResult = await runSTSSalesNurture({
      action: "pipeline_digest",
    });
    console.log("✅ Pipeline digest generated");
    console.log("   Summary:");
    console.log(`   - Total deals: ${digestResult.pipelineDigest?.summary.totalDeals || 0}`);
    console.log(`   - In proposal: ${digestResult.pipelineDigest?.summary.inProposal || 0}`);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 STS Sales Agent Test PASSED!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testSTSSales().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
