const { Channel, Webhook, Message, MessageFlagsBitField, WebhookClient } = require("discord.js");
const { getChannelSettings, writeChannelSettings, getDefaultChannelSettings } = require("./channel");
const config = require("./config");

/**
 * Only allow processing a single channel once at the same time.
 */
const mutex = new Set();

/**
 * Checks if a sticky needs to be repost in the given channel and does so if necessary.
 * @param {Channel} channel The channel to check for sticky reposts.
 * @param {Message?} message The message that triggered this check.
 * @returns {Promise<Message | void>} The reposted message if a sticky was reposted. Undefined otherwise.
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

    const res = await webhook.send({ 
      content: settings.content, 
      embeds: settings.embeds,
      flags: settings.silent ? [MessageFlagsBitField.Flags.SuppressNotifications] : [],
    });
    settings.lastMessageId = res.id;
    writeChannelSettings(settings);
    return res;
  } finally{
    mutex.delete(channelId);
  }
}

/**
 * Gets the webhook for the given channel.
 * @param {Channel} channel The channel of which to get the webhook.
 * @returns {Promise<WebhookClient | null>} The webbhook for the given channel. Null if no webhook is found.
 */
async function getWebhook(channel) {
  const settings = getChannelSettings(channel.id);
  if (!settings) {
    return null;
  }
  if (settings.webhookUrl) {
    return new WebhookClient({ url: settings.webhookUrl });
  }
  const webhookId = settings.webhookId;
  const webhooks = await channel.fetchWebhooks();
  /** @type {Webhook} */
  const webhook = webhooks.get(webhookId);
  return webhook.client;
}

/**
 * Creates a webhook and saves it in the database.
 * @param {Channel} channel The channel for which to create the webhook.
 * @returns {Promise<Webhook>} The created webbhook for the given channel.
 */
async function createWebhook(channel) {
  const settings = getChannelSettings(channel.id) ?? getDefaultChannelSettings(channel);
  /** @type {Webhook}  */
  const wh = await channel.createWebhook({
    name: config.DISCORD_WEBHOOK_NAME,
    avatar: config.DISCORD_WEBHOOK_AVATAR,
  });
  await wh.send({ content: `Webhook <@${wh.id}> created for channel <#${channel.id}>`});
  settings.webhookId = wh.id;
  settings.webhookUrl = wh.url;
  writeChannelSettings(settings);
  return wh;
}

/**
 * Gets the webhook for the given channel. If none is found: Creates a webhook and saves it in the database.
 * @param {Channel} channel The channel for which to create/get the webhook.
 * @returns {Promise<WebhookClient>} The webbhook for the given channel.
 */
async function getOrCreateWebhook(channel) {
  let webhook = await getWebhook(channel);
  if (!webhook) {
    const wh = await createWebhook(channel);
    webhook = wh.client;
  }
  return webhook;
}


module.exports = { maybeRepost, getWebhook, getOrCreateWebhook };