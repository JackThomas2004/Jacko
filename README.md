# Jacko

Online multiplayer card game based on Skyjo. Same rules, same card colours — new name.

## Prerequisites

- Node.js 18+
- PostgreSQL (running locally or a connection URL)
- Redis (running locally or a connection URL)

## Quick Start

### 1. Clone & install

```bash
# Install server deps
cd server
npm install

# Install client deps
cd ../client
npm install
```

### 2. Configure the server

```bash
cd server
cp .env.example .env
# Edit .env — fill in DATABASE_URL, REDIS_URL, JWT_SECRET
```

### 3. Set up the database

```bash
cd server
npm run db:generate   # generate Prisma client
npm run db:push       # push schema to your PostgreSQL DB
```

### 4. Run

In two separate terminals:

```bash
# Terminal 1 — backend
cd server
npm run dev

# Terminal 2 — frontend
cd client
npm run dev
```

Open http://localhost:5173

---

## Project Structure

```
jacko/
├── server/
│   ├── prisma/
│   │   └── schema.prisma        # DB schema (users, friends, lobbies, games)
│   └── src/
│       ├── index.js             # Entry point
│       ├── app.js               # Express app + routes
│       ├── socket.js            # Socket.io server + JWT auth
│       ├── middleware/
│       │   └── auth.js          # JWT middleware
│       ├── routes/
│       │   ├── auth.js          # POST /register, /login, /logout, GET /me
│       │   ├── users.js         # GET/PATCH users
│       │   ├── friends.js       # Friends list + requests
│       │   ├── lobbies.js       # Create / join lobbies
│       │   └── games.js         # Game history
│       ├── game/
│       │   ├── deck.js          # 150-card Jacko deck, shuffle, deal
│       │   ├── gameEngine.js    # Pure game logic (all rules)
│       │   └── socketHandlers.js # Real-time event handlers
│       └── lib/
│           ├── prisma.js        # Prisma client singleton
│           └── redis.js         # Redis client + game state helpers
│
└── client/
    └── src/
        ├── api/client.js        # Axios API wrapper (all endpoints)
        ├── context/
        │   ├── AuthContext.jsx  # Current user + login/register/logout
        │   └── SocketContext.jsx # Socket.io connection
        ├── components/
        │   ├── Card.jsx         # Single card (face-up/down, all colours)
        │   ├── PlayerGrid.jsx   # 3×4 card grid
        │   ├── Chat.jsx         # Floating chat panel
        │   ├── Scoreboard.jsx   # Live score sidebar
        │   └── Navbar.jsx       # Top nav bar
        └── pages/
            ├── Landing.jsx      # Login / register
            ├── Home.jsx         # Dashboard — create/join lobby + friends
            ├── Friends.jsx      # Friends management
            ├── Lobby.jsx        # Waiting room
            ├── Game.jsx         # Main game table
            ├── RoundSummary.jsx # End-of-round scores
            └── GameOver.jsx     # Final podium screen
```

## Game Rules (Jacko)

See [jacko-game-plan.md](../jacko-game-plan.md) for the full spec.

Key points:
- 150 cards, values −2 to 12, colour-coded as in Skyjo
- 2–8 players, each with a 3×4 grid (12 cards)
- Flip 2 cards to start; take turns drawing or taking from discard
- Complete a column of 3 identical values → column is removed
- First player to flip all cards ends the round (others get 1 more turn)
- Penalty: if the trigger player isn't lowest, their score is doubled
- Game ends when any player hits 100+ cumulative points
- Lowest total wins

## Tech Stack

| Layer      | Tech                            |
|------------|---------------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS  |
| Real-time  | Socket.io                       |
| Backend    | Node.js + Express               |
| Auth       | JWT (httpOnly cookie) + bcrypt  |
| Database   | PostgreSQL + Prisma             |
| Cache      | Redis (live game state)         |
