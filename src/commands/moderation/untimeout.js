const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { requireModeration } = require('../../utils/permissions');
const { sendActionLog } = require('../../utils/logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Hapus timeout dari anggota')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User yang dihapus timeoutnya').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (!target) return interaction.editReply({ embeds: [errorEmbed('User tidak ditemukan.')] });

    const guard = requireModeration(interaction, target, PermissionFlagsBits.ModerateMembers);
    if (guard) return interaction.editReply({ embeds: [guard] });

    if (!target.isCommunicationDisabled()) {
      return interaction.editReply({ embeds: [errorEmbed('User tidak sedang dalam timeout.')] });
    }

    await target.timeout(null, `Timeout dihapus oleh ${interaction.user.tag}`);
    await interaction.editReply({
      embeds: [successEmbed(`Timeout **${target.user.tag}** telah dihapus. 🔓`)],
    });

    sendActionLog(interaction.client, interaction.guild.id, {
      title: '🔓 Untimeout',
      description: `Timeout **${target.user.tag}** dihapus oleh ${interaction.user}`,
      color: '#57F287',
    });
  },
};
