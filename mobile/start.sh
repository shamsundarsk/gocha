#!/bin/zsh
# ─── Gocha Mobile — start.sh ───────────────────────────────────────
# Run from your terminal: cd /Users/user/gocha/mobile && ./start.sh
# ────────────────────────────────────────────────────────────────────

# Raise file descriptor limit (fixes EMFILE)
ulimit -n 65536

# Kill anything already on port 8081
kill $(lsof -ti tcp:8081) 2>/dev/null
sleep 1

# Clear Metro cache
rm -rf "$HOME/Library/Caches/com.facebook.metro" 2>/dev/null
rm -rf .expo 2>/dev/null

# Start Expo using node directly (bypasses pyenv shims)
EXPO_NO_WATCHMAN=1 \
  NODE_OPTIONS="--max-old-space-size=4096" \
  node node_modules/.bin/expo start --port 8081 --clear
