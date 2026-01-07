# Focus App - Minimalist Pomodoro & Task Focus App

Eine "Hybrid-First" Focus-App mit Pomodoro-Timer und Task-Management. Funktioniert sofort ohne Account (Guest Mode) und synchronisiert Daten nach dem Login mit Supabase.

## 🚀 Quick Start

### 1. Dependencies installieren

```bash
cd focus-app
npm install
```

### 2. Supabase einrichten

#### 2.1 Supabase Projekt erstellen
1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein Konto
2. Klicke auf **New Project**
3. Wähle einen Namen (z.B. `focus-app`)
4. Wähle eine Region (z.B. `eu-central-1` für Europa)
5. Setze ein sicheres Datenbank-Passwort
6. Klicke auf **Create new project**

#### 2.2 API Credentials kopieren
1. Gehe zu **Settings** → **API**
2. Kopiere die **Project URL** und den **anon public** Key

#### 2.3 Environment Variables setzen
```bash
cp .env.example .env
```

Bearbeite `.env` und füge deine Supabase Credentials ein:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
```

#### 2.4 Datenbank-Schema erstellen
1. Gehe im Supabase Dashboard zu **SQL Editor**
2. Klicke auf **New Query**
3. Kopiere den Inhalt von `supabase/schema.sql`
4. Klicke auf **Run**

#### 2.5 Google OAuth aktivieren (optional)
1. Gehe zu **Authentication** → **Providers** → **Google**
2. Aktiviere Google
3. Erstelle OAuth Credentials in der [Google Cloud Console](https://console.cloud.google.com):
   - APIs & Services → Credentials → Create OAuth 2.0 Client ID
   - Authorized Redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Kopiere Client ID und Secret in Supabase

### 3. Development Server starten

```bash
npm run dev
```

Die App ist unter [http://localhost:3000](http://localhost:3000) erreichbar.

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
├── stores/                 # Pinia Stores
├── supabase/
│   └── schema.sql          # Datenbank-Schema
└── types/
    └── index.ts            # TypeScript Typen
```

## 🛠 Tech Stack

- **Frontend**: Nuxt 3, Vue 3
- **UI**: Nuxt UI (Tailwind CSS + Heroicons)
- **State**: Pinia
- **Backend**: Supabase (Auth, PostgreSQL, Realtime)
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
