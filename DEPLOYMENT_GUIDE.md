# 🚀 KadaiGPT - Deployment Guide (Render.com)

## Why Render.com?

| Feature | Vercel ❌ | Render ✅ |
|---------|----------|----------|
| FastAPI backend | 30s timeout serverless | Full long-running process |
| WhatsApp Baileys Bot | ❌ No WebSocket support | ✅ Docker, always-on |
| PostgreSQL | External only (Neon) | Built-in free DB |
| Background tasks | ❌ No workers | ✅ Cron + workers |
| File uploads | ❌ /tmp only | ✅ Persistent disk |
| Python version | 3.14 only (broken) | Any version via Docker |
| **Monthly Cost** | **$0 (limited)** | **$0 free tier** |

---

## Architecture on Render

```
┌──────────────────────────────────────────────────────────┐
│                    RENDER.COM                            │
│                                                          │
│  ┌──────────────────────┐  ┌──────────────────────────┐  │
│  │   Web Service         │  │   WhatsApp Bot           │  │
│  │   (Docker)            │  │   (Docker)               │  │
│  │                       │  │                           │  │
│  │  FastAPI Backend      │  │  Baileys + Node.js       │  │
│  │  + React Frontend     │  │  Persistent WebSocket    │  │
│  │  + OCR + AI           │  │  24/7 Connection         │  │
│  └──────────┬────────────┘  └───────────────────────────┘  │
│             │                                              │
│  ┌──────────▼────────────┐                                │
│  │  PostgreSQL Database   │                                │
│  │  (Render Free Tier)    │                                │
│  └────────────────────────┘                                │
└──────────────────────────────────────────────────────────┘
```

---

## Step 1: Create a Render Account

1. Go to [render.com](https://render.com) → Sign up with **GitHub**
2. This auto-connects your GitHub repos

---

## Step 2: One-Click Deploy with Blueprint

The easiest way — uses the `render.yaml` file in the repo:

1. Go to [render.com/deploy](https://render.com/deploy)
2. Paste your repo URL: `https://github.com/Lokii1211/kadaigpt`
3. Render reads `render.yaml` and auto-creates:
   - ✅ Web Service (FastAPI + React)
   - ✅ WhatsApp Bot Service
   - ✅ PostgreSQL Database
4. Click **Apply** → Wait for build (~3-5 minutes)

---

## Step 3 (Alternative): Manual Setup

If Blueprint doesn't work, create services manually:

### 3a. Create PostgreSQL Database
1. Dashboard → **New** → **PostgreSQL**
2. Name: `kadaigpt-db`
3. Region: **Singapore**
4. Plan: **Free**
5. Click **Create Database**
6. Copy the **Internal Database URL** (starts with `postgres://...`)

### 3b. Create Web Service (Backend + Frontend)
1. Dashboard → **New** → **Web Service**
2. Connect your GitHub repo: `Lokii1211/kadaigpt`
3. Settings:
   - **Name**: `kadaigpt`
   - **Region**: Singapore
   - **Runtime**: Docker
   - **Plan**: Free
4. **Environment Variables** → Add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | *(paste Internal Database URL from step 3a)* |
| `SECRET_KEY` | *(click Generate)* |
| `JWT_SECRET_KEY` | *(click Generate)* |
| `APP_ENV` | `production` |
| `GOOGLE_API_KEY` | Your Gemini API key |
| `TELEGRAM_BOT_TOKEN` | Your bot token |
| `PORT` | `8000` |

5. Click **Create Web Service**

### 3c. Create WhatsApp Bot Service (Optional)
1. Dashboard → **New** → **Web Service**
2. Connect same repo
3. Settings:
   - **Name**: `kadaigpt-whatsapp`
   - **Root Directory**: `whatsapp-gateway`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile`
4. **Environment Variables**:
   - `KADAIGPT_BACKEND_URL` = `https://kadaigpt.onrender.com`
   - `PORT` = `3001`
5. Click **Create Web Service**

---

## Step 4: Verify Deployment

After build completes (~3-5 min), check these URLs:

| URL | Expected |
|-----|----------|
| `https://kadaigpt.onrender.com/` | React frontend ✅ |
| `https://kadaigpt.onrender.com/api/health` | `{"status":"healthy"}` ✅ |
| `https://kadaigpt.onrender.com/api/docs` | Swagger UI ✅ |

---

## Step 5: Set Up Telegram Webhook

After deployment, set the Telegram webhook:

```
https://kadaigpt.onrender.com/api/v1/telegram/set-webhook
```

---

## Free Tier Limitations

| Limitation | Details | Workaround |
|-----------|---------|------------|
| **Sleep after 15 min** | Free services sleep after inactivity | First request takes ~30s to wake up |
| **750 hours/month** | Enough for 1 service 24/7 | Use 2 services = ~375 hrs each |
| **PostgreSQL 90 days** | Free DB expires after 90 days | Recreate or upgrade ($7/mo) |
| **512 MB RAM** | Per free service | Enough for KadaiGPT |

---

## Troubleshooting

### Build fails
- Check **Logs** tab in Render dashboard
- Ensure `Dockerfile` exists at repo root
- Check `requirements.txt` has all dependencies

### Database connection errors
- Use the **Internal Database URL** (not External)
- Render auto-injects `DATABASE_URL` if using Blueprint

### Service sleeping (slow first request)
- Normal on free tier — takes ~30s to wake
- Tip: Use [UptimeRobot](https://uptimerobot.com) to ping every 14 min (keeps it awake for free)

### WhatsApp QR Code
- Visit `https://kadaigpt-whatsapp.onrender.com` to see the QR
- Scan with WhatsApp on your phone
- Session persists across restarts

---

## Cost Comparison

| Platform | Backend | Database | WhatsApp Bot | Total |
|----------|---------|----------|-------------|-------|
| Railway (expired) | $5/mo | $5/mo | $5/mo | **$15/mo** |
| Vercel + Neon | $0 | $0 | ❌ Can't run | **$0 (limited)** |
| **Render.com** | **$0** | **$0** | **$0** | **$0/mo ✅** |
| Render Paid | $7/mo | $7/mo | $7/mo | **$21/mo** |
