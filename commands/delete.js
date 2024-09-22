const { CommandInteraction, SlashCommandBuilder, Webhook, Message } = require("discord.js");
const { getChannelSettings, writeChannelSettings } = require("../db");
const { hasStickyPermission } = require("../permissions");
const { getWebhook } = require("../logic");

module.exports.name = "delete-sticky";

module.exports.data = new SlashCommandBuilder()
  .setName(module.exports.name)
  .setDescription("Deletes the sticky in the current channel.");
    

/**
 * @param {CommandInteraction} interaction
 */
module.exports.execute = async function(interaction) {
  // Check if the user has permission to delete a sticky
  if (!hasStickyPermission(interaction.member)) {
    return interaction.reply({
      content: "You do not have permission to delete a sticky.",
      ephemeral: true,
    });
  }

  const settings = getChannelSettings(channelId);
  if (!settings) {
    return interaction.reply({
      content: "No sticky exists in this channel.",
      ephemeral: true,
    });
  }

  const webhook = getWebhook(interaction.channel);

  
  // Done
  return interaction.reply("Created sticky");
};
