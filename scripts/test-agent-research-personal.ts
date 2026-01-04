#!/usr/bin/env tsx
/**
 * Test Personal Lead Research Agent
 */

import "dotenv/config";
import { runPersonalLeadResearch } from "../src/agents/personal/lead-research.js";

async function testPersonalResearch() {
  console.log("🧪 Testing Personal Lead Research Agent\n");

  try {
    console.log("1️⃣  Testing lead research...");
    const result = await runPersonalLeadResearch({
      name: "Andrej Karpathy",
      company: "OpenAI",
      context: "AI researcher and educator, former Director of AI at Tesla",
    });

    console.log("✅ Research completed");
    console.log(`   Name: ${result.name}`);
    console.log(`   Score: ${result.score}`);
    console.log(`   Recommendation: ${result.recommendation}`);
    console.log(`   Connection points: ${result.connectionPoints?.length || 0}`);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Personal Research Agent Test PASSED!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testPersonalResearch().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
