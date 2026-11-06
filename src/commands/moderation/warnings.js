const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const { createEmbed, errorEmbed } = require('../../utils/embeds');
const models = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Lihat daftar warning sebuah user')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User yang diperiksa').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const warnings = models.getWarnings(interaction.guild.id, user.id);

    if (!warnings.length) {
      return interaction.reply({
        embeds: [errorEmbed(`${user.tag} tidak punya warning. 🎉`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    const lines = warnings.map(
      (w, i) =>
        `**${i + 1}.** ${w.reason ?? '*tanpa alasan*'}\n— oleh <@${w.moderator_id}> • <t:${Math.floor(new Date(w.created_at + 'Z').getTime() / 1000)}:R>`,
    );

    await interaction.reply({
      embeds: [
        createEmbed({
          title: `⚠️ Warnings — ${user.tag} (${warnings.length})`,
          description: lines.join('\n\n').slice(0, 4000),
          thumbnail: user.displayAvatarURL({ size: 128 }),
          color: '#FEE75C',
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
