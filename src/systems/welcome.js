const { AttachmentBuilder } = require('discord.js');
const { getSetting } = require('../database/db');
const welcomeCard = require('./welcomeCard');

const DEFAULT_WELCOME = 'Halo {mention}, selamat datang di **{server}**! 🎉';
const DEFAULT_GOODBYE = '**{username}** telah meninggalkan **{server}**. 👋';

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
    message: getSetting(guildId, 'welcomeMessage') || DEFAULT_WELCOME,
  };
}

function getGoodbyeConfig(guildId) {
  return {
    channelId: getSetting(guildId, 'goodbyeChannel'),
    message: getSetting(guildId, 'goodbyeMessage') || DEFAULT_GOODBYE,
  };
}

/**
 * Susun pesan: teks biasa + kartu gambar terlampir (tanpa embed).
 * Kalau kartu gagal digambar, tetap kirim teksnya saja.
 * allowedMentions hanya mengizinkan mention member itu sendiri — template
 * berisi @everyone/@here tidak akan ikut nge-ping semua orang.
 */
async function buildMessage(member, { template, isLeaving, cardFactory, fileName }) {
  const content = renderTemplate(template, member, isLeaving);
  const payload = { content, allowedMentions: { users: isLeaving ? [] : [member.id] } };
  try {
    const png = await cardFactory(member);
    payload.files = [new AttachmentBuilder(png, { name: fileName })];
  } catch (err) {
    console.error(`[WELCOME] Gagal render kartu ${fileName}:`, err);
  }
  return payload;
}

function buildWelcomeMessage(member) {
  return buildMessage(member, {
    template: getWelcomeConfig(member.guild.id).message,
    isLeaving: false,
    cardFactory: welcomeCard.createWelcomeCard,
    fileName: 'welcome.png',
  });
}

function buildGoodbyeMessage(member) {
  return buildMessage(member, {
    template: getGoodbyeConfig(member.guild.id).message,
    isLeaving: true,
    cardFactory: welcomeCard.createGoodbyeCard,
    fileName: 'goodbye.png',
  });
}

module.exports = {
  renderTemplate,
  getWelcomeConfig,
  getGoodbyeConfig,
  buildWelcomeMessage,
  buildGoodbyeMessage,
};
