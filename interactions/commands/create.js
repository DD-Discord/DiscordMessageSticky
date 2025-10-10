const { SlashCommandBuilder, Webhook, Message, PermissionFlagsBits, ChatInputCommandInteraction } = require("discord.js");
const { getChannelSettings, writeChannelSettings, getChannelSettingsEmbed } = require("../../channel");
const { getOrCreateWebhook } = require("../../logic");
const { wrapInCode } = require("../../fmt");

module.exports.name = "sticky-create";

module.exports.data = new SlashCommandBuilder()
  .setName(module.exports.name)
  .setDescription("Creates a sticky from the given message ID.")
  .addChannelOption(option => {
    option.setName("channel");
    option.setDescription("The channel to create the sticky in.");
    option.setRequired(true);
    return option;
  })
  .addStringOption(option => {
    option.setName("message-id");
    option.setDescription("The ID of the message to create a sticky from (must be in the same channel as the sticky).");
    option.setRequired(true);
    return option;
  })
  .addBooleanOption(option => {
    option.setName("ignore-bots");
    option.setDescription("Ignore messages from bots. (Default: Yes)");
    return option;
  })
  .addBooleanOption(option => {
    option.setName("silent");
    option.setDescription("If set, reposting the sticky will not send notifications. (Default: Yes)");
    return option;
  })
  .addIntegerOption(option => {
    option.setName("debounce");
    option.setDescription("If set, wait the specified amount of milliseconds before reposting the message. (Default: 0)");
    return option;
  })
  .addBooleanOption(option => {
    option.setName("override");
    option.setDescription("Override the current sticky.");
    return option;
  })
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);


/**
 * @param {ChatInputCommandInteraction} interaction
 */
module.exports.execute = async function (interaction) {
  // Get settings
  const templateId = interaction.options.getString("message-id");
  const ignoreBots = interaction.options.getBoolean("ignore-bots");
  const override = interaction.options.getBoolean("override");
  const silent = interaction.options.getBoolean("silent");
  const channel = interaction.options.getChannel("channel");
  const debounce = interaction.options.getInteger("debounce");
  const channelId = channel.id;

  // Fetch message
  /** @type {Message} */
  let message;
  try {
    message = await channel.messages.fetch(templateId);
  } catch (error) {
    console.error(error);
    return interaction.reply({
      content: `# Failed to fetch message\nCan't load message with ID \`${templateId}\` in channel ${channel.url}. The bot is probably missing permissions, or the message you chose is in a different channel. The error is:\n${wrapInCode(error)}`,
    });
  }

  // Create webhook
  /** @type {Webhook} */
  let webhook;
  try {
    webhook = await getOrCreateWebhook(channel);
  } catch (error) {
    console.error(error);
    return interaction.reply({
      content: `# Failed to create webhook\nThe bot is probably missing permissions. The error is:\n${wrapInCode(error)}`,
    });
  }

  // Check if a sticky already exists
  const settings = getChannelSettings(channelId);
  if (settings.templateId && !override) {
    return interaction.reply({
      content: `# A sticky already exists\nUse the \`override\` option to replace it.`,
    });
  }

  // Save settings
  settings.templateId = message.id;
  if (ignoreBots !== null) {
    settings.ignoreBots = ignoreBots;
  }
  if (silent !== null) {
    settings.silent = silent;
  }
  if (debounce !== null) {
    settings.debounce = debounce;
  }
  settings.guildId = message.guildId; // set guild ID since old db records dont have it
  settings.content = message.content;
  settings.embeds = message.embeds.map(e => e.toJSON());
  delete settings.createdAt;
  writeChannelSettings(settings);

  // Done
  return interaction.reply({
    content: `# Created sticky\nFrom message ${message.url}.`,
    embeds: [getChannelSettingsEmbed(settings)],
  });
};
