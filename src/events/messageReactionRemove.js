const { Events } = require('discord.js');
const { handle } = require('./messageReactionAdd');

module.exports = {
  name: Events.MessageReactionRemove,
  execute: (reaction, user) => handle(reaction, user, false),
};
