const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const models = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('Hapus semua warning sebuah user')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User yang warningnya dihapus').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const result = models.clearWarnings(interaction.guild.id, user.id);

    if (result.changes === 0) {
      return interaction.reply({
        embeds: [errorEmbed(`${user.tag} tidak punya warning untuk dihapus.`)],
        ephemeral: true,
      });
    }

    await interaction.reply({
      embeds: [successEmbed(`Berhasil menghapus **${result.changes}** warning milik **${user.tag}**. ✔️`)],
      ephemeral: true,
    });
  },
};
