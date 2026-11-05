const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');
const models = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Lihat saldo & statistik ekonomi kamu (atau user lain)')
    .addUserOption((opt) => opt.setName('user').setDescription('User yang saldo-nya dilihat')),

  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.options.getUser('user') ?? interaction.user;
    if (user.bot) {
      return interaction.editReply('🤖 Bot tidak punya dompet, maaf!');
    }

    const data = models.getUser(interaction.guild.id, user.id);

    await interaction.editReply({
      embeds: [
        createEmbed({
          title: `💰 Dompet — ${user.displayName}`,
          fields: [
            { name: 'Saldo', value: `**${data.balance.toLocaleString('id-ID')} 🪙**`, inline: true },
            { name: 'Level', value: `${data.level}`, inline: true },
            { name: 'XP', value: data.xp.toLocaleString('id-ID'), inline: true },
          ],
          thumbnail: user.displayAvatarURL({ size: 128 }),
        }),
      ],
    });
  },
};
