const { getSetting } = require('../database/db');

/** Variabel yang bisa dipakai di template pesan welcome/goodbye */
function renderTemplate(template, member, isLeaving = false) {
  return (template || '')
    .replaceAll('{user}', isLeaving ? member.user?.tag ?? member.displayName : member.displayName)
    .replaceAll('{mention}', `<@${member.id}>`)
    .replaceAll('{username}', member.user?.username ?? member.user?.tag ?? member.displayName)
    .replaceAll('{server}', member.guild?.name ?? '')
    .replaceAll('{memberCount}', String(member.guild?.memberCount ?? 0));
}

function getWelcomeConfig(guildId) {
  return {
    channelId: getSetting(guildId, 'welcomeChannel'),
    message: getSetting(guildId, 'welcomeMessage') ||
      'Selamat datang {mention} di server **{server}**! Kamu adalah anggota ke-{memberCount}. 🎉',
  };
}

function getGoodbyeConfig(guildId) {
  return {
    channelId: getSetting(guildId, 'goodbyeChannel'),
    message: getSetting(guildId, 'goodbyeMessage') ||
      '{username} telah meninggalkan **{server}**. Semua yang dating pasti pergi. 😔',
  };
}

module.exports = { renderTemplate, getWelcomeConfig, getGoodbyeConfig };
