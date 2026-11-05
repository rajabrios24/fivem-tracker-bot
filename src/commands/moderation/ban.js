const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/embeds');
const { requireModeration } = require('../../utils/permissions');
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
    .setDMPermission(false),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('alasan') ?? 'Tidak ada alasan';

    await interaction.deferReply({ ephemeral: true });

    if (!target) {
      const user = interaction.options.getUser('user', true);
      if (user) {
        // Ban user yang sudah keluar server tetap bisa via ID
        await interaction.guild.members.ban(user.id, { reason, deleteMessageSeconds: (interaction.options.getInteger('hapus_pesan') ?? 0) * 86400 });
        return interaction.editReply({ embeds: [successEmbed(`**${user.tag}** telah di-ban.`)] });
      }
      return interaction.editReply({ embeds: [errorEmbed('User tidak ditemukan.')] });
    }

    const guard = requireModeration(interaction, target, PermissionFlagsBits.BanMembers);
    if (guard) return interaction.editReply({ embeds: [guard] });

    await target.send(`🚫 Kamu di-ban dari **${interaction.guild.name}**.\nAlasan: ${reason}`).catch(() => {});
    await interaction.guild.members.ban(target, {
      reason: `${reason} (oleh ${interaction.user.tag})`,
      deleteMessageSeconds: (interaction.options.getInteger('hapus_pesan') ?? 0) * 86400,
    });

    await interaction.editReply({ embeds: [successEmbed(`**${target.user.tag}** telah di-ban.\nAlasan: ${reason}`)] });

    sendActionLog(interaction.client, interaction.guild.id, {
      title: '🔨 Ban',
      description: `**${target.user.tag}** di-ban oleh ${interaction.user}`,
      fields: [{ name: 'Alasan', value: reason }],
      color: '#ED4245',
    });
  },
};
