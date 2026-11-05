const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { successEmbed, createEmbed } = require('../../utils/embeds');
const { setSetting, getSetting, getAllSettings } = require('../../database/db');
const welcome = require('../../systems/welcome');
const welcomeCard = require('../../systems/welcomeCard');

const VARS = '`{user}` `{mention}` `{username}` `{server}` `{memberCount}`';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Atur pesan welcome & goodbye')
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Set channel & pesan welcome')
        .addChannelOption((opt) =>
          opt.setName('channel').setDescription('Channel sambutan').addChannelTypes(0).setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName('pesan')
            .setDescription(`Pesan welcome (${VARS})`)
            .setMaxLength(1000),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('setgoodbye')
        .setDescription('Set channel & pesan goodbye')
        .addChannelOption((opt) =>
          opt.setName('channel').setDescription('Channel perpisahan').addChannelTypes(0).setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName('pesan')
            .setDescription(`Pesan goodbye (${VARS})`)
            .setMaxLength(1000),
        ),
    )
    .addSubcommand((sub) => sub.setName('show').setDescription('Lihat konfigurasi welcome saat ini'))
    .addSubcommand((sub) => sub.setName('off').setDescription('Matikan welcome & goodbye'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),

  async execute(interaction) {
    const guild = interaction.guild;
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const channel = interaction.options.getChannel('channel', true);
      const message = interaction.options.getString('pesan');
      setSetting(guild.id, 'welcomeChannel', channel.id);
      if (message) setSetting(guild.id, 'welcomeMessage', message);

      await interaction.reply({ embeds: [successEmbed(`Welcome diaktifkan untuk ${channel}${message ? '' : ' (pesan default dipakai)'}`)], ephemeral: true });

      // Kirim contoh tampilan: kartu bergambar + pesan custom
      const template = getSetting(guild.id, 'welcomeMessage') || 'Selamat datang {mention} di server **{server}**!';
      const text = welcome.renderTemplate(template, interaction.member);
      try {
        const png = await welcomeCard.createWelcomeCard(interaction.member);
        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setDescription(text)
              .setColor(0x5865f2)
              .setImage('attachment://welcome-card.png')
              .setFooter({ text: `Anggota ke-${guild.memberCount}` }),
          ],
          files: [new AttachmentBuilder(png, { name: 'welcome-card.png' })],
        });
      } catch (err) {
        console.error('[WELCOME] Gagal render preview kartu:', err);
        await channel.send({
          embeds: [createEmbed({ thumbnail: interaction.user.displayAvatarURL({ size: 256 }), title: `🎉 Selamat datang, ${interaction.user.displayName}!`, description: text })],
        });
      }
      return;
    }

    if (sub === 'setgoodbye') {
      const channel = interaction.options.getChannel('channel', true);
      const message = interaction.options.getString('pesan');
      setSetting(guild.id, 'goodbyeChannel', channel.id);
      if (message) setSetting(guild.id, 'goodbyeMessage', message);

      await interaction.reply({ embeds: [successEmbed(`Goodbye diaktifkan untuk ${channel}${message ? '' : ' (pesan default dipakai)'}`)], ephemeral: true });

      const template = getSetting(guild.id, 'goodbyeMessage') || '{username} telah meninggalkan **{server}**.';
      try {
        const png = await welcomeCard.createGoodbyeCard(interaction.member);
        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setDescription(`👋 ${welcome.renderTemplate(template, interaction.member, true)}`)
              .setColor(0x99aab5)
              .setImage('attachment://goodbye-card.png'),
          ],
          files: [new AttachmentBuilder(png, { name: 'goodbye-card.png' })],
        });
      } catch (err) {
        console.error('[GOODBYE] Gagal render preview kartu:', err);
        await channel.send({
          embeds: [createEmbed({ title: '👋 Contoh goodbye', description: welcome.renderTemplate(template, interaction.member, true) })],
        });
      }
      return;
    }

    if (sub === 'show') {
      const s = getAllSettings(guild.id);
      await interaction.reply({
        embeds: [
          createEmbed({
            title: '⚙️ Konfigurasi Welcome',
            fields: [
              { name: 'Channel welcome', value: s.welcomeChannel ? `<#${s.welcomeChannel}>` : '*belum diset*', inline: true },
              { name: 'Channel goodbye', value: s.goodbyeChannel ? `<#${s.goodbyeChannel}>` : '*belum diset*', inline: true },
              { name: 'Pesan welcome', value: (s.welcomeMessage ?? '*default*').slice(0, 1000) },
              { name: 'Pesan goodbye', value: (s.goodbyeMessage ?? '*default*').slice(0, 1000) },
              { name: 'Variabel yang tersedia', value: VARS },
            ],
          }),
        ],
        ephemeral: true,
      });
      return;
    }

    // off
    setSetting(guild.id, 'welcomeChannel', null);
    setSetting(guild.id, 'goodbyeChannel', null);
    await interaction.reply({ embeds: [successEmbed('Welcome & goodbye dimatikan. 🔕')], ephemeral: true });
  },
};
