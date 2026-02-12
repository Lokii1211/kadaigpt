# 🚀 KadaiGPT - Vercel Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    VERCEL                            │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │   Frontend    │    │   Backend (Serverless)   │   │
│  │  React/Vite   │    │   FastAPI + Python       │   │
│  │  Static CDN   │    │   api/index.py           │   │
│  └──────────────┘    └──────────┬───────────────┘   │
│                                 │                    │
└─────────────────────────────────┼────────────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │    Neon PostgreSQL          │
                    │  (Free Serverless DB)       │
                    │  neon.tech                  │
                    └────────────────────────────┘
```

**Railway → Vercel Migration Summary:**
- **Frontend**: Vite static build → Vercel CDN (automatic)
- **Backend**: FastAPI → Vercel Serverless Python Functions
- **Database**: Railway PostgreSQL → Neon PostgreSQL (free tier)
- **WhatsApp Gateway**: Cannot run on Vercel (needs persistent WebSocket). See alternatives below.

---

## Step 1: Set Up Neon PostgreSQL (Free Database)

1. Go to [neon.tech](https://neon.tech) and sign up (free tier: 0.5 GB storage)
2. Create a new project: **"kadaigpt"**
3. Select region: **Asia Pacific (Singapore)** for lowest latency to India
4. Copy the connection string. It will look like:
   ```
   postgresql://username:password@ep-xxxxx.ap-southeast-1.aws.neon.tech/kadaigpt?sslmode=require
   ```
5. Save this - you'll need it for Vercel environment variables

---

## Step 2: Push Code to GitHub

```bash
cd c:\Users\dell\Desktop\KadaiGPT\VyaparAI
git add -A
git commit -m "chore: migrate from Railway to Vercel deployment"
git push origin main
```

---

## Step 3: Deploy to Vercel

### Option A: Via Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
cd c:\Users\dell\Desktop\KadaiGPT\VyaparAI
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: kadaigpt
# - Directory: ./
# - Override settings? No (vercel.json handles it)
```

### Option B: Via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo: `Lokii1211/kadaigpt`
3. Vercel auto-detects `vercel.json` configuration
4. Click **Deploy**

---

## Step 4: Configure Environment Variables

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these variables:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/kadaigpt?sslmode=require` | ✅ Yes |
| `SECRET_KEY` | `your-strong-random-secret-key-here` | ✅ Yes |
| `JWT_SECRET_KEY` | `your-jwt-secret-key-here` | ✅ Yes |
| `APP_ENV` | `production` | ✅ Yes |
| `GOOGLE_API_KEY` | `your-gemini-api-key` | 🔄 For OCR/AI |
| `TELEGRAM_BOT_TOKEN` | `your-telegram-bot-token` | 🔄 For Telegram |
| `EVOLUTION_API_URL` | `https://your-whatsapp-api.com` | 🔄 For WhatsApp |
| `EVOLUTION_API_KEY` | `your-evolution-api-key` | 🔄 For WhatsApp |
| `ENCRYPTION_KEY` | (generate with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`) | 🔄 For data encryption |

After adding variables, **redeploy** the project.

---

## Step 5: Initialize Database Tables

After first deployment, the FastAPI lifespan event will automatically create tables.
Visit: `https://your-app.vercel.app/api/health` to trigger initialization.

If tables don't auto-create, you can run a one-time script:

```python
# Run locally with the Neon DATABASE_URL
import asyncio
from app.database import init_db
asyncio.run(init_db())
```

---

## WhatsApp Gateway Alternative

⚠️ **The WhatsApp Gateway (Baileys) CANNOT run on Vercel** because it requires:
- Persistent WebSocket connection to WhatsApp servers
- Long-running process (not serverless compatible)
- File system for auth session storage

### Free Alternatives:

1. **Render.com Free Tier** (Recommended)
   - Supports Docker, 750 free hours/month
   - Deploy the `whatsapp-gateway/` folder as a separate service
   - Set env var: `KADAIGPT_BACKEND_URL=https://your-app.vercel.app`

2. **Fly.io Free Tier**
   - 3 shared VMs free
   - Good for always-on services
   ```bash
   cd whatsapp-gateway
   flyctl launch
   flyctl deploy
   ```

3. **Oracle Cloud Free Tier**
   - 2 free AMD VMs (forever free)
   - Run the WhatsApp gateway as a Docker container

4. **Use Telegram Instead** (Simplest)
   - Telegram bot works perfectly with Vercel serverless
   - Set `TELEGRAM_BOT_TOKEN` in Vercel env vars
   - No persistent connection needed (webhook-based)

---

## Verifying Deployment

After deployment, check these URLs:

| URL | Expected |
|-----|----------|
| `https://your-app.vercel.app/` | React frontend loads |
| `https://your-app.vercel.app/api/health` | `{"status": "healthy", ...}` |
| `https://your-app.vercel.app/api/docs` | FastAPI Swagger UI |
| `https://your-app.vercel.app/api/v1/subscription/tiers` | Subscription tiers JSON |

---

## Troubleshooting

### "Module not found" errors
- Ensure `backend/requirements.txt` has all dependencies
- Check Vercel build logs for pip install errors

### Database connection errors
- Verify `DATABASE_URL` is set correctly in Vercel env vars
- Ensure Neon project is active (free tier sleeps after inactivity)
- Check that `?sslmode=require` is in the URL

### CORS errors
- The `vercel.json` headers handle CORS for API routes
- Frontend is served from the same domain, so no CORS needed for it

### Cold starts (slow first request)
- Normal for Vercel serverless Python functions
- First request may take 2-5 seconds, subsequent requests are fast
- Neon also has cold starts (~1s) on free tier

### 500 errors on API routes
- Check Vercel Function Logs: Dashboard → Deployments → Functions tab
- Common cause: missing environment variables

---

## Cost Comparison

| Service | Railway (expired) | Vercel + Neon (new) |
|---------|-------------------|---------------------|
| Frontend | Included | Free (100GB bandwidth) |
| Backend | $5/mo | Free (100GB-hrs serverless) |
| Database | $5/mo (PostgreSQL) | Free (0.5GB on Neon) |
| WhatsApp | $5/mo (Docker) | Free on Render/Fly.io |
| **Total** | **~$15/mo** | **$0/mo** ✅ |
