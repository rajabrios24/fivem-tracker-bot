const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed } = require('../../utils/embeds');
const economy = require('../../systems/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addmoney')
    .setDescription('[Admin] Tambah/kurangi saldo sebuah user')
    .addUserOption((opt) => opt.setName('user').setDescription('User target').setRequired(true))
    .addIntegerOption((opt) =>
      opt.setName('jumlah').setDescription('Jumlah (negatif = ambil saldo)').setMinValue(-1e9).setMaxValue(1e9).setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('jumlah', true);

    const balance = economy.adjustMoney(interaction.guild.id, user.id, amount);
    await interaction.reply({
      embeds: [
        successEmbed(
          `Saldo ${user} ${amount >= 0 ? '+' : ''}${amount.toLocaleString('id-ID')} 🪙 → sekarang **${balance.toLocaleString('id-ID')} 🪙**`,
        ),
      ],
      ephemeral: true,
    });
  },
};
