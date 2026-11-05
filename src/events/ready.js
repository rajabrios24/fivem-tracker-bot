const { Events, ActivityType } = require('discord.js');
const config = require('../config');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Bot aktif sebagai ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: '/help | siap membantu 🚀', type: ActivityType.Watching }],
      status: 'online',
    });
  },
};
