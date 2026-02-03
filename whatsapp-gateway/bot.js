/**
 * KadaiGPT WhatsApp Bot v3.2
 * Postgres session + QR Code URL for easy scanning
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

const DATABASE_URL = process.env.DATABASE_URL;
const AUTH_DIR = './auth_info';

let pool = null;
if (DATABASE_URL) {
    pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
}

console.log('');
console.log('╔═══════════════════════════════════════╗');
console.log('║   KadaiGPT WhatsApp Bot v3.2          ║');
console.log('╚═══════════════════════════════════════╝');
console.log('');

// Postgres-based auth state
async function usePostgresAuthState() {
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
            console.log('✅ Postgres auth ready');
        } catch (e) {
            console.log('Postgres error:', e.message);
            authState = await useFileAuthState();
        }
    } else {
        authState = await useFileAuthState();
    }

    const { state, saveCreds } = authState;
    const { version } = await fetchLatestBaileysVersion();

    console.log('WhatsApp:', version.join('.'));
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
            console.log('══════════════════════════════════════════════════════');
            console.log('');
            console.log('   📱 SCAN THIS QR CODE:');
            console.log('');
            console.log('   https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(qr));
            console.log('');
            console.log('   1. Copy the URL above');
            console.log('   2. Open in browser');
            console.log('   3. Scan QR with WhatsApp → Linked Devices');
            console.log('');
            console.log('══════════════════════════════════════════════════════');
            console.log('');
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            console.log('Disconnected:', code);
            setTimeout(start, 5000);
        }

        if (connection === 'open') {
            console.log('');
            console.log('══════════════════════════════════════════════════════');
            console.log('   ✅ CONNECTED! KadaiGPT Bot is LIVE 24/7');
            console.log('══════════════════════════════════════════════════════');
            console.log('');
        }
    });

    sock.ev.on('creds.update', saveCreds);

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
💡 help - Commands

_KadaiGPT AI_ 🤖`;
    }

    if (text.includes('sales')) return `📊 *Sales*\n💰 ₹12,450 | 🧾 28 bills | 📈 +12%`;
    if (text.includes('stock')) return `📦 *Stock*\n✅ 156 in | ⚠️ 8 low | ❌ 3 out`;
    if (text.includes('profit')) return `📈 *Profit*\n₹12,450 - ₹3,200 = ₹9,250 (74%)`;
    if (text.includes('expense')) return `💸 *Expense*\nToday: ₹3,200 | Month: ₹45,600`;
    if (text.includes('bill')) return `🧾 *Bills*\n#1234 ₹850 | #1233 ₹1,200 | #1232 ₹450`;
    if (text.includes('help')) return `🤖 sales, stock, profit, expense, bill`;
    if (text.includes('thank')) return `🙏 Happy to help!`;

    return `Try: sales, stock, profit, help 🤖`;
}

setInterval(() => console.log(`[${new Date().toISOString()}] ♥`), 300000);
process.on('uncaughtException', (e) => console.error('Error:', e.message));
process.on('unhandledRejection', (e) => console.error('Error:', e.message));

start();
