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
  if (!interaction.inGuild() || !interaction.member) {
    return errorEmbed('Command ini hanya bisa dipakai di dalam server.');
  }

  const executorCheck = requireMemberPermission(interaction, permBit);
  if (executorCheck) return executorCheck;

  const me = interaction.guild.members.me;
  if (!me) return errorEmbed('Data bot di server ini belum tersedia. Coba lagi sebentar lagi.');
  if (!me.permissions.has(permBit)) {
    return errorEmbed(`Saya tidak punya permission **${permName(permBit)}**. Periksa peran saya di pengaturan server.`);
  }
  if (target.user.id === interaction.client.user.id) {
    return errorEmbed('Me? Saya tidak bisa memoderasi diri sendiri 😅');
  }
  if (target.id === interaction.user.id) {
    return errorEmbed('Kamu tidak bisa memoderasi dirimu sendiri.');
  }
  if (target.id === interaction.guild.ownerId) {
    return errorEmbed('Owner server tidak bisa dimoderasi.');
  }
  // Owner server boleh memoderasi siapa pun di bawah bot
  const isOwner = interaction.user.id === interaction.guild.ownerId;
  if (!isOwner && interaction.member.roles.highest.position <= target.roles.highest.position) {
    return errorEmbed('Kamu tidak bisa memoderasi anggota dengan peran yang sama tinggi atau lebih tinggi darimu.');
  }
  if (target.roles.highest.position >= me.roles.highest.position) {
    return errorEmbed('Saya tidak bisa memoderasi anggota ini karena perannya lebih tinggi (atau sama) daripada saya.');
  }
  return null;
}

module.exports = { requireMemberPermission, requireModeration, permName };
