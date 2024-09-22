const { CommandInteraction, SlashCommandBuilder, Webhook, Message } = require("discord.js");
const { getChannelSettings, deleteChannelSettings } = require("../db");
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

  try {
    const settings = getChannelSettings(interaction.channel.id);
    if (!settings) {
      return interaction.reply({
        content: "No sticky exists in this channel.",
        ephemeral: true,
      });
    }

    deleteChannelSettings(interaction.channel.id);

    const webhook = await getWebhook(interaction.channel);
    if (!webhook) {
      return interaction.reply({
        content: "Sticky settings were deleted, but no webhook found for this channel. Please check the Integration settings of this channel manually.",
        ephemeral: true,
      });
    }

    await webhook.delete('Sticky deleted by ' + interaction.user.tag);
  
    // Done
    return interaction.reply({
      content: "Sticky deleted.",
      ephemeral: true,
    });
  } catch (error) {
    console.error('Failed to delete sticky', error);
    return interaction.reply({
      content: "Failed to delete sticky.",
      ephemeral: true,
    });
  }
};
