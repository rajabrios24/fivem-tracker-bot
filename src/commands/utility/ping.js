const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Cek kecepatan respon bot'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '📡 Mengukur...', fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;

    await interaction.editReply({
      content: null,
      embeds: [
        createEmbed({
          title: '🏓 Pong!',
          description:
            `**Roundtrip:** ${roundtrip}ms\n**WebSocket:** ${interaction.client.ws.ping}ms`,
        }),
      ],
    });
  },
};
