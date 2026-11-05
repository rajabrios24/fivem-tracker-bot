const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed } = require('../../utils/embeds');
const leveling = require('../../systems/leveling');
const { db } = require('../../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('synclevels')
    .setDescription('[Admin] Sinkronkan kolom level dengan XP semua member')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const rows = db.prepare('SELECT user_id FROM users WHERE guild_id = ?').all(interaction.guild.id);
    let promoted = 0;
    for (const row of rows) {
      const result = leveling.recalcLevel(interaction.guild.id, row.user_id);
      if (result.leveledUp) promoted += 1;
    }

    await interaction.editReply({
      embeds: [successEmbed(`Sinkron level selesai untuk **${rows.length}** user. ${promoted} user naik level. 📊`)],
    });
  },
};
