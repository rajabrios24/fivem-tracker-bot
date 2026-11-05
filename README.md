# 🤖 Bot Discord — Leveling, Ekonomi, Moderasi, Welcome & Reaction Role

Bot Discord powerful berbasis **Node.js + discord.js v14 + SQLite**.

## ⚙️ Setup

1. **Install dependensi**
   ```bash
   npm install
   ```

2. **Konfigurasi `.env`**
   ```env
   TOKEN=token_bot_kamu
   CLIENT_ID=application_id_kamu
   # GUILD_ID=1234567890  ← opsional, daftar command instan ke 1 server
   ```
   - Token & Client ID dari [Discord Developer Portal](https://discord.com/developers/applications)

3. **Aktifkan Privileged Intents** (Developer Portal → Bot)
   - ✅ **Server Members Intent** (wajib untuk welcome/goodbye & leveling)
   - ✅ **Message Content Intent** (wajib untuk anti-spam & XP)

4. **Invite bot ke server** — URL (ganti `CLIENT_ID`):
   ```
   https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
   ```
   `permissions=8` beri derajat administrator — atau kurangi sesuai kebutuhan:
   `604650374262574912` (ModerateMembers, KickMembers, BanMembers, ManageMessages, ManageRoles, ManageGuild).

5. **Daftarkan slash command**
   ```bash
   npm run deploy
   ```

6. **Jalankan bot**
   ```bash
   npm start        # produksi
   npm run dev      # development (auto-restart saat file berubah)
   ```

## 📚 Daftar Command

| Kategori | Command |
|----------|---------|
| Utility | `/ping` `/help` `/botinfo` `/serverinfo` |
| Moderasi | `/ban` `/kick` `/timeout` `/untimeout` `/warn` `/warnings` `/clearwarns` `/purge` `/logs set ・ off` |
| Leveling | `/rank` `/leaderboard` `/givexp` (admin) `/synclevels` (admin) |
| Ekonomi | `/balance` `/daily` `/work` `/shop` `/buy` `/transfer` `/addmoney` (admin) |
| Welcome | `/welcome set ・ setgoodbye ・ show ・ off` |
| Reaction Role | `/reactionrole add ・ remove ・ list` |
| Auto-Mod | `/automod toggle ・ addword ・ removeword ・ status` |

### Cara Kerja Singkat

- **XP & Leveling** — tiap pesan memberi XP 15–25 (cooldown 60 detik agar tidak farming). Naik level = bonus **250 🪙**. Formula level: tiap level butuh `100×level + 50×level×(level+1)/2` XP kumulatif.
- **Ekonomi** — saldo awal 1000 🪙. `/daily` = 1000 🪙 tiap 22 jam. `/work` = 150–400 🪙 tiap 30 menit.
- **Anti-Spam** (otomatis) — >6 pesan dalam 5 detik → **timeout 10 menit**. Kata terlarang (set via `/automod addword`) → pesan terhapus + **warning**. Moderator (ManageMessages) dikecualikan.
- **Welcome/Goodbye** — set channel, pesan mendukung variabel `{user}` `{mention}` `{username}` `{server}` `{memberCount}`.
- **Reaction Role** — `/reactionrole add <message_id> <emoji> <role>`, sistem memberi/mengambil role ketika member reaksi/un-reaksi emoji.
- **Log Moderasi** — aktifkan dengan `/logs set #channel`; semua aksi moderasi & auto-mod tercatat di situ.

## 📁 Struktur

```
deploy-commands.js       # mendaftarkan slash command ke Discord
src/
├── index.js             # entri bot (client, intents, loader command/event)
├── config.js
├── commands/            # semua slash command (per kategori)
├── events/              # ready, message, interaction, member, reaction
├── systems/             # leveling, ekonomi, antiSpam, welcome, reactionRole
├── database/            # SQLite + helper models
└── utils/               # embed, permission, log moderasi
```

## ⚠️ Keamanan

- File `.env` berisi **token bot rahasia** — jangan pernah commit/share. Sudah di-gitignore.
- Kalau token pernah bocor, **regenerate** di Developer Portal → Bot → Reset Token.

## 🚀 Hosting

Karena bot ini memakai database SQLite (file `data.sqlite`), cara hosting yang paling cocok adalah:

| Opsi | Cocok untuk | Catatan |
|------|-------------|---------|
| **VPS (Ubuntu/Debian)** | Produksi, uptime penuh | Install Node.js & `npm install` → `npm start`, jalankan dengan `systemd`/`pm2` |
| **Docker** | Produksi | Mudah dipindahkan, perlu volume untuk `data.sqlite` |
| **Railway / Render** | Cepat & gratis (terbatas) | SQLite kadang tidak persisten saat rebuild — pertimbangkan pindah ke PostgreSQL nanti |

Tanya saya kapan saja kalau mau dibantu persiapan deploy ke salah satu opsi di atas!

