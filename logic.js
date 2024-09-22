const { Channel, Webhook, Message } = require("discord.js");
const { getChannelSettings, writeChannelSettings } = require("./db");
const config = require("./config");

/**
 * Only allow processing a single channel once at the same time.
 */
const mutex = new Set();

/**
 * Checks if a sticky needs to be repost in the given channel and does so if necessary.
 * @param {Channel} channel The channel to check for sticky reposts.
 * @param {Message?} message The message that triggered this check.
 */
async function maybeRepost(channel, message) {
  // Get settings for channel
  const channelId = channel.id;
  const settings = getChannelSettings(channel.id);
  if (!settings) {
    return
  }

  try {
    if (mutex.has(channelId)) {
      return;
    }
    mutex.add(channelId);

    // Get webhook for channel
    const webhook = await getWebhook(channel);
    if (!webhook) {
      console.warn('No webhook for channel ' + channelId);
      return;
    }

    // Prevent reposting messages from the webhook itself
    if (message) {
      const authorId = message.author.id;
      if (authorId === webhook.id) {
        console.debug('Ignoring message from webhook');
        return;
      }
      if (settings.ignoreBots && message.author.bot) {
        console.debug('Ignoring message from bot');
        return;
      }
    }

    // Delete old sticky
    if (settings.lastMessageId) {
      try {
        await channel.messages.delete(settings.lastMessageId);
      } catch (error) {
        console.error('Failed to delete old sticky', error);
      }
    }

    // Repost sticky
    if (!settings.templateId) {
      console.debug('No message ID set');
      return;
    }

    const res = await webhook.send({ content: settings.content, embeds: settings.embeds });
    settings.lastMessageId = res.id;
    writeChannelSettings(channelId, settings);
  } finally{
    mutex.delete(channelId);
  }
}

/**
 * 
 * @param {Channel} channel The channel of which to get the webhook.
 * @returns {Promise<Webhook | null>} The webbhook for the given channel.
 */
async function getWebhook(channel) {
  const settings = getChannelSettings(channel.id);
  if (!settings) {
    return null;
  }
  const webhookId = settings.webhookId;
  const webhooks = await channel.fetchWebhooks();
  /** @type {Webhook} */
  const webhook = webhooks.get(webhookId);
  return webhook;
}

async function createWebhook(channel) {
  const settings = getChannelSettings(channel.id) ?? {};
  /** @type {Webhook}  */
  const wh = await interaction.channel.createWebhook({
    name: config.DISCORD_WEBHOOK_NAME,
    avatar: config.DISCORD_WEBHOOK_AVATAR,
  })
  await wh.send({ content: 'Webhook created for channel ID ' + channel.id });
  settings.webhookId = wh.id;
  settings.channelId = channel.id;
  writeChannelSettings(channel.id, settings);
  return wh;
}

async function getOrCreateWebhook(channel) {
  let webhook = await getWebhook(channel);
  if (!webhook) {
    webhook = await createWebhook(channel);
  }
  return webhook;
}


module.exports = { maybeRepost, getWebhook, getOrCreateWebhook };