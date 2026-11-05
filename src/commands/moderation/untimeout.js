const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { requireModeration } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Hapus timeout dari anggota')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User yang dihapus timeoutnya').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    await interaction.deferReply({ ephemeral: true });

    if (!target) return interaction.editReply({ embeds: [errorEmbed('User tidak ditemukan.')] });

    const guard = requireModeration(interaction, target, PermissionFlagsBits.ModerateMembers);
    if (guard) return interaction.editReply({ embeds: [guard] });

    if (!target.isCommunicationDisabled()) {
      return interaction.editReply({ embeds: [errorEmbed('User tidak sedang dalam timeout.')] });
    }

    await target.timeout(null);
    await interaction.editReply({
      embeds: [successEmbed(`Timeout **${target.user.tag}** telah dihapus. 🔓`)],
    });
  },
};
