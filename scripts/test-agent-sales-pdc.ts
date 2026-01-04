#!/usr/bin/env tsx
/**
 * Test PDC Sales/Nurture Agent
 */

import "dotenv/config";
import { runPDCSalesNurture } from "../src/agents/pdc/sales-nurture.js";
import logger from "../src/shared/logger.js";

async function testPDCSales() {
  console.log("🧪 Testing PDC Sales/Nurture Agent\n");

  try {
    // Test 1: Schedule consultation
    console.log("1️⃣  Testing consultation scheduling...");
    const consultResult = await runPDCSalesNurture({
      action: "schedule_consultation",
      parentName: "Sarah Johnson",
      parentEmail: "sarah.j@example.com",
      athleteName: "Michael Johnson",
      sport: "Basketball",
    });
    console.log("✅ Consultation scheduled");
    console.log(`   Athlete: ${consultResult.consultation?.athleteName}`);
    console.log(`   Parent: ${consultResult.consultation?.parentName}`);
    console.log(`   Confirmed: ${consultResult.consultation?.confirmationSent}`);

    // Test 2: Check follow-ups
    console.log("\n2️⃣  Testing follow-up check...");
    const followupResult = await runPDCSalesNurture({
      action: "check_followups",
    });
    console.log("✅ Follow-ups checked");
    console.log(`   Due follow-ups: ${followupResult.followUps?.length || 0}`);
    followupResult.followUps?.slice(0, 2).forEach((fu) => {
      console.log(`   - ${fu.athleteName} (${fu.sequenceType})`);
    });

    // Test 3: Enrollment digest
    console.log("\n3️⃣  Testing enrollment digest...");
    const digestResult = await runPDCSalesNurture({
      action: "enrollment_digest",
    });
    console.log("✅ Enrollment digest generated");
    console.log("   Summary:");
    console.log(`   - Total inquiries: ${digestResult.enrollmentDigest?.summary.totalInquiries}`);
    console.log(
      `   - Consultations scheduled: ${digestResult.enrollmentDigest?.summary.consultationsScheduled}`
    );
    console.log(
      `   - Active athletes: ${digestResult.enrollmentDigest?.summary.activeAthletes}`
    );
    console.log(
      `   - This month enrollments: ${digestResult.enrollmentDigest?.summary.thisMonthEnrollments}`
    );
    console.log(`   - Needs action: ${digestResult.enrollmentDigest?.needsAction.length || 0}`);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 PDC Sales Agent Test PASSED!");
    console.log("=".repeat(50));
    console.log("\nAll operations working correctly! ✅");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testPDCSales().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
