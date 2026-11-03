#!/usr/bin/env bash
# Runs the app in the iOS Simulator against unive-v2 on this laptop.
# Starts unive-v2's `bun dev` (docker + Next.js) first, unless it's already
# running, and stops it again when this script exits.
set -euo pipefail

API_URL=http://localhost:3000
WEB_DIR="$(cd "$(dirname "$0")/../.." && pwd)/unive-v22"

if lsof -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "unive-v2 is already running on port 3000; using it."
else
  echo "Starting unive-v2 (bun dev) in $WEB_DIR …"
  (cd "$WEB_DIR" && bun dev) &
  web_pid=$!

  # Background jobs ignore Ctrl+C, so stop bun dev and everything it started.
  kill_tree() {
    for child in $(pgrep -P "$1"); do kill_tree "$child"; done
    kill "$1" 2>/dev/null || true
  }
  trap 'kill_tree "$web_pid"' EXIT

  # Next.js compiles on the first request, so wait until it answers.
  until curl -s -o /dev/null --max-time 60 "$API_URL/api/auth/ok"; do
    kill -0 "$web_pid" 2>/dev/null || { echo "unive-v2 failed to start." >&2; exit 1; }
    sleep 1
  done
  echo "unive-v2 is up. Sign-in codes appear below as [OTP]."
fi

EXPO_PUBLIC_API_URL=$API_URL npx expo start --ios --clear
