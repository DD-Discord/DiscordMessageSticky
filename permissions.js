const { GuildMember, PermissionsBitField } = require('discord.js')
const config = require('./config')

/**
 * Checks if the user has permission to create a sticky.
 * @param {GuildMember} member The user to check for sticky permissions.
 * @returns {boolean} Whether the user has permission to create a sticky.
 */
function hasStickyPermission(member) {
  return member.permissions.has(PermissionsBitField.Flags[config.DISCORD_STICKY_PERMISSION]);
}

module.exports = { hasStickyPermission };
