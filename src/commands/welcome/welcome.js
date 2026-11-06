const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  InteractionContextType,
  MessageFlags,
} = require('discord.js');
const { successEmbed, errorEmbed, createEmbed } = require('../../utils/embeds');
const { setSetting, getAllSettings } = require('../../database/db');
const welcome = require('../../systems/welcome');
const welcomeCard = require('../../systems/welcomeCard');

const VARS = '`{user}` `{mention}` `{username}` `{server}` `{memberCount}`';
const MAX_BG_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_BG_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const NO_ACCESS = (channel) =>
  `Setting tersimpan, tapi saya tidak bisa mengirim pesan di ${channel}. Pastikan saya punya izin **View Channel**, **Send Messages**, dan **Attach Files** di sana.`;

/** Kirim contoh pesan ke channel. Kembalikan false kalau gagal terkirim. */
async function sendPreview(channel, payload) {
  try {
    await channel.send(payload);
    return true;
  } catch (err) {
    console.error('[WELCOME] Gagal kirim preview:', err.message);
    return false;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Atur pesan & kartu welcome / goodbye')
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Set channel & pesan welcome')
        .addChannelOption((opt) =>
          opt.setName('channel').setDescription('Channel sambutan').addChannelTypes(ChannelType.GuildText).setRequired(true),
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
          opt.setName('channel').setDescription('Channel perpisahan').addChannelTypes(ChannelType.GuildText).setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName('pesan')
            .setDescription(`Pesan goodbye (${VARS})`)
            .setMaxLength(1000),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('background')
        .setDescription('Ganti gambar latar kartu welcome/goodbye')
        .addAttachmentOption((opt) =>
          opt.setName('gambar').setDescription('Gambar PNG/JPG/WEBP, ideal 1024×500 (maks 8 MB)'),
        )
        .addBooleanOption((opt) =>
          opt.setName('reset').setDescription('Hapus background custom & kembali ke default'),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('test')
        .setDescription('Kirim contoh kartu welcome/goodbye (hanya kamu yang lihat)')
        .addStringOption((opt) =>
          opt
            .setName('jenis')
            .setDescription('Kartu yang dites')
            .addChoices({ name: 'Welcome', value: 'welcome' }, { name: 'Goodbye', value: 'goodbye' }),
        ),
    )
    .addSubcommand((sub) => sub.setName('show').setDescription('Lihat konfigurasi welcome saat ini'))
    .addSubcommand((sub) => sub.setName('off').setDescription('Matikan welcome & goodbye'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const guild = interaction.guild;
    const sub = interaction.options.getSubcommand();

    if (sub === 'set' || sub === 'setgoodbye') {
      const isWelcome = sub === 'set';
      const channel = interaction.options.getChannel('channel', true);
      const message = interaction.options.getString('pesan');
      setSetting(guild.id, isWelcome ? 'welcomeChannel' : 'goodbyeChannel', channel.id);
      if (message) setSetting(guild.id, isWelcome ? 'welcomeMessage' : 'goodbyeMessage', message);

      await interaction.reply({
        embeds: [successEmbed(`${isWelcome ? 'Welcome' : 'Goodbye'} diaktifkan untuk ${channel}${message ? '' : ' (pesan default dipakai)'}. Contohnya dikirim ke sana.`)],
        flags: MessageFlags.Ephemeral,
      });

      // Contoh tampilan persis seperti saat member join/keluar
      const payload = isWelcome
        ? await welcome.buildWelcomeMessage(interaction.member)
        : await welcome.buildGoodbyeMessage(interaction.member);
      if (!(await sendPreview(channel, payload))) {
        await interaction.followUp({ embeds: [errorEmbed(NO_ACCESS(channel))], flags: MessageFlags.Ephemeral });
      }
      return;
    }

    if (sub === 'background') {
      const attachment = interaction.options.getAttachment('gambar');
      const reset = interaction.options.getBoolean('reset') ?? false;

      if (reset) {
        const removed = welcomeCard.removeGuildBackground(guild.id);
        return interaction.reply({
          embeds: [removed ? successEmbed('Background custom dihapus, kembali ke default. 🖼️') : errorEmbed('Server ini belum punya background custom.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      if (!attachment) {
        return interaction.reply({
          embeds: [errorEmbed('Lampirkan gambar di opsi `gambar`, atau pakai `reset:True` untuk kembali ke default.')],
          flags: MessageFlags.Ephemeral,
        });
      }
      const type = (attachment.contentType ?? '').split(';')[0];
      if (!ALLOWED_BG_TYPES.includes(type)) {
        return interaction.reply({ embeds: [errorEmbed('Format harus PNG, JPG, atau WEBP.')], flags: MessageFlags.Ephemeral });
      }
      if (attachment.size > MAX_BG_BYTES) {
        return interaction.reply({ embeds: [errorEmbed('Ukuran gambar maksimal 8 MB.')], flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      try {
        // URL lampiran Discord kedaluwarsa, jadi gambar diunduh & disimpan lokal
        const res = await fetch(attachment.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await welcomeCard.saveGuildBackground(guild.id, Buffer.from(await res.arrayBuffer()));
      } catch (err) {
        console.error('[WELCOME] Gagal simpan background:', err);
        return interaction.editReply({ embeds: [errorEmbed('Gagal memproses gambar. Pastikan file-nya gambar yang valid.')] });
      }

      const preview = await welcome.buildWelcomeMessage(interaction.member);
      return interaction.editReply({
        content: '✅ Background disimpan! Begini tampilannya:',
        files: preview.files ?? [],
        allowedMentions: { parse: [] },
      });
    }

    if (sub === 'test') {
      const isWelcome = (interaction.options.getString('jenis') ?? 'welcome') === 'welcome';
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const payload = isWelcome
        ? await welcome.buildWelcomeMessage(interaction.member)
        : await welcome.buildGoodbyeMessage(interaction.member);
      return interaction.editReply({ ...payload, allowedMentions: { parse: [] } });
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
              { name: 'Background', value: welcomeCard.hasGuildBackground(guild.id) ? 'Custom ✅' : 'Default', inline: true },
              { name: 'Pesan welcome', value: (s.welcomeMessage ?? '*default*').slice(0, 1000) },
              { name: 'Pesan goodbye', value: (s.goodbyeMessage ?? '*default*').slice(0, 1000) },
              { name: 'Variabel yang tersedia', value: VARS },
            ],
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // off
    setSetting(guild.id, 'welcomeChannel', null);
    setSetting(guild.id, 'goodbyeChannel', null);
    await interaction.reply({ embeds: [successEmbed('Welcome & goodbye dimatikan. 🔕')], flags: MessageFlags.Ephemeral });
  },
};
