const { db } = require('../database/db');

/** Dapatkan semua role yang terhubung ke reaksi pada satu pesan */
function findRoleForReaction(messageId, emoji) {
  const row = db
    .prepare('SELECT role_id FROM reaction_roles WHERE message_id = ? AND emoji = ?')
    .get(messageId, emoji);
  return row?.role_id ?? null;
}

function addReactionRole(guildId, messageId, emoji, roleId) {
  db.prepare(
    'INSERT OR REPLACE INTO reaction_roles (guild_id, message_id, emoji, role_id) VALUES (?, ?, ?, ?)',
  ).run(guildId, messageId, emoji, roleId);
}

function removeReactionRole(messageId, emoji) {
  const info = db
    .prepare('DELETE FROM reaction_roles WHERE message_id = ? AND emoji = ?')
    .run(messageId, emoji);
  return info.changes;
}

function listReactionRoles(guildId = null) {
  if (guildId) {
    return db.prepare('SELECT * FROM reaction_roles WHERE guild_id = ?').all(guildId);
  }
  return db.prepare('SELECT * FROM reaction_roles').all();
}

/** Normalisasi emoji: custom emoji → id, unicode emoji → karakternya */
function normalizeEmoji(fromReaction) {
  // Reaction sini adalah object; ambil nama (unicode) atau identifier kombinasi
  if (fromReaction.emoji.id) return fromReaction.emoji.id;
  return fromReaction.emoji.name;
}

module.exports = { findRoleForReaction, addReactionRole, removeReactionRole, listReactionRoles, normalizeEmoji };
