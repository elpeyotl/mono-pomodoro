# 🚀 Mono - Vercel Deployment Guide

Diese Anleitung beschreibt, wie du Mono auf Vercel deployen kannst. Vercel ist die empfohlene Plattform für Nuxt 3 Apps mit erstklassiger Integration.

## Voraussetzungen

- [Vercel Account](https://vercel.com/) (kostenlos mit GitHub)
- Git Repository (GitHub, GitLab, oder Bitbucket)
- Supabase Projekt (siehe [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))

---

## Schritt 1: Repository vorbereiten

### 1.1 Git Repository erstellen

```bash
cd focus-app
git init
git add .
git commit -m "Initial commit: Mono Pomodoro App"
```

### 1.2 Auf GitHub pushen

```bash
# Erstelle ein neues Repository auf GitHub, dann:
git remote add origin https://github.com/DEIN-USERNAME/mono-pomodoro.git
git branch -M main
git push -u origin main
```

---

## Schritt 2: Vercel Projekt erstellen

### 2.1 Mit Vercel verbinden

1. Gehe zu [vercel.com](https://vercel.com/) und logge dich ein (oder erstelle einen Account mit GitHub)
2. Klicke auf **"Add New..."** → **"Project"**
3. Wähle **"Import Git Repository"**
4. Wähle dein GitHub Repository `mono-pomodoro`
5. Klicke auf **"Import"**

### 2.2 Build-Einstellungen

Vercel erkennt Nuxt 3 automatisch! Die Einstellungen werden aus `vercel.json` gelesen:

| Einstellung | Wert |
|-------------|------|
| **Framework Preset** | Nuxt.js (automatisch erkannt) |
| **Build Command** | `npm run build` |
| **Output Directory** | `.output` |
| **Install Command** | `npm install` |

---

## Schritt 3: Environment Variables setzen

### 3.1 In Vercel Dashboard

1. Gehe zu deinem Projekt in Vercel
2. Klicke auf **"Settings"** → **"Environment Variables"**
3. Füge folgende Variablen hinzu:

| Variable | Wert | Environment |
|----------|------|-------------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `SUPABASE_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Production, Preview, Development |
| `NUXT_PUBLIC_SITE_URL` | `https://deine-app.vercel.app` | Production |

### 3.2 Supabase Credentials finden

1. Gehe zu [Supabase Dashboard](https://supabase.com/dashboard)
2. Wähle dein Projekt
3. Gehe zu **Settings** → **API**
4. Kopiere:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** Key → `SUPABASE_KEY`

---

## Schritt 4: Supabase OAuth für Production konfigurieren

### 4.1 Redirect URLs aktualisieren

1. Gehe zu Supabase Dashboard → **Authentication** → **URL Configuration**
2. Füge deine Vercel URL zu **Redirect URLs** hinzu:

```
https://deine-app.vercel.app/confirm
```

**Wichtig:** Füge auch Preview-URLs hinzu, wenn du Branch Previews nutzen möchtest:
```
https://*.vercel.app/confirm
```

### 4.2 Site URL setzen

Setze die **Site URL** auf deine Vercel Domain:

```
https://deine-app.vercel.app
```

### 4.3 Google OAuth Provider aktualisieren

Falls du Google OAuth verwendest:

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Wähle dein Projekt → **APIs & Services** → **Credentials**
3. Bearbeite deine OAuth 2.0 Client ID
4. Füge zu **Authorized redirect URIs** hinzu:

```
https://xxx.supabase.co/auth/v1/callback
```

(Ersetze `xxx` mit deiner Supabase Project ID)

---

## Schritt 5: Deployment starten

### 5.1 Automatisches Deployment

Nach dem Verbinden mit GitHub wird Vercel automatisch deployen:
- Bei jedem Push auf `main` → Production Deployment
- Bei Pull Requests → Preview Deployment

### 5.2 Manuelles Deployment

```bash
# Vercel CLI installieren
npm install -g vercel

# Login
vercel login

# Deploy (Preview)
vercel

# Deploy (Production)
vercel --prod
```

---

## Schritt 6: Deployment verifizieren

### 6.1 Checkliste

- [ ] App lädt korrekt unter `https://deine-app.vercel.app`
- [ ] Wellen-Hintergrund animiert
- [ ] Timer funktioniert (Start/Pause/Reset)
- [ ] Tasks können erstellt werden (Guest Mode)
- [ ] Google Login funktioniert
- [ ] Nach Login werden Tasks synchronisiert

### 6.2 Häufige Probleme

#### Build schlägt fehl

```bash
# Lokal testen
npm run build

# Vercel Logs prüfen
vercel logs
```

#### OAuth Redirect funktioniert nicht

- Prüfe, ob die Redirect URL in Supabase korrekt ist
- Prüfe, ob die Site URL in Supabase gesetzt ist
- Prüfe die Google Cloud Console Redirect URIs

#### 500 Error auf der Seite

- Prüfe die Vercel Function Logs im Dashboard
- Stelle sicher, dass alle Environment Variables gesetzt sind

---

## Vercel Features

### Preview Deployments

Vercel erstellt automatisch Preview-Deployments für jeden Pull Request:
- Eigene URL wie `https://mono-pomodoro-abc123.vercel.app`
- Kommentare direkt im PR mit Preview-Link
- Perfekt für Code Reviews

### Analytics (Optional)

Aktiviere Vercel Analytics für Einblicke:
1. Gehe zu **Settings** → **Analytics**
2. Klicke auf **Enable**

### Custom Domain

1. Gehe zu **Settings** → **Domains**
2. Füge deine Domain hinzu (z.B. `mono.example.com`)
3. Folge den DNS-Anweisungen

**Vergiss nicht:** Aktualisiere die Supabase Redirect URLs für die neue Domain!

---

## Zusammenfassung der URLs

| Service | URL |
|---------|-----|
| **Production** | `https://deine-app.vercel.app` |
| **Vercel Dashboard** | `https://vercel.com/dashboard` |
| **Supabase Dashboard** | `https://supabase.com/dashboard/project/xxx` |
| **Google Cloud Console** | `https://console.cloud.google.com/` |

---

## Vercel vs. andere Plattformen

| Feature | Vercel | Netlify |
|---------|--------|---------|
| Nuxt 3 Support | ⭐ Erstklassig | Gut |
| SSR | ✅ Native | ✅ Mit Functions |
| Edge Functions | ✅ | ✅ |
| Preview Deployments | ✅ | ✅ |
| Analytics | ✅ Built-in | ❌ Addon |
| Preis (Hobby) | Kostenlos | Kostenlos |

---

## Support

Bei Problemen:
1. Prüfe die [Vercel Docs](https://vercel.com/docs)
2. Prüfe die [Nuxt 3 Deployment Docs](https://nuxt.com/docs/getting-started/deployment#vercel)
3. Prüfe die [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
