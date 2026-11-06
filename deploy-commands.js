/**
 * Mendaftarkan semua slash command ke Discord API.
 * Jalankan: npm run deploy
 * (opsional) isi GUILD_ID di .env untuk pendaftaran instan di 1 server saja.
 */
const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');
const config = require('./src/config');

function collectCommands(dir) {
  const arr = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      arr.push(...collectCommands(full));
      continue;
    }
    if (!entry.name.endsWith('.js')) continue;
    const command = require(full);
    if (command?.data?.toJSON) arr.push(command.data.toJSON());
  }
  return arr;
}

(async () => {
  if (!config.clientId) {
    console.error('[DEPLOY] CLIENT_ID belum diisi di file .env! (Developer Portal → General Information → Application ID)');
    process.exit(1);
  }

  const commands = collectCommands(path.join(__dirname, 'src', 'commands'));
  console.log(`Mendaftarkan ${commands.length} slash command...`);

  const rest = new REST().setToken(config.token);
  const route = config.guildId
    ? Routes.applicationGuildCommands(config.clientId, config.guildId)
    : Routes.applicationCommands(config.clientId);

  const data = await rest.put(route, { body: commands });
  console.log(`✅ Berhasil! ${data.length} command terdaftar${config.guildId ? ` (guild ${config.guildId})` : ' secara global (mungkin butuh beberapa menit untuk muncul)'}`);
})().catch((err) => {
  console.error('Gagal mendaftarkan command:', err);
  process.exit(1);
});
