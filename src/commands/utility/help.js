const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { embedColor } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Menampilkan daftar command yang tersedia'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Daftar Command')
      .setColor(embedColor)
      .addFields(
        {
          name: '⚙️ Utility',
          value: '`/ping` `/botinfo` `/serverinfo`',
        },
        {
          name: '🛡️ Moderasi',
          value:
            '`/ban` `/kick` `/timeout` `/untimeout` `/warn` `/warnings` `/clearwarns` `/purge` `/logs`',
        },
        {
          name: '📈 Leveling',
          value: '`/rank` `/leaderboard` `/givexp` (admin) `/synclevels` (admin)',
        },
        {
          name: '💰 Ekonomi',
          value:
            '`/balance` `/daily` `/work` `/shop` `/buy` `/transfer` `/addmoney` (admin)',
        },
        {
          name: '👋 Welcome & Role',
          value:
            '`/welcome` `/reactionrole`',
        },
        {
          name: '🚫 Auto-Mod',
          value: '`/automod toggle` `/automod addword` `/automod removeword` `/automod status`',
        },
      )
      .setFooter({ text: 'Mulai ketik "/" untuk melihat semua command beserta opsinya.' });

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
