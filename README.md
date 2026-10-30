# Focus App - Minimalist Pomodoro & Task Focus App

Eine "Hybrid-First" Focus-App mit Pomodoro-Timer und Task-Management. Funktioniert sofort ohne Account (Guest Mode) und synchronisiert Daten nach dem Login über eine Postgres-Datenbank (Neon).

## 🚀 Quick Start

### 1. Lokal einrichten

```bash
cp .env.example .env            # DATABASE_URL auf ein lokales Postgres oder einen Neon-Branch setzen
npm install --legacy-peer-deps
npm run db:migrate
npm run dev
```

In Claude-Cloud-Sessions erledigt `bash scripts/cloud-setup.sh` alles davon.

Ohne `RESEND_API_KEY` werden Bestätigungs- und Reset-Links in der Server-Konsole ausgegeben.

### 2. Google OAuth (optional)

In der [Google Cloud Console](https://console.cloud.google.com) unter APIs & Services → Credentials einen
OAuth-Client anlegen. Redirect-URI: `<BETTER_AUTH_URL>/api/auth/callback/google`
(lokal `http://localhost:3000/api/auth/callback/google`). Client-ID und Secret als `GOOGLE_CLIENT_ID` und
`GOOGLE_CLIENT_SECRET` setzen.

### 3. Deployment (Vercel)

Neon über Vercel → Storage verbinden (setzt `DATABASE_URL`, Vorschauen bekommen eigene DB-Branches).
Zusätzlich setzen: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`RESEND_API_KEY`, `MAIL_FROM`. Der Build spielt Migrationen automatisch ein.

## 📁 Projektstruktur

```
focus-app/
├── app.vue                 # Root App Component
├── nuxt.config.ts          # Nuxt Konfiguration
├── components/
│   ├── AppNavbar.vue       # Navigation mit Login-Button
│   └── PomodoroTimer.vue   # Timer Komponente
├── composables/            # Vue Composables
├── layouts/
│   └── default.vue         # Default Layout
├── pages/
│   ├── index.vue           # Hauptseite
│   └── confirm.vue         # OAuth Callback
├── server/
│   ├── api/                # CRUD-Routen (tasks, tags, sessions, settings) + /api/auth
│   ├── db/                 # Drizzle-Schema und Migrationen
│   └── utils/              # DB, Better Auth, Mailversand
├── stores/                 # Pinia Stores
└── types/
    └── index.ts            # TypeScript Typen
```

## 🛠 Tech Stack

- **Frontend**: Nuxt 3, Vue 3
- **UI**: Nuxt UI (Tailwind CSS + Heroicons)
- **State**: Pinia
- **Backend**: Nitro-API, Neon Postgres (Drizzle ORM), Better Auth
- **Utilities**: VueUse

## 🎯 Features

- ⏱️ **Pomodoro Timer**: 25/5/15 Minuten Intervalle
- ✅ **Task Management**: CRUD für Aufgaben
- 🌙 **Dark Mode**: Standardmäßig aktiviert
- 👤 **Guest Mode**: Funktioniert ohne Account (localStorage)
- ☁️ **Cloud Sync**: Daten werden nach Login synchronisiert
- 🔐 **Google OAuth**: Einfache Anmeldung

## 📝 Scripts

```bash
npm run dev      # Development Server
npm run build    # Production Build
npm run preview  # Preview Production Build
npm run generate # Static Site Generation
```

## 📄 Lizenz

MIT
