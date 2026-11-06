const { Events } = require('discord.js');
const welcome = require('../systems/welcome');
const { sendActionLog } = require('../utils/logs');

module.exports = {
  name: Events.GuildMemberRemove,
  execute: async (member) => {
    // ===== Pesan Goodbye (teks + kartu gambar) =====
    const { channelId } = welcome.getGoodbyeConfig(member.guild.id);
    const channel = channelId ? member.guild.channels.cache.get(channelId) : null;
    if (channel?.isTextBased()) {
      const payload = await welcome.buildGoodbyeMessage(member);
      await channel.send(payload).catch((err) => console.error('[GOODBYE] Gagal kirim:', err.message));
    }

    sendActionLog(member.client, member.guild.id, {
      title: '📤 Member Keluar',
      description: `${member.user?.tag ?? member.displayName} (${member.id}) keluar.`,
      color: '#ED4245',
    });
  },
};
