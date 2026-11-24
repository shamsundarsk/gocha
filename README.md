# Gocha — Personal Execution & Memory System

> **PLAN → CONNECT → ADAPT → ACT → CAPTURE → REMEMBER**

A connected personal execution system that combines what you plan, what is happening around you, what you actually do, and what you want to remember.

---

## Architecture

```
mobile/          React Native / Expo (Expo Router)
backend/         FastAPI + Python
docker-compose   PostgreSQL + Redis + API
```

---

## Quick Start

### Backend

```bash
# 1. Start infrastructure
docker-compose up postgres redis -d

# 2. Create virtualenv
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Configure
cp .env.example .env
# Edit .env with your keys

# 4. Run migrations
alembic upgrade head

# 5. Start API
uvicorn app.main:app --reload --port 8000
```

API docs at: http://localhost:8000/docs

### Mobile

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android).

---

## Core Engines

| Engine | Purpose |
|--------|---------|
| **Input/Task Engine** | Natural language → structured tasks |
| **Context Engine** | Assembles unified context from all adapters |
| **Rule Engine** | Deterministic rules driving all scheduling decisions |
| **Adaptive Scheduler** | Rebuilds the day's schedule on any context change |
| **Event Discovery** | Nearby event aggregation, normalization, deduplication |
| **Evidence Engine** | Records what actually happened |
| **Wrapped Generator** | Builds Day/Week/Month/Year Wrapped from actual data |
| **Insights Engine** | Derives behavioral patterns with minimum data thresholds |

---

## Development Phases

| Phase | Status |
|-------|--------|
| Phase 1 — Core Execution | ✅ Built |
| Phase 2 — Connectivity | ✅ Adapter pattern ready |
| Phase 3 — Event Discovery | ✅ Aggregator + Eventbrite + Demo |
| Phase 4 — Execution + Memory | ✅ Evidence + Wrapped |
| Phase 5 — Advanced | 🔄 Scaffolded |

---

## Demo Mode

Enable demo mode in Profile → Demo Mode to simulate all integrations with realistic data.

Demo simulates: calendar, fitness, weather, screen time, location, nearby events, and task history — without requiring any real device integrations.

---

## Key Design Decisions

- **No AI dependency** — the core product runs on deterministic rules
- **Privacy first** — location stored at ~1km precision, 24h expiry
- **Adapter pattern** — context engine is decoupled from every API
- **No gamification** — clarity, execution, and visible progress
- **Offline resilient** — each adapter fails silently; core continues

---

## Environment Variables

See `backend/.env.example` for all required configuration.

Required for full functionality:
- `OPENWEATHER_API_KEY` — weather context
- `GOOGLE_MAPS_API_KEY` — geocoding
- `ELEVENLABS_API_KEY` — voice assistant
- `EVENTBRITE_API_KEY` — event discovery

Optional:
- `TICKETMASTER_API_KEY` — additional event source

---

## API Reference

Base URL: `http://localhost:8000/api/v1`

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | Create account |
| `POST /auth/login` | Sign in |
| `GET/POST /tasks` | Task management |
| `POST /tasks/parse` | Natural language → tasks |
| `GET /schedule/{date}` | Day schedule |
| `POST /schedule/{date}/recalculate` | Force recalculate |
| `GET /context/current` | Unified context |
| `GET /events/nearby` | Nearby event discovery |
| `GET /wrapped/day/{date}` | Day Wrapped |
| `GET /insights` | Behavioral insights |
| `GET/PATCH /user/preferences` | User settings |
