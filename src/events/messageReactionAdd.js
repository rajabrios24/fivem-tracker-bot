const { Events } = require('discord.js');
const reactionRole = require('../systems/reactionRole');
const { sendActionLog } = require('../utils/logs');

/** Resolve pesan (termasuk dari cache partial) agar kita bisa memberi role */
async function resolveMessage(reaction) {
  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return null; }
  }
  if (reaction.message.partial) {
    try { await reaction.message.fetch(); } catch { return null; }
  }
  return reaction.message;
}

/** Helper bersama untuk add/remove */
async function handle(reaction, user, add, client) {
  if (user.bot) return;

  const message = await resolveMessage(reaction);
  if (!message?.guild) return;

  const emoji = reaction.emoji.id ?? reaction.emoji.name;
  const roleId = reactionRole.findRoleForReaction(message.id, emoji);
  if (!roleId) return;

  const guild = message.guild;
  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;

  const role = await guild.roles.fetch(roleId).catch(() => null);
  if (!role) return;

  try {
    if (add) {
      await member.roles.add(role);
      sendActionLog(client, guild.id, {
        title: '🎭 Reaction Role: Tambah',
        description: `${user.tag} mendapat role **${role.name}**`,
      });
    } else {
      await member.roles.remove(role);
      sendActionLog(client, guild.id, {
        title: '🎭 Reaction Role: Hapus',
        description: `${user.tag} kehilangan role **${role.name}**`,
      });
    }
  } catch (err) {
    console.error('[REACTION ROLE] Gagal ubah role:', err);
  }
}

module.exports = {
  name: Events.MessageReactionAdd,
  execute: (reaction, user, client) => handle(reaction, user, true, client),
  handle,
};
