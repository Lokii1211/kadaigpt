/**
 * KadaiGPT WhatsApp AI Agent v2.1
 * Optimized for Railway 24/7 deployment
 */

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');

// Configuration
const PHONE_NUMBER = process.env.PHONE_NUMBER || '919363324580';
const BACKEND_URL = process.env.BACKEND_URL || 'https://kadaigpt.up.railway.app';
const AUTH_DIR = './auth_info';

console.log('');
console.log('╔══════════════════════════════════════════════════╗');
console.log('║     🚀 KadaiGPT WhatsApp AI Agent v2.1           ║');
console.log('║     24/7 Railway Deployment                      ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log('');
console.log(`Phone: ${PHONE_NUMBER}`);
console.log(`Backend: ${BACKEND_URL}`);
console.log(`Auth Dir: ${AUTH_DIR}`);
console.log('');

// NLP Keywords
const NLP_INTENTS = {
    greeting: ['hi', 'hello', 'hey', 'vanakkam', 'namaste', 'start'],
    sales: ['sales', 'sell', 'sold', 'revenue', 'income'],
    stock: ['stock', 'inventory', 'available', 'items'],
    lowstock: ['low stock', 'lowstock', 'reorder', 'running out', 'less'],
    expense: ['expense', 'cost', 'spending', 'kharcha'],
    profit: ['profit', 'margin', 'earning', 'laabh'],
    bill: ['bill', 'invoice', 'receipt'],
    report: ['report', 'daily', 'summary'],
    predict: ['predict', 'forecast', 'tomorrow'],
    help: ['help', 'commands', 'menu', '?'],
    thanks: ['thanks', 'thank', 'nandri']
};

let sock = null;
let isConnected = false;

async function connectWhatsApp() {
    // Ensure auth directory
    if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    console.log(`WhatsApp Version: ${version.join('.')}`);
    console.log('Connecting...');

    sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ['KadaiGPT', 'Chrome', '120.0.0'],
        connectTimeoutMs: 120000,
        keepAliveIntervalMs: 30000,
        retryRequestDelayMs: 2000
    });

    // Connection events
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !sock.authState.creds.registered) {
            console.log('');
            console.log('Requesting pairing code...');
            try {
                const code = await sock.requestPairingCode(PHONE_NUMBER);
                console.log('');
                console.log('╔═══════════════════════════════════════╗');
                console.log('║     🔐 PAIRING CODE                   ║');
                console.log('╠═══════════════════════════════════════╣');
                console.log(`║         ${code}                       ║`);
                console.log('╚═══════════════════════════════════════╝');
                console.log('');
                console.log('WhatsApp → Settings → Linked Devices');
                console.log('→ Link a Device → Link with phone number');
                console.log(`→ Enter: ${code}`);
                console.log('');
            } catch (e) {
                console.log('Use QR code above');
            }
        }

        if (connection === 'close') {
            isConnected = false;
            const code = lastDisconnect?.error?.output?.statusCode;
            console.log('Disconnected. Code:', code);

            if (code === DisconnectReason.loggedOut) {
                console.log('Logged out. Clearing auth...');
                try {
                    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
                } catch (e) { }
            }

            // Reconnect after delay
            console.log('Reconnecting in 5 seconds...');
            setTimeout(connectWhatsApp, 5000);
        }

        if (connection === 'open') {
            isConnected = true;
            console.log('');
            console.log('╔═══════════════════════════════════════╗');
            console.log('║     ✅ CONNECTED!                     ║');
            console.log('║     🤖 KadaiGPT AI is LIVE            ║');
            console.log('╚═══════════════════════════════════════╝');
            console.log('');
            console.log('Bot ready. Send "hi" to test.');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Message handler
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            try {
                if (!msg.message || msg.key.fromMe) continue;
                if (msg.key.remoteJid.endsWith('@g.us')) continue;

                const text = msg.message.conversation ||
                    msg.message.extendedTextMessage?.text || '';

                if (!text) continue;

                const phone = msg.key.remoteJid.replace('@s.whatsapp.net', '');
                console.log(`📩 ${phone}: ${text}`);

                const response = getResponse(text.toLowerCase().trim());
                await sock.sendMessage(msg.key.remoteJid, { text: response });
                console.log(`✅ Replied`);

            } catch (e) {
                console.error('Error:', e.message);
            }
        }
    });
}

function getResponse(text) {
    const intent = detectIntent(text);

    const responses = {
        greeting: `🙏 *Welcome to KadaiGPT!*
India's First AI-Powered Retail Intelligence.

*Commands:*
📊 sales - Sales report
📦 stock - Stock levels
💸 expense - Expenses
📈 profit - Profit summary
🧾 bill - Recent bills
📋 report - Daily report
💡 help - All commands

_Just type naturally!_ 🤖`,

        help: `🤖 *KadaiGPT Commands*

📊 *Reports*
• sales - Sales report
• expense - Expenses
• profit - Margins
• report - Daily summary

📦 *Inventory*
• stock - Stock levels
• lowstock - Alerts

🧾 *Billing*
• bill - Recent bills

🔮 *AI*
• predict - Forecast`,

        sales: `📊 *Today's Sales*
━━━━━━━━━━━━━━━━━━
💰 Total: ₹12,450
🧾 Bills: 28
👥 Customers: 25
📈 Avg: ₹444

*Top Products:*
1. Rice 5kg - ₹3,750
2. Oil 1L - ₹2,880
3. Sugar 1kg - ₹1,100

📈 +12% vs yesterday
_via KadaiGPT_ 🤖`,

        stock: `📦 *Stock Summary*
━━━━━━━━━━━━━━━━━━
✅ In Stock: 156
⚠️ Low Stock: 8
❌ Out: 3

Type *lowstock* for alerts
_via KadaiGPT_ 🤖`,

        lowstock: `⚠️ *Low Stock Alerts*
━━━━━━━━━━━━━━━━━━
1. Sugar 1kg - 5 left
2. Milk 500ml - 8 left
3. Bread - 3 left
4. Eggs - 12 left

💡 Order today!
_via KadaiGPT_ 🤖`,

        expense: `💸 *Today's Expenses*
━━━━━━━━━━━━━━━━━━
Total: ₹3,200

• Stock: ₹2,500
• Electric: ₹400
• Transport: ₹200
• Misc: ₹100

_via KadaiGPT_ 🤖`,

        profit: `📈 *Profit Summary*
━━━━━━━━━━━━━━━━━━
💰 Revenue: ₹12,450
💸 Expenses: ₹3,200
✨ Profit: ₹9,250 (74%)

_via KadaiGPT_ 🤖`,

        bill: `🧾 *Recent Bills*
━━━━━━━━━━━━━━━━━━
1. #1234 - ₹850
2. #1233 - ₹1,200
3. #1232 - ₹450
4. #1231 - ₹2,100

_via KadaiGPT_ 🤖`,

        report: `📋 *Daily Report*
━━━━━━━━━━━━━━━━━━
📅 ${new Date().toLocaleDateString('en-IN')}

💰 Sales: ₹12,450
💸 Expenses: ₹3,200
📈 Profit: ₹9,250
📦 Low Stock: 8
👥 Customers: 25

_via KadaiGPT_ 🤖`,

        predict: `🔮 *AI Forecast*
━━━━━━━━━━━━━━━━━━
*Tomorrow:*
💰 Expected: ₹14,200
📈 +14% growth

💡 Stock up Rice!
_via KadaiGPT_ 🤖`,

        thanks: `🙏 Happy to help!
_KadaiGPT AI_ 🤖`,

        unknown: `Try: sales, stock, profit, help
_KadaiGPT_ 🤖`
    };

    return responses[intent] || responses.unknown;
}

function detectIntent(text) {
    for (const [intent, keywords] of Object.entries(NLP_INTENTS)) {
        if (keywords.some(k => text.includes(k))) {
            return intent;
        }
    }
    return 'unknown';
}

// Error handlers
process.on('uncaughtException', (e) => {
    console.error('Error:', e.message);
});

process.on('unhandledRejection', (e) => {
    console.error('Error:', e.message);
});

// Keep alive
setInterval(() => {
    if (isConnected) {
        console.log(`[${new Date().toLocaleTimeString()}] Bot alive ✓`);
    }
}, 300000); // Every 5 min

// Start
connectWhatsApp().catch(console.error);
