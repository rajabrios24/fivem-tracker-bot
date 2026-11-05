const { Events } = require('discord.js');
const { errorReply } = require('../utils/embeds');

module.exports = {
  name: Events.InteractionCreate,
  execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.warn(`[WARN] Command /${interaction.commandName} tidak ditemukan.`);
      return;
    }

    try {
      Promise.resolve(command.execute(interaction, client)).catch(async (err) => {
        console.error(`[ERROR] /${interaction.commandName}:`, err);
        await errorReply(interaction, 'Terjadi kesalahan saat menjalankan command ini.');
      });
    } catch (err) {
      console.error(`[ERROR] /${interaction.commandName} (sync):`, err);
    }
  },
};
