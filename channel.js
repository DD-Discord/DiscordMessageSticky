const { dbGet, dbRegister, dbWrite, dbDelete, DbRecord, dbGetAll } = require("./db");
const { APIEmbed, EmbedBuilder, Channel } = require("discord.js");
const { wrapInCode } = require("./fmt");

/**
 * Settings for a single channel in the message sticky.
 * @typedef {Object} ChannelSettings
 * 
 * @property {string} guildId The ID of the guild.
 * @property {string} channelId The ID of the channel.
 * @property {string} channelName The name of the channel.
 * @property {string} webhookId The ID of the webhook. [DEPRECATED]
 * @property {string} webhookUrl The URL of the webhook. [may be null during migration]
 * @property {string} templateId The ID of the template message (same channel).
 * @property {boolean} ignoreBots Ignore bot messages when triggering the sticky?
 * @property {boolean} silent Make sticky reposts silent?
 * 
 * @property {number} debounce If set debounces the repost by the given amount of MS.
 * @property {boolean} isDebouncing Is a debounce process currently ongoing?
 * @property {string | null} lastMessageId The ID of the last message (same channel).
 * 
 * @property {string} content The cached sticky message content.
 * @property {APIEmbed[]} embeds The cached sticky message embeds.
 * 
 * @property {Date?} createdAt When the record was created. Only set during the first save.
 * @property {Date?} updatedAt When the record was last saved. Set on each save.
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
 * @returns {ChannelSettings[]}
 */
function getAllChannelSettings() {
  return dbGetAll("channels");
}
module.exports.getAllChannelSettings = getAllChannelSettings;

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
    guildId: channel.guildId,
    channelId: channel.id,
    channelName: channel.name,
    silent: true,
    ignoreBots: true,
    debounce: 0,
    isDebouncing: false,
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
  const embed = new EmbedBuilder()
    .setTitle(settings.channelName)
    .setDescription(`> These are the settings for <#${settings.channelId}>:\n${wrapInCode({ content: settings.content, embeds: settings.embeds })}`)
    .addFields([
      { name: 'Guild ID', value: wrapInCode(settings.guildId), inline: true, },
      { name: 'Channel ID', value: wrapInCode(settings.channelId), inline: true, },
      { name: 'Channel Name', value: wrapInCode(settings.channelName), inline: true, },
      { name: 'Ignore bots?', value: wrapInCode(settings.ignoreBots), inline: true, },
      { name: 'Silent?', value: wrapInCode(settings.silent), inline: true, },
      { name: 'Debounce MS', value: wrapInCode(settings.debounce), inline: true, },
      { name: 'Is debouncing?', value: wrapInCode(settings.isDebouncing), inline: true, },
      { name: 'Template ID', value: wrapInCode(settings.templateId), inline: true, },
      // Limit length for security
      { name: 'Webhook (ID)', value: wrapInCode(settings.webhookId, { maxLength: 60 }), inline: true, },
      { name: 'Webhook (URL)', value: wrapInCode(settings.webhookUrl, { maxLength: 60 }), inline: true, },
    ])
    .setFooter({ text: 'Sticky created at' })
    .setTimestamp(settings.createdAt);
  return embed;
}
module.exports.getChannelSettingsEmbed = getChannelSettingsEmbed;