require('dotenv').config();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID || null; // opsional: isi GUILD_ID di .env agar command langsung aktif di 1 server
const embedColor = process.env.EMBED_COLOR || '#5865F2';

if (!token) {
  console.error('[CONFIG] TOKEN belum diisi di file .env!');
  process.exit(1);
}

module.exports = { token, clientId, guildId, embedColor };
