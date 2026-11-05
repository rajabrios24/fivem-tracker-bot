const { EmbedBuilder } = require('discord.js');
const { embedColor } = require('../config');

/**
 * Buat embed dasar dengan warna default bot.
 * Contoh: createEmbed({ title: 'Ping', description: '_latency_ms' })
 */
function createEmbed({ title = null, description = null, fields = [], color = null, footer = null, thumbnail = null, image = null, timestamp = false }) {
  const embed = new EmbedBuilder().setColor(color || embedColor);
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (fields?.length) {
    embed.setFields(fields.map((f) => ({ name: f.name, value: f.value ?? '-', inline: !!f.inline })));
  }
  if (footer) embed.setFooter({ text: footer });
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);
  if (timestamp) embed.setTimestamp();
  return embed;
}

/** Embed merah untuk pesan error/gagal */
function errorEmbed(description) {
  return createEmbed({ description: `❌ ${description}`, color: '#ED4245' });
}

/** Embed hijau untuk pesan sukses */
function successEmbed(description) {
  return createEmbed({ description: `✅ ${description}`, color: '#57F287' });
}

/** Embed abu-abu untuk info/lainnya */
function infoEmbed(description) {
  return createEmbed({ description, color: '#99AAB5' });
}

/** Balas interaction dengan pesan error (aman dipanggil dari catch) */
async function errorReply(interaction, description) {
  const payload = { embeds: [errorEmbed(description)], ephemeral: true };
  const content = { ...payload };
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(content);
    }
  } catch (err) {
    console.error('Gagal mengirim pesan error:', err);
  }
}

module.exports = { createEmbed, errorEmbed, successEmbed, infoEmbed, errorReply };
