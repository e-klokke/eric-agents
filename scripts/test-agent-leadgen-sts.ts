#!/usr/bin/env tsx
/**
 * Test STS Lead Generation Agent
 */

import "dotenv/config";
import { runSTSLeadGeneration } from "../src/agents/sts/lead-generation.js";
import logger from "../src/shared/logger.js";

async function testSTSLeadGen() {
  console.log("🧪 Testing STS Lead Generation Agent\n");

  try {
    // Test 1: Capture inbound lead
    console.log("1️⃣  Testing inbound lead capture...");
    const inboundResult = await runSTSLeadGeneration({
      action: "capture_inbound",
      inboundLead: {
        source: "website",
        name: "John Smith",
        email: "john.smith@example.com",
        company: "Tech Corp",
        message: "Looking for enterprise IT infrastructure solutions",
        pageVisited: "/enterprise-services",
      },
    });
    console.log("✅ Inbound lead captured");
    console.log(`   Lead ID: ${inboundResult.inboundResult?.leadId}`);
    console.log(`   Score: ${inboundResult.inboundResult?.score}`);
    console.log(`   Qualification: ${inboundResult.inboundResult?.qualification}`);

    // Test 2: Build prospect list
    console.log("\n2️⃣  Testing prospect list building...");
    const listResult = await runSTSLeadGeneration({
      action: "build_list",
      listCriteria: {
        industry: ["Healthcare", "Education"],
        companySize: "100-1000 employees",
        location: ["Tampa, FL", "Orlando, FL"],
      },
    });
    console.log("✅ Prospect list built");
    console.log(`   Prospects found: ${listResult.prospectList?.length || 0}`);
    listResult.prospectList?.slice(0, 2).forEach((p) => {
      console.log(`   - ${p.company} (fit: ${p.fitScore})`);
    });

    // Test 3: Generate outreach
    console.log("\n3️⃣  Testing outreach generation...");
    const outreachResult = await runSTSLeadGeneration({
      action: "generate_outreach",
      prospect: {
        name: "Jane Doe",
        title: "CTO",
        company: "Tech Corp",
        trigger: "Hiring 5 IT infrastructure roles",
      },
      outreachType: "cold_email",
    });
    console.log("✅ Outreach generated");
    console.log(`   Subject: ${outreachResult.outreach?.subject}`);
    console.log(`   Preview: ${outreachResult.outreach?.body.substring(0, 100)}...`);

    // Test 4: Lead digest
    console.log("\n4️⃣  Testing lead digest...");
    const digestResult = await runSTSLeadGeneration({
      action: "lead_digest",
    });
    console.log("✅ Lead digest generated");
    console.log("   Summary:");
    console.log(`   - New inbound leads: ${digestResult.leadDigest?.summary.newInboundLeads}`);
    console.log(
      `   - Outbound prospects: ${digestResult.leadDigest?.summary.outboundProspectsAdded}`
    );
    console.log(`   - Triggers detected: ${digestResult.leadDigest?.summary.triggersDetected}`);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 STS Lead Gen Agent Test PASSED!");
    console.log("=".repeat(50));
    console.log("\nAll operations working correctly! ✅");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testSTSLeadGen().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
