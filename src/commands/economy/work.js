const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { createEmbed, errorEmbed } = require('../../utils/embeds');
const economy = require('../../systems/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Bekerja untuk mendapat uang 💼')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const result = economy.work(interaction.guild.id, interaction.user.id);

    if (!result.ok) {
      return interaction.reply({ embeds: [errorEmbed(result.message)], flags: MessageFlags.Ephemeral });
    }

    await interaction.reply({
      embeds: [
        createEmbed({
          title: '💼 Gajian!',
          description: `Kamu ${result.job} dan menerima **${result.amount.toLocaleString('id-ID')} 🪙**.\nSaldo sekarang: **${result.balance.toLocaleString('id-ID')} 🪙**`,
          footer: `Bekerja lagi setelah ${economy.formatDuration(economy.getWorkCooldown())}`,
        }),
      ],
    });
  },
};
