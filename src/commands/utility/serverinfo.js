const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { embedColor } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Informasi tentang server ini'),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'Command ini hanya untuk server.', ephemeral: true });
    }
    const { guild } = interaction;
    const sfw = guild.description ? guild.description.slice(0, 1000) : '-';

    const embed = new EmbedBuilder()
      .setTitle(`🏠 ${guild.name}`)
      .setColor(embedColor)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: '🆔 ID', value: guild.id, inline: true },
        { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: '👥 Anggota', value: String(guild.memberCount), inline: true },
        { name: '💬 Channel Teks', value: String(guild.channels.cache.filter((c) => c.isTextBased()).size), inline: true },
        { name: '🔊 Channel Voice', value: String(guild.channels.cache.filter((c) => c.isVoiceBased()).size), inline: true },
        { name: '🎭 Role', value: String(guild.roles.cache.size), inline: true },
        { name: '🗓️ Dibuat', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '🚀 Boost', value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount}x)`, inline: true },
        { name: '📄 Deskripsi', value: sfw },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
