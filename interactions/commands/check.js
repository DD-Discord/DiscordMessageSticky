const { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getChannelSettings, getChannelSettingsEmbed } = require("../../channel");

module.exports.name = "sticky-check";

module.exports.data = new SlashCommandBuilder()
  .setName(module.exports.name)
  .setDescription("Checks if a sticky exists in the channel.")
  .addChannelOption(option => {
    option.setName("channel");
    option.setDescription("The channel to check the sticky in. (Default: Current channel)");
    return option;
  })
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);
    
/**
 * @param {ChatInputCommandInteraction} interaction
 */
module.exports.execute = async function(interaction) {
  const channel = interaction.options.getChannel("channel") ?? interaction.channel;
  // Get settings
  const settings = getChannelSettings(channel.id);  
  // Done
  return interaction.reply({
    content: `# Sticky for ${channel.url}`,
    embeds: [getChannelSettingsEmbed(settings)],
  });
};
