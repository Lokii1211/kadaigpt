/**
 * KadaiGPT WhatsApp Bot v3.0
 * For Railway with Persistent Volume
 * Mount /data volume in Railway settings
 */

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// Use /data for Railway persistent volume, fallback to local
const AUTH_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'auth')
    : './auth_info';

console.log('');
console.log('╔═══════════════════════════════════════╗');
console.log('║   KadaiGPT WhatsApp Bot v3.0          ║');
console.log('║   Railway 24/7 with Volume            ║');
console.log('╚═══════════════════════════════════════╝');
console.log('');
console.log('Auth directory:', AUTH_DIR);
console.log('');

async function start() {
    // Ensure directory exists
    if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
        console.log('Created auth directory');
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
            console.log('═══════════════════════════════════════');
            console.log('   SCAN QR CODE WITH WHATSAPP');
            console.log('═══════════════════════════════════════');
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            console.log('Disconnected:', code);

            if (code === DisconnectReason.loggedOut) {
                console.log('Logged out - clearing auth');
                try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch (e) { }
            }

            console.log('Reconnecting in 5s...');
            setTimeout(start, 5000);
        }

        if (connection === 'open') {
            console.log('');
            console.log('═══════════════════════════════════════');
            console.log('   ✅ CONNECTED!                       ');
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

        console.log('📩', text);
        const reply = getReply(text.toLowerCase().trim());
        await sock.sendMessage(msg.key.remoteJid, { text: reply });
        console.log('✅ Sent');
    });
}

function getReply(text) {
    if (['hi', 'hello', 'hey', 'start'].some(g => text.includes(g))) {
        return `🙏 *Welcome to KadaiGPT!*
India's First AI-Powered Retail Intelligence

*Quick Commands:*
📊 sales - Today's sales
📦 stock - Inventory
💸 expense - Expenses
📈 profit - Profit
🧾 bill - Recent bills
📋 report - Daily report
💡 help - All commands

_Type what you need!_ 🤖`;
    }

    if (text.includes('sales')) {
        return `📊 *Today's Sales*
━━━━━━━━━━━━━━━━━━
💰 Total: ₹12,450
🧾 Bills: 28
👥 Customers: 25

📈 +12% vs yesterday
_KadaiGPT AI_ 🤖`;
    }

    if (text.includes('stock')) {
        return `📦 *Stock Summary*
━━━━━━━━━━━━━━━━━━
✅ In Stock: 156
⚠️ Low Stock: 8
❌ Out: 3

_KadaiGPT AI_ 🤖`;
    }

    if (text.includes('low')) {
        return `⚠️ *Low Stock Alerts*
━━━━━━━━━━━━━━━━━━
1. Sugar - 5 left
2. Milk - 8 left
3. Bread - 3 left

💡 Order today!
_KadaiGPT AI_ 🤖`;
    }

    if (text.includes('expense')) {
        return `💸 *Expenses*
━━━━━━━━━━━━━━━━━━
Today: ₹3,200
Month: ₹45,600

_KadaiGPT AI_ 🤖`;
    }

    if (text.includes('profit')) {
        return `📈 *Profit*
━━━━━━━━━━━━━━━━━━
Revenue: ₹12,450
Cost: ₹3,200
Profit: ₹9,250 (74%)

_KadaiGPT AI_ 🤖`;
    }

    if (text.includes('bill')) {
        return `🧾 *Recent Bills*
━━━━━━━━━━━━━━━━━━
1. #1234 - ₹850
2. #1233 - ₹1,200
3. #1232 - ₹450

_KadaiGPT AI_ 🤖`;
    }

    if (text.includes('report')) {
        return `📋 *Daily Report*
━━━━━━━━━━━━━━━━━━
Sales: ₹12,450
Expenses: ₹3,200
Profit: ₹9,250
Bills: 28
Customers: 25

_KadaiGPT AI_ 🤖`;
    }

    if (text.includes('help')) {
        return `🤖 *KadaiGPT Commands*
• sales - Report
• stock - Inventory
• lowstock - Alerts
• expense - Costs
• profit - Margins
• bill - Invoices
• report - Summary`;
    }

    if (text.includes('thank')) {
        return `🙏 Happy to help!`;
    }

    return `Try: sales, stock, profit, help 🤖`;
}

// Keep alive
setInterval(() => {
    console.log(`[${new Date().toISOString()}] alive`);
}, 300000);

process.on('uncaughtException', (e) => console.error('Error:', e.message));
process.on('unhandledRejection', (e) => console.error('Error:', e.message));

start();
