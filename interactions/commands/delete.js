const { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getChannelSettings, deleteChannelSettings } = require("../../channel");
const { getWebhook } = require("../../logic");
const { wrapInCode } = require("../../fmt");

module.exports.name = "sticky-delete";

module.exports.data = new SlashCommandBuilder()
  .setName(module.exports.name)
  .setDescription("Deletes the sticky in the channel.")
  .addChannelOption(option => {
    option.setName("channel");
    option.setDescription("The channel to check the sticky in. (Default: Current channel)");
    return option;
  })
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

/**
 * @param {ChatInputCommandInteraction} interaction
 */
module.exports.execute = async function (interaction) {
  const channel = interaction.options.getChannel("channel") ?? interaction.channel;

  try {
    const settings = getChannelSettings(channel.id);
    if (!settings) {
      return interaction.reply({
        content: "# No sticky\nNo sticky exists in this channel.",
      });
    }

    deleteChannelSettings(channel.id);

    const webhook = await getWebhook(interaction.channel);
    if (!webhook) {
      return interaction.reply({
        content: "# Sticky partially deleted\nSticky settings were deleted, but no webhook found for this channel. Please check the Integration settings of this channel manually.",
      });
    }

    await webhook.delete('Sticky deleted by ' + interaction.user.username);

    // Done
    return interaction.reply({
      content: "# Sticky fully deleted\nSticky deleted.",
    });
  } catch (error) {
    console.error('Failed to delete sticky', error);
    return interaction.reply({
      content: "# Error deleting sticky\nFailed to delete sticky. The error is:\n" + wrapInCode(error),
    });
  }
};
