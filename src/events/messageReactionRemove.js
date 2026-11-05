const { Events } = require('discord.js');
const { handle } = require('./messageReactionAdd');

module.exports = {
  name: Events.MessageReactionRemove,
  execute: (reaction, user, client) => handle(reaction, user, false, client),
};
