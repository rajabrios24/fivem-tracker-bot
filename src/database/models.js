const { db } = require('./db');

const ensureUserStmt = db.prepare(
  'INSERT OR IGNORE INTO users (guild_id, user_id) VALUES (?, ?)',
);
const getUserStmt = db.prepare(
  'SELECT * FROM users WHERE guild_id = ? AND user_id = ?',
);
const updateUserStmt = db.prepare(
  `UPDATE users
   SET xp = ?, level = ?, balance = ?, last_daily = ?, last_work = ?
   WHERE guild_id = ? AND user_id = ?`,
);

/** Pastikan user ada di DB, lalu kembalikan datanya */
function ensureUser(guildId, userId) {
  ensureUserStmt.run(guildId, userId);
  return getUserStmt.get(guildId, userId);
}

function saveUser(guildId, userId, user) {
  updateUserStmt.run(
    user.xp,
    user.level,
    user.balance,
    user.last_daily,
    user.last_work,
    guildId,
    userId,
  );
}

function getUser(guildId, userId) {
  return ensureUser(guildId, userId);
}

/** Ambil top N user berdasarkan XP untuk satu server (leaderboard) */
function getLeaderboard(guildId, limit = 10) {
  return db
    .prepare(
      'SELECT user_id, xp, level FROM users WHERE guild_id = ? AND xp > 0 ORDER BY xp DESC LIMIT ?',
    )
    .all(guildId, limit);
}

// ---- Warnings ----
const addWarningStmt = db.prepare(
  'INSERT INTO warnings (guild_id, user_id, moderator_id, reason) VALUES (?, ?, ?, ?)',
);
function addWarning(guildId, userId, moderatorId, reason) {
  return addWarningStmt.run(guildId, userId, moderatorId, reason ?? null);
}

function getWarnings(guildId, userId) {
  return db
    .prepare(
      'SELECT id, moderator_id, reason, created_at FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY id ASC',
    )
    .all(guildId, userId);
}

function clearWarnings(guildId, userId) {
  return db.prepare('DELETE FROM warnings WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
}

function removeWarning(guildId, userId, warnId) {
  return db
    .prepare('DELETE FROM warnings WHERE guild_id = ? AND user_id = ? AND id = ?')
    .run(guildId, userId, warnId);
}

module.exports = {
  ensureUser,
  getUser,
  saveUser,
  getLeaderboard,
  addWarning,
  getWarnings,
  clearWarnings,
  removeWarning,
};
