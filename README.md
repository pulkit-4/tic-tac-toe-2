# Tic-Tac-Toe — Production-Ready Multiplayer Game

A **production-ready, server-authoritative** multiplayer Tic-Tac-Toe game built with:

- **Backend**: [Nakama](https://heroiclabs.com/nakama/) game server (TypeScript runtime)
- **Frontend**: React + TypeScript (Vite) — mobile-first responsive UI
- **Infrastructure**: Docker Compose (Nakama + PostgreSQL)

## Features

- ✅ Server-authoritative game logic (all moves validated server-side)
- ✅ Real-time multiplayer via WebSocket
- ✅ Automatic matchmaking (find or create open games)
- ✅ Private rooms (create + share match ID)
- ✅ Join by match ID / room code
- ✅ Graceful disconnect handling with reconnect support and forfeit on timeout
- ✅ Persistent player stats (wins, losses, draws, streaks)
- ✅ Global leaderboard
- ✅ **Timed mode**: 30 seconds per turn with auto-forfeit
- ✅ Device-based authentication (no sign-up required)
- ✅ Mobile-optimized responsive UI

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (React)                    │
│                                                     │
│  Auth  ──►  Lobby  ──►  Game Screen                │
│  (device)   (matchmake/   (board UI, real-time)     │
│             create/join)                            │
└────────────────┬────────────────────────────────────┘
                 │  WebSocket (Nakama socket protocol)
                 ▼
┌─────────────────────────────────────────────────────┐
│                Nakama Game Server                   │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │  TypeScript Runtime Module          │           │
│  │                                     │           │
│  │  • tic_tac_toe match handler        │           │
│  │    - matchInit / matchJoin          │           │
│  │    - matchLoop (move validation,    │           │
│  │      win/draw detection, timers)    │           │
│  │    - matchLeave (disconnect grace)  │           │
│  │                                     │           │
│  │  • RPCs                             │           │
│  │    - create_match                   │           │
│  │    - find_match (matchmaking)       │           │
│  │    - get_stats                      │           │
│  │    - get_leaderboard                │           │
│  └─────────────────────────────────────┘           │
│                      │                              │
│              PostgreSQL Storage                     │
│         (player_stats, leaderboard)                 │
└─────────────────────────────────────────────────────┘
```

### Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Runtime language | TypeScript | Rapid development, type safety |
| Match type | Authoritative | Server holds canonical state; clients cannot cheat |
| Message protocol | JSON over WebSocket opcodes | Simple, debuggable |
| Auth | Device auth | Zero-friction for testing; swap for email/social in production |
| State sync | Full state broadcast on every event | Simplicity and correctness |
| Timer | Server-side deadline (epoch ms) | Client clock drift doesn't affect game outcome |

### Message Opcodes

**Client → Server:**

| Opcode | Name | Payload |
|---|---|---|
| 1 | MOVE | `{ "position": 0-8 }` |
| 2 | FORFEIT | `{}` |

**Server → Client:**

| Opcode | Name | Payload |
|---|---|---|
| 101 | STATE_UPDATE | Full `GameState` object |
| 102 | GAME_OVER | `{ winner, winReason, players }` |
| 103 | ERROR | `{ code, message }` |
| 104 | WAITING | *(unused, state update conveys waiting)* |
| 105 | TIMER_UPDATE | `{ remaining, currentTurn }` |

---

## Quick Start (Local Development)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js 18+](https://nodejs.org/)

### 1. Build the Backend Module

```bash
cd backend
npm install
npm run build
# Produces: backend/build/index.js
```

### 2. Start Nakama + PostgreSQL

```bash
# From repo root
docker compose up -d
```

Nakama takes ~15 seconds to start. Check readiness:

```bash
curl http://localhost:7350/healthcheck
# → {}
```

- **Nakama API**: http://localhost:7350
- **Nakama Console**: http://localhost:7349 (admin / admin)

### 3. Start the Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# → http://localhost:3000
```

### 4. Test Multiplayer (Two Browser Sessions)

1. Open **http://localhost:3000** in **Browser A** — enter a display name and click "Play Now"
2. Open **http://localhost:3000** in **Browser B** (or an incognito window) — enter a different name
3. In **Browser A**: click "Find Match"
4. In **Browser B**: click "Find Match"
5. Both clients are matched together — take turns clicking the board!

**Alternative (Private Room):**

1. Browser A: "Create Room" → copy the Match ID
2. Browser B: "Join by Code" → paste the Match ID

---

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_NAKAMA_HOST` | `localhost` | Nakama server hostname |
| `VITE_NAKAMA_PORT` | `7350` | Nakama HTTP port |
| `VITE_NAKAMA_USE_SSL` | `false` | Use HTTPS/WSS |
| `VITE_NAKAMA_SERVER_KEY` | `defaultkey` | Nakama server key |

### Nakama Server Key

The server key is configured in the Nakama config. For production, change it:

```yaml
# docker-compose.yml environment
- NAKAMA_RUNTIME_HTTP_KEY=your-secret-key
```

---

## Deployment

### Option A: Docker Compose (VPS / Cloud VM)

1. **Provision a VM** (e.g., Ubuntu 22.04 on DigitalOcean / AWS EC2 / GCP)

2. **Install Docker + Compose:**
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

3. **Clone and configure:**
   ```bash
   git clone https://github.com/pulkit-4/tic-tac-toe-2.git
   cd tic-tac-toe-2
   ```

4. **Edit `docker-compose.yml`** — change database password and server key for production.

5. **Build backend:**
   ```bash
   cd backend && npm install && npm run build && cd ..
   ```

6. **Start services:**
   ```bash
   docker compose up -d
   ```

7. **Configure your domain** (recommended: Nginx reverse proxy):
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:7350;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
       }
   }
   ```

8. **Add SSL** with Let's Encrypt: `certbot --nginx`

### Option B: Deploy Frontend to Vercel / Netlify

```bash
cd frontend
cp .env.example .env
# Set VITE_NAKAMA_HOST=api.yourdomain.com, VITE_NAKAMA_USE_SSL=true

# Vercel
npx vercel --prod

# or Netlify
npm run build
# Upload dist/ to Netlify
```

### Option C: Managed Nakama (Heroic Cloud)

Heroic Labs offers [managed Nakama hosting](https://heroiclabs.com/nakama-cloud/). Upload the built `backend/build/index.js` module via the console.

---

## Development Notes

### Rebuilding the Backend

After changing any TypeScript in `backend/src/`:

```bash
cd backend && npm run build
docker compose restart nakama
```

### Viewing Nakama Logs

```bash
docker compose logs -f nakama
```

### Resetting Game State

```bash
docker compose down -v   # removes all data
docker compose up -d
```

### Running Two Clients Locally

Open two separate browser tabs or use one normal + one incognito window — each gets its own `device_id` stored in `localStorage`.

---

## Project Structure

```
.
├── backend/                    # Nakama TypeScript runtime
│   ├── src/
│   │   ├── main.ts             # Module entry point (registers handlers)
│   │   ├── match_handler.ts    # Authoritative match logic
│   │   ├── rpcs.ts             # RPC functions (matchmaking, stats)
│   │   └── types.ts            # Shared types & constants
│   ├── build/                  # Compiled JS (generated, not committed)
│   ├── package.json
│   ├── tsconfig.json
│   ├── rollup.config.mjs
│   └── build.sh
│
├── frontend/                   # React + TypeScript app
│   ├── src/
│   │   ├── main.tsx            # Entry point
│   │   ├── App.tsx             # Router + Auth provider
│   │   ├── index.css           # Global styles
│   │   ├── nakama.ts           # Nakama client singleton
│   │   ├── types.ts            # Shared TypeScript types
│   │   ├── hooks/
│   │   │   ├── useAuth.tsx     # Auth context + hooks
│   │   │   └── useMatch.ts     # Match state + WebSocket hook
│   │   ├── screens/
│   │   │   ├── AuthScreen.tsx
│   │   │   ├── LobbyScreen.tsx
│   │   │   ├── GameScreen.tsx
│   │   │   └── LeaderboardScreen.tsx
│   │   └── components/
│   │       ├── Board.tsx       # 3x3 game board
│   │       ├── Timer.tsx       # Countdown timer (SVG)
│   │       └── PlayerCard.tsx  # Player info card
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docker-compose.yml
├── nakama-config.yml           # Nakama config reference
└── README.md
```

---

## API / Server Configuration

### Nakama Endpoints

| Endpoint | Description |
|---|---|
| `POST /v2/account/authenticate/device` | Device authentication |
| `GET /v2/rpc/create_match` | Create a new match |
| `GET /v2/rpc/find_match` | Find open match or create one |
| `GET /v2/rpc/get_stats` | Get authenticated player's stats |
| `GET /v2/rpc/get_leaderboard` | Get global wins leaderboard |
| `WS /ws` | WebSocket connection for real-time match play |

### Storage Collections

| Collection | Key | Permissions |
|---|---|---|
| `player_stats` | `stats` | Read: public, Write: server only |

### Leaderboards

| ID | Sort | Operator | Reset |
|---|---|---|---|
| `global_wins` | Descending | Set (highest) | Never |
