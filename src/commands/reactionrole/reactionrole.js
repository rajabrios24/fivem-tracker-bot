const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const reactionRole = require('../../systems/reactionRole');
const { sendActionLog } = require('../../utils/logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Atur role yang didapat lewat reaksi emoji')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Hubungkan emoji di sebuah pesan dengan role')
        .addStringOption((opt) =>
          opt
            .setName('message_id')
            .setDescription('ID pesan (klik kanan pesan → Copy ID, aktifkan Developer Mode dulu)')
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName('emoji').setDescription('Emoji (unicode atau custom)').setRequired(true),
        )
        .addRoleOption((opt) => opt.setName('role').setDescription('Role yang diberikan').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Hapus mapping emoji ↔ role pada sebuah pesan')
        .addStringOption((opt) => opt.setName('message_id').setDescription('ID pesan').setRequired(true))
        .addStringOption((opt) => opt.setName('emoji').setDescription('Emoji').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub.setName('list').setDescription('Lihat semua reaction role di server ini'),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),

  async execute(interaction) {
    const guild = interaction.guild;
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const messageId = interaction.options.getString('message_id', true).trim();
      const emoji = interaction.options.getString('emoji', true).trim();
      const role = interaction.options.getRole('role', true);

      // Validasi role
      const me = guild.members.me;
      if (role.position >= me.roles.highest.position) {
        return interaction.reply({
          embeds: [errorEmbed('Role ini lebih tinggi dari role tertinggi saya. Geser role bot ke atas di pengaturan server.')],
          ephemeral: true,
        });
      }
      if (role.managed) {
        return interaction.reply({
          embeds: [errorEmbed('Role ini dikelola oleh integrasi lain dan tidak bisa diberikan.')],
          ephemeral: true,
        });
      }

      // Pastikan pesan ada & ambil untuk menambahkan reaksi otomatis
      const targetMessage = await fetchMessage(guild, messageId);
      if (!targetMessage) {
        return interaction.reply({
          embeds: [errorEmbed('Pesan tidak ditemukan. Pastikan ID pesan benar dan pesan ada di server ini.')],
          ephemeral: true,
        });
      }

      reactionRole.addReactionRole(guild.id, targetMessage.id, emoji, role.id);
      await targetMessage.react(emoji).catch(() => {});

      await interaction.reply({
        embeds: [successEmbed(`Reaction role dibuat: ${emoji} → **${role.name}**\nMember klik emoji di pesan itu untuk mendapat role.`)],
        ephemeral: true,
      });

      sendActionLog(interaction.client, guild.id, {
        title: '🎭 Reaction Role: Dibuat',
        description: `${emoji} → **${role.name}** di pesan ${targetMessage.id}`,
      });
      return;
    }

    if (sub === 'remove') {
      const messageId = interaction.options.getString('message_id', true).trim();
      const emoji = interaction.options.getString('emoji', true).trim();
      const removed = reactionRole.removeReactionRole(messageId, emoji);

      if (!removed) {
        return interaction.reply({ embeds: [errorEmbed('Mapping tidak ditemukan untuk pesan & emoji itu.')], ephemeral: true });
      }
      return interaction.reply({ embeds: [successEmbed('Mapping reaction role dihapus. 🗑️')], ephemeral: true });
    }

    // list
    const rows = reactionRole.listReactionRoles(guild.id);
    if (!rows.length) {
      return interaction.reply({ embeds: [errorEmbed('Belum ada reaction role. Buat dengan `/reactionrole add`.')], ephemeral: true });
    }

    const lines = await Promise.all(
      rows.map(async (r) => {
        const role = await guild.roles.fetch(r.role_id).catch(() => null);
        return `• <#${r.message_id}> — ${r.emoji} → **${role?.name ?? '*role terhapus*'}**`;
      }),
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('🎭 Reaction Roles')
          .setDescription(lines.join('\n').slice(0, 4000))
          .setColor(0x5865f2),
      ],
      ephemeral: true,
    });
  },
};

/** Cari & fetch pesan dari semua channel teks di guild */
async function fetchMessage(guild, messageId) {
  for (const channel of guild.channels.cache.filter((c) => c.isTextBased()).values()) {
    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (msg) return msg;
  }
  return null;
}
