#!/usr/bin/env sh
set -e

GEO_DIR="${GEO_DIR:-/data/geoip}"
EDITIONS="${MAXMIND_EDITION_IDS:-GeoLite2-City}"

if [ -n "$MAXMIND_ACCOUNT_ID" ] && [ -n "$MAXMIND_LICENSE_KEY" ]; then
  mkdir -p "$GEO_DIR"
  cat > /etc/GeoIP.conf <<EOF
AccountID $MAXMIND_ACCOUNT_ID
LicenseKey $MAXMIND_LICENSE_KEY
EditionIDs $EDITIONS
DatabaseDirectory $GEO_DIR
EOF
  echo "[entrypoint] Updating MaxMind DB(s): $EDITIONS"
  geoipupdate -v || echo "[entrypoint] WARN: geoipupdate failed; continuing without fresh DB"
else
  echo "[entrypoint] MAXMIND_ACCOUNT_ID/LICENSE_KEY not set; skipping geoipupdate"
fi

exec "$@"
