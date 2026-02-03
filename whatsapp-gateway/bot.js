/**
 * KadaiGPT WhatsApp Bot - Railway 24/7 Version
 * Reads credentials from CREDS_BASE64 env variable
 */

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

const AUTH_DIR = './auth_info';

console.log('');
console.log('╔═══════════════════════════════════════╗');
console.log('║   KadaiGPT WhatsApp Bot v2.2          ║');
console.log('║   Railway 24/7 Deployment             ║');
console.log('╚═══════════════════════════════════════╝');
console.log('');

// Restore credentials from environment variable
function restoreCredentials() {
    const credsBase64 = process.env.CREDS_BASE64;
    if (credsBase64) {
        console.log('📦 Restoring credentials from environment...');
        if (!fs.existsSync(AUTH_DIR)) {
            fs.mkdirSync(AUTH_DIR, { recursive: true });
        }
        const credsJson = Buffer.from(credsBase64, 'base64').toString('utf8');
        fs.writeFileSync(`${AUTH_DIR}/creds.json`, credsJson);
        console.log('✅ Credentials restored!');
        return true;
    }
    return false;
}

async function start() {
    // Restore creds if available
    restoreCredentials();

    if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    console.log('WhatsApp Version:', version.join('.'));
    console.log('Connecting...');

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ['KadaiGPT', 'Chrome', '120.0.0'],
        connectTimeoutMs: 60000
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('');
            console.log('QR Code displayed - scan with WhatsApp');
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            console.log('Disconnected:', code);

            if (code === DisconnectReason.loggedOut) {
                console.log('Logged out - clearing auth');
                fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            }

            console.log('Reconnecting in 5s...');
            setTimeout(start, 5000);
        }

        if (connection === 'open') {
            console.log('');
            console.log('═══════════════════════════════════════');
            console.log('   ✅ CONNECTED TO WHATSAPP!           ');
            console.log('   🤖 KadaiGPT Bot is LIVE 24/7        ');
            console.log('═══════════════════════════════════════');
            console.log('');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Message handler
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        if (msg.key.remoteJid.endsWith('@g.us')) return;

        const text = msg.message.conversation ||
            msg.message.extendedTextMessage?.text || '';
        if (!text) return;

        const phone = msg.key.remoteJid.replace('@s.whatsapp.net', '');
        console.log(`📩 [${phone}]: ${text}`);

        const reply = getReply(text.toLowerCase().trim());
        await sock.sendMessage(msg.key.remoteJid, { text: reply });
        console.log('✅ Reply sent');
    });
}

function getReply(text) {
    // Greetings
    if (['hi', 'hello', 'hey', 'start', 'vanakkam', 'namaste'].some(g => text.includes(g))) {
        return `🙏 *Welcome to KadaiGPT!*
India's First AI-Powered Retail Intelligence

*Commands:*
📊 sales - Today's sales
📦 stock - Inventory status
💸 expense - Expenses
📈 profit - Profit summary
🧾 bill - Recent bills
📋 report - Daily report
💡 help - All commands

_Just type what you need!_ 🤖`;
    }

    // Sales
    if (text.includes('sales') || text.includes('revenue')) {
        return `📊 *Today's Sales*
━━━━━━━━━━━━━━━━━━
💰 Total: ₹12,450
🧾 Bills: 28
👥 Customers: 25
📈 Avg Bill: ₹444

*Top Products:*
1. Rice 5kg - ₹3,750
2. Oil 1L - ₹2,880
3. Sugar 1kg - ₹1,100

📈 +12% vs yesterday
_via KadaiGPT AI_ 🤖`;
    }

    // Stock
    if (text.includes('stock') || text.includes('inventory')) {
        return `📦 *Stock Summary*
━━━━━━━━━━━━━━━━━━
✅ In Stock: 156
⚠️ Low Stock: 8
❌ Out of Stock: 3

*Categories:*
🍚 Groceries: 89
🥤 Beverages: 34
🧴 Personal: 33

Type *lowstock* for alerts
_via KadaiGPT AI_ 🤖`;
    }

    // Low stock
    if (text.includes('low') || text.includes('alert')) {
        return `⚠️ *Low Stock Alerts*
━━━━━━━━━━━━━━━━━━
1. Sugar 1kg - 5 left
2. Milk 500ml - 8 left
3. Bread - 3 left
4. Eggs - 12 left
5. Butter - 4 left

💡 Order today!
_via KadaiGPT AI_ 🤖`;
    }

    // Expense
    if (text.includes('expense') || text.includes('cost')) {
        return `💸 *Today's Expenses*
━━━━━━━━━━━━━━━━━━
Total: ₹3,200

• Stock: ₹2,500
• Electricity: ₹400
• Transport: ₹200
• Misc: ₹100

📊 Month: ₹45,600
_via KadaiGPT AI_ 🤖`;
    }

    // Profit
    if (text.includes('profit') || text.includes('margin')) {
        return `📈 *Profit Summary*
━━━━━━━━━━━━━━━━━━
*Today:*
💰 Revenue: ₹12,450
💸 Expenses: ₹3,200
✨ Profit: ₹9,250 (74%)

*This Month:*
💰 Revenue: ₹3,45,000
✨ Profit: ₹1,35,000 (39%)

_via KadaiGPT AI_ 🤖`;
    }

    // Bill
    if (text.includes('bill') || text.includes('invoice')) {
        return `🧾 *Recent Bills*
━━━━━━━━━━━━━━━━━━
1. #1234 - ₹850 - Ramesh
2. #1233 - ₹1,200 - Walk-in
3. #1232 - ₹450 - Priya
4. #1231 - ₹2,100 - Kumar
5. #1230 - ₹680 - Lakshmi

📊 Today: ₹5,280
_via KadaiGPT AI_ 🤖`;
    }

    // Report
    if (text.includes('report') || text.includes('summary') || text.includes('daily')) {
        const today = new Date().toLocaleDateString('en-IN');
        return `📋 *Daily Report*
━━━━━━━━━━━━━━━━━━
📅 ${today}

💰 *Sales:* ₹12,450
💸 *Expenses:* ₹3,200
📈 *Profit:* ₹9,250

📦 *Inventory:*
• Low Stock: 8 items
• Out of Stock: 3 items

👥 *Customers:* 25
🧾 *Bills:* 28

_via KadaiGPT AI_ 🤖`;
    }

    // Predict
    if (text.includes('predict') || text.includes('forecast')) {
        return `🔮 *AI Predictions*
━━━━━━━━━━━━━━━━━━
*Tomorrow:*
💰 Expected: ₹14,200
📈 +14% vs today

*This Week:*
Mon-Fri: ₹70,000
Weekend: ₹40,000

💡 *Tip:* Stock up on Rice!
_via KadaiGPT AI_ 🤖`;
    }

    // Help
    if (text.includes('help') || text.includes('command') || text === '?') {
        return `🤖 *KadaiGPT Commands*

📊 *Reports*
• sales - Sales report
• expense - Expenses
• profit - Profit margin
• report - Daily summary

📦 *Inventory*
• stock - Stock levels
• lowstock - Low stock alerts

🧾 *Billing*
• bill - Recent bills

🔮 *AI Features*
• predict - Sales forecast

_Type naturally in Tamil/Hindi/English!_`;
    }

    // Thanks
    if (text.includes('thank') || text.includes('nandri')) {
        return `🙏 Happy to help!

Need anything else? Just ask!

_KadaiGPT - Your AI Partner_ 🤖`;
    }

    // Default
    return `🤔 I can help with:

• *sales* - Today's sales
• *stock* - Stock status
• *profit* - Profit summary
• *help* - All commands

Just type what you need! 🤖`;
}

// Keep alive log
setInterval(() => {
    console.log(`[${new Date().toLocaleTimeString()}] Bot alive ✓`);
}, 300000);

// Error handlers
process.on('uncaughtException', (e) => {
    console.error('Error:', e.message);
});

process.on('unhandledRejection', (e) => {
    console.error('Rejection:', e.message);
});

// Start
start().catch(console.error);
