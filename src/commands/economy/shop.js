const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');
const economy = require('../../systems/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Lihat daftar barang yang dijual 🏪'),

  async execute(interaction) {
    const items = economy.getShopItems();
    const lines = items
      .map((i) => `${i.emoji} **${i.name}** \`(${i.id})\` — **${i.price.toLocaleString('id-ID')} 🪙**\n↳ *${i.desc}*`)
      .join('\n');

    await interaction.reply({
      embeds: [
        createEmbed({
          title: '🏪 Toko Server',
          description: lines,
          footer: 'Beli pakai /buy id:nama-barang',
        }),
      ],
    });
  },
};
