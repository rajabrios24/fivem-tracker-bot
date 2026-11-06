const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, InteractionContextType, MessageFlags } = require('discord.js');
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
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('off').setDescription('Matikan log moderasi'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const channel = interaction.options.getChannel('channel', true);
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Uji kirim dulu — kalau bot tidak punya izin, jangan simpan setting
      try {
        await channel.send({
          embeds: [createEmbed({ title: '📜 Log Channel Aktif', description: 'Log moderasi maupun auto-mod akan dikirim ke channel ini.' })],
        });
      } catch {
        return interaction.editReply({
          embeds: [errorEmbed(`Saya tidak bisa mengirim pesan di ${channel}. Pastikan saya punya izin **View Channel**, **Send Messages**, dan **Embed Links** di sana.`)],
        });
      }

      setSetting(interaction.guild.id, 'logChannel', channel.id);
      return interaction.editReply({
        embeds: [successEmbed(`Log moderasi akan dikirim ke ${channel}. 📜`)],
      });
    }

    const current = getSetting(interaction.guild.id, 'logChannel');
    if (!current) {
      return interaction.reply({ embeds: [errorEmbed('Log belum diaktifkan.')], flags: MessageFlags.Ephemeral });
    }
    setSetting(interaction.guild.id, 'logChannel', null);
    await interaction.reply({ embeds: [successEmbed('Log moderasi dimatikan. 🔕')], flags: MessageFlags.Ephemeral });
  },
};
