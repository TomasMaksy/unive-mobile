#!/usr/bin/env bash
# Runs the app against unive-v2 on this laptop.
#
#   npm run dev          iOS Simulator, and phones on the same Wi-Fi
#   npm run dev:remote   phones on any network, through ngrok (scripts/ngrok.yml)
#
# Either way, scan the QR code with Expo Go. Starts unive-v2's `bun dev`
# (docker + Next.js) first, unless it's already running, and stops it again
# when this script exits.
set -euo pipefail

WEB_DIR="$(cd "$(dirname "$0")/../.." && pwd)/unive-v22"
NGROK_CONFIG="$(dirname "$0")/ngrok.yml"
pids=()

# Background jobs ignore Ctrl+C, so stop them and everything they started.
kill_tree() {
  for child in $(pgrep -P "$1"); do kill_tree "$child"; done
  kill "$1" 2>/dev/null || true
}
cleanup() {
  for pid in ${pids[@]+"${pids[@]}"}; do kill_tree "$pid"; done
}
trap cleanup EXIT

if [[ "${REMOTE:-}" == 1 ]]; then
  # One public address for both: Metro, with /api/… passed on to unive-v2.
  PUBLIC_URL="https://$(sed -n 's|^ *url: https://\(.*\.ngrok-free\.dev\)$|\1|p' "$NGROK_CONFIG")"
  API_URL=$PUBLIC_URL
  # Expo puts this address in the QR code and in the links Expo Go loads.
  export EXPO_PACKAGER_PROXY_URL=$PUBLIC_URL
else
  # On a phone, `localhost` is the phone itself, so the app gets this Mac's
  # Wi-Fi address instead. It's the same address Metro serves the app from.
  # Set EXPO_PUBLIC_API_URL=http://localhost:3000 to use the Simulator only.
  LAN_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || true)
  API_URL=${EXPO_PUBLIC_API_URL:-http://${LAN_IP:-localhost}:3000}
fi

if lsof -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "unive-v2 is already running on port 3000; using it."
else
  echo "Starting unive-v2 (bun dev) in $WEB_DIR …"
  (cd "$WEB_DIR" && bun dev) &
  pids+=($!)

  # Next.js compiles on the first request, so wait until it answers.
  until curl -s -o /dev/null --max-time 60 http://localhost:3000/api/auth/ok; do
    kill -0 "${pids[0]}" 2>/dev/null || { echo "unive-v2 failed to start." >&2; exit 1; }
    sleep 1
  done
  echo "unive-v2 is up. Sign-in codes appear below as [OTP]."
fi

if [[ "${REMOTE:-}" == 1 ]]; then
  # ngrok's own config file holds your sign-in; ours adds the address.
  NGROK_AUTH_CONFIG=$(ngrok config check | sed -n 's/.*file at //p')
  ngrok start --all --config "$NGROK_AUTH_CONFIG" --config "$NGROK_CONFIG" --log stdout --log-level warn &
  pids+=($!)
  echo "Anyone with the QR code below can open the app, from any network, while this runs."
  echo "Your dev server is public at $PUBLIC_URL until you stop it (Ctrl+C)."
fi

echo "The app will use unive-v2 at $API_URL."
EXPO_PUBLIC_API_URL=$API_URL npx expo start --ios --clear
