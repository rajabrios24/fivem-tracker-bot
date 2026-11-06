const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Cek kecepatan respon bot'),

  async execute(interaction) {
    const response = await interaction.reply({ content: '📡 Mengukur...', withResponse: true });
    const roundtrip = response.resource.message.createdTimestamp - interaction.createdTimestamp;

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
