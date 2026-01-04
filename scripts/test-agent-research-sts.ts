#!/usr/bin/env tsx
/**
 * Test STS Lead Research Agent
 */

import "dotenv/config";
import { runSTSLeadResearch } from "../src/agents/sts/lead-research.js";

async function testSTSResearch() {
  console.log("🧪 Testing STS Lead Research Agent\n");

  try {
    console.log("1️⃣  Testing company research...");
    const result = await runSTSLeadResearch({
      companyName: "Tampa General Hospital",
      industry: "Healthcare",
      employeeCount: 2500,
      location: "Tampa, FL",
    });

    console.log("✅ Research completed");
    console.log(`   Company: ${result.companyName}`);
    console.log(`   Score: ${result.score}`);
    console.log(`   Recommendation: ${result.recommendation}`);
    console.log(`   Tech stack insights: ${result.techStack?.length || 0} items`);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 STS Research Agent Test PASSED!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testSTSResearch().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
