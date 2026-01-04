#!/usr/bin/env node
/**
 * Ultra-simple ID getter
 * Just run this and send a message to your bot
 */

import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_BOT_TOKEN || "8418057873:AAEEKAjbV4tFpwcoZgIyEbDfKYNi7CIBHwU";

console.log("\n╔════════════════════════════════════════════╗");
console.log("║   TELEGRAM ID FINDER - ULTRA SIMPLE        ║");
console.log("╚════════════════════════════════════════════╝\n");

console.log("📱 What's your bot's username?");
console.log("   (The @username you gave it when creating with @BotFather)\n");
console.log("⏳ WAITING FOR YOUR MESSAGE...\n");
console.log("👉 Open Telegram → Search for your bot → Send 'hi'\n");

const bot = new TelegramBot(token, { polling: true });

bot.on("message", (msg) => {
  const id = msg.from?.id;
  const username = msg.from?.username;
  const name = msg.from?.first_name;

  console.log("\n╔════════════════════════════════════════════╗");
  console.log("║          ✅ GOT YOUR ID!                   ║");
  console.log("╚════════════════════════════════════════════╝\n");
  console.log(`👤 Name:     ${name}`);
  console.log(`🆔 Username: ${username ? "@" + username : "Not set"}`);
  console.log(`🔢 USER ID:  ${id}`);
  console.log("\n╔════════════════════════════════════════════╗");
  console.log(`║  YOUR ID IS: ${id}${" ".repeat(28 - String(id).length)}║`);
  console.log("╚════════════════════════════════════════════╝\n");
  console.log("📋 COPY THIS LINE TO YOUR .env FILE:\n");
  console.log(`TELEGRAM_ALLOWED_USERS=${id}\n`);
  console.log("✅ Then restart the bot with: npm run bot\n");

  // Send confirmation to user
  bot.sendMessage(msg.chat.id, `✅ Your Telegram ID is: ${id}\n\nAdd this to your .env file:\nTELEGRAM_ALLOWED_USERS=${id}`);

  console.log("Press Ctrl+C to exit");
});

bot.on("polling_error", (error) => {
  console.error("\n❌ ERROR:", error.message);
  if (error.message.includes("409")) {
    console.log("\n⚠️  Your bot is already running somewhere else!");
    console.log("Stop the other instance first.\n");
  } else if (error.message.includes("401")) {
    console.log("\n⚠️  Invalid bot token!");
    console.log("Get a new token from @BotFather\n");
  }
  process.exit(1);
});

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  console.log("\n\n👋 Exiting...");
  bot.stopPolling();
  process.exit(0);
});
