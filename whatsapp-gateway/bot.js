/**
 * KadaiGPT WhatsApp Bot v3.1
 * Stores session in Postgres (already free on Railway!)
 */

const {
    default: makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    BufferJSON,
    initAuthCreds,
    proto
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const { Pool } = require('pg');

// Use Railway Postgres or local file
const DATABASE_URL = process.env.DATABASE_URL;
const AUTH_DIR = './auth_info';

let pool = null;
if (DATABASE_URL) {
    pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
    console.log('Using Postgres for session storage');
}

console.log('');
console.log('╔═══════════════════════════════════════╗');
console.log('║   KadaiGPT WhatsApp Bot v3.1          ║');
console.log('║   Postgres Session Storage            ║');
console.log('╚═══════════════════════════════════════╝');
console.log('');

// Postgres-based auth state
async function usePostgresAuthState() {
    // Create table if not exists
    await pool.query(`
        CREATE TABLE IF NOT EXISTS whatsapp_auth (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `);

    const writeData = async (key, data) => {
        const value = JSON.stringify(data, BufferJSON.replacer);
        await pool.query(
            `INSERT INTO whatsapp_auth (key, value, updated_at) 
             VALUES ($1, $2, NOW()) 
             ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
            [key, value]
        );
    };

    const readData = async (key) => {
        const result = await pool.query('SELECT value FROM whatsapp_auth WHERE key = $1', [key]);
        if (result.rows.length > 0) {
            return JSON.parse(result.rows[0].value, BufferJSON.reviver);
        }
        return null;
    };

    const removeData = async (key) => {
        await pool.query('DELETE FROM whatsapp_auth WHERE key = $1', [key]);
    };

    // Load or initialize creds
    let creds = await readData('creds');
    if (!creds) {
        creds = initAuthCreds();
    }

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    for (const id of ids) {
                        const value = await readData(`${type}-${id}`);
                        if (value) {
                            if (type === 'app-state-sync-key') {
                                data[id] = proto.Message.AppStateSyncKeyData.fromObject(value);
                            } else {
                                data[id] = value;
                            }
                        }
                    }
                    return data;
                },
                set: async (data) => {
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            if (value) {
                                await writeData(key, value);
                            } else {
                                await removeData(key);
                            }
                        }
                    }
                }
            }
        },
        saveCreds: async () => {
            await writeData('creds', creds);
        }
    };
}

// File-based auth state (fallback)
async function useFileAuthState() {
    const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
    if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
    return await useMultiFileAuthState(AUTH_DIR);
}

async function start() {
    let authState;

    if (pool) {
        try {
            authState = await usePostgresAuthState();
            console.log('✅ Using Postgres for auth');
        } catch (e) {
            console.log('Postgres failed, using files:', e.message);
            authState = await useFileAuthState();
        }
    } else {
        authState = await useFileAuthState();
        console.log('Using file-based auth');
    }

    const { state, saveCreds } = authState;
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
            console.log('   SCAN QR WITH WHATSAPP               ');
            console.log('═══════════════════════════════════════');
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            console.log('Disconnected:', code);

            if (code === DisconnectReason.loggedOut) {
                console.log('Logged out');
            }

            console.log('Reconnecting in 5s...');
            setTimeout(start, 5000);
        }

        if (connection === 'open') {
            console.log('');
            console.log('═══════════════════════════════════════');
            console.log('   ✅ CONNECTED! Bot is LIVE 24/7      ');
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

📊 sales - Sales report
📦 stock - Inventory
💸 expense - Expenses
📈 profit - Profit
🧾 bill - Bills
📋 report - Daily report
💡 help - Commands

_KadaiGPT AI_ 🤖`;
    }

    if (text.includes('sales')) {
        return `📊 *Today's Sales*
💰 Total: ₹12,450
🧾 Bills: 28
📈 +12% vs yesterday`;
    }

    if (text.includes('stock')) {
        return `📦 *Stock*
✅ In Stock: 156
⚠️ Low: 8
❌ Out: 3`;
    }

    if (text.includes('profit')) {
        return `📈 *Profit*
Revenue: ₹12,450
Cost: ₹3,200
Profit: ₹9,250 (74%)`;
    }

    if (text.includes('help')) {
        return `🤖 *Commands*
sales, stock, profit, expense, bill, report`;
    }

    return `Try: sales, stock, profit, help 🤖`;
}

setInterval(() => console.log(`[${new Date().toISOString()}] alive`), 300000);

process.on('uncaughtException', (e) => console.error('Error:', e.message));
process.on('unhandledRejection', (e) => console.error('Error:', e.message));

start();
