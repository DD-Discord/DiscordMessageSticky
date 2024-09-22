const fs = require('fs');

const cache = {};

function deleteChannelSettings(channelId) {
  const path = getChannelSettingsPath(channelId);
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
  delete cache[channelId];
}

function writeChannelSettings(channelId, settings) {
  const path = getChannelSettingsPath(channelId);
  fs.writeFileSync(path, JSON.stringify(settings, null, 2));
  cache[channelId] = settings;
}

function getChannelSettings(channelId) {
  const path = getChannelSettingsPath(channelId);
  let settings = cache[channelId];
  if (settings === undefined) {
    if (fs.existsSync(path)) {
      settings = JSON.parse(fs.readFileSync(path));
    } else {
      settings = null;
    }
    cache[channelId] = settings;
  }
  return settings;
}

function getChannelSettingsPath(channelId) {
  return `./data/channels/${channelId}.json`;
}

module.exports = {
  deleteChannelSettings,
  writeChannelSettings,
  getChannelSettings,
};