#!/usr/bin/env tsx
/**
 * Test PDC Lead Research Agent
 */

import "dotenv/config";
import { runPDCLeadResearch } from "../src/agents/pdc/lead-research.js";

async function testPDCResearch() {
  console.log("🧪 Testing PDC Lead Research Agent\n");

  try {
    console.log("1️⃣  Testing lead research...");
    const result = await runPDCLeadResearch({
      researchType: "lead",
      athleteName: "Bronny James",
      sport: "Basketball",
    });

    console.log("✅ Research completed");
    console.log(`   Type: ${result.researchType}`);
    console.log(`   Score: ${result.score}`);
    console.log(`   Recommendation: ${result.recommendation}`);
    console.log(`   Key findings: ${result.findings?.length || 0} points`);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 PDC Research Agent Test PASSED!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testPDCResearch().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
