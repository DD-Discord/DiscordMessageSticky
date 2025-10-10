const { dbGet, dbRegister, dbWrite, dbDelete } = require("./db");
const { APIEmbed, EmbedBuilder } = require("discord.js");
const { wrapInCode } = require("./fmt");

/**
 * Settings for a single channel in the message deleter.
 * @typedef {Object} ChannelSettings
 * @property {string} channelId The ID of the channel.
 * @property {string} channelName The name of the channel.
 * @property {string} webhookId The ID of the webhook. [DEPRECATED]
 * @property {string} templateId The ID of the template message (same channel).
 * @property {string | null} lastMessageId The ID of the last message (same channel).
 * @property {boolean} ignoreBots Ignore bot messages when triggering the sticky?
 * @property {boolean} silent Make sticky reposts silent?
 * @property {string} content The cached sticky message content.
 * @property {APIEmbed[]} embeds The cached sticky message embeds.
 */

function register() {
  dbRegister("channels");
}
module.exports.register = register;

/**
 * 
 * @param {string} channelId 
 * @returns {ChannelSettings}
 */
function getChannelSettings(channelId) {
  return dbGet("channels", channelId);
}
module.exports.getChannelSettings = getChannelSettings;

/**
 * 
 * @param {ChannelSettings} settings 
 */
function writeChannelSettings(settings) {
  dbWrite("channels", settings.channelId, settings);
}
module.exports.writeChannelSettings = writeChannelSettings;

/**
 * 
 * @param {string} channelId 
 */
function deleteChannelSettings(channelId) {
  dbDelete("channels", channelId);
}
module.exports.deleteChannelSettings = deleteChannelSettings;

/**
 * Gets the default settings.
 * @param {Channel} channel The channel to get them for.
 * @returns {ChannelSettings}
 */
function getDefaultChannelSettings(channel) {
  return {
    channelId: channel.id,
    channelName: channel.name,
    silent: true,
    ignoreBots: true,
    lastMessageId: null,
    templateId: '',
    webhookId: '',
    webhookUrl: '',
  }
}
module.exports.getDefaultChannelSettings = getDefaultChannelSettings;

/**
 * Creates an embed containing the current channel settings.
 * @param {ChannelSettings} settings The channel settings
 */
function getChannelSettingsEmbed(settings) {
  const embed = new EmbedBuilder();
  embed.setTitle(settings.channelName);
  embed.setDescription(`> These are the settings for <#${settings.channelId}>:\n${wrapInCode({ content: settings.content, embeds: settings.embeds })}`);
  embed.addFields([
    { name: 'Channel ID', value: wrapInCode(settings.channelId), inline: true, },
    { name: 'Channel Name', value: wrapInCode(settings.channelName), inline: true, },
    { name: 'Ignore bots?', value: wrapInCode(settings.ignoreBots), inline: true, },
    { name: 'Silent?', value: wrapInCode(settings.silent), inline: true, },
    { name: 'Template ID', value: wrapInCode(settings.templateId), inline: true, },
    // Limit length for security
    { name: 'Webhook (ID)', value: wrapInCode(settings.webhookId, { maxLength: 60 }), inline: true, },
    { name: 'Webhook (URL)', value: wrapInCode(settings.webhookUrl, { maxLength: 60 }), inline: true, },
  ]);
  return embed;
}
module.exports.getChannelSettingsEmbed = getChannelSettingsEmbed;