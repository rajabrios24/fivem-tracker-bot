const models = require('../database/models');
const { getUser } = models;

const DAILY_COOLDOWN_MS = 22 * 60 * 60 * 1000; // 22 jam
const WORK_COOLDOWN_MS = 30 * 60 * 1000; // 30 menit
const DAILY_AMOUNT = 1000;
const STARTING_BALANCE = 1000;

const WORK_JOBS = [
  'membantu memoderasi server',
  'mengantar paket ⛟',
  'merekrut anggota baru 📣',
  'memperbaiki bug di sini 🔧',
  'menyiram tanaman 🌱',
  'menulis error log 📝',
  'mengurus bot 🔧',
  'bermain musik 🎧',
];

function getDailyCooldown() { return DAILY_COOLDOWN_MS; }
function getWorkCooldown() { return WORK_COOLDOWN_MS; }

/** Sisa cooldown yang belum berlalu (ms), 0 kalau sudah bisa */
function remaining(cooldownMs, lastTs) {
  const diff = lastTs + cooldownMs - Date.now();
  return diff > 0 ? diff : 0;
}

/** Format sisa cooldown jadi teks "1h 5m 10s" */
function formatDuration(ms) {
  const total = Math.ceil(ms / 1000);
  const parts = [];
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) parts.push(`${h} jam`);
  if (m) parts.push(`${m} menit`);
  if (s && !h) parts.push(`${s} detik`);
  return parts.join(' ') || '0 detik';
}

/**
 * Klaim hadiah harian. Kembalikan { ok: false, message } saat masih cooldown,
 * atau { ok: true, balance, amount }.
 */
function claimDaily(guildId, userId) {
  const user = getUser(guildId, userId);
  const wait = remaining(DAILY_COOLDOWN_MS, user.last_daily);
  if (wait > 0) {
    return { ok: false, message: `Kamu sudah klaim hadiah harian hari ini. Jalankan lagi dalam **${formatDuration(wait)}**. 🛌` };
  }
  const balance = user.balance + DAILY_AMOUNT;
  models.saveUser(guildId, userId, { ...user, balance, last_daily: Date.now() });
  return { ok: true, amount: DAILY_AMOUNT, balance };
}

/** Bekerja untuk uang. Kembalikan { ok, amount?, balance, job, message? } */
function work(guildId, userId) {
  const user = getUser(guildId, userId);
  const wait = remaining(WORK_COOLDOWN_MS, user.last_work);
  if (wait > 0) {
    return { ok: false, message: `Kamu baru saja bekerja. Istirahat dulu ~ **${formatDuration(wait)}**. ⏳` };
  }
  const job = WORK_JOBS[Math.floor(Math.random() * WORK_JOBS.length)];
  const amount = 150 + Math.floor(Math.random() * 251); // 150-400
  const balance = user.balance + amount;
  models.saveUser(guildId, userId, { ...user, balance, last_work: Date.now() });
  return { ok: true, amount, balance, job };
}

function transfer(fromGuildId, fromUserId, targetUserId, amount) {
  if (fromUserId === targetUserId) return { ok: false, message: 'Kamu tidak bisa transfer uang ke dirimu sendiri.' };

  const sender = getUser(fromGuildId, fromUserId);
  if (sender.balance < amount) {
    return { ok: false, message: `Saldo kamu tidak cukup. Saldo saat ini: **${sender.balance.toLocaleString('id-ID')}** 🪙` };
  }
  const receiver = getUser(fromGuildId, targetUserId);
  models.saveUser(fromGuildId, fromUserId, { ...sender, balance: sender.balance - amount });
  models.saveUser(fromGuildId, targetUserId, { ...receiver, balance: receiver.balance + amount });

  return { ok: true, amount, newBalance: sender.balance - amount };
}

/** Ubah saldo user (delta bisa negatif). Hasil tidak pernah di bawah 0. */
function adjustMoney(guildId, userId, delta) {
  const user = getUser(guildId, userId);
  const balance = Math.max(0, user.balance + delta);
  models.saveUser(guildId, userId, { ...user, balance });
  return balance;
}

function getShopItems() {
  return structuredClone(SHOP_ITEMS);
}

const SHOP_ITEMS = [
  { id: 'kopi', emoji: '☕', name: 'Kopi Segar', price: 150, desc: 'Melelahkan hari sebagai anggota aktif server.' },
  { id: 'tiket', emoji: '🎫', name: 'Tiket Lottery', price: 500, desc: 'Jangan lupa menebak angka di server (kontrol manual).' },
  { id: 'shield', emoji: '🛡️', name: 'Shield Status', price: 2000, desc: 'Tampilkan status keren di profil rank-mu.' },
  { id: 'crown', emoji: '👑', name: 'Mahkotamu', price: 5000, desc: 'Tanda kontribusi luar biasa di server.' },
];

/** Beli barang dari shop. */
function buyItem(guildId, userId, itemId) {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return { ok: false, message: 'Barang tidak ditemukan.' };

  const user = getUser(guildId, userId);
  if (user.balance < item.price) {
    return { ok: false, message: `Kamu butuh **${item.price.toLocaleString('id-ID')}** 🪙 untuk membeli **${item.name}**, tapi saldo kamu hanya **${user.balance.toLocaleString('id-ID')}** 🪙.` };
  }
  models.saveUser(guildId, userId, { ...user, balance: user.balance - item.price });
  return { ok: true, item, newBalance: user.balance - item.price };
}

module.exports = {
  DAILY_COOLDOWN_MS,
  WORK_COOLDOWN_MS,
  DAILY_AMOUNT,
  getDailyCooldown,
  getWorkCooldown,
  remaining,
  formatDuration,
  claimDaily,
  work,
  transfer,
  adjustMoney,
  getShopItems,
  buyItem,
};
