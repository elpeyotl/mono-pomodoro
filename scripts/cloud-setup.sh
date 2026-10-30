#!/usr/bin/env bash
# Richtet eine Cloud-Session ein. Mehrfach ausführbar, legt nur an, was fehlt.
#   bash scripts/cloud-setup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# 1. Postgres starten
if ! pg_isready -q 2>/dev/null; then
  sudo service postgresql start >/dev/null
  for _ in $(seq 1 30); do pg_isready -q && break; sleep 1; done
fi

# 2. Rolle und Datenbank
if ! sudo -u postgres psql -tAc "select 1 from pg_roles where rolname='mono'" | grep -q 1; then
  sudo -u postgres psql -qc "create role mono login password 'mono' createdb"
fi
if ! sudo -u postgres psql -tAc "select 1 from pg_database where datname='mono'" | grep -q 1; then
  sudo -u postgres psql -qc "create database mono owner mono"
fi

# 3. .env (nie überschreiben)
if [ ! -f .env ]; then
  sed "s/^BETTER_AUTH_SECRET=.*/BETTER_AUTH_SECRET=$(openssl rand -hex 32)/" .env.example > .env
  echo "[setup] .env angelegt"
fi

# 4. Pakete nur bei geänderter package.json (keine Lockfile im Repo)
if [ ! -f node_modules/.cloud-setup-lock ] || ! cmp -s package.json node_modules/.cloud-setup-lock; then
  npm install --legacy-peer-deps
  cp package.json node_modules/.cloud-setup-lock
fi

# 5. Migrieren
set -a; source .env; set +a
npx tsx scripts/migrate.ts

echo "[setup] fertig – npm run dev startet die App auf http://localhost:3000"
