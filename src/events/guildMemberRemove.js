const { Events, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const welcome = require('../systems/welcome');
const welcomeCard = require('../systems/welcomeCard');
const { sendActionLog } = require('../utils/logs');

module.exports = {
  name: Events.GuildMemberRemove,
  execute: async (member) => {
    // member bisa sebagian jika data sudah hilang dari cache; fetch agar aman
    if (member.partial) {
      try { await member.fetch(); } catch {/* abaikan */}
    }

    // ===== Pesan Goodbye =====
    const { channelId, message: template } = welcome.getGoodbyeConfig(member.guild.id);
    if (channelId) {
      const channel = member.guild.channels.cache.get(channelId);
      if (channel?.isTextBased()) {
        const text = welcome.renderTemplate(template, member, true);

        try {
          const png = await welcomeCard.createGoodbyeCard(member);
          const card = new AttachmentBuilder(png, { name: 'goodbye-card.png' });

          const embed = new EmbedBuilder()
            .setDescription(text)
            .setColor(0x99aab5)
            .setImage('attachment://goodbye-card.png');

          await channel.send({ embeds: [embed], files: [card] });
        } catch (err) {
          console.error('[GOODBYE] Gagal render kartu:', err);
          await channel
            .send({ content: `👋 ${text}` })
            .catch((err2) => console.error('[GOODBYE] Gagal kirim:', err2));
        }
      }
    }

    sendActionLog(member.client, member.guild.id, {
      title: '📤 Member Keluar',
      description: `${member.user?.tag ?? member.displayName} (${member.id}) keluar.`,
      color: '#ED4245',
    });
  },
};
