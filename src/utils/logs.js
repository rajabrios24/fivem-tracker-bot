const { getSetting } = require('../database/db');
const { createEmbed } = require('./embeds');

/**
 * Kirim embed log aksi (moderasi, auto-mod, member join/leave) ke channel log
 * yang diset via /logs set. Diam-diam gagal jika not set/channel salah.
 */
async function sendActionLog(client, guildId, { title, description = null, fields = [], color = null }) {
  const channelId = getSetting(guildId, 'logChannel');
  if (!channelId) return false;

  try {
    const channel = client.channels.cache.get(channelId) ?? await client.channels.fetch(channelId);
    if (!channel?.isTextBased()) return false;

    const embed = createEmbed({ title, description, fields, color: color ?? '#FEE75C' }).setTimestamp();
    await channel.send({ embeds: [embed] });
    return true;
  } catch (err) {
    console.error('[LOGS] Gagal mengirim action log:', err.message);
    return false;
  }
}

module.exports = { sendActionLog };
