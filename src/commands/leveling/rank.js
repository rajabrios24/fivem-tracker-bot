const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embeds');
const leveling = require('../../systems/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Lihat kartu rank & XP kamu (atau user lain)')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User yang rank-nya ingin dilihat'),
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.options.getUser('user') ?? interaction.user;
    const data = leveling.getRankData(interaction.guild.id, user.id);

    await interaction.editReply({
      embeds: [
        createEmbed({
          title: `🏅 Rank — ${user.displayName}`,
          description:
            `**Level:** ${data.level}\n` +
            `**XP Total:** ${data.xp.toLocaleString('id-ID')}\n\n` +
            `Progress ke Level ${data.level + 1}:\n\`${data.bar}\`\n\`(${data.currentLevelXp}/${data.nextLevelXp} XP — sisa ${data.nextLevelIn} XP)\`\n\n` +
            `💰 Saldo: **${data.balance.toLocaleString('id-ID')} 🪙**`,
          thumbnail: user.displayAvatarURL({ size: 256 }),
        }),
      ],
    });
  },
};
