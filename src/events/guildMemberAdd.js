const { Events, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const welcome = require('../systems/welcome');
const welcomeCard = require('../systems/welcomeCard');
const models = require('../database/models');
const { sendActionLog } = require('../utils/logs');

module.exports = {
  name: Events.GuildMemberAdd,
  execute: async (member) => {
    // Pastikan data user tersedia di database leveling/ekonomi
    models.ensureUser(member.guild.id, member.id);

    // ===== Pesan Welcome =====
    const { channelId, message: template } = welcome.getWelcomeConfig(member.guild.id);
    if (channelId) {
      const channel = member.guild.channels.cache.get(channelId);
      if (channel?.isTextBased()) {
        const text = welcome.renderTemplate(template, member);

        try {
          // Kartu bergambar gaya Koya (fancy + konfeti)
          const png = await welcomeCard.createWelcomeCard(member);
          const card = new AttachmentBuilder(png, { name: 'welcome-card.png' });

          const embed = new EmbedBuilder()
            .setDescription(text)
            .setColor(0x5865f2)
            .setImage('attachment://welcome-card.png')
            .setFooter({ text: `Anggota ke-${member.guild.memberCount}` });

          await channel.send({ embeds: [embed], files: [card] });
        } catch (err) {
          // Fallback: kirim teks saja bila kartu gagal digambar
          console.error('[WELCOME] Gagal render kartu:', err);
          await channel
            .send({ content: `🎉 ${text}` })
            .catch((err2) => console.error('[WELCOME] Gagal kirim:', err2));
        }
      }
    }

    sendActionLog(member.client, member.guild.id, {
      title: '📥 Member Baru',
      description: `${member} (${member.user.tag}) bergabung.`,
      color: '#57F287',
    });
  },
};
