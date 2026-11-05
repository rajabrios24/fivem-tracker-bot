const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const economy = require('../../systems/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Beli item dari toko')
    .addStringOption((opt) =>
      opt.setName('id').setDescription('ID item (lihat /shop)').setRequired(true).setAutocomplete(false),
    ),

  async execute(interaction) {
    const itemId = interaction.options.getString('id', true);
    const result = economy.buyItem(interaction.guild.id, interaction.user.id, itemId.toLowerCase());

    if (!result.ok) {
      return interaction.reply({ embeds: [errorEmbed(`${result.message}\nLihat daftar barang dengan /shop`)], ephemeral: true });
    }

    await interaction.reply({
      embeds: [successEmbed(`Berhasil membeli ${result.item.emoji} **${result.item.name}** seharga **${result.item.price.toLocaleString('id-ID')} 🪙**!\nSaldo sekarang: **${result.newBalance.toLocaleString('id-ID')} 🪙**`)],
    });
  },
};
