const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const economy = require('../../systems/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer uang ke user lain')
    .addUserOption((opt) => opt.setName('user').setDescription('Penerima').setRequired(true))
    .addIntegerOption((opt) =>
      opt.setName('jumlah').setDescription('Jumlah uang yang ditransfer').setMinValue(1).setRequired(true),
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('jumlah', true);

    if (target.bot) {
      return interaction.reply({ embeds: [errorEmbed('Bot tidak bisa menerima transfer.')], ephemeral: true });
    }

    const result = economy.transfer(interaction.guild.id, interaction.user.id, target.id, amount);
    if (!result.ok) {
      return interaction.reply({ embeds: [errorEmbed(result.message)], ephemeral: true });
    }

    await interaction.reply({
      embeds: [
        successEmbed(
          `💸 Transfer berhasil! Kamu mengirim **${amount.toLocaleString('id-ID')} 🪙** ke ${target}.\nSaldo kamu sekarang: **${result.newBalance.toLocaleString('id-ID')} 🪙**`,
        ),
      ],
    });
  },
};
