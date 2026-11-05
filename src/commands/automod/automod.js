const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, createEmbed } = require('../../utils/embeds');
const antiSpam = require('../../systems/antiSpam');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Atur auto-moderasi (anti-spam & kata terlarang)')
    .addSubcommand((sub) =>
      sub
        .setName('toggle')
        .setDescription('Nyalakan/matikan auto-mod untuk server ini')
        .addBooleanOption((opt) =>
          opt.setName('aktif').setDescription('true = nyala, false = mati').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('addword')
        .setDescription('Tambah kata terlarang')
        .addStringOption((opt) => opt.setName('kata').setDescription('Kata yang dilarang').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('removeword')
        .setDescription('Hapus kata terlarang')
        .addStringOption((opt) => opt.setName('kata').setDescription('Kata yang dihapus').setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName('status').setDescription('Lihat konfigurasi auto-mod'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    if (sub === 'toggle') {
      const on = interaction.options.getBoolean('aktif', true);
      antiSpam.setAntiSpam(guildId, on);
      return interaction.reply({
        embeds: [successEmbed(`Auto-mod kini **${on ? 'AKTIF' : 'MATI'}** di server ini. ${on ? '🛡️' : '💤'}`)],
        ephemeral: true,
      });
    }

    if (sub === 'addword') {
      const word = interaction.options.getString('kata', true).toLowerCase().trim();
      if (word.length < 2) {
        return interaction.reply({ embeds: [errorEmbed('Kata minimal 2 karakter.')], ephemeral: true });
      }
      const words = antiSpam.getBannedWords(guildId);
      if (words.includes(word)) {
        return interaction.reply({ embeds: [errorEmbed('Kata itu sudah ada di daftar.')], ephemeral: true });
      }
      words.push(word);
      antiSpam.setBannedWords(guildId, words);
      return interaction.reply({ embeds: [successEmbed(`Kata **"${word}"** ditambahkan ke daftar terlarang.`)], ephemeral: true });
    }

    if (sub === 'removeword') {
      const word = interaction.options.getString('kata', true).toLowerCase().trim();
      const words = antiSpam.getBannedWords(guildId);
      const filtered = words.filter((w) => w !== word);
      if (filtered.length === words.length) {
        return interaction.reply({ embeds: [errorEmbed('Kata itu tidak ada di daftar.')], ephemeral: true });
      }
      antiSpam.setBannedWords(guildId, filtered);
      return interaction.reply({ embeds: [successEmbed(`Kata **"${word}"** dihapus dari daftar terlarang.`)], ephemeral: true });
    }

    // status
    const words = antiSpam.getBannedWords(guildId);
    await interaction.reply({
      embeds: [
        createEmbed({
          title: '🛡️ Konfigurasi Auto-Mod',
          fields: [
            { name: 'Status', value: antiSpam.isAntiSpamOn(guildId) ? '**AKTIF** ✅' : '**MATI** 💤', inline: true },
            { name: 'Batas spam', value: `${antiSpam.MAX_MESSAGES} pesan / ${antiSpam.WINDOW_MS / 1000} detik → timeout 10 menit`, inline: true },
            {
              name: `Kata terlarang (${words.length})`,
              value: words.length ? words.map((w) => `\`${w}\``).join(', ').slice(0, 1000) : '*kosong — tambah dengan /automod addword*',
            },
          ],
        }),
      ],
      ephemeral: true,
    });
  },
};
