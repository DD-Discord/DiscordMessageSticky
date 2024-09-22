const { CommandInteraction, SlashCommandBuilder } = require("discord.js");
const { getChannelSettings } = require("../db");
const { hasStickyPermission } = require("../permissions");

module.exports.name = "check-sticky";

module.exports.data = new SlashCommandBuilder()
  .setName(module.exports.name)
  .setDescription("Checks if a sticky exists in the channel.");
    
/**
 * @param {CommandInteraction} interaction
 */
module.exports.execute = async function(interaction) {
  // Check if the user has permission to check a sticky
  if (!hasStickyPermission(interaction.member)) {
    return interaction.reply({
      content: "You do not have permission to check a sticky.",
      ephemeral: true,
    });
  }

  // Get settings
  const settings = getChannelSettings(interaction.channel.id);  
  // Done
  return interaction.reply({
    content: '```json\n' + JSON.stringify(settings, null, 2).substring(0, 1900) + '\n```',
    ephemeral: true,
  });
};
