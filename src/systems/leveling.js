const models = require('../database/models');

// Berapa XP yang didapat per pesan + cooldown anti-farming
const XP_MIN = 15;
const XP_MAX = 25;
const XP_COOLDOWN_MS = 60_000;
// Bonus uang setiap naik level
const LEVEL_UP_BONUS = 250;

const lastXpAt = new Map(); // key: `${guildId}:${userId}` → timestamp

/** Total XP minimum untuk mencapai level tertentu */
function xpThreshold(level) {
  // level 1 → 150, level 2 → 400, dst (kurva makin curam)
  return (100 * level) + (50 * level * (level + 1)) / 2;
}

/** Konversi total XP → level saat ini */
function levelFromXp(xp) {
  let level = 0;
  while (xpThreshold(level + 1) <= xp) level += 1;
  return level;
}

/** Format progress bar sederhana */
function progressBar(current, max, size = 20) {
  const ratio = Math.max(0, Math.min(1, max > 0 ? current / max : 0));
  const filled = Math.round(ratio * size);
  return '█'.repeat(filled) + '░'.repeat(size - filled);
}

/**
 * Beri XP untuk satu pesan user. Kembalikan null jika masih cooldown,
 * atau { xp, level, leveledUp, bonus } sesudah ditambahkan.
 */
function handleXpForMessage(guildId, userId) {
  const now = Date.now();
  const key = `${guildId}:${userId}`;
  const last = lastXpAt.get(key) ?? 0;
  if (now - last < XP_COOLDOWN_MS) return null;
  lastXpAt.set(key, now);

  const user = models.getUser(guildId, userId);
  const xp = user.xp + Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
  const newLevel = levelFromXp(xp);
  const leveledUp = newLevel > user.level;
  const bonus = leveledUp ? LEVEL_UP_BONUS : 0;

  models.saveUser(guildId, userId, { ...user, xp, level: newLevel, balance: user.balance + bonus });

  // Bersihkan map kalau terlalu besar supaya penggunaan memori stabil
  if (lastXpAt.size > 10_000) {
    for (const k of lastXpAt.keys()) {
      lastXpAt.delete(k);
      if (lastXpAt.size <= 5_000) break;
    }
  }

  return { xp, level: newLevel, leveledUp, bonus };
}

/** Pastikan kolom level cocok dengan XP (mis. setelah /givexp) */
function recalcLevel(guildId, userId) {
  const user = models.getUser(guildId, userId);
  const level = levelFromXp(user.xp);
  const leveledUp = level > user.level;
  const bonus = leveledUp ? (level - user.level) * LEVEL_UP_BONUS : 0;
  models.saveUser(guildId, userId, { ...user, level, balance: user.balance + bonus });
  return { ...models.getUser(guildId, userId), leveledUp, bonus };
}

/** Data untuk card /rank */
function getRankData(guildId, userId) {
  const user = models.getUser(guildId, userId);
  const currentLevelXp = user.xp - xpThreshold(user.level);
  const nextLevelXp = xpThreshold(user.level + 1) - xpThreshold(user.level);
  return {
    xp: user.xp,
    level: user.level,
    balance: user.balance,
    nextLevelIn: nextLevelXp - currentLevelXp,
    bar: progressBar(currentLevelXp, nextLevelXp),
    currentLevelXp,
    nextLevelXp,
  };
}

module.exports = {
  XP_MIN,
  XP_MAX,
  LEVEL_UP_BONUS,
  xpThreshold,
  levelFromXp,
  handleXpForMessage,
  recalcLevel,
  getRankData,
  progressBar,
};
