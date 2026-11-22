#!/usr/bin/env bash
# Attacking MADD: runs 11 real attacks against the LOCAL server and prints each request and the server's reply.
# Test accounts only: demo@madd.test (from the handoff) and a fresh attacker account made by this script.
# Never point this at a server you don't own. Usage: cd server && bash scripts/attack-demo.sh
set -u
API="${API:-http://localhost:3000}"
DB="docker exec ewallet-db-1 psql -U madd -d madd -tA"
DEMO_EMAIL="demo@madd.test"; DEMO_PASSWORD="demo12345"; DEMO_PIN="482913"
DEMO_DEVICE="33333333-3333-4333-8333-333333333333"   # the demo account's trusted phone
RECIPIENT="0123454521"                                # demo2@madd.test
STAMP=$(date +%s); ATTACKER_EMAIL="attacker$STAMP@madd.test"
ATTACKER_PHONE="011$(printf '%08d' $((STAMP % 100000000)))"; ATTACKER_PASSWORD="Attack123"; ATTACKER_PIN="739154"
ATTACKER_DEVICE="44444444-4444-4444-8444-$(printf '%012d' $((STAMP % 1000000000000)))"

# Prints a coloured heading for one attack.
title() { printf '\n\033[1;31m▶ ATTACK %s\033[0m  %s\n' "$1" "$2"; }

# Sends one request and prints "→ METHOD PATH" then "← STATUS body". Args: method path token [json-body].
call() {
  local method=$1 path=$2 token=$3 body=${4:-} out; out=$(mktemp)
  local args=(-s -o "$out" -w '%{http_code}' -X "$method" "$API$path" -H 'Content-Type: application/json')
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$body" ] && args+=(-d "$body")
  local status; status=$(curl "${args[@]}")
  printf '  → %s %s %s\n  ← \033[1m%s\033[0m %s\n' "$method" "$path" "${body:+$body}" "$status" "$(jq -c . "$out" 2>/dev/null || head -c 80 "$out")"
  rm -f "$out"
}

# Logs in and prints only the token. Args: email password device.
token_for() {
  curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$2\",\"deviceId\":\"$3\",\"deviceName\":\"Attack script\"}" | jq -r '.token // empty'
}

# 1. Change "role" to "admin" inside a real token. The signature no longer matches.
attack_forged_token() {
  title 1 "Forged token: role changed to admin"
  local payload forged
  payload=$(cut -d. -f2 <<<"$DEMO_TOKEN" | tr '_-' '/+' | base64 -d 2>/dev/null | jq -c '.role="admin"')
  forged="$(cut -d. -f1 <<<"$DEMO_TOKEN").$(printf '%s' "$payload" | base64 -w0 | tr '/+' '_-' | tr -d '=').$(cut -d. -f3 <<<"$DEMO_TOKEN")"
  call GET /admin/stats "$forged"
}

# 2. Keep a token, log out, then use it again (replay).
attack_replay() {
  title 2 "Stolen token used after logout"
  local stolen; stolen=$(token_for "$DEMO_EMAIL" "$DEMO_PASSWORD" "$DEMO_DEVICE")
  call POST /auth/logout "$stolen"
  call GET /wallet "$stolen"
}

# 3. A customer token calling admin routes, including disguised spellings.
attack_admin_routes() {
  title 3 "Customer calls admin routes"
  call GET /admin/stats "$DEMO_TOKEN"
  call GET /ADMIN/stats "$DEMO_TOKEN"
  call GET /%61dmin/stats "$DEMO_TOKEN"
}

# 4. Negative and decimal amounts, to try to pull money in or break rounding.
attack_bad_amounts() {
  title 4 "Negative and decimal amounts"
  call POST /transfers "$DEMO_TOKEN" "{\"recipientPhone\":\"$RECIPIENT\",\"amountSen\":-50000,\"pin\":\"$DEMO_PIN\"}"
  call POST /transfers "$DEMO_TOKEN" "{\"recipientPhone\":\"$RECIPIENT\",\"amountSen\":12550.5,\"pin\":\"$DEMO_PIN\"}"
}

# 5. Read a transfer between two other users (IDOR), compared with an id that doesn't exist.
attack_idor() {
  title 5 "Reading someone else's transfer"
  local other; other=$($DB -c "SELECT t.id FROM transactions t JOIN users s ON s.id=t.sender_id JOIN users r ON r.id=t.receiver_id WHERE s.email<>'$DEMO_EMAIL' AND r.email<>'$DEMO_EMAIL' LIMIT 1")
  [ -z "$other" ] && { echo "  (no transfer between two other users yet)"; return; }
  call GET "/transactions/$other" "$DEMO_TOKEN"
  call GET /transactions/99999999 "$DEMO_TOKEN"
}

# 6. Scan phone numbers to list users (enumeration). The 11th search in a minute is refused.
attack_enumeration() {
  title 6 "Scanning phone numbers for users"
  for i in $(seq 1 11); do
    local status; status=$(curl -s -o /dev/null -w '%{http_code}' "$API/users/lookup?phone=01234500$(printf '%02d' "$i")" -H "Authorization: Bearer $DEMO_TOKEN")
    printf '  → GET /users/lookup?phone=01234500%02d  ← %s\n' "$i" "$status"
  done
  call GET /users/lookup?phone=0123450012 "$DEMO_TOKEN"
}

# 7. Two transfers at the same moment that together spend more than the balance (race condition).
attack_double_spend() {
  title 7 "Double spend: two transfers at once"
  call POST /auth/register "" "{\"fullName\":\"Attack Test\",\"email\":\"$ATTACKER_EMAIL\",\"phone\":\"$ATTACKER_PHONE\",\"password\":\"$ATTACKER_PASSWORD\",\"pin\":\"$ATTACKER_PIN\"}"
  ATTACKER_TOKEN=$(token_for "$ATTACKER_EMAIL" "$ATTACKER_PASSWORD" "$ATTACKER_DEVICE")
  local body="{\"recipientPhone\":\"$RECIPIENT\",\"amountSen\":45000,\"pin\":\"$ATTACKER_PIN\"}"
  call POST /transfers "$ATTACKER_TOKEN" "$body"
  echo "  Balance now: $(curl -s "$API/wallet" -H "Authorization: Bearer $ATTACKER_TOKEN" | jq -c .)"
  echo "  Sending RM 450 twice at the same moment:"
  call POST /transfers "$ATTACKER_TOKEN" "$body" & call POST /transfers "$ATTACKER_TOKEN" "$body" & wait
  echo "  Balance after: $(curl -s "$API/wallet" -H "Authorization: Bearer $ATTACKER_TOKEN" | jq -c .)"
}

# 8. Guess the PIN on a transfer until it locks.
attack_pin_guessing() {
  title 8 "Guessing the transfer PIN"
  for guess in 111222 333444 555666 777888 999000 123987; do
    call POST /transfers "$ATTACKER_TOKEN" "{\"recipientPhone\":\"$RECIPIENT\",\"amountSen\":1000,\"pin\":\"$guess\"}"
  done
}

# 9. Guess the password (R4), then the same for an email that doesn't exist.
attack_brute_force() {
  title 9 "Guessing the password (R4)"
  for guess in pass1111 pass2222 pass3333 pass4444 pass5555 pass6666; do
    call POST /auth/login "" "{\"email\":\"$ATTACKER_EMAIL\",\"password\":\"$guess\",\"deviceId\":\"$ATTACKER_DEVICE\",\"deviceName\":\"Attack script\"}"
  done
  echo "  Same guess for an email that doesn't exist:"
  call POST /auth/login "" "{\"email\":\"nobody$STAMP@madd.test\",\"password\":\"pass1111\",\"deviceId\":\"$ATTACKER_DEVICE\",\"deviceName\":\"Attack script\"}"
}

# 10. Stolen password used on a new phone (R3): the login works, the transfer is held.
attack_new_device() {
  title 10 "Stolen password on a new phone (R3)"
  local thief; thief=$(token_for "$DEMO_EMAIL" "$DEMO_PASSWORD" "55555555-5555-4555-8555-$(printf '%012d' "$STAMP")")
  call POST /transfers "$thief" "{\"recipientPhone\":\"$RECIPIENT\",\"amountSen\":2000,\"pin\":\"$DEMO_PIN\"}"
}

# 11. Edit the security log straight in the database. Run in a transaction that is rolled back anyway.
attack_edit_log() {
  title 11 "Editing the security log in SQL"
  printf '  → UPDATE security_events SET reason = %s\n  ← ' "'nothing happened'"
  $DB -c "BEGIN; UPDATE security_events SET reason = 'nothing happened' WHERE id = (SELECT min(id) FROM security_events); ROLLBACK;" 2>&1 | grep -m1 ERROR
  printf '  → DELETE FROM security_events\n  ← '
  $DB -c "BEGIN; DELETE FROM security_events; ROLLBACK;" 2>&1 | grep -m1 ERROR
}

DEMO_TOKEN=$(token_for "$DEMO_EMAIL" "$DEMO_PASSWORD" "$DEMO_DEVICE")
[ -z "$DEMO_TOKEN" ] && { echo "Could not log in as $DEMO_EMAIL. Is the server running?"; exit 1; }
attack_forged_token; attack_replay; attack_admin_routes; attack_bad_amounts; attack_enumeration
attack_double_spend; attack_idor; attack_pin_guessing; attack_brute_force; attack_new_device; attack_edit_log
