const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');
const models = require('../../database/models');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Peringkat XP tertinggi di server ini'),

  async execute(interaction) {
    await interaction.deferReply();

    const top = models.getLeaderboard(interaction.guild.id, 10);
    if (!top.length) {
      return interaction.editReply('Belum ada data XP di server ini — mulai ngobrol dulu! 🗣️');
    }

    const lines = top.map((row, i) => {
      const medal = MEDALS[i] || '🔹';
      return `${medal} <@${row.user_id}> — **Level ${row.level}** (${row.xp.toLocaleString('id-ID')} XP)`;
    });

    await interaction.editReply({
      embeds: [
        createEmbed({
          title: '🏆 Leaderboard Server',
          description: lines.join('\n'),
          timestamp: true,
        }),
      ],
    });
  },
};
