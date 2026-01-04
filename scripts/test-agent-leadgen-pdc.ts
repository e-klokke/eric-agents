#!/usr/bin/env tsx
/**
 * Test PDC Lead Generation Agent
 */

import "dotenv/config";
import { runPDCLeadGeneration } from "../src/agents/pdc/lead-generation.js";

async function testPDCLeadGen() {
  console.log("🧪 Testing PDC Lead Generation Agent\n");

  try {
    // Test 1: Capture inbound lead
    console.log("1️⃣  Testing inbound lead capture...");
    const inboundResult = await runPDCLeadGeneration({
      action: "capture_inbound",
      inboundLead: {
        source: "instagram",
        athleteName: "Marcus Thompson",
        parentName: "Jennifer Thompson",
        parentEmail: "jthompson@example.com",
        sport: "Basketball",
        grade: "10th",
        message: "Interested in the Bridge Program for my son",
      },
    });
    console.log("✅ Inbound lead captured");
    console.log(`   Lead ID: ${inboundResult.inboundResult?.leadId}`);
    console.log(`   Score: ${inboundResult.inboundResult?.score}`);

    // Test 2: Lead digest
    console.log("\n2️⃣  Testing lead digest...");
    const digestResult = await runPDCLeadGeneration({
      action: "lead_digest",
    });
    console.log("✅ Lead digest generated");
    console.log("   Summary:");
    console.log(`   - New inbound leads: ${digestResult.leadDigest?.summary.newInboundLeads || 0}`);
    console.log(`   - School prospects: ${digestResult.leadDigest?.summary.schoolProspects || 0}`);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 PDC Lead Gen Agent Test PASSED!");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testPDCLeadGen().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
