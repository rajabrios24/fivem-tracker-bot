const { getSetting, setSetting } = require('../database/db');

/** Batas spam: pesan lebih banyak dari ini dalam window ini → spam */
const MAX_MESSAGES = 6;
const WINDOW_MS = 5_000;
/** Timeout otomatis saat ketahuan spam */
const AUTO_TIMEOUT_MS = 10 * 60 * 1000; // 10 menit

// key `${guildId}:${userId}` → array timestamp pesan
const messageHistory = new Map();

function isAntiSpamOn(guildId) {
  return getSetting(guildId, 'antispam') !== '0'; // default: aktif
}

function setAntiSpam(guildId, on) {
  setSetting(guildId, 'antispam', on ? '1' : '0');
}

/** Ambil daftar kata terlarang per server (JSON array) */
function getBannedWords(guildId) {
  const raw = getSetting(guildId, 'bannedWords', '[]');
  try { return JSON.parse(raw); } catch { return []; }
}

function setBannedWords(guildId, words) {
  setSetting(guildId, 'bannedWords', JSON.stringify(words.filter(Boolean)));
}

/** Pencatat pesan: kembalikan true jika user melewati batas spam. */
function trackMessage(guildId, userId) {
  const now = Date.now();
  const key = `${guildId}:${userId}`;
  const history = (messageHistory.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  history.push(now);
  messageHistory.set(key, history);

  if (messageHistory.size > 10_000) {
    for (const k of messageHistory.keys()) {
      messageHistory.delete(k);
      if (messageHistory.size <= 5_000) break;
    }
  }
  return history.length > MAX_MESSAGES;
}

/** Cek apakah pesan mengandung kata terlarang → kembalikan kata yg cocok */
function findBannedWord(guildId, content) {
  const lower = content.toLowerCase();
  return getBannedWords(guildId).find((word) => lower.includes(word.toLowerCase())) ?? null;
}

/**
 * Pipeline utama auto-mod untuk satu pesan.
 * Kembalikan { spam: boolean, bannedWord: string|null }
 */
function inspectMessage(guildId, userId, content) {
  const result = { spam: false, bannedWord: null };

  if (!isAntiSpamOn(guildId)) return result;

  if (trackMessage(guildId, userId)) result.spam = true;
  result.bannedWord = findBannedWord(guildId, content);
  return result;
}

/** Reset riwayat pesan satu user (mis. setelah di-timeout) */
function resetUserHistory(guildId, userId) {
  messageHistory.delete(`${guildId}:${userId}`);
}

module.exports = {
  AUTO_TIMEOUT_MS,
  MAX_MESSAGES,
  WINDOW_MS,
  isAntiSpamOn,
  setAntiSpam,
  getBannedWords,
  setBannedWords,
  trackMessage,
  findBannedWord,
  inspectMessage,
  resetUserHistory,
};
