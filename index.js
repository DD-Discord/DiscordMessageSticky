const { Client, GatewayIntentBits, Events } = require("discord.js");
const interactions = require("./interactions");
const config = require("./config");
const { maybeRepost } = require("./logic");
const { register } = require("./channel");

register();

const client = new Client({
  intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

client.once(Events.ClientReady, () => {
  console.log("Discord bot is ready! 🤖");
});

client.on(Events.GuildAvailable, async (guild) => {
  await interactions.deploy({ guildId: guild.id });
});

client.on(Events.MessageCreate, async (message) => {
  if (message.channel != null) {
    try {
      await maybeRepost(message.channel, message);
    } catch(error) {
      console.error('Error handling message', error);
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  const handled = await interactions.handle(interaction);
  if (!handled) {
    console.warn('Unhandled interaction', interaction);
  }
});
client.login(config.DISCORD_TOKEN);
