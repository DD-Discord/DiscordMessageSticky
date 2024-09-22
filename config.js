const dotenv = require("dotenv");

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_WEBHOOK_NAME, DISCORD_WEBHOOK_AVATAR, DISCORD_STICKY_PERMISSION } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error("Missing environment variables");
}

module.exports = {
  DISCORD_TOKEN,
  DISCORD_CLIENT_ID,
  DISCORD_WEBHOOK_NAME,
  DISCORD_WEBHOOK_AVATAR,
  DISCORD_STICKY_PERMISSION,
};
