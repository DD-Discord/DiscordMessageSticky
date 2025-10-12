const { Channel, Webhook, Message, MessageFlagsBitField, WebhookClient, Client, Guild } = require("discord.js");
const { getChannelSettings, writeChannelSettings, getDefaultChannelSettings, ChannelSettings, getAllChannelSettings, webhookSendTo, webhookDeleteFrom } = require("./channel");
const config = require("./config");

/**
 * Only allow processing a single channel once at the same time.
 */
const mutex = new Set();
const debounceTimers = new Map();

/**
 * 
 * @param {Guild} guild 
 */
async function reviveDebouncers(guild) {
  const allSettings = getAllChannelSettings();
  for (const setting of allSettings) {
    if (setting.guildId !== guild.id) {
      continue;
    }
    
    if (!setting.isDebouncing) {
      continue;
    }

    try {
      const channel = await guild.channels.fetch(setting.channelId);
      if (channel) {
        startDebounceTimer(channel, setting);
      }
    } catch(error) {
      console.error('Failed to revive timer for %s in %s', setting.channelId, guild.id, error);
    }
  }
}
module.exports.reviveDebouncers = reviveDebouncers;

/**
 * @param {Channel} channel
 * @param {ChannelSettings} settings 
 */
function startDebounceTimer(channel, settings) {
  if (!settings.debounce) {
    return false;
  }
  if (settings.isDebouncing) {
    const timer = debounceTimers.get(channel.id);
    clearTimeout(timer);
  }
  const timer = setTimeout(() => onDebounceTimer(channel), settings.debounce);
  console.log('Debouncing %s in %s', channel.id, settings.debounce);
  debounceTimers.set(channel.id, timer);
  settings.isDebouncing = true;
  writeChannelSettings(settings);
  return timer;
}

/**
 * 
 * @param {Channel} channel 
 */
async function onDebounceTimer(channel) {
  try {
    const settings = getChannelSettings(channel.id);
    if (!settings) {
      return;
    }
    settings.isDebouncing = false;
    writeChannelSettings(settings);
    await performRepost(channel);
  } catch(error) {
    console.error('Error debounced reposting in %s', channel.id, error)
  }
}

/**
 * 
 * @param {Channel} channel 
 */
async function performRepost(channel) {
  const settings = getChannelSettings(channel.id);
  if (!settings) {
    return false;
  }

  // Get webhook for channel
  const webhook = await getWebhook(channel);
  if (!webhook) {
    console.warn('No webhook for channel ' + channel.id);
    return false;
  }
  
  // Delete old sticky
  if (settings.lastMessageId) {
    try {
      await webhookDeleteFrom(webhook, settings.channel, settings.lastMessageId);
    } catch (error) {
      console.error('Failed to delete old sticky', error);
    }
  }

  // Repost sticky
  const res = await webhookSendTo(webhook, settings.channel, { 
    content: settings.content, 
    embeds: settings.embeds,
    flags: settings.silent ? [MessageFlagsBitField.Flags.SuppressNotifications] : [],
  });
  settings.lastMessageId = res.id;
  writeChannelSettings(settings);
}

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
    return false;
  }

  try {
    if (mutex.has(channelId)) {
      return false;
    }
    mutex.add(channelId);

    // Get webhook for channel
    const webhook = await getWebhook(channel);
    if (!webhook) {
      console.warn('No webhook for channel ' + channelId);
      return false;
    }

    // Prevent reposting messages from the webhook itself
    if (message) {
      const authorId = message.author.id;
      if (authorId === webhook.id) {
        console.debug('Ignoring message from webhook');
        return false;
      }
      if (settings.ignoreBots && (message.author.bot || message.author.system)) {
        console.debug('Ignoring message from bot');
        return false;
      }
    }

    if (settings.debounce) {
      return startDebounceTimer(channel, settings);
    } else {
      return await performRepost(channel);
    }
  } finally {
    mutex.delete(channelId);
  }
}
module.exports.maybeRepost = maybeRepost;

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
  if (channel.isThread()) {
    channel = channel.parent;
  }
  const webhooks = await channel.fetchWebhooks();
  /** @type {Webhook} */
  const webhook = webhooks.get(webhookId);
  settings.webhookUrl = webhook.url;
  return new WebhookClient({ url: webhook.url });
}
module.exports.getWebhook = getWebhook;

/**
 * Creates a webhook and saves it in the database.
 * @param {Channel} channel The channel for which to create the webhook.
 * @returns {Promise<Webhook>} The created webbhook for the given channel.
 */
async function createWebhook(channel) {
  const settings = getChannelSettings(channel.id) ?? getDefaultChannelSettings(channel);
  if (channel.isThread()) {
    channel = channel.parent;
  }
  /** @type {Webhook}  */
  const wh = await channel.createWebhook({
    name: config.DISCORD_WEBHOOK_NAME,
    avatar: config.DISCORD_WEBHOOK_AVATAR,
  });
  await webhookSendTo(wh, settings.channel, { content: `Webhook <@${wh.id}> created for channel <#${channel.id}>`});
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
    webhook = new WebhookClient({ url: wh.url });
  }
  return webhook;
}
module.exports.getOrCreateWebhook = getOrCreateWebhook;
