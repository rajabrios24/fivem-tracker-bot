const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/embeds');
const { requireModeration, requireMemberPermission } = require('../../utils/permissions');
const { sendActionLog } = require('../../utils/logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban anggota dari server')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User yang akan di-ban').setRequired(true),
    )
    .addStringOption((opt) =>
      opt.setName('alasan').setDescription('Alasan ban').setRequired(false),
    )
    .addIntegerOption((opt) =>
      opt
        .setName('hapus_pesan')
        .setDescription('Hapus pesan lama user berapa hari ke belakang (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('alasan') ?? 'Tidak ada alasan';
    const deleteMessageSeconds = (interaction.options.getInteger('hapus_pesan') ?? 0) * 86400;
    const auditReason = `${reason} (oleh ${interaction.user.tag})`;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (target) {
      // User masih di server → cek hierarki role lengkap
      const guard = requireModeration(interaction, target, PermissionFlagsBits.BanMembers);
      if (guard) return interaction.editReply({ embeds: [guard] });

      await target.send(`🚫 Kamu di-ban dari **${interaction.guild.name}**.\nAlasan: ${reason}`).catch(() => {});
    } else {
      // User sudah keluar server → ban via ID (tidak ada hierarki role untuk dicek)
      const guard = requireMemberPermission(interaction, PermissionFlagsBits.BanMembers);
      if (guard) return interaction.editReply({ embeds: [guard] });
      if (user.id === interaction.client.user.id) {
        return interaction.editReply({ embeds: [errorEmbed('Saya tidak bisa mem-ban diri sendiri 😅')] });
      }
      if (!interaction.guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers)) {
        return interaction.editReply({ embeds: [errorEmbed('Saya tidak punya permission **BanMembers**.')] });
      }
    }

    try {
      await interaction.guild.members.ban(user.id, { reason: auditReason, deleteMessageSeconds });
    } catch (err) {
      console.error('[BAN] Gagal:', err.message);
      return interaction.editReply({ embeds: [errorEmbed(`Gagal mem-ban **${user.tag}**: ${err.message}`)] });
    }

    await interaction.editReply({ embeds: [successEmbed(`**${user.tag}** telah di-ban.\nAlasan: ${reason}`)] });

    sendActionLog(interaction.client, interaction.guild.id, {
      title: '🔨 Ban',
      description: `**${user.tag}** (${user.id}) di-ban oleh ${interaction.user}${target ? '' : ' *(sudah tidak di server)*'}`,
      fields: [{ name: 'Alasan', value: reason }],
      color: '#ED4245',
    });
  },
};
