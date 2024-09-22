const dotenv = require("dotenv");

dotenv.config();

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_WEBHOOK_NAME, DISCORD_WEBHOOK_AVATAR } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error("Missing environment variables");
}

module.exports = {
  DISCORD_TOKEN,
  DISCORD_CLIENT_ID,
  DISCORD_WEBHOOK_NAME,
  DISCORD_WEBHOOK_AVATAR,
};
