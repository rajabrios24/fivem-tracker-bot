const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embeds');
const { getSetting, setSetting } = require('../../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Atur channel log moderasi')
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Set channel untuk log moderasi')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Channel tujuan log')
            .addChannelTypes(0 /* GuildText */)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('off').setDescription('Matikan log moderasi'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const channel = interaction.options.getChannel('channel', true);
      setSetting(interaction.guild.id, 'logChannel', channel.id);
      await interaction.reply({
        embeds: [successEmbed(`Log moderasi akan dikirim ke ${channel}. 📜`)],
        ephemeral: true,
      });
      await channel.send({
        embeds: [createEmbed({ title: '📜 Log Channel Aktif', description: 'Log moderasi maupun auto-mod akan dikirim ke channel ini.' })],
      });
      return;
    }

    const current = getSetting(interaction.guild.id, 'logChannel');
    if (!current) {
      return interaction.reply({ embeds: [errorEmbed('Log belum diaktifkan.')], ephemeral: true });
    }
    setSetting(interaction.guild.id, 'logChannel', null);
    await interaction.reply({ embeds: [successEmbed('Log moderasi dimatikan. 🔕')], ephemeral: true });
  },
};
