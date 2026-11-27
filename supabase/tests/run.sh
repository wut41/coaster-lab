#!/usr/bin/env bash
# Tests the Coaster Lab database migrations on a throw-away local PostgreSQL (nothing is sent to Supabase).
#   bash supabase/tests/run.sh           # 10.0 migration + 10.1 hardening, then every test
#   bash supabase/tests/run.sh payments  # the same, then the PROPOSED purchases design in docs/payments (design only:
#                                        # it is not a migration and is never applied to the real project)
# Needs PostgreSQL 14 or newer installed locally (initdb, postgres, psql). The real project runs PostgreSQL 17.
# Order: Supabase stand-in → the live project as of 2026-11-27 (01 + 02) → its tests (05) → the repository migrations → their tests (10)
# → the release attacks (20).
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; MIG="$HERE/../migrations"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
[ -x "$PGBIN/initdb" ] || { echo "FAIL PostgreSQL was not found (set PGBIN to its bin folder)"; exit 1; }
PORT="${PGPORT:-54329}"; DIR="$(mktemp -d /tmp/cl-pgtest.XXXXXX)"
# PostgreSQL refuses to run as root: use the postgres user when we are root
if [ "$(id -u)" = "0" ]; then AS=(runuser -u postgres --); chown postgres "$DIR"; else AS=(); fi
cleanup() { "${AS[@]}" "$PGBIN/pg_ctl" -D "$DIR/data" -m immediate stop >/dev/null 2>&1; rm -rf "$DIR"; }
trap cleanup EXIT
"${AS[@]}" "$PGBIN/initdb" -D "$DIR/data" -U postgres -A trust --locale=C.UTF-8 -E UTF8 >/dev/null || { echo "FAIL initdb"; exit 1; }
"${AS[@]}" "$PGBIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -c listen_addresses='' -c unix_socket_directories='$DIR' -c fsync=off" -l "$DIR/log" -w start >/dev/null || { echo "FAIL could not start PostgreSQL"; cat "$DIR/log"; exit 1; }
PSQL=("${AS[@]}" "$PGBIN/psql" -h "$DIR" -p "$PORT" -U postgres -d postgres -X -q -v ON_ERROR_STOP=1)
step() { local out; if ! out=$("${PSQL[@]}" -f - < "$2" 2>&1); then echo "FAIL $1 did not apply"; echo "$out" | head -20; exit 1; fi; echo "$out" | grep -E '^(psql:.*)?NOTICE:  (PASS|FAIL)' | sed -E 's/^.*NOTICE:  //'; echo "$out" | grep -E 'ERROR|WARNING' | head -20; }
step "Supabase stand-in" "$HERE/00_supabase_shim.sql"
step "live baseline" "$HERE/01_live_baseline.sql"
step "live migrations to 2026-11-27" "$HERE/02_live_2026-11-27.sql"
# production as it is today, before the repository migrations
echo "--- production (2026-11-27)"; PRES="$("${PSQL[@]}" -f - < "$HERE/05_production_tests.sql" 2>&1)"; PRC=$?
echo "$PRES" | grep -E 'NOTICE:  (PASS|FAIL|INFO)' | sed -E 's/^.*NOTICE:  //'
[ $PRC -ne 0 ] && { echo "FAIL the production test script stopped early:"; echo "$PRES" | grep -v 'NOTICE:  PASS' | tail -15; }
PP=$(echo "$PRES" | grep -c 'NOTICE:  PASS'); PF=$(echo "$PRES" | grep -c 'NOTICE:  FAIL'); [ $PRC -ne 0 ] && PF=$((PF+1))
echo "--- repository migrations (applied to production on 2026-11-27)"
for f in $(ls "$MIG"/*.sql | sort); do step "$(basename "$f")" "$f"; echo "applied $(basename "$f")"; done
# the migrations must be safe to run twice
for f in $(ls "$MIG"/*.sql | sort); do step "$(basename "$f") (second run)" "$f"; done; echo "PASS every migration can be run a second time"
RES="$("${PSQL[@]}" -f - < "$HERE/10_tests.sql" 2>&1)"; RC=$?
echo "$RES" | grep -E 'NOTICE:  (PASS|FAIL)' | sed -E 's/^.*NOTICE:  //'
if [ $RC -ne 0 ]; then echo "FAIL the test script stopped early:"; echo "$RES" | grep -v 'NOTICE:  PASS' | tail -15; fi
P=$(echo "$RES" | grep -c 'NOTICE:  PASS'); F=$(echo "$RES" | grep -c 'NOTICE:  FAIL'); [ $RC -ne 0 ] && F=$((F+1))
# release attacks on the same database (impersonation, header and IPv6 rate-limit bypass, direct table writes, ...)
echo "--- release attacks (20_attacks.sql)"; ARES="$("${PSQL[@]}" -f - < "$HERE/20_attacks.sql" 2>&1)"; ARC=$?
echo "$ARES" | grep -E 'NOTICE:  (PASS|FAIL)' | sed -E 's/^.*NOTICE:  //'
if [ $ARC -ne 0 ]; then echo "FAIL the attack script stopped early:"; echo "$ARES" | grep -v 'NOTICE:  PASS' | tail -15; fi
P=$((P + $(echo "$ARES" | grep -c 'NOTICE:  PASS'))); F=$((F + $(echo "$ARES" | grep -c 'NOTICE:  FAIL'))); [ $ARC -ne 0 ] && F=$((F+1))
P=$((P+1+PP)); F=$((F+PF))
if [ "${1:-}" = "payments" ]; then
  PAY="$HERE/../../docs/payments"; echo; echo "--- proposed purchases design (docs/payments, not a migration)"
  step "proposed_schema.sql" "$PAY/proposed_schema.sql"; step "proposed_schema.sql (second run)" "$PAY/proposed_schema.sql"; echo "PASS the proposed schema can be run a second time"; P=$((P+1))
  RES="$("${PSQL[@]}" -f - < "$PAY/proposed_schema_tests.sql" 2>&1)"; RC=$?
  echo "$RES" | grep -E 'NOTICE:  (PASS|FAIL)' | sed -E 's/^.*NOTICE:  //'
  if [ $RC -ne 0 ]; then echo "FAIL the payments test script stopped early:"; echo "$RES" | grep -v 'NOTICE:  PASS' | tail -15; F=$((F+1)); fi
  P=$((P + $(echo "$RES" | grep -c 'NOTICE:  PASS'))); F=$((F + $(echo "$RES" | grep -c 'NOTICE:  FAIL')))
fi
echo; echo "$P passed, $F failed"; [ "$F" = "0" ]
