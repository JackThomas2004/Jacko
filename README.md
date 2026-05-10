# ParkSpot

Peer-to-peer parking rental platform. Homeowners list their garages, driveways, and parking spaces; drivers find and book them by the hour or day.

## Features

- **For Hosts**: List a space (garage, driveway, carport, parking lot), set hourly and/or daily pricing, manage bookings (confirm / decline / complete), edit or deactivate listings.
- **For Renters**: Browse spaces by city, type, and price, book instantly, view booking history, leave reviews after completed stays.
- **Auth**: JWT-based (httpOnly cookie), register/login/logout, user profiles.
- **Database**: SQLite via Prisma — zero external services needed for local dev.

## Prerequisites

- Node.js 18+

## Quick Start

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure the server

```bash
cd server
cp .env.example .env
# The default DATABASE_URL="file:./dev.db" works out of the box.
# Change JWT_SECRET for production.
```

### 3. Set up the database

```bash
cd server
npm run db:push       # creates dev.db and all tables
npm run db:seed       # optional: seeds 2 demo users + 5 spaces
```

### 4. Run

Two separate terminals:

```bash
# Terminal 1 — backend (http://localhost:4000)
cd server && npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd client && npm run dev
```

Open http://localhost:5173

Demo accounts (if seeded):
- `alice@example.com` / `password123`
- `bob@example.com` / `password123`

---

## Project Structure

```
parkspot/
├── server/
│   ├── prisma/schema.prisma      # Users, Spaces, Bookings, Reviews
│   └── src/
│       ├── index.js              # Entry point
│       ├── app.js                # Express app + routes
│       ├── seed.js               # Demo data seeder
│       ├── middleware/auth.js    # JWT middleware
│       ├── routes/
│       │   ├── auth.js           # register, login, logout, me
│       │   ├── spaces.js         # CRUD + search for spaces
│       │   ├── bookings.js       # Create/manage bookings
│       │   └── reviews.js        # Post-stay reviews
│       └── lib/prisma.js         # Prisma client singleton
│
└── client/
    └── src/
        ├── api/client.js         # Axios wrapper for all API calls
        ├── context/AuthContext.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── SpaceCard.jsx
        │   └── AuthModal.jsx
        └── pages/
            ├── Landing.jsx       # Hero + auth modal
            ├── Browse.jsx        # Search with filters
            ├── SpaceDetail.jsx   # Space info + booking form
            ├── Dashboard.jsx     # User home
            ├── ListSpace.jsx     # Create a new listing
            ├── EditSpace.jsx     # Edit / delete listing
            ├── MyBookings.jsx    # Renter: bookings + reviews
            └── HostedBookings.jsx # Host: listings + incoming bookings
```

## Tech Stack

| Layer    | Tech                           |
|----------|--------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend  | Node.js + Express              |
| Auth     | JWT (httpOnly cookie) + bcrypt |
| Database | SQLite + Prisma ORM            |
