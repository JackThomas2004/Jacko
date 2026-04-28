# Jacko — Deployment Guide
## Railway (backend + database + Redis) + Vercel (frontend)

This guide takes the app from your computer to the internet in about 20 minutes.

---

## What you'll end up with

| Service | Platform | Cost |
|---------|----------|------|
| Node.js backend | Railway | ~$5/month (Hobby plan) |
| PostgreSQL database | Railway (included) | Included |
| Redis | Railway (included) | Included |
| React frontend | Vercel | Free |

---

## Step 1 — Push the code to GitHub

Open a terminal, navigate to the `jacko/` folder, and run:

```bash
cd /path/to/jacko

git init
git add .
git commit -m "Initial commit"
```

Then go to https://github.com/new, create a new **private** repository called `jacko`, and run the commands GitHub shows you (they'll look like this):

```bash
git remote add origin https://github.com/YOUR_USERNAME/jacko.git
git branch -M main
git push -u origin main
```

Your code is now on GitHub. ✅

---

## Step 2 — Deploy the backend on Railway

### 2a. Create a Railway account

1. Go to https://railway.app and sign up with your GitHub account.
2. Choose the **Hobby** plan ($5/month). This covers the backend, database, and Redis.

### 2b. Create a new project

1. Click **New Project** → **Deploy from GitHub repo**.
2. Select your `jacko` repository.
3. Railway will ask what to deploy. Click **Add service** → **GitHub Repo** again.
4. In the settings for this service, set the **Root Directory** to `server`.
5. Railway will auto-detect it's a Node.js app and use the `nixpacks.toml` you already have.

### 2c. Add PostgreSQL

1. In your Railway project, click **+ New** → **Database** → **Add PostgreSQL**.
2. Railway creates the database and automatically sets `DATABASE_URL` as an environment variable in your project. No extra config needed.

### 2d. Add Redis

1. Click **+ New** → **Database** → **Add Redis**.
2. Railway creates Redis and automatically sets `REDIS_URL`. Again, no extra config needed.

### 2e. Set environment variables for the backend

Click on your backend service → **Variables** tab → and add these:

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | A long random string — use https://randomkeygen.com (pick "Fort Knox Passwords") |
| `CLIENT_ORIGIN` | Leave blank for now — you'll fill this in after deploying the frontend |
| `NODE_ENV` | `production` |

> `DATABASE_URL` and `REDIS_URL` are already set automatically by Railway — don't touch them.

### 2f. Run the database migration

Once the backend deploys successfully (you'll see a green "Active" status):

1. Click your backend service → **Settings** → scroll to **Deploy**.
2. Open the **Railway CLI** or use the built-in shell (click the terminal icon).
3. Run:
```bash
npx prisma db push
```
This creates all the tables in your PostgreSQL database.

> **Alternative:** You can also run this from your own computer if you install the Railway CLI:
> ```bash
> npm install -g @railway/cli
> railway login
> railway link   # select your project
> cd server
> railway run npx prisma db push
> ```

### 2g. Copy your Railway backend URL

1. Click your backend service → **Settings** → **Networking**.
2. Click **Generate Domain** if you haven't already.
3. Copy the URL — it'll look like `https://jacko-production-xxxx.up.railway.app`.

You'll need this in the next step. ✅

---

## Step 3 — Deploy the frontend on Vercel

### 3a. Create a Vercel account

Go to https://vercel.com and sign up with your GitHub account. It's free.

### 3b. Import your project

1. Click **Add New** → **Project**.
2. Find and import your `jacko` GitHub repository.
3. On the "Configure Project" screen, set the **Root Directory** to `client`.
4. Vercel will auto-detect it as a Vite project.

### 3c. Set environment variables

Under **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway URL from Step 2g, e.g. `https://jacko-production-xxxx.up.railway.app` |
| `VITE_SOCKET_URL` | Same Railway URL |

### 3d. Deploy

Click **Deploy**. Vercel will build and deploy in about a minute.

Once done, copy your Vercel URL — it'll look like `https://jacko.vercel.app`.

---

## Step 4 — Connect everything together

### 4a. Update Railway with the Vercel URL

Go back to Railway → your backend service → **Variables**, and set:

| Variable | Value |
|----------|-------|
| `CLIENT_ORIGIN` | Your Vercel URL, e.g. `https://jacko.vercel.app` |

If you also want to allow local development at the same time:

```
CLIENT_ORIGIN=https://jacko.vercel.app,http://localhost:5173
```

Railway will automatically redeploy the backend. ✅

---

## Step 5 — Test it

1. Open your Vercel URL in a browser: `https://jacko.vercel.app`
2. Register an account.
3. Open the same URL in a different browser (or incognito window) and register another account.
4. Add each other as friends, create a lobby, and play!

---

## Updating the app in future

Any time you push changes to GitHub, both Railway and Vercel will automatically redeploy. Just:

```bash
git add .
git commit -m "Update: description of change"
git push
```

---

## Troubleshooting

**Backend shows "crashed" on Railway:**
- Click the service → **Logs** tab to see the error.
- Most common cause: missing environment variable or database not migrated yet.

**Frontend shows a blank page or 404:**
- Check that `vercel.json` is present in the `client/` folder (it makes all routes fall back to `index.html`).

**Can't connect to the game / WebSocket errors:**
- Make sure `VITE_SOCKET_URL` on Vercel matches your Railway backend URL exactly (no trailing slash).
- Make sure `CLIENT_ORIGIN` on Railway matches your Vercel URL exactly.

**Database error on first deploy:**
- Run `npx prisma db push` via Railway CLI or the built-in shell to create the tables.

---

## Environment variable reference

### Server (Railway)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Set automatically by Railway PostgreSQL |
| `REDIS_URL` | Set automatically by Railway Redis |
| `JWT_SECRET` | Long random secret for signing auth tokens |
| `CLIENT_ORIGIN` | Your Vercel URL (comma-separated if multiple) |
| `NODE_ENV` | `production` |
| `PORT` | Set automatically by Railway |

### Client (Vercel)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Your Railway backend URL |
| `VITE_SOCKET_URL` | Your Railway backend URL (same value) |
