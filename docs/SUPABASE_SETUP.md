# Supabase Setup Guide für Mono

Diese Anleitung führt dich durch die vollständige Einrichtung von Supabase für die Mono Pomodoro App.

## 1. Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com) und erstelle einen Account
2. Klicke auf **"New Project"**
3. Wähle eine Organisation (oder erstelle eine neue)
4. Fülle aus:
   - **Name**: `mono-pomodoro` (oder beliebig)
   - **Database Password**: Generiere ein sicheres Passwort (speichere es!)
   - **Region**: Wähle die nächste Region (z.B. `eu-central-1` für Europa)
5. Klicke **"Create new project"** und warte ~2 Minuten

## 2. API Credentials kopieren

1. Gehe zu **Settings** → **API**
2. Kopiere:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** Key → `SUPABASE_KEY`

3. Füge sie in deine `.env` Datei ein:

```env
SUPABASE_URL=https://dein-projekt.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Datenbank-Schema erstellen

1. Gehe zu **SQL Editor** im Supabase Dashboard
2. Klicke **"New Query"**
3. Kopiere den Inhalt von `supabase/schema.sql` und füge ihn ein
4. Klicke **"Run"**

Du solltest eine Erfolgsmeldung sehen und die `tasks` Tabelle unter **Table Editor** finden.

## 4. Google OAuth einrichten

### 4.1 Google Cloud Console

1. Gehe zu [console.cloud.google.com](https://console.cloud.google.com)
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Gehe zu **APIs & Services** → **OAuth consent screen**
   - Wähle **External**
   - Fülle App-Name, User Support Email, Developer Email aus
   - Klicke **Save and Continue** durch alle Schritte
4. Gehe zu **APIs & Services** → **Credentials**
5. Klicke **"+ CREATE CREDENTIALS"** → **OAuth client ID**
6. Wähle **Web application**
7. Füge hinzu:
   - **Name**: `Mono Pomodoro`
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000`
     - `https://dein-projekt.supabase.co`
   - **Authorized redirect URIs**:
     - `https://dein-projekt.supabase.co/auth/v1/callback`
8. Klicke **Create** und kopiere:
   - **Client ID**
   - **Client Secret**

### 4.2 Supabase Auth konfigurieren

1. Gehe zu **Authentication** → **Providers** im Supabase Dashboard
2. Finde **Google** und aktiviere es
3. Füge ein:
   - **Client ID** (von Google)
   - **Client Secret** (von Google)
4. Klicke **Save**

### 4.3 Redirect URL konfigurieren

1. Gehe zu **Authentication** → **URL Configuration**
2. Setze:
   - **Site URL**: `http://localhost:3000` (für Development)
   - **Redirect URLs**: 
     - `http://localhost:3000/confirm`
     - `http://localhost:3000/**`

## 5. App testen

1. Starte die App: `npm run dev`
2. Klicke auf **"Login with Google"**
3. Melde dich mit deinem Google-Account an
4. Du solltest zurück zur App geleitet werden

## 6. Produktions-Deployment

Für Produktion (z.B. Vercel, Netlify):

1. Setze Environment Variables:
   ```
   SUPABASE_URL=https://dein-projekt.supabase.co
   SUPABASE_KEY=dein-anon-key
   ```

2. Aktualisiere in Supabase:
   - **Site URL**: `https://deine-domain.com`
   - **Redirect URLs**: `https://deine-domain.com/confirm`

3. Aktualisiere in Google Cloud Console:
   - **Authorized JavaScript origins**: `https://deine-domain.com`
   - **Authorized redirect URIs**: `https://dein-projekt.supabase.co/auth/v1/callback`

## Troubleshooting

### "Invalid login credentials"
- Überprüfe, ob Google Provider in Supabase aktiviert ist
- Überprüfe Client ID und Secret

### "Redirect URI mismatch"
- Stelle sicher, dass die Redirect URI in Google Console exakt übereinstimmt
- Format: `https://DEIN-PROJEKT.supabase.co/auth/v1/callback`

### Tasks werden nicht synchronisiert
- Überprüfe, ob das SQL-Schema ausgeführt wurde
- Überprüfe die RLS Policies in Supabase

### CORS Fehler
- Füge deine Domain zu den erlaubten Origins in Supabase hinzu
- **Settings** → **API** → **CORS allowed origins**
