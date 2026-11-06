const { db } = require('../database/db');

const findStmt = db.prepare('SELECT role_id FROM reaction_roles WHERE message_id = ? AND emoji = ?');
const addStmt = db.prepare(
  'INSERT OR REPLACE INTO reaction_roles (guild_id, channel_id, message_id, emoji, role_id) VALUES (?, ?, ?, ?, ?)',
);
const removeStmt = db.prepare('DELETE FROM reaction_roles WHERE guild_id = ? AND message_id = ? AND emoji = ?');
const listStmt = db.prepare('SELECT * FROM reaction_roles WHERE guild_id = ?');

/** Dapatkan role yang terhubung ke reaksi pada satu pesan */
function findRoleForReaction(messageId, emoji) {
  return findStmt.get(messageId, emoji)?.role_id ?? null;
}

function addReactionRole(guildId, channelId, messageId, emoji, roleId) {
  addStmt.run(guildId, channelId, messageId, emoji, roleId);
}

/** Hapus mapping — dibatasi per server agar server lain tidak bisa menghapusnya */
function removeReactionRole(guildId, messageId, emoji) {
  return removeStmt.run(guildId, messageId, emoji).changes;
}

function listReactionRoles(guildId) {
  return listStmt.all(guildId);
}

/**
 * Normalisasi emoji dari input teks user menjadi kunci yang sama dengan
 * yang dipakai event reaksi: custom emoji `<:nama:123>` / `<a:nama:123>` → `123`,
 * emoji unicode → karakternya apa adanya.
 */
function normalizeEmojiInput(input) {
  const trimmed = input.trim();
  const custom = trimmed.match(/^<a?:\w+:(\d+)>$/);
  if (custom) return custom[1];
  return trimmed;
}

/** Kunci emoji dari objek reaksi Discord (custom → id, unicode → nama) */
function emojiKeyFromReaction(reaction) {
  return reaction.emoji.id ?? reaction.emoji.name;
}

module.exports = {
  findRoleForReaction,
  addReactionRole,
  removeReactionRole,
  listReactionRoles,
  normalizeEmojiInput,
  emojiKeyFromReaction,
};
