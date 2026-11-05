const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, errorEmbed } = require('../../utils/embeds');
const economy = require('../../systems/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Klaim hadiah harian 🪙'),

  async execute(interaction) {
    const result = economy.claimDaily(interaction.guild.id, interaction.user.id);

    if (!result.ok) {
      return interaction.reply({ embeds: [errorEmbed(result.message)], ephemeral: true });
    }

    await interaction.reply({
      embeds: [
        createEmbed({
          title: '🎁 Hadiah Harian',
          description: `Kamu menerima **${result.amount.toLocaleString('id-ID')} 🪙**!\nSaldo sekarang: **${result.balance.toLocaleString('id-ID')} 🪙**\n\nDatang lagi besok! 🌅`,
        }),
      ],
    });
  },
};
