/**
 * Quick script to get your Telegram ID
 *
 * Usage:
 * 1. Set TELEGRAM_BOT_TOKEN in .env
 * 2. Run: tsx get-telegram-id.ts
 * 3. Send any message to your bot
 * 4. Your ID will be displayed here
 */

import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("❌ TELEGRAM_BOT_TOKEN not found in .env");
  console.log("\nSteps to fix:");
  console.log("1. Open Telegram and search for @BotFather");
  console.log("2. Send: /newbot");
  console.log("3. Follow prompts to create your bot");
  console.log("4. Copy the token BotFather gives you");
  console.log("5. Add to .env file: TELEGRAM_BOT_TOKEN=your-token-here");
  process.exit(1);
}

console.log("✅ Bot token found!");
console.log("\n🤖 Starting bot to capture your Telegram ID...");
console.log("\n📱 Instructions:");
console.log("1. Open Telegram");
console.log("2. Search for your bot (the username you gave it)");
console.log("3. Send any message to your bot");
console.log("4. Your ID will appear below\n");
console.log("⏳ Waiting for message...\n");

const bot = new TelegramBot(token, { polling: true });

bot.on("message", (msg) => {
  const userId = msg.from?.id;
  const username = msg.from?.username;
  const firstName = msg.from?.first_name;

  console.log("═══════════════════════════════════════════");
  console.log("✅ MESSAGE RECEIVED!");
  console.log("═══════════════════════════════════════════");
  console.log(`👤 Name: ${firstName}`);
  console.log(`🆔 Username: @${username || "none"}`);
  console.log(`🔢 User ID: ${userId}`);
  console.log("═══════════════════════════════════════════");
  console.log("\n📋 Next steps:");
  console.log(`1. Copy this ID: ${userId}`);
  console.log("2. Add to your .env file:");
  console.log(`   TELEGRAM_ALLOWED_USERS=${userId}`);
  console.log("\n✨ You can now use your bot!");
  console.log("\nPress Ctrl+C to exit");
});

bot.on("polling_error", (error) => {
  console.error("❌ Polling error:", error.message);
  if (error.message.includes("401")) {
    console.log("\n🔧 Your bot token might be invalid.");
    console.log("Get a new token from @BotFather with /token");
  }
});
