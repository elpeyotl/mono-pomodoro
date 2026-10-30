// Einmaliger Umzug Supabase -> Neon.
//
//   SUPABASE_DB_URL=postgres://...supabase...  DATABASE_URL=postgres://...neon...  \
//     npx tsx scripts/migrate-from-supabase.ts [--dry-run]
//
// - User behalten ihre UUID, dadurch passen tasks/tags/... ohne Umschlüsseln.
// - Passwort-Hashes (bcrypt) werden übernommen; server/utils/auth.ts prüft sie weiter.
// - Google-Logins werden über die Google-ID (sub) als account übernommen.
// - Mehrfach ausführbar: bereits vorhandene Zeilen werden übersprungen (ON CONFLICT DO NOTHING).
// - Liest in Supabase nur, schreibt nur in Neon.
import pg from 'pg'

const dryRun = process.argv.includes('--dry-run')
const srcUrl = process.env.SUPABASE_DB_URL
const dstUrl = process.env.DATABASE_URL
if (!srcUrl || !dstUrl) {
  console.error('SUPABASE_DB_URL und DATABASE_URL müssen gesetzt sein')
  process.exit(1)
}

const ssl = (url: string) => (/localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false })
const src = new pg.Client({ connectionString: srcUrl, ssl: ssl(srcUrl) })
const dst = new pg.Client({ connectionString: dstUrl, ssl: ssl(dstUrl) })

async function main() {
  await src.connect()
  await dst.connect()

  const users = (await src.query(`
    select id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
           coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name') as name,
           coalesce(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture') as image
    from auth.users
    where email is not null and deleted_at is null
  `)).rows

  const identities = (await src.query(`
    select user_id, provider, coalesce(identity_data->>'sub', provider_id) as sub
    from auth.identities
    where provider <> 'email'
  `)).rows

  const tasks = (await src.query('select * from public.tasks where user_id is not null')).rows
  const tags = (await src.query('select * from public.tags')).rows
  const sessions = (await src.query('select * from public.focus_sessions')).rows
  const settings = (await src.query('select * from public.user_settings')).rows

  console.log(`Supabase: ${users.length} User, ${identities.length} OAuth-Identitäten, ` +
    `${tasks.length} Tasks, ${tags.length} Tags, ${sessions.length} Sessions, ${settings.length} Settings`)

  const unknownProviders = [...new Set(identities.map(i => i.provider))].filter(p => p !== 'google')
  if (unknownProviders.length) console.warn(`Achtung: nicht übernommene Provider: ${unknownProviders.join(', ')}`)

  if (dryRun) {
    console.log('Dry run – nichts geschrieben')
    return
  }

  const userIds = new Set(users.map(u => u.id))
  const count = { user: 0, credential: 0, google: 0, tasks: 0, tags: 0, sessions: 0, settings: 0 }

  await dst.query('begin')
  try {
    for (const u of users) {
      const r = await dst.query(
        `insert into "user" (id, name, email, email_verified, image, created_at, updated_at)
         values ($1, $2, lower($3), $4, $5, $6, $7) on conflict do nothing`,
        [u.id, u.name || u.email.split('@')[0], u.email, u.email_confirmed_at != null, u.image,
          u.created_at, u.updated_at ?? u.created_at]
      )
      count.user += r.rowCount ?? 0

      if (u.encrypted_password) {
        const exists = await dst.query(
          `select 1 from account where user_id = $1 and provider_id = 'credential'`, [u.id])
        if (exists.rowCount === 0) {
          await dst.query(
            `insert into account (user_id, account_id, provider_id, password, created_at, updated_at)
             values ($1, $2, 'credential', $3, $4, $4)`,
            [u.id, String(u.id), u.encrypted_password, u.created_at]
          )
          count.credential++
        }
      }
    }

    for (const i of identities) {
      if (i.provider !== 'google' || !userIds.has(i.user_id) || !i.sub) continue
      const exists = await dst.query(
        `select 1 from account where provider_id = 'google' and account_id = $1`, [i.sub])
      if (exists.rowCount === 0) {
        await dst.query(
          `insert into account (user_id, account_id, provider_id) values ($1, $2, 'google')`,
          [i.user_id, i.sub]
        )
        count.google++
      }
    }

    for (const t of tags) {
      if (!userIds.has(t.user_id)) continue
      const r = await dst.query(
        `insert into tags (id, user_id, name, color, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6) on conflict do nothing`,
        [t.id, t.user_id, t.name, t.color ?? 'blue', t.created_at, t.updated_at ?? t.created_at]
      )
      count.tags += r.rowCount ?? 0
    }

    for (const t of tasks) {
      if (!userIds.has(t.user_id)) continue
      const r = await dst.query(
        `insert into tasks (id, user_id, title, description, due_date, subtasks, tags, is_completed,
                            pomodoro_count, total_focus_time, is_active, sort_order, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) on conflict do nothing`,
        [t.id, t.user_id, t.title, t.description ?? null, t.due_date ?? null,
          JSON.stringify(t.subtasks ?? []), t.tags ?? [], t.is_completed ?? false,
          t.pomodoro_count ?? 0, t.total_focus_time ?? 0, t.is_active ?? false, t.sort_order ?? 0,
          t.created_at, t.updated_at ?? t.created_at]
      )
      count.tasks += r.rowCount ?? 0
    }

    for (const s of sessions) {
      if (!userIds.has(s.user_id)) continue
      const r = await dst.query(
        `insert into focus_sessions (id, user_id, task_id, duration_seconds, started_at, ended_at,
                                     completed_pomodoro, created_at)
         values ($1, $2, (select id from tasks where id = $3), $4, $5, $6, $7, $8) on conflict do nothing`,
        [s.id, s.user_id, s.task_id, s.duration_seconds, s.started_at, s.ended_at,
          s.completed_pomodoro ?? false, s.created_at]
      )
      count.sessions += r.rowCount ?? 0
    }

    for (const s of settings) {
      if (!userIds.has(s.user_id)) continue
      const r = await dst.query(
        `insert into user_settings (user_id, focus_duration, short_break_duration, long_break_duration,
                                    long_break_interval, auto_start, sound_enabled, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9) on conflict (user_id) do nothing`,
        [s.user_id, s.focus_duration, s.short_break_duration, s.long_break_duration,
          s.long_break_interval, s.auto_start, s.sound_enabled, s.created_at, s.updated_at ?? s.created_at]
      )
      count.settings += r.rowCount ?? 0
    }

    await dst.query('commit')
  } catch (e) {
    await dst.query('rollback')
    throw e
  }

  console.log('Neu in Neon:', count)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await src.end().catch(() => {})
    await dst.end().catch(() => {})
  })
