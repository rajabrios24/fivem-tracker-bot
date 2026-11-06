const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendActionLog } = require('../../utils/logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Hapus sejumlah pesan terbaru di channel ini (moderator saja)')
    .addIntegerOption((opt) =>
      opt
        .setName('jumlah')
        .setDescription('Jumlah pesan yang dihapus (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const amount = interaction.options.getInteger('jumlah', true);

    if (!interaction.channel) {
      return interaction.reply({ embeds: [errorEmbed('Channel tidak valid.')], flags: MessageFlags.Ephemeral });
    }

    // bulkDelete hanya bekerja di channel teks
    if (!interaction.channel.isTextBased()) {
      return interaction.reply({ embeds: [errorEmbed('Command ini hanya bisa dipakai di channel teks.')], flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // true = filter pesan lebih tua dari 14 hari (tidak bisa di-bulk delete by discord)
    const deleted = await interaction.channel.bulkDelete(amount, true);

    await interaction.editReply({ embeds: [successEmbed(`🗑️ Berhasil menghapus **${deleted.size}** pesan.`)] });

    // Log
    sendActionLog(interaction.client, interaction.guild.id, {
      title: '🧹 Purge',
      description: `${interaction.user} menghapus **${deleted.size}** pesan di ${interaction.channel}.`,
      color: '#ED4245',
    });
  },
};
