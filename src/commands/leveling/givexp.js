const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const leveling = require('../../systems/leveling');
const models = require('../../database/models');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('givexp')
    .setDescription('[Admin] Beri/kurangi XP sebuah user')
    .addUserOption((opt) => opt.setName('user').setDescription('User target').setRequired(true))
    .addIntegerOption((opt) =>
      opt
        .setName('jumlah')
        .setDescription('Jumlah XP (pakai nilai negatif untuk mengurangi)')
        .setMinValue(-100000)
        .setMaxValue(100000)
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('jumlah', true);

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [errorEmbed('User tidak ada di server ini.')], ephemeral: true });
    if (member.user.bot) return interaction.reply({ embeds: [errorEmbed('Bot tidak mengikuti sistem leveling.')], ephemeral: true });

    const user2 = models.getUser(interaction.guild.id, member.id);
    user2.xp = Math.max(0, user2.xp + amount);
    models.saveUser(interaction.guild.id, member.id, user2);

    const result = leveling.recalcLevel(interaction.guild.id, member.id);

    await interaction.reply({
      embeds: [
        successEmbed(
          `Berhasil ${amount >= 0 ? 'memberi' : 'mengurangi'} **${Math.abs(amount)} XP** untuk ${member}. Sekarang: **Level ${result.level}** • **${result.xp.toLocaleString('id-ID')} XP**${result.leveledUp ? ` • bonus naik level **${result.bonus} 🪙** 🎉` : ''}`,
        ),
      ],
      ephemeral: true,
    });
  },
};
