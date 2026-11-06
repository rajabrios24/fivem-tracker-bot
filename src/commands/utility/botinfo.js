const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Informasi tentang bot ini'),

  async execute(interaction) {
    const client = interaction.client;
    const totalMembers = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount ?? 0), 0);
    const uptimeStr = formatUptime(client.uptime);

    await interaction.reply({
      embeds: [
        createEmbed({
          thumbnail: client.user.displayAvatarURL({ size: 256 }),
          title: `ℹ️ Tentang ${client.user.username}`,
          fields: [
            { name: '🔵 Discord.js', value: require('discord.js').version, inline: true },
            { name: '🟩 Node.js', value: process.version, inline: true },
            { name: '⏱️ Uptime', value: uptimeStr, inline: true },
            { name: '🏠 Server', value: String(client.guilds.cache.size), inline: true },
            { name: '👥 Anggota', value: totalMembers.toLocaleString('id-ID'), inline: true },
            { name: '💾 Memori', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`, inline: true },
          ],
        }),
      ],
    });
  },
};

function formatUptime(ms = 0) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d} hari`);
  if (h) parts.push(`${h} jam`);
  if (m) parts.push(`${m} menit`);
  return parts.join(' ') || `<1 menit`;
}
