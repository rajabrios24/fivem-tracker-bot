const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { requireModeration } = require('../../utils/permissions');
const models = require('../../database/models');
const { sendActionLog } = require('../../utils/logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Beri warning ke anggota')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User yang di-warning').setRequired(true),
    )
    .addStringOption((opt) =>
      opt.setName('alasan').setDescription('Alasan warning').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('alasan', true);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!target) return interaction.editReply({ embeds: [errorEmbed('User tidak ditemukan.')] });

    const guard = requireModeration(interaction, target, PermissionFlagsBits.ModerateMembers);
    if (guard) return interaction.editReply({ embeds: [guard] });

    models.addWarning(interaction.guild.id, target.id, interaction.user.id, reason);
    const total = models.getWarnings(interaction.guild.id, target.id).length;

    await target
      .send(`⚠️ Kamu diberi **warning ${total}** di **${interaction.guild.name}**.\nAlasan: ${reason}`)
      .catch(() => {});

    await interaction.editReply({
      embeds: [successEmbed(`**${target.user.tag}** kini punya **${total} warning**.`)],
    });

    sendActionLog(interaction.client, interaction.guild.id, {
      title: '⚠️ Warning',
      description: `**${target.user.tag}** di-warning oleh ${interaction.user}`,
      fields: [
        { name: 'Alasan', value: reason },
        { name: 'Total warning', value: String(total), inline: true },
      ],
    });
  },
};
