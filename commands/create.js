const { CommandInteraction, SlashCommandBuilder, Webhook, Message } = require("discord.js");
const { getChannelSettings, writeChannelSettings } = require("../db");
const { hasStickyPermission } = require("../permissions");
const { getOrCreateWebhook } = require("../logic");

module.exports.name = "create-sticky";

module.exports.data = new SlashCommandBuilder()
  .setName(module.exports.name)
  .setDescription("Creates a sticky from the given message ID.")
  .addStringOption(option => {
    option.setName("message-id");
    option.setDescription("The ID of the message to create a sticky from.");
    option.setRequired(true);
    return option;
  })
  .addBooleanOption(option => {
    option.setName("ignore-bots");
    option.setDescription("Ignore messages from bots.");
    return option;
  })
  .addBooleanOption(option => {
    option.setName("override");
    option.setDescription("Override the current sticky.");
    return option;
  });
    

/**
 * @param {CommandInteraction} interaction
 */
module.exports.execute = async function(interaction) {
  // Check if the user has permission to create a sticky
  if (!hasStickyPermission(interaction.member)) {
    return interaction.reply({
      content: "You do not have permission to create a sticky.",
      ephemeral: true,
    });
  }

  // Get settings
  const templateId = interaction.options.getString("message-id");
  const ignoreBots = interaction.options.getBoolean("ignore-bots") ?? false;
  const override = interaction.options.getBoolean("override") ?? false;
  const channelId = interaction.channelId;
  let settings = getChannelSettings(channelId);

  // Check if a sticky already exists
  if (settings.templateId && !override) {
    return interaction.reply({
      content: "A sticky already exists. Use the `override` option to replace it.",
      ephemeral: true,
    });
  }

  // Fetch message
  /** @type {Message} */
  let message;
  try {
    message = await interaction.channel.messages.fetch(templateId);
  } catch (error) {
    return interaction.reply({
      content: "Failed to fetch message with ID " + templateId,
      ephemeral: true,
    });
  }

  // Create webhook
  /** @type {Webhook} */
  let webhook;
  try {
    webhook = await getOrCreateWebhook(interaction.channel);
  } catch (error) {
    console.error(error);
    return interaction.reply({
      content: "Failed to create webhook - The bot is probably missing permissions.",
      ephemeral: true,
    });
  }

  // Save settings
  settings.creatorId = interaction.user.id;
  settings.templateId = message.id;
  settings.ignoreBots = ignoreBots;
  settings.content = message.content;
  settings.embeds = message.embeds;
  writeChannelSettings(channelId, settings);
  
  // Done
  return interaction.reply({
    content: "Created sticky",
    ephemeral: true,
  });
};
