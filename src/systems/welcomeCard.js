const { createCanvas, loadImage } = require('@napi-rs/canvas');

const W = 1000;
const H = 450;
const AVATAR_R = 90;
const CONFETTI_COLORS = ['#FEE75C', '#57F287', '#EB459E', '#5865F2', '#ED4245', '#FAA61A', '#FFFFFF'];

/** PRNG deterministik dari seed string (polanya konsisten per user) */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
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

/** Lingkaran avatar + ring glow */
function drawAvatar(ctx, avatar, cx, cy, r) {
  // Glow luar
  ctx.save();
  ctx.shadowColor = 'rgba(255, 255, 255, 0.55)';
  ctx.shadowBlur = 35;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  // Avatar itu sendiri (clip lingkaran)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  drawCover(ctx, avatar, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  // Ring tipis
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
}

/** Konfeti: potongan kecil warna-warni, deterministik per user */
function drawConfetti(ctx, seed, count = 90) {
  const rand = mulberry32(hashSeed(seed));
  for (let i = 0; i < count; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const size = 6 + rand() * 12;
    const angle = rand() * Math.PI;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.55 + rand() * 0.35;
    ctx.fillStyle = CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)];
    ctx.fillRect(-size / 2, -size / 4, size, size / 2);
    ctx.restore();
  }
}

/** Teks tengah dengan shadow lembut */
function drawCenterText(ctx, text, y, { size, weight = 'bold', color = '#ffffff', shadow = true }) {
  ctx.save();
  if (shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
  }
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px sans-serif`;
  ctx.textAlign = 'center';
  // Pangkas teks kelewat panjang
  let t = text;
  while (ctx.measureText(t).width > W - 120 && t.length > 3) t = t.slice(0, -2);
  if (t !== text) t += '…';
  ctx.fillText(t, W / 2, y);
  ctx.restore();
}

/** Pill badge "Member ke-N" di pojok kiri atas */
function drawCounterBadge(ctx, count) {
  const label = `Member ke-${count.toLocaleString('id-ID')}`;
  ctx.save();
  ctx.font = 'bold 26px sans-serif';
  const tw = ctx.measureText(label).width;
  const padding = 22;
  const x = 28;
  const y = 28;
  const w = tw + padding * 2;
  const h = 46;
  const r = h / 2;

  // Kotak rounded pill semi transparan
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + padding, y + h / 2 + 9);
  ctx.restore();
}

/**
 * Buat kartu welcome/goodbye sebagai PNG buffer.
 * Layout: background (banner server/gradient) → scrim gelap → avatar lingkaran
 * ber-glow → title → subtitle → badge counter (+ konfeti kalau celebrating).
 */
async function createCard({ member, title, subtitle, celebrating = false }) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ---- Background ----
  const bannerUrl = member.guild.bannerURL({ extension: 'png', size: 1024 });
  if (bannerUrl) {
    const bg = await loadImage(bannerUrl);
    drawCover(ctx, bg, 0, 0, W, H);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, '#5865F2');
    gradient.addColorStop(0.55, '#7B5FE8');
    gradient.addColorStop(1, '#EB459E');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  }

  // Scrim agar teks terbaca
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, 0, W, H);

  // ---- Konfeti (di bawah scrim, di atas background) ----
  if (celebrating) drawConfetti(ctx, member.id, 100);

  // ---- Title & subtitle (teks ditata dulu supaya posisi avatar pas) ----
  const nameY = H - 118;
  const subY = H - 66;

  // ---- Avatar ----
  const avatarUrl = member.displayAvatarURL({ extension: 'png', size: 256 });
  const avatar = await loadImage(avatarUrl);
  drawAvatar(ctx, avatar, W / 2, AVATAR_R + 60, AVATAR_R);

  // ---- Teks ----
  drawCenterText(ctx, title, nameY, { size: 52 });
  drawCenterText(ctx, subtitle, subY, { size: 30, weight: 'normal', color: '#e6e6fa' });

  // ---- Badge ----
  drawCounterBadge(ctx, member.guild.memberCount);

  return canvas.encode('png');
}

/** Kartu welcome 🎉 (dengan konfeti) */
function createWelcomeCard(member, serverName = member.guild.name) {
  return createCard({
    member,
    title: `Selamat datang, ${member.displayName}!`,
    subtitle: `di ${serverName} 🎉`,
    celebrating: true,
  });
}

/** Kartu goodbye 👋 (lebih tenang, tanpa konfeti) */
function createGoodbyeCard(member, serverName = member.guild.name) {
  return createCard({
    member,
    title: `Selamat tinggal…`,
    subtitle: `${member.displayName} meninggalkan ${serverName}`,
    celebrating: false,
  });
}

module.exports = { createWelcomeCard, createGoodbyeCard };
