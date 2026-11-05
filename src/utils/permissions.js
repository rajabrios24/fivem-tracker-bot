const { PermissionFlagsBits } = require('discord.js');
const { errorEmbed } = require('./embeds');

/** Ambil nama permission yang mudah dibaca */
function permName(bit) {
  const found = Object.entries(PermissionFlagsBits).find(([, value]) => value === bit);
  return found ? found[0] : String(bit);
}

/** Pastikan pemakai command punya permission tertentu. Kembalikan null jika lolos. */
function requireMemberPermission(interaction, permBit) {
  if (interaction.memberPermissions?.has(permBit)) return null;
  return errorEmbed(`Kamu tidak punya permission **${permName(permBit)}** untuk menggunakan command ini.`);
}

/**
 * Moderasi standar: executor harus bisa `ModerateMembers` (atau `KickMembers`,
 * mau pun `BanMembers`), bot juga harus punya permission & posisi role lebih tinggi.
 * Kembalikan embed error atau null jika lolos.
 */
function requireModeration(interaction, target, permBit) {
  if (!interaction.inGuild() || !interaction.member || !interaction.guild.me) return null;

  const executorCheck = requireMemberPermission(interaction, permBit);
  if (executorCheck) return executorCheck;

  const me = interaction.guild.members.me;
  if (!me.permissions.has(permBit)) {
    return errorEmbed(`Saya tidak punya permission **${permName(permBit)}**. Periksa peran saya di pengaturan server.`);
  }
  if (target.user.id === interaction.client.user.id) {
    return errorEmbed('Me? Saya tidak bisa memoderasi diri sendiri 😅');
  }
  if (interaction.member.roles.highest.position <= target.roles.highest.position) {
    return errorEmbed('Kamu tidak bisa memoderasi anggota dengan peran yang sama tinggi atau lebih tinggi darimu.');
  }
  if (target.roles.highest.position >= me.roles.highest.position) {
    return errorEmbed('Saya tidak bisa memoderasi anggota ini karena perannya lebih tinggi (atau sama) daripada saya.');
  }
  return null;
}

module.exports = { requireMemberPermission, requireModeration, permName };
