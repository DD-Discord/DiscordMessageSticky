const { Guild, Message } = require("discord.js");
const channel = require("./channel");

/**
 * Information about a single message.
 * 
 * @typedef {Object} MessageInfo
 * 
 * @property {string} id The ID of the message.
 * @property {channel.ChannelInfo} channel The channel the message is in.
 */

/**
 * 
 * @param {Message} message 
 * @returns {MessageInfo}
 */
function getMessageInfo(message) {
  return {
    id: message.id,
    channel: channel.getChannelInfo(message.channel),
  };
}
module.exports.getMessageInfo = getMessageInfo;

/**
 * 
 * @param {Guild} guild 
 * @param {MessageInfo | string} message
 */
async function getMessage(guild, message) {
  if (typeof message === 'string') {
    const parsed = parseMessageLink(message);
    if (parsed.guildId !== guild.id) {
      return null;
    }
    message = {
      id: parsed.messageId,
      channel: {
        id: parsed.channelId,
        name: parsed.channelId,
      },
    };
  }
  const msgChannel = await channel.getChannel(guild, message.channel);
  if (!msgChannel?.isTextBased()) {
    return null;
  }
  const msg = await msgChannel.messages.fetch(message.id);
  return msg;
}
module.exports.getMessage = getMessage;

const MESSAGE_LINK_REGEX = /channels\/(?<guildId>\d+)\/(?<channelId>\d+)\/(?<messageId>\d+)/;

/**
 * 
 * @param {string} link 
 */
function parseMessageLink(link) {
  const regex = MESSAGE_LINK_REGEX.exec(link);
  if (!regex) {
    return null;
  }
  return {
    guildId: regex.groups["guildId"],
    channelId: regex.groups["channelId"],
    messageId: regex.groups["messageId"],
  };
}