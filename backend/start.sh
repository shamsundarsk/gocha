#!/bin/zsh
# ─── Gocha Backend — start.sh ──────────────────────────────────────
# Run this in a terminal: cd /Users/user/gocha/backend && ./start.sh
# ────────────────────────────────────────────────────────────────────
/opt/homebrew/Cellar/python@3.14/3.14.7/bin/python3.14 \
  -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
