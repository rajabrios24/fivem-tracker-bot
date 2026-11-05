const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config');

// ===== Client & Intents =====
// GuildMembers  : dibutuhkan welcome/goodbye & cek hierarchy role
// MessageContent: dibutuhkan anti-spam, filter kata terlarang, dan perhitungan XP
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.User, Partials.GuildMember],
});

// Koleksi command juga di-embed ke object client agar mudah diakses file lain
client.commands = new Collection();

// ===== Muat Command (rekursif dari src/commands/**) =====
function loadCommands(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommands(full);
      continue;
    }
    if (!entry.name.endsWith('.js')) continue;

    const command = require(full);
    if (!command?.data || typeof command.execute !== 'function') {
      console.warn(`[COMMANDS] Lewati ${full} (tidak punya data/execute)`);
      continue;
    }
    client.commands.set(command.data.name, command);
    console.log(`[COMMANDS] /${command.data.name} dimuat dari ${path.relative(process.cwd(), full)}`);
  }
}
loadCommands(path.join(__dirname, 'commands'));

// ===== Muat Event =====
const eventsDir = path.join(__dirname, 'events');
for (const entry of fs.readdirSync(eventsDir, { withFileTypes: true })) {
  if (!entry.name.endsWith('.js')) continue;
  const event = require(path.join(eventsDir, entry.name));
  const handler = (...args) => {
    Promise.resolve(event.execute(...args, client)).catch((err) => {
      console.error(`[EVENT ${event.name}] Gagal dieksekusi:`, err);
    });
  };
  if (event.once) client.once(event.name, handler);
  else client.on(event.name, handler);
  console.log(`[EVENTS] ${event.name} dimuat dari src/events/${entry.name}`);
}

// ===== Jalankan Bot =====

client.login(config.token).catch((err) => {
  console.error('[LOGIN] Gagal login. Periksa TOKEN di .env:', err.message);
  process.exit(1);
});
