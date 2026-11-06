const fs = require('node:fs');
const path = require('node:path');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

// ===== Ukuran kartu (rasio ~2:1, sama seperti kartu welcome bot populer) =====
const W = 1024;
const H = 500;
const AVATAR_R = 125;
const AVATAR_CY = 180;
const RING = 8;

const ROOT = path.join(__dirname, '..', '..');
const FONT_DIR = path.join(ROOT, 'assets', 'fonts');
/** Background custom per server (diset lewat /welcome background) */
const BG_DIR = path.join(ROOT, 'data', 'backgrounds');
/** Background default untuk semua server — taruh file sendiri di sini (opsional) */
const DEFAULT_BG_CANDIDATES = ['welcome-background.png', 'welcome-background.jpg', 'welcome-background.jpeg', 'welcome-background.webp']
  .map((f) => path.join(ROOT, 'assets', f));

// ===== Font =====
// Barlow (SIL Open Font License) ikut dibundel di assets/fonts agar tampilan
// sama di Windows maupun hosting Linux. Kalau file tidak ada, pakai font sistem.
function registerFont(file, alias) {
  const p = path.join(FONT_DIR, file);
  try {
    if (fs.existsSync(p) && GlobalFonts.registerFromPath(p, alias)) return alias;
  } catch (err) {
    console.warn(`[WELCOME CARD] Gagal memuat font ${file}:`, err.message);
  }
  return null;
}
const TITLE_FONT = registerFont('Barlow-ExtraBold.ttf', 'WelcomeTitle') ?? 'Arial Black';
const NAME_FONT = registerFont('Barlow-Bold.ttf', 'WelcomeName') ?? 'Arial';

/** Path file background custom untuk satu server */
function guildBackgroundPath(guildId) {
  return path.join(BG_DIR, `${guildId}.png`);
}

/** Cover-fit: gambar image agar memenuhi area w×h seperti CSS object-fit: cover */
function drawCover(ctx, image, x, y, w, h) {
  const ir = image.width / image.height;
  const rr = w / h;
  let sw;
  let sh;
  if (ir > rr) {
    sh = image.height;
    sw = sh * rr;
  } else {
    sw = image.width;
    sh = sw / rr;
  }
  const sx = (image.width - sw) / 2;
  const sy = (image.height - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
}

/**
 * Pilih background: custom server → default di assets/ → banner server → gradient.
 * Selalu berhasil (gradient sebagai cadangan terakhir).
 */
async function drawBackground(ctx, guild) {
  const sources = [guildBackgroundPath(guild.id), ...DEFAULT_BG_CANDIDATES].filter((p) => fs.existsSync(p));
  const banner = guild.bannerURL({ extension: 'png', size: 1024 });
  if (banner) sources.push(banner);

  for (const src of sources) {
    try {
      drawCover(ctx, await loadImage(src), 0, 0, W, H);
      return;
    } catch (err) {
      console.warn('[WELCOME CARD] Background gagal dimuat, coba sumber lain:', err.message);
    }
  }

  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, '#5865F2');
  gradient.addColorStop(0.55, '#7B5FE8');
  gradient.addColorStop(1, '#EB459E');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

/** Gelapkan bagian bawah sedikit supaya teks putih tetap terbaca di background terang */
function drawBottomShade(ctx, strength) {
  const shade = ctx.createLinearGradient(0, H * 0.45, 0, H);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(1, `rgba(0, 0, 0, ${strength})`);
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
}

/** Avatar bulat dengan ring putih tebal + bayangan lembut */
async function drawAvatar(ctx, member) {
  const cx = W / 2;
  const cy = AVATAR_CY;

  // Ring putih + bayangan
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, AVATAR_R + RING, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  // Isi avatar (clip lingkaran)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, AVATAR_R, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  try {
    const avatar = await loadImage(member.displayAvatarURL({ extension: 'png', size: 512 }));
    drawCover(ctx, avatar, cx - AVATAR_R, cy - AVATAR_R, AVATAR_R * 2, AVATAR_R * 2);
  } catch (err) {
    console.warn('[WELCOME CARD] Avatar gagal dimuat:', err.message);
    ctx.fillStyle = '#5865F2';
    ctx.fillRect(cx - AVATAR_R, cy - AVATAR_R, AVATAR_R * 2, AVATAR_R * 2);
  }
  ctx.restore();
}

/** Teks tengah putih dengan bayangan; dikecilkan otomatis kalau terlalu lebar */
function drawCenterText(ctx, text, y, { family, size, minSize = 20 }) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 3;

  const maxWidth = W - 120;
  let s = size;
  ctx.font = `${s}px "${family}", sans-serif`;
  while (ctx.measureText(text).width > maxWidth && s > minSize) {
    s -= 2;
    ctx.font = `${s}px "${family}", sans-serif`;
  }
  // Masih kepanjangan di ukuran minimum → potong dengan elipsis
  let t = text;
  while (ctx.measureText(t).width > maxWidth && t.length > 3) t = t.slice(0, -1);
  if (t !== text) t = `${t.slice(0, -1)}…`;

  ctx.fillText(t, W / 2, y);
  ctx.restore();
}

/**
 * Buat kartu sebagai PNG buffer.
 * Layout: background penuh → shade bawah → avatar bulat ber-ring → judul besar → username.
 */
async function createCard({ member, title, shade = 0.35 }) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  await drawBackground(ctx, member.guild);
  drawBottomShade(ctx, shade);
  await drawAvatar(ctx, member);

  // Username Discord hanya huruf/angka/._ → aman digambar tanpa masalah glyph emoji
  const name = (member.user?.username ?? member.displayName ?? 'member').toUpperCase();
  drawCenterText(ctx, title, 395, { family: TITLE_FONT, size: 96, minSize: 60 });
  drawCenterText(ctx, name, 448, { family: NAME_FONT, size: 44, minSize: 24 });

  return canvas.encode('png');
}

/** Kartu welcome */
function createWelcomeCard(member) {
  return createCard({ member, title: 'WELCOME' });
}

/** Kartu goodbye (shade sedikit lebih gelap) */
function createGoodbyeCard(member) {
  return createCard({ member, title: 'GOODBYE', shade: 0.5 });
}

/**
 * Simpan gambar jadi background custom server. Gambar langsung di-crop ke
 * ukuran kartu dan disimpan sebagai PNG, jadi render berikutnya cepat.
 * Melempar error kalau buffer bukan gambar yang valid.
 */
async function saveGuildBackground(guildId, imageBuffer) {
  const image = await loadImage(imageBuffer);
  const canvas = createCanvas(W, H);
  drawCover(canvas.getContext('2d'), image, 0, 0, W, H);
  fs.mkdirSync(BG_DIR, { recursive: true });
  fs.writeFileSync(guildBackgroundPath(guildId), await canvas.encode('png'));
}

/** Hapus background custom server. Kembalikan true kalau ada yang dihapus. */
function removeGuildBackground(guildId) {
  const p = guildBackgroundPath(guildId);
  if (!fs.existsSync(p)) return false;
  fs.unlinkSync(p);
  return true;
}

function hasGuildBackground(guildId) {
  return fs.existsSync(guildBackgroundPath(guildId));
}

module.exports = {
  createWelcomeCard,
  createGoodbyeCard,
  saveGuildBackground,
  removeGuildBackground,
  hasGuildBackground,
  CARD_WIDTH: W,
  CARD_HEIGHT: H,
};
