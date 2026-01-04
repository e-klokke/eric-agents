#!/usr/bin/env tsx
/**
 * Test Supabase Connection
 *
 * Verifies:
 * 1. Environment variables are set
 * 2. Can connect to Supabase
 * 3. Database tables exist
 */

import "dotenv/config";
import { supabase } from "../src/shared/supabase.js";
import logger from "../src/shared/logger.js";

const REQUIRED_TABLES = [
  // Core tables
  "agent_runs",
  "memories",

  // PDC Sales
  "pdc_athletes",
  "pdc_followup_queue",
  "pdc_referral_partners",

  // STS Sales
  "sts_deals",
  "sts_followup_queue",

  // PDC Lead Gen
  "pdc_inbound_leads",
  "pdc_outbound_prospects",
  "pdc_partner_prospects",

  // STS Lead Gen
  "sts_inbound_leads",
  "sts_outbound_prospects",
  "sts_trigger_events",
];

async function testConnection() {
  console.log("🔍 Testing Supabase Connection...\n");

  // Step 1: Check environment variables
  console.log("1️⃣  Checking environment variables...");
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    console.log("\n💡 Fix:");
    console.log("   1. Copy .env.example to .env");
    console.log("   2. Add your Supabase credentials");
    console.log("   3. See SUPABASE_SETUP.md for detailed instructions");
    process.exit(1);
  }

  if (supabaseUrl.includes("your-project") || supabaseKey.includes("your-service-key")) {
    console.error("❌ Supabase credentials are still placeholder values");
    console.log("\n💡 Fix:");
    console.log("   1. Get your actual credentials from Supabase Dashboard");
    console.log("   2. Update .env file with real values");
    console.log("   3. See SUPABASE_SETUP.md for detailed instructions");
    process.exit(1);
  }

  console.log("✅ Environment variables found");
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);

  // Step 2: Test connection
  console.log("\n2️⃣  Testing database connection...");
  try {
    const { data, error } = await supabase
      .from("agent_runs")
      .select("count")
      .limit(1);

    if (error) {
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        console.error("❌ Database tables don't exist yet");
        console.log("\n💡 Fix:");
        console.log("   Run migrations to create tables:");
        console.log("   1. supabase link --project-ref your-ref");
        console.log("   2. supabase db push");
        console.log("   Or see SUPABASE_SETUP.md for manual SQL method");
        process.exit(1);
      }
      throw error;
    }

    console.log("✅ Successfully connected to Supabase");
  } catch (error) {
    console.error("❌ Connection failed:", error);
    console.log("\n💡 Fix:");
    console.log("   1. Check your internet connection");
    console.log("   2. Verify SUPABASE_URL is correct");
    console.log("   3. Verify you're using service_role key, not anon key");
    process.exit(1);
  }

  // Step 3: Verify tables exist
  console.log("\n3️⃣  Verifying database tables...");
  let missingTables: string[] = [];

  for (const table of REQUIRED_TABLES) {
    try {
      const { error } = await supabase.from(table).select("count").limit(1);

      if (error) {
        if (error.message.includes("does not exist")) {
          missingTables.push(table);
          console.log(`   ❌ ${table} - missing`);
        } else {
          console.log(`   ⚠️  ${table} - error: ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${table}`);
      }
    } catch (error) {
      console.log(`   ⚠️  ${table} - error checking`);
    }
  }

  if (missingTables.length > 0) {
    console.log(`\n❌ ${missingTables.length} tables are missing`);
    console.log("\n💡 Fix:");
    console.log("   Run migrations to create tables:");
    console.log("   supabase db push");
    process.exit(1);
  }

  console.log(`\n✅ All ${REQUIRED_TABLES.length} required tables verified`);

  // Step 4: Test RPC functions
  console.log("\n4️⃣  Testing RPC functions...");
  try {
    const { data: stsSummary, error: stsError } = await supabase.rpc("get_sts_leadgen_summary");
    if (stsError) {
      console.log("   ⚠️  get_sts_leadgen_summary - not found (may not be critical)");
    } else {
      console.log("   ✅ get_sts_leadgen_summary");
    }

    const { data: pdcSummary, error: pdcError } = await supabase.rpc("get_pdc_leadgen_summary");
    if (pdcError) {
      console.log("   ⚠️  get_pdc_leadgen_summary - not found (may not be critical)");
    } else {
      console.log("   ✅ get_pdc_leadgen_summary");
    }
  } catch (error) {
    console.log("   ⚠️  Some RPC functions not available");
  }

  // Success!
  console.log("\n" + "=".repeat(50));
  console.log("🎉 Supabase connection test PASSED!");
  console.log("=".repeat(50));
  console.log("\nNext steps:");
  console.log("  1. Test agents: npm run test:agent:leadgen:sts");
  console.log("  2. Test agents: npm run test:agent:sales:pdc");
  console.log("  3. Start building! 🚀");
  console.log();

  process.exit(0);
}

testConnection().catch((error) => {
  console.error("\n💥 Unexpected error:", error);
  process.exit(1);
});
