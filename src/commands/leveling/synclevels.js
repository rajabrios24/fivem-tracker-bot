const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const { successEmbed } = require('../../utils/embeds');
const leveling = require('../../systems/leveling');
const { db } = require('../../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('synclevels')
    .setDescription('[Admin] Sinkronkan kolom level dengan XP semua member')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const rows = db.prepare('SELECT user_id FROM users WHERE guild_id = ?').all(interaction.guild.id);
    let promoted = 0;
    // Satu transaksi: jauh lebih cepat untuk banyak user & atomik
    db.transaction(() => {
      for (const row of rows) {
        const result = leveling.recalcLevel(interaction.guild.id, row.user_id);
        if (result.leveledUp) promoted += 1;
      }
    })();

    await interaction.editReply({
      embeds: [successEmbed(`Sinkron level selesai untuk **${rows.length}** user. ${promoted} user naik level. 📊`)],
    });
  },
};
