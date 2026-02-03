/**
 * KadaiGPT WhatsApp AI Agent
 * Using PAIRING CODE instead of QR (easier to use!)
 */

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const axios = require('axios');
const readline = require('readline');

// Configuration
const CONFIG = {
    BACKEND_URL: process.env.BACKEND_URL || 'https://kadaigpt.up.railway.app',
    BOT_NAME: 'KadaiGPT AI',
    // Set your phone number here (with country code, no + or spaces)
    // Example: 919876543210 for India
    PHONE_NUMBER: process.env.PHONE_NUMBER || '',
    VERSION: '2.0.0'
};

const STORE_NAME = 'KadaiGPT Store';

// User session management
const userSessions = new Map();

// NLP Keywords
const NLP_INTENTS = {
    greeting: ['hi', 'hello', 'hey', 'vanakkam', 'namaste', 'start'],
    sales: ['sales', 'sell', 'sold', 'revenue', 'income'],
    stock: ['stock', 'inventory', 'available', 'items'],
    lowstock: ['low stock', 'lowstock', 'reorder', 'running out'],
    expense: ['expense', 'cost', 'spending', 'kharcha'],
    profit: ['profit', 'margin', 'earning', 'laabh'],
    bill: ['bill', 'invoice', 'receipt'],
    report: ['report', 'daily', 'summary'],
    predict: ['predict', 'forecast', 'tomorrow'],
    help: ['help', 'commands', 'menu'],
    thanks: ['thanks', 'thank you']
};

async function question(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

async function startBot() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║     🚀 KadaiGPT WhatsApp AI Agent v2.0           ║');
    console.log('║     Using Pairing Code (No QR needed!)           ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Backend: ${CONFIG.BACKEND_URL}`);
    console.log('');

    // Ensure auth directory
    if (!fs.existsSync('./auth_info')) {
        fs.mkdirSync('./auth_info', { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version } = await fetchLatestBaileysVersion();

    console.log(`WhatsApp Version: ${version.join('.')}`);
    console.log('');

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['KadaiGPT AI', 'Chrome', '120.0.0']
    });

    // Check if we need to pair
    if (!sock.authState.creds.registered) {
        let phoneNumber = CONFIG.PHONE_NUMBER;

        if (!phoneNumber) {
            console.log('╔══════════════════════════════════════════════════╗');
            console.log('║     📱 PHONE NUMBER REQUIRED                     ║');
            console.log('╚══════════════════════════════════════════════════╝');
            console.log('');
            console.log('Enter your phone number with country code.');
            console.log('Example: 919876543210 (India)');
            console.log('');
            phoneNumber = await question('Phone Number: ');
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        }

        if (phoneNumber.length < 10) {
            console.log('Invalid phone number!');
            process.exit(1);
        }

        console.log('');
        console.log('Requesting pairing code...');

        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log('');
            console.log('╔══════════════════════════════════════════════════╗');
            console.log('║     🔐 YOUR PAIRING CODE                         ║');
            console.log('╠══════════════════════════════════════════════════╣');
            console.log(`║                                                  ║`);
            console.log(`║           ${code}                              ║`);
            console.log(`║                                                  ║`);
            console.log('╚══════════════════════════════════════════════════╝');
            console.log('');
            console.log('📱 To connect:');
            console.log('   1. Open WhatsApp on your phone');
            console.log('   2. Go to Settings → Linked Devices');
            console.log('   3. Tap "Link a Device"');
            console.log('   4. Tap "Link with phone number instead"');
            console.log(`   5. Enter the code: ${code}`);
            console.log('');
        } catch (error) {
            console.error('Failed to get pairing code:', error.message);
            console.log('');
            console.log('Falling back to QR code...');
        }
    }

    // Connection events
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('');
            console.log('If pairing code didn\'t work, scan this QR:');
            require('qrcode-terminal').generate(qr, { small: true });
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log(`Connection closed. Reason: ${reason}`);

            if (reason !== DisconnectReason.loggedOut) {
                console.log('Reconnecting...');
                setTimeout(() => startBot(), 3000);
            }
        }

        if (connection === 'open') {
            console.log('');
            console.log('╔══════════════════════════════════════════════════╗');
            console.log('║     ✅ CONNECTED TO WHATSAPP!                    ║');
            console.log('║     🤖 KadaiGPT AI Agent is LIVE                 ║');
            console.log('╚══════════════════════════════════════════════════╝');
            console.log('');
            console.log('Bot is ready! Send "hi" to test.');
            console.log('');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Message handler
    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;
            if (msg.key.remoteJid.endsWith('@g.us')) return;

            const phone = msg.key.remoteJid.replace('@s.whatsapp.net', '');
            const text = msg.message.conversation ||
                msg.message.extendedTextMessage?.text || '';

            if (!text) return;

            console.log(`📩 [${phone}]: ${text}`);

            const response = await processMessage(phone, text);
            await sock.sendMessage(msg.key.remoteJid, { text: response });
            console.log(`✅ Reply sent`);

        } catch (error) {
            console.error('Message error:', error.message);
        }
    });
}

async function processMessage(phone, text) {
    const cleanText = text.toLowerCase().trim();
    const intent = detectIntent(cleanText);

    switch (intent) {
        case 'greeting':
            return `🙏 *Welcome to ${STORE_NAME}!*

I'm your KadaiGPT AI assistant.

*Commands:*
📊 sales - Sales report
📦 stock - Stock levels
💸 expense - Expenses
📈 profit - Profit summary
🧾 bill - Recent bills
📋 report - Daily report
💡 help - All commands

Just type what you need! 🤖`;

        case 'help':
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

Type naturally in Tamil/Hindi/English!`;

        case 'sales':
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

        case 'stock':
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

        case 'lowstock':
            return `⚠️ *Low Stock Alerts*
━━━━━━━━━━━━━━━━━━
1. Sugar 1kg - 5 left
2. Milk 500ml - 8 left
3. Bread - 3 left
4. Eggs - 12 left
5. Butter - 4 left

💡 Order today before stockout!
_via KadaiGPT AI_ 🤖`;

        case 'expense':
            return `💸 *Expenses Today*
━━━━━━━━━━━━━━━━━━
Total: ₹3,200

• Stock: ₹2,500
• Electricity: ₹400
• Transport: ₹200
• Misc: ₹100

📊 Month: ₹45,600
_via KadaiGPT AI_ 🤖`;

        case 'profit':
            return `📈 *Profit Summary*
━━━━━━━━━━━━━━━━━━
*Today:*
💰 Revenue: ₹12,450
💸 Expenses: ₹3,200
✨ Profit: ₹9,250 (74%)

*This Month:*
💰 Revenue: ₹3,45,000
✨ Profit: ₹1,35,000 (39%)

📈 +12% vs last month
_via KadaiGPT AI_ 🤖`;

        case 'bill':
            return `🧾 *Recent Bills*
━━━━━━━━━━━━━━━━━━
1. #1234 - ₹850 - Ramesh
2. #1233 - ₹1,200 - Walk-in
3. #1232 - ₹450 - Priya
4. #1231 - ₹2,100 - Kumar
5. #1230 - ₹680 - Lakshmi

📊 Today: ₹5,280 (5 bills)
_via KadaiGPT AI_ 🤖`;

        case 'report':
            return `📋 *Daily Report*
━━━━━━━━━━━━━━━━━━
📅 ${new Date().toLocaleDateString('en-IN')}

💰 *Sales:* ₹12,450
💸 *Expenses:* ₹3,200
📈 *Profit:* ₹9,250

📦 *Inventory:*
• Low Stock: 8 items
• Out of Stock: 3 items

👥 *Customers:* 25
🧾 *Bills:* 28

_via KadaiGPT AI_ 🤖`;

        case 'predict':
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

        case 'thanks':
            return `🙏 Happy to help!

Need anything else? Just ask!

_KadaiGPT - Your AI Partner_ 🤖`;

        default:
            return `🤔 I can help with:

• *sales* - Sales report
• *stock* - Stock levels
• *profit* - Profit summary
• *help* - All commands

Just type what you need! 🤖`;
    }
}

function detectIntent(text) {
    for (const [intent, keywords] of Object.entries(NLP_INTENTS)) {
        if (keywords.some(k => text.includes(k))) {
            return intent;
        }
    }
    return 'unknown';
}

// Start
startBot().catch(console.error);
