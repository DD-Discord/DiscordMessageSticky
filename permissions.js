const { GuildMember, PermissionsBitField } = require('discord.js')

/**
 * Checks if the user has permission to create a sticky.
 * @param {GuildMember} member The user to check for sticky permissions.
 * @returns {boolean} Whether the user has permission to create a sticky.
 */
export function hasStickyPermission(member) {
  return member.permissions.has(PermissionsBitField.Flags.ManageMessages);
}