const { Events, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const antiSpam = require('../systems/antiSpam');
const leveling = require('../systems/leveling');
const models = require('../database/models');
const { sendActionLog } = require('../utils/logs');

/** Hapus pesan dengan aman (bisa saja sudah terhapus) */
async function safeDelete(message) {
  try {
    if (message.deletable) await message.delete();
  } catch {/* abaikan */}
}

module.exports = {
  name: Events.MessageCreate,
  execute: async (message, client) => {
    if (message.author.bot || !message.inGuild() || !message.member) return;

    const { guild, member } = message;

    // Moderator (ManageMessages) tidak kena auto-mod
    const isMod = member.permissions.has(PermissionFlagsBits.ManageMessages);
    if (!isMod) {
      const inspect = antiSpam.inspectMessage(guild.id, member.id, message.content);

      // ===== Kata terlarang: hapus + warning =====
      if (inspect.bannedWord) {
        await safeDelete(message);
        models.addWarning(guild.id, member.id, client.user.id, `Auto-mod: kata terlarang "${inspect.bannedWord}"`);
        sendActionLog(client, guild.id, {
          title: '🚫 Auto-Mod: Kata Terlarang',
          fields: [
            { name: 'Pengguna', value: `${member} (${member.user.tag})`, inline: true },
            { name: 'Kata terlarang', value: inspect.bannedWord, inline: true },
          ],
        });
        await member
          .send(`⚠️ Pesanmu di **${guild.name}** dihapus karena mengandung kata terlarang.`)
          .catch(() => {});
        return;
      }

      // ===== Spam: timeout otomatis =====
      if (inspect.spam) {
        antiSpam.resetUserHistory(guild.id, member.id);
        const reason = 'Auto-mod: mengirim pesan terlalu cepat (spam)';
        try {
          await member.timeout(antiSpam.AUTO_TIMEOUT_MS, reason);
          await message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setDescription(`🚨 ${member} di-**timeout 10 menit** karena spam.`)
                .setColor(0xED4245),
            ],
          });
          sendActionLog(client, guild.id, {
            title: '🚨 Auto-Mod: Spam',
            description: `${member} (${member.user.tag}) di-timeout otomatis (10 menit).`,
          });
        } catch (err) {
          console.error('[SPAM] Gagal memberi timeout:', err);
        }
        return;
      }
    }

    // ===== Leveling (XP) =====
    const result = leveling.handleXpForMessage(guild.id, member.id);
    if (!result?.leveledUp) return;

    await message.channel.send(
      `🎉 Selamat ${message.author}, kamu naik ke **Level ${result.level}** dan mendapat bonus **${result.bonus} 🪙**!`,
    );
  },
};
