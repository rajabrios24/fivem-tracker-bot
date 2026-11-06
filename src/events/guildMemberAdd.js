const { Events } = require('discord.js');
const welcome = require('../systems/welcome');
const models = require('../database/models');
const { sendActionLog } = require('../utils/logs');

module.exports = {
  name: Events.GuildMemberAdd,
  execute: async (member) => {
    // Pastikan data user tersedia di database leveling/ekonomi
    if (!member.user.bot) models.ensureUser(member.guild.id, member.id);

    // ===== Pesan Welcome (teks + kartu gambar) =====
    const { channelId } = welcome.getWelcomeConfig(member.guild.id);
    const channel = channelId ? member.guild.channels.cache.get(channelId) : null;
    if (channel?.isTextBased()) {
      const payload = await welcome.buildWelcomeMessage(member);
      await channel.send(payload).catch((err) => console.error('[WELCOME] Gagal kirim:', err.message));
    }

    sendActionLog(member.client, member.guild.id, {
      title: '📥 Member Baru',
      description: `${member} (${member.user.tag}) bergabung.`,
      color: '#57F287',
    });
  },
};
