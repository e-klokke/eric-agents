/**
 * Quick validation test script
 *
 * Run: npx tsx test-validation.ts
 */

import {
  PersonalLeadInputSchema,
  PDCLeadInputSchema,
  STSLeadInputSchema,
  PDCContentInputSchema,
  STSContentInputSchema,
  validateInput,
} from "./src/shared/validation.js";

console.log("🧪 Testing Input Validation\n");

// Test 1: Valid personal research
console.log("✅ Test 1: Valid Personal Research");
const test1 = validateInput(PersonalLeadInputSchema, {
  name: "Satya Nadella",
  company: "Microsoft",
});
console.log(test1.success ? "PASS" : `FAIL: ${test1.error}`);
console.log("");

// Test 2: Missing required field
console.log("❌ Test 2: Missing Required Field (should fail)");
const test2 = validateInput(PersonalLeadInputSchema, {
  company: "Microsoft",
});
console.log(!test2.success ? `PASS - Error: ${test2.error}` : "FAIL: Should have failed");
console.log("");

// Test 3: Invalid enum value
console.log("❌ Test 3: Invalid Enum Value (should fail)");
const test3 = validateInput(PDCLeadInputSchema, {
  researchType: "invalid_type",
});
console.log(!test3.success ? `PASS - Error: ${test3.error}` : "FAIL: Should have failed");
console.log("");

// Test 4: String too long
console.log("❌ Test 4: String Too Long (should fail)");
const test4 = validateInput(PersonalLeadInputSchema, {
  name: "A".repeat(300), // Exceeds 200 character limit
});
console.log(!test4.success ? `PASS - Error: ${test4.error}` : "FAIL: Should have failed");
console.log("");

// Test 5: Invalid URL
console.log("❌ Test 5: Invalid URL (should fail)");
const test5 = validateInput(STSLeadInputSchema, {
  companyName: "Acme Corp",
  website: "not-a-url",
});
console.log(!test5.success ? `PASS - Error: ${test5.error}` : "FAIL: Should have failed");
console.log("");

// Test 6: Valid with optional fields
console.log("✅ Test 6: Valid with Optional Fields");
const test6 = validateInput(STSLeadInputSchema, {
  companyName: "Acme Healthcare",
  website: "https://acme.com",
  contactName: "Jane Doe",
  contactTitle: "CTO",
});
console.log(test6.success ? "PASS" : `FAIL: ${test6.error}`);
console.log("");

// Test 7: Valid content generation
console.log("✅ Test 7: Valid Content Generation");
const test7 = validateInput(PDCContentInputSchema, {
  action: "generate",
  topic: "mental toughness",
  pillar: "hidden_game",
});
console.log(test7.success ? "PASS" : `FAIL: ${test7.error}`);
console.log("");

// Test 8: Empty string when required
console.log("❌ Test 8: Empty String When Required (should fail)");
const test8 = validateInput(PersonalLeadInputSchema, {
  name: "",
  company: "Microsoft",
});
console.log(!test8.success ? `PASS - Error: ${test8.error}` : "FAIL: Should have failed");
console.log("");

// Test 9: Trimming whitespace
console.log("✅ Test 9: Trimming Whitespace");
const test9 = validateInput(PersonalLeadInputSchema, {
  name: "  Satya Nadella  ",
  company: "  Microsoft  ",
});
if (test9.success) {
  console.log(`PASS - Trimmed name: "${test9.data.name}"`);
  console.log(`PASS - Trimmed company: "${test9.data.company}"`);
} else {
  console.log(`FAIL: ${test9.error}`);
}
console.log("");

console.log("🎉 All validation tests completed!");
