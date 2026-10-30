# Mono – Pomodoro & Task Focus App

Nuxt 3 (SSR, Vercel) · Nuxt UI 2 · Pinia · Postgres auf **Neon** (Drizzle ORM) · Login mit **Better Auth**.
Bis Oktober 2026 lief alles auf Supabase; der Ordner `supabase/` ist nur noch Referenz für den Umzug.

## Erster Schritt jeder Session

```bash
bash scripts/cloud-setup.sh   # Postgres, DB, .env, Pakete, Migrationen
npm run dev
```

Stoppt Postgres, das Skript nochmals laufen lassen.

## Aufbau

- `server/db/schema.ts` – Drizzle-Schema: Auth-Tabellen (`user`, `session`, `account`, `verification`) und App-Tabellen
  (`tasks`, `tags`, `focus_sessions`, `user_settings`). IDs sind UUIDs (gleich wie früher in Supabase).
- `server/db/migrations/` – von drizzle-kit erzeugt. Schema ändern → `npm run db:generate` → Datei committen.
  `npm run build` spielt Migrationen zuerst ein (`scripts/migrate.ts`), auch in Vercel-Vorschauen.
- `server/utils/auth.ts` – Better Auth (E-Mail/Passwort mit Bestätigung, Google, Reset). Akzeptiert alte
  bcrypt-Hashes aus Supabase.
- `server/api/*` – CRUD-Routen. **Jede Route ruft `requireUser(event)` und filtert auf `user_id`**; das ersetzt die
  frühere Row-Level-Security. `user_id` wird nie vom Client übernommen.
- `server/utils/mappers.ts` – API spricht snake_case wie früher Supabase, damit `types/` und Stores gleich bleiben.
- `stores/*` – Gast-Modus in localStorage, eingeloggt über `$fetch('/api/…')`. `useAuthUser()` ersetzt
  `useSupabaseUser()`; befüllt in `plugins/auth.client.ts`.
- Geräte-Sync: kein Realtime mehr; Tasks/Tags werden beim Zurückkehren in den Tab neu geladen.

## Regeln

- Mails nur über `server/utils/mail.ts`: In Vorschauen (`VERCEL_ENV=preview`) wird nie gesendet, ohne
  `RESEND_API_KEY` landen Links in der Server-Konsole.
- Service Worker darf `/api/*` nie bedienen (`navigateFallbackDenylist`), sonst bricht der Google-Callback.
- Neue API-Route: Felder per Whitelist übernehmen, IDs mit `isUuid`/`requireUuidParam` prüfen.
- `npm install --legacy-peer-deps` (Peer-Konflikt Better-Auth-Adapter; `.npmrc` ist gitignored).

## Testen und Ausliefern

- Ein Branch pro Session (`claude/<thema>`), PR und Merge über die REST-API (`gh api …/pulls`).
- Vor dem Merge: `npm run typecheck` und `npm run build`. Kein Test-Setup vorhanden.
- Login-Flows lokal mit curl testbar: Verifizierungs- und Reset-Links stehen im Server-Log.

## Umzug Supabase → Neon

`scripts/migrate-from-supabase.ts` (erst `--dry-run`). Übernimmt User inkl. Passwort-Hash und Google-Konto,
dann alle App-Daten. Mehrfach ausführbar. Danach Supabase-Projekt pausieren, nicht sofort löschen.
