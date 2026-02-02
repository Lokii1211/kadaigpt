# WhatsApp Bot Setup Guide for KadaiGPT

## Overview

KadaiGPT uses **Evolution API** for WhatsApp integration. This is a FREE, open-source solution that provides unlimited WhatsApp messaging capabilities.

## Architecture

```
User sends WhatsApp message
        ↓
Evolution API (on Railway)
        ↓
Webhook → KadaiGPT Backend
        ↓
Process query (AI/Database)
        ↓
Send response via Evolution API
        ↓
User receives reply
```

## Step 1: Deploy Evolution API on Railway

### Option A: One-Click Deploy (Recommended)

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Fork this repo: `https://github.com/EvolutionAPI/evolution-api`
5. Deploy!

### Option B: Deploy from Docker

1. Create a new project on Railway
2. Add a new service
3. Select "Docker Image"
4. Use image: `atendai/evolution-api:latest`
5. Add these environment variables:

```env
SERVER_URL=https://your-project-name.railway.app
SERVER_TYPE=http
SERVER_PORT=8080

AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=your-secret-api-key-here
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

WEBHOOK_GLOBAL_URL=https://your-kadaigpt-backend.railway.app/api/v1/whatsapp/webhook
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_EVENTS_MESSAGES_UPSERT=true
WEBHOOK_EVENTS_CONNECTION_UPDATE=true

DATABASE_ENABLED=false
RABBITMQ_ENABLED=false
REDIS_ENABLED=false
CHATWOOT_ENABLED=false

LOG_LEVEL=ERROR
STORE_MESSAGES=true
STORE_CONTACTS=true
STORE_CHATS=true
```

## Step 2: Create WhatsApp Instance

Once Evolution API is deployed:

1. Open your Evolution API URL: `https://your-evolution-api.railway.app`
2. Use the Swagger docs at: `https://your-evolution-api.railway.app/docs`

### Create Instance

```bash
curl -X POST "https://your-evolution-api.railway.app/instance/create" \
  -H "apikey: your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "kadaigpt",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

### Get QR Code

```bash
curl -X GET "https://your-evolution-api.railway.app/instance/connect/kadaigpt" \
  -H "apikey: your-secret-api-key"
```

3. Scan the QR code with your WhatsApp to connect

## Step 3: Configure KadaiGPT Backend

Add these to your backend `.env` file:

```env
EVOLUTION_API_URL=https://your-evolution-api.railway.app
EVOLUTION_API_KEY=your-secret-api-key
EVOLUTION_INSTANCE_NAME=kadaigpt
```

## Step 4: Test the Bot

### Test via API

```bash
curl -X POST "https://your-kadaigpt-backend.railway.app/api/v1/whatsapp/test?message=hello"
```

### Send a Test Message

```bash
curl -X POST "https://your-kadaigpt-backend.railway.app/api/v1/whatsapp/send" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "919876543210",
    "message": "Hello from KadaiGPT!"
  }'
```

## Bot Commands

Once connected, users can send these commands:

| Command | Description |
|---------|-------------|
| `hi` / `hello` | Greeting |
| `help` | Show all commands |
| `sales` | Today's sales report |
| `expense` | Today's expenses |
| `profit` | Profit/Loss report |
| `stock` | Low stock alerts |
| `bills` | Recent bills |
| `customers` | Customer list |
| `products` | Product inventory |
| `gst` | GST summary |
| `report` | Full daily summary |

## Sending Welcome Messages

When a user registers on your site, call:

```bash
curl -X POST "https://your-kadaigpt-backend.railway.app/api/v1/whatsapp/welcome" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "919876543210",
    "user_name": "Lokesh"
  }'
```

## Troubleshooting

### QR Code Not Showing

1. Check Evolution API logs on Railway
2. Ensure instance is created correctly
3. Try recreating the instance

### Messages Not Being Received

1. Check webhook URL is correct
2. Verify API key matches
3. Check Railway logs for errors

### WhatsApp Disconnected

1. Re-scan QR code
2. Check if WhatsApp Web is logged in elsewhere
3. Wait 5 minutes and try again

## Cost

- **Evolution API**: FREE (self-hosted)
- **Railway Hosting**: ~$5/month (or free with Hobby plan)
- **WhatsApp**: FREE (using your personal/business number)

## Security Notes

1. Keep your API key secret
2. Use HTTPS only
3. Validate webhook signatures
4. Don't store sensitive data in messages

## Files Created

```
backend/
├── app/
│   ├── services/
│   │   └── whatsapp_bot.py    # Bot logic & message handling
│   ├── routers/
│   │   └── whatsapp.py        # Webhook & API endpoints
│   └── config.py              # Evolution API settings
├── .env.example               # Environment variables
```

## Next Steps

1. Deploy Evolution API on Railway
2. Create instance and scan QR code
3. Update KadaiGPT backend .env
4. Test with `hi` message
5. Add user registration webhook

Happy chatting! 🤖💬
