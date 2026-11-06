const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { requireModeration } = require('../../utils/permissions');
const { sendActionLog } = require('../../utils/logs');

const DURATIONS = [
  { label: '60 detik', value: 60 },
  { label: '5 menit', value: 300 },
  { label: '10 menit', value: 600 },
  { label: '30 menit', value: 1800 },
  { label: '1 jam', value: 3600 },
  { label: '6 jam', value: 21600 },
  { label: '12 jam', value: 43200 },
  { label: '1 hari', value: 86400 },
  { label: '3 hari', value: 259200 },
  { label: '7 hari', value: 604800 },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Beri timeout (mute) ke anggota')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User yang di-timeout').setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('durasi')
        .setDescription('Durasi timeout')
        .setRequired(true)
        .addChoices(...DURATIONS.map((d) => ({ name: d.label, value: String(d.value) }))),
    )
    .addStringOption((opt) => opt.setName('alasan').setDescription('Alasan timeout'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const durationSeconds = Number(interaction.options.getString('durasi', true));
    const reason = interaction.options.getString('alasan') ?? 'Tidak ada alasan';

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (!target) return interaction.editReply({ embeds: [errorEmbed('User tidak ditemukan.')] });

    const guard = requireModeration(interaction, target, PermissionFlagsBits.ModerateMembers);
    if (guard) return interaction.editReply({ embeds: [guard] });

    const until = Date.now() + durationSeconds * 1000;
    await target.timeout(durationSeconds * 1000, `${reason} (oleh ${interaction.user.tag})`);

    await interaction.editReply({
      embeds: [successEmbed(`**${target.user.tag}** di-timeout. Berakhir <t:${Math.floor(until / 1000)}:R>.\nAlasan: ${reason}`)],
    });

    sendActionLog(interaction.client, interaction.guild.id, {
      title: '🔇 Timeout',
      description: `**${target.user.tag}** di-timeout oleh ${interaction.user}`,
      fields: [
        { name: 'Durasi', value: `${DURATIONS.find((d) => d.value === durationSeconds)?.label ?? durationSeconds + ' detik'}`, inline: true },
        { name: 'Alasan', value: reason, inline: true },
      ],
      color: '#FEE75C',
    });
  },
};
