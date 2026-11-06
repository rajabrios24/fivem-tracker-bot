const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
  InteractionContextType,
  MessageFlags,
} = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const reactionRole = require('../../systems/reactionRole');
const { sendActionLog } = require('../../utils/logs');

const TEXT_CHANNEL_TYPES = [ChannelType.GuildText, ChannelType.GuildAnnouncement];

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
        .addRoleOption((opt) => opt.setName('role').setDescription('Role yang diberikan').setRequired(true))
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Channel tempat pesan berada (opsional, mempercepat pencarian)')
            .addChannelTypes(...TEXT_CHANNEL_TYPES),
        ),
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
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const guild = interaction.guild;
    const sub = interaction.options.getSubcommand();

    // Defer di awal: pencarian pesan & fetch role bisa lebih dari 3 detik
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (sub === 'add') {
      const messageId = interaction.options.getString('message_id', true).trim();
      const emojiInput = interaction.options.getString('emoji', true).trim();
      const role = interaction.options.getRole('role', true);
      const channel = interaction.options.getChannel('channel');

      // Validasi role
      const me = guild.members.me;
      if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.editReply({ embeds: [errorEmbed('Saya butuh permission **ManageRoles** untuk memberi role.')] });
      }
      if (role.position >= me.roles.highest.position) {
        return interaction.editReply({
          embeds: [errorEmbed('Role ini lebih tinggi dari role tertinggi saya. Geser role bot ke atas di pengaturan server.')],
        });
      }
      if (role.managed || role.id === guild.id) {
        return interaction.editReply({
          embeds: [errorEmbed('Role ini dikelola otomatis (integrasi/@everyone) dan tidak bisa diberikan.')],
        });
      }

      // Pastikan pesan ada
      const targetMessage = await fetchMessage(guild, messageId, channel);
      if (!targetMessage) {
        return interaction.editReply({
          embeds: [errorEmbed('Pesan tidak ditemukan. Pastikan ID pesan benar, pesan ada di server ini, dan saya bisa melihat channel-nya.')],
        });
      }

      // Bot memberi reaksi dulu: sekaligus validasi emoji, dan kunci emoji diambil
      // dari hasil reaksi supaya pasti sama dengan yang dikirim event reaksi nanti.
      let botReaction;
      try {
        botReaction = await targetMessage.react(emojiInput);
      } catch {
        return interaction.editReply({
          embeds: [errorEmbed('Emoji tidak valid atau tidak bisa saya pakai (emoji custom harus dari server yang saya ikuti).')],
        });
      }
      const emojiKey = reactionRole.emojiKeyFromReaction(botReaction);

      reactionRole.addReactionRole(guild.id, targetMessage.channelId, targetMessage.id, emojiKey, role.id);

      await interaction.editReply({
        embeds: [successEmbed(`Reaction role dibuat: ${emojiInput} → **${role.name}**\nMember klik emoji di pesan itu untuk mendapat role.\n${targetMessage.url}`)],
      });

      sendActionLog(interaction.client, guild.id, {
        title: '🎭 Reaction Role: Dibuat',
        description: `${emojiInput} → **${role.name}** di ${targetMessage.url}`,
      });
      return;
    }

    if (sub === 'remove') {
      const messageId = interaction.options.getString('message_id', true).trim();
      const emoji = reactionRole.normalizeEmojiInput(interaction.options.getString('emoji', true));
      const removed = reactionRole.removeReactionRole(guild.id, messageId, emoji);

      if (!removed) {
        return interaction.editReply({ embeds: [errorEmbed('Mapping tidak ditemukan untuk pesan & emoji itu di server ini.')] });
      }
      return interaction.editReply({ embeds: [successEmbed('Mapping reaction role dihapus. 🗑️')] });
    }

    // list
    const rows = reactionRole.listReactionRoles(guild.id);
    if (!rows.length) {
      return interaction.editReply({ embeds: [errorEmbed('Belum ada reaction role. Buat dengan `/reactionrole add`.')] });
    }

    const lines = rows.map((r) => {
      const role = guild.roles.cache.get(r.role_id);
      const emoji = /^\d+$/.test(r.emoji) ? (guild.emojis.cache.get(r.emoji)?.toString() ?? `:${r.emoji}:`) : r.emoji;
      const where = r.channel_id
        ? `https://discord.com/channels/${guild.id}/${r.channel_id}/${r.message_id}`
        : `pesan \`${r.message_id}\``;
      return `• ${where} — ${emoji} → ${role ? `**${role.name}**` : '*role terhapus*'}`;
    });

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle('🎭 Reaction Roles')
          .setDescription(lines.join('\n').slice(0, 4000))
          .setColor(0x5865f2),
      ],
    });
  },
};

/**
 * Fetch pesan berdasarkan ID. Kalau channel diberikan, cari di sana saja.
 * Kalau tidak, cari di semua channel teks yang bisa dibaca bot.
 */
async function fetchMessage(guild, messageId, channel = null) {
  if (!/^\d{17,20}$/.test(messageId)) return null;

  if (channel) {
    return channel.messages.fetch(messageId).catch(() => null);
  }

  const me = guild.members.me;
  const candidates = guild.channels.cache.filter(
    (c) =>
      TEXT_CHANNEL_TYPES.includes(c.type) &&
      c.permissionsFor(me)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]),
  );
  for (const c of candidates.values()) {
    const msg = await c.messages.fetch(messageId).catch(() => null);
    if (msg) return msg;
  }
  return null;
}
