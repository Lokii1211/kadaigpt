# KadaiGPT WhatsApp Bot 🤖

A powerful WhatsApp bot integration for KadaiGPT using [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys).

## Features

✅ **Multi-Language Support**
- English, Hindi, Tamil
- Change language with `lang en/hi/ta`

✅ **Stock Management**
- View low stock alerts
- Get restock suggestions
- Price predictions

✅ **Sales & Orders**
- Real-time sales summaries
- Recent order notifications
- Daily reports

✅ **AI Queries**
- Natural language queries
- Ask anything about your store
- Get intelligent insights

✅ **Proactive Notifications**
- Stock alerts
- Daily summaries
- Order confirmations
- Reminders

## Installation

```bash
# Navigate to whatsapp-bot directory
cd whatsapp-bot

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
```

## Configuration

Edit `.env` file:

```env
BACKEND_URL=http://localhost:8000/api/v1
STORE_ID=1
OWNER_NUMBER=919876543210
```

## Running

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

On first run, scan the QR code with WhatsApp to connect.

## Commands

| Command | Description |
|---------|-------------|
| `hi` / `start` | Welcome message |
| `stock` | View low stock items |
| `sales` | Today's sales summary |
| `orders` | Recent orders |
| `expenses` | Expense summary |
| `alerts` | Active alerts |
| `lang en` | Switch to English |
| `lang hi` | Switch to Hindi |
| `lang ta` | Switch to Tamil |
| `help` | Show all commands |

For any other message, the AI assistant will try to answer your query!

## Using with MoneyViya (Baileys Bot)

Since you're already using Baileys for MoneyViya, you can:

### Option 1: Separate Instances
Run both bots separately with different WhatsApp numbers.

### Option 2: Unified Bot
Combine the routing logic:

```javascript
// In your MoneyViya bot.js
const KadaiGPTBot = require('../VyaparAI/whatsapp-bot/bot')

// Add routing based on message content
if (message.includes('kadai') || message.includes('stock') || message.includes('sales')) {
    return kadaiGPT.handleMessage(message)
}
```

### Option 3: Webhook Integration
Set up both bots to communicate via webhooks:

```javascript
// KadaiGPT sends to MoneyViya
await axios.post('http://localhost:3001/kadai-webhook', { data })
```

## API Integration

The bot automatically connects to your KadaiGPT backend:

```
GET /api/v1/products - Fetch products
GET /api/v1/dashboard/stats - Dashboard stats
GET /api/v1/bills - Recent bills
POST /api/v1/agents/query - AI queries
```

## Proactive Notifications

### Send Stock Alert
```javascript
const bot = require('./bot')
await bot.sendStockAlert(lowStockProducts, ['919876543210'])
```

### Send Daily Summary
```javascript
await bot.sendDailySummary({
    totalSales: 45000,
    totalBills: 87,
    customersServed: 45,
    avgBill: 517,
    topProduct: 'Basmati Rice',
    lowStockCount: 3
}, ['919876543210', '919876543211'])
```

### Send Order Notification
```javascript
await bot.sendOrderNotification({
    id: 234,
    customerName: 'John',
    total: 450,
    itemCount: 5,
    paymentMethod: 'UPI',
    items: [{ name: 'Rice', qty: 2, total: 170 }]
}, '919876543210')
```

## Scheduled Tasks

Add to your backend cron:

```python
# Daily summary at 9 PM
@scheduler.cron('0 21 * * *')
async def send_daily_summary():
    summary = await get_daily_summary()
    # Call WhatsApp bot API
```

## Security Notes

- Auth data stored in `whatsapp-auth/` folder
- Never commit this folder to git
- Use strong backend API authentication
- Validate phone numbers

## Troubleshooting

**QR Code Not Showing?**
- Delete `whatsapp-auth` folder
- Restart the bot

**Connection Issues?**
- Check internet connectivity
- Wait and retry (WhatsApp rate limits)

**Messages Not Sending?**
- Verify phone number format (with country code)
- Check backend API is running

## License

MIT
