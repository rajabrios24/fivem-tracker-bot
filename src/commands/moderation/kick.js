const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { requireModeration } = require('../../utils/permissions');
const { sendActionLog } = require('../../utils/logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick anggota dari server')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User yang akan di-kick').setRequired(true),
    )
    .addStringOption((opt) =>
      opt.setName('alasan').setDescription('Alasan kick'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('alasan') ?? 'Tidak ada alasan';

    await interaction.deferReply({ ephemeral: true });

    if (!target) {
      return interaction.editReply({ embeds: [errorEmbed('User tidak ditemukan. Pastikan user masih anggota server.')] });
    }

    const guard = requireModeration(interaction, target, PermissionFlagsBits.KickMembers);
    if (guard) return interaction.editReply({ embeds: [guard] });

    await target.send(`🥾 Kamu di-kick dari **${interaction.guild.name}**.\nAlasan: ${reason}`).catch(() => {});
    await interaction.guild.members.kick(target, `${reason} (oleh ${interaction.user.tag})`);

    await interaction.editReply({ embeds: [successEmbed(`**${target.user.tag}** telah di-kick.\nAlasan: ${reason}`)] });

    sendActionLog(interaction.client, interaction.guild.id, {
      title: '🥾 Kick',
      description: `**${target.user.tag}** di-kick oleh ${interaction.user}`,
      fields: [{ name: 'Alasan', value: reason }],
      color: '#ED4245',
    });
  },
};
