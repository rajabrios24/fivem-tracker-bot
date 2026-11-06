const path = require('node:path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, '..', '..', 'data.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    guild_id   TEXT    NOT NULL,
    user_id    TEXT    NOT NULL,
    xp         INTEGER NOT NULL DEFAULT 0,
    level      INTEGER NOT NULL DEFAULT 0,
    balance    INTEGER NOT NULL DEFAULT 1000,
    last_daily INTEGER NOT NULL DEFAULT 0,
    last_work  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id     TEXT NOT NULL,
    user_id      TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason       TEXT,
    created_at   TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_warnings_guild_user ON warnings (guild_id, user_id);

  CREATE TABLE IF NOT EXISTS settings (
    guild_id TEXT NOT NULL,
    key      TEXT NOT NULL,
    value    TEXT,
    PRIMARY KEY (guild_id, key)
  );

  CREATE TABLE IF NOT EXISTS reaction_roles (
    guild_id   TEXT NOT NULL,
    channel_id TEXT,
    message_id TEXT NOT NULL,
    emoji      TEXT NOT NULL,
    role_id    TEXT NOT NULL,
    PRIMARY KEY (message_id, emoji)
  );
  CREATE INDEX IF NOT EXISTS idx_reaction_roles_message ON reaction_roles (message_id);
`);

// ===== Migrasi untuk database lama =====
// Versi sebelumnya belum punya kolom channel_id di reaction_roles
const reactionRoleCols = db.prepare('PRAGMA table_info(reaction_roles)').all().map((c) => c.name);
if (!reactionRoleCols.includes('channel_id')) {
  db.exec('ALTER TABLE reaction_roles ADD COLUMN channel_id TEXT');
}

// Versi sebelumnya menyimpan emoji custom sebagai "<:nama:id>", padahal
// event reaksi mencocokkan pakai id saja → ubah ke id agar mapping lama ikut jalan
{
  const legacyRows = db.prepare("SELECT message_id, emoji FROM reaction_roles WHERE emoji LIKE '<%:%>'").all();
  const fixEmoji = db.prepare('UPDATE OR IGNORE reaction_roles SET emoji = ? WHERE message_id = ? AND emoji = ?');
  db.transaction(() => {
    for (const row of legacyRows) {
      const id = row.emoji.match(/^<a?:\w+:(\d+)>$/)?.[1];
      if (id) fixEmoji.run(id, row.message_id, row.emoji);
    }
  })();
}

const getSettingStmt = db.prepare('SELECT value FROM settings WHERE guild_id = ? AND key = ?');
const setSettingStmt = db.prepare(
  'INSERT INTO settings (guild_id, key, value) VALUES (?, ?, ?) ON CONFLICT (guild_id, key) DO UPDATE SET value = excluded.value',
);
const getAllSettingsStmt = db.prepare('SELECT key, value FROM settings WHERE guild_id = ?');


/** Ambil satu nilai setting per server */
function getSetting(guildId, key, fallback = null) {
  const row = getSettingStmt.get(guildId, key);
  return row?.value ?? fallback;
}

/** Simpan/ubah satu nilai setting per server */
function setSetting(guildId, key, value) {
  setSettingStmt.run(guildId, key, value);
}

/** Ambil semua pasangan key → value untuk satu server */
function getAllSettings(guildId) {
  const rows = getAllSettingsStmt.all(guildId);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

module.exports = { db, getSetting, setSetting, getAllSettings };
