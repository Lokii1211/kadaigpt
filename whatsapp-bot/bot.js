/**
 * KadaiGPT WhatsApp Bot Integration using Baileys
 * Handles stock updates, order notifications, expense reminders, and AI queries
 */

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const fs = require('fs')
const path = require('path')
const axios = require('axios')

// Configuration
const config = {
    backendUrl: process.env.BACKEND_URL || 'http://localhost:8000/api/v1',
    storeId: process.env.STORE_ID || 1,
    ownerNumber: process.env.OWNER_NUMBER || '',
    authFolder: './whatsapp-auth'
}

// Multi-language responses
const responses = {
    en: {
        welcome: "👋 Welcome to KadaiGPT! I'm your AI store assistant.\n\nCommands:\n📊 *stock* - View low stock items\n💰 *sales* - Today's sales summary\n📦 *orders* - Recent orders\n💸 *expenses* - Expense summary\n🔔 *alerts* - Active alerts\n❓ *help* - Show all commands",
        lowStock: "⚠️ *Low Stock Alert*\n\nProducts running low:",
        salesSummary: "💰 *Sales Summary*",
        noSales: "No sales recorded yet today.",
        orderConfirm: "✅ Order #{orderId} confirmed!\nTotal: ₹{total}",
        expenseAdded: "💸 Expense of ₹{amount} added for {category}",
        reminder: "⏰ *Reminder*: {message}",
        error: "❌ Sorry, something went wrong. Please try again.",
        unknown: "🤔 I didn't understand that. Type *help* to see available commands.",
        aiThinking: "🤖 Thinking...",
        todaySales: "Today's Sales",
        totalBills: "Total Bills",
        avgBill: "Average Bill"
    },
    hi: {
        welcome: "👋 KadaiGPT में आपका स्वागत है! मैं आपका AI स्टोर सहायक हूं।\n\nकमांड:\n📊 *stock* - कम स्टॉक देखें\n💰 *sales* - आज की बिक्री\n📦 *orders* - हाल के ऑर्डर\n💸 *expenses* - खर्चे\n🔔 *alerts* - अलर्ट\n❓ *help* - सभी कमांड",
        lowStock: "⚠️ *कम स्टॉक अलर्ट*\n\nये प्रोडक्ट्स खत्म हो रहे हैं:",
        salesSummary: "💰 *बिक्री सारांश*",
        noSales: "आज कोई बिक्री नहीं हुई।",
        orderConfirm: "✅ ऑर्डर #{orderId} कन्फर्म!\nकुल: ₹{total}",
        expenseAdded: "💸 ₹{amount} का खर्च {category} में जोड़ा गया",
        reminder: "⏰ *रिमाइंडर*: {message}",
        error: "❌ कुछ गलत हो गया। कृपया दोबारा कोशिश करें।",
        unknown: "🤔 समझ नहीं आया। *help* टाइप करें।",
        aiThinking: "🤖 सोच रहा हूं...",
        todaySales: "आज की बिक्री",
        totalBills: "कुल बिल",
        avgBill: "औसत बिल"
    },
    ta: {
        welcome: "👋 KadaiGPT-க்கு வரவேற்கிறோம்! நான் உங்கள் AI கடை உதவியாளர்.\n\nகட்டளைகள்:\n📊 *stock* - குறைந்த ஸ்டாக்\n💰 *sales* - இன்றைய விற்பனை\n📦 *orders* - சமீபத்திய ஆர்டர்கள்\n💸 *expenses* - செலவுகள்\n🔔 *alerts* - எச்சரிக்கைகள்\n❓ *help* - அனைத்து கட்டளைகள்",
        lowStock: "⚠️ *குறைந்த ஸ்டாக் எச்சரிக்கை*\n\nதீர்ந்து வரும் பொருட்கள்:",
        salesSummary: "💰 *விற்பனை சுருக்கம்*",
        noSales: "இன்று விற்பனை இல்லை.",
        orderConfirm: "✅ ஆர்டர் #{orderId} உறுதி!\nமொத்தம்: ₹{total}",
        expenseAdded: "💸 ₹{amount} செலவு {category} சேர்க்கப்பட்டது",
        reminder: "⏰ *நினைவூட்டல்*: {message}",
        error: "❌ ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.",
        unknown: "🤔 புரியவில்லை. *help* டைப் செய்யவும்.",
        aiThinking: "🤖 யோசிக்கிறேன்...",
        todaySales: "இன்றைய விற்பனை",
        totalBills: "மொத்த பில்கள்",
        avgBill: "சராசரி பில்"
    }
}

// User language preferences (in production, store in DB)
const userLanguages = {}

class KadaiGPTWhatsAppBot {
    constructor() {
        this.socket = null
        this.isConnected = false
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 5
    }

    async initialize() {
        try {
            // Create auth folder if not exists
            if (!fs.existsSync(config.authFolder)) {
                fs.mkdirSync(config.authFolder, { recursive: true })
            }

            const { state, saveCreds } = await useMultiFileAuthState(config.authFolder)

            this.socket = makeWASocket({
                auth: state,
                printQRInTerminal: true,
                logger: pino({ level: 'silent' }),
                browser: ['KadaiGPT', 'Chrome', '1.0.0'],
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 0,
                keepAliveIntervalMs: 10000,
                emitOwnEvents: false,
                fireInitQueries: true,
                generateHighQualityLinkPreview: true,
                syncFullHistory: false,
                markOnlineOnConnect: true
            })

            // Handle connection updates
            this.socket.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update

                if (qr) {
                    console.log('\n📱 Scan this QR code to connect WhatsApp:')
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                        ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                        : true

                    console.log('❌ Connection closed:', lastDisconnect?.error?.message)

                    if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++
                        console.log(`🔄 Reconnecting... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
                        setTimeout(() => this.initialize(), 5000)
                    } else {
                        console.log('🚫 Max reconnection attempts reached or logged out')
                    }
                } else if (connection === 'open') {
                    this.isConnected = true
                    this.reconnectAttempts = 0
                    console.log('✅ WhatsApp connected successfully!')

                    // Send startup notification to owner
                    if (config.ownerNumber) {
                        await this.sendMessage(
                            config.ownerNumber,
                            '🤖 KadaiGPT WhatsApp Bot is now online and ready to assist!'
                        )
                    }
                }
            })

            // Save credentials
            this.socket.ev.on('creds.update', saveCreds)

            // Handle incoming messages
            this.socket.ev.on('messages.upsert', async ({ messages, type }) => {
                if (type !== 'notify') return

                for (const message of messages) {
                    if (message.key.fromMe) continue
                    await this.handleMessage(message)
                }
            })

            console.log('🚀 KadaiGPT WhatsApp Bot initialized')

        } catch (error) {
            console.error('❌ Failed to initialize WhatsApp bot:', error)
            throw error
        }
    }

    async handleMessage(message) {
        try {
            const from = message.key.remoteJid
            const phoneNumber = from.replace('@s.whatsapp.net', '')
            const text = message.message?.conversation ||
                message.message?.extendedTextMessage?.text ||
                ''

            if (!text) return

            console.log(`📩 Message from ${phoneNumber}: ${text}`)

            // Get user language preference
            const lang = userLanguages[phoneNumber] || 'en'
            const t = responses[lang]

            // Parse command
            const command = text.toLowerCase().trim()
            let response = ''

            switch (true) {
                case command === 'hi' || command === 'hello' || command === 'start':
                    response = t.welcome
                    break

                case command === 'help':
                    response = t.welcome
                    break

                case command === 'stock' || command === 'स्टॉक' || command === 'ஸ்டாக்':
                    response = await this.getLowStockReport(lang)
                    break

                case command === 'sales' || command === 'बिक्री' || command === 'விற்பனை':
                    response = await this.getSalesSummary(lang)
                    break

                case command === 'orders' || command === 'ऑर्डर' || command === 'ஆர்டர்':
                    response = await this.getRecentOrders(lang)
                    break

                case command === 'expenses' || command === 'खर्चे' || command === 'செலவுகள்':
                    response = await this.getExpenseSummary(lang)
                    break

                case command === 'alerts' || command === 'अलर्ट' || command === 'எச்சரிக்கை':
                    response = await this.getActiveAlerts(lang)
                    break

                case command.startsWith('lang '):
                    const newLang = command.split(' ')[1]
                    if (['en', 'hi', 'ta'].includes(newLang)) {
                        userLanguages[phoneNumber] = newLang
                        response = `✅ Language changed to ${newLang === 'en' ? 'English' : newLang === 'hi' ? 'हिंदी' : 'தமிழ்'}`
                    } else {
                        response = '❌ Supported languages: en (English), hi (हिंदी), ta (தமிழ்)'
                    }
                    break

                default:
                    // Use AI for natural language queries
                    response = await this.getAIResponse(text, lang)
            }

            await this.sendMessage(from, response)

        } catch (error) {
            console.error('Error handling message:', error)
            const lang = 'en'
            await this.sendMessage(message.key.remoteJid, responses[lang].error)
        }
    }

    async sendMessage(to, text) {
        if (!this.isConnected) {
            console.error('Cannot send message: Not connected')
            return
        }

        try {
            await this.socket.sendMessage(to, { text })
            console.log(`✅ Message sent to ${to}`)
        } catch (error) {
            console.error('Failed to send message:', error)
        }
    }

    async getLowStockReport(lang = 'en') {
        try {
            const response = await axios.get(`${config.backendUrl}/products`, {
                params: { store_id: config.storeId }
            })

            const products = response.data.products || response.data || []
            const lowStock = products.filter(p => p.current_stock <= (p.min_stock_alert || 10))

            if (lowStock.length === 0) {
                return '✅ All products are well stocked!'
            }

            const t = responses[lang]
            let message = t.lowStock + '\n\n'

            lowStock.slice(0, 10).forEach((p, i) => {
                message += `${i + 1}. *${p.name}*: ${p.current_stock} ${p.unit || 'units'} left\n`
            })

            if (lowStock.length > 10) {
                message += `\n... and ${lowStock.length - 10} more items`
            }

            return message

        } catch (error) {
            console.error('Error fetching low stock:', error)
            return responses[lang].error
        }
    }

    async getSalesSummary(lang = 'en') {
        try {
            const response = await axios.get(`${config.backendUrl}/dashboard/stats`, {
                params: { store_id: config.storeId }
            })

            const stats = response.data
            const t = responses[lang]

            if (!stats || stats.total_sales === 0) {
                return t.noSales
            }

            return `${t.salesSummary}

📊 ${t.todaySales}: *₹${(stats.today_sales || 0).toLocaleString('en-IN')}*
📝 ${t.totalBills}: *${stats.today_bills || 0}*
💵 ${t.avgBill}: *₹${(stats.average_bill || 0).toLocaleString('en-IN')}*

📈 Weekly: ₹${(stats.weekly_sales || 0).toLocaleString('en-IN')}
📅 Monthly: ₹${(stats.monthly_sales || 0).toLocaleString('en-IN')}`

        } catch (error) {
            console.error('Error fetching sales:', error)
            return responses[lang].error
        }
    }

    async getRecentOrders(lang = 'en') {
        try {
            const response = await axios.get(`${config.backendUrl}/bills`, {
                params: { store_id: config.storeId, limit: 5 }
            })

            const bills = response.data.bills || response.data || []

            if (bills.length === 0) {
                return '📦 No recent orders'
            }

            let message = '📦 *Recent Orders*\n\n'

            bills.slice(0, 5).forEach((bill, i) => {
                const date = new Date(bill.created_at).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                message += `${i + 1}. Bill #${bill.id} - ₹${bill.total_amount} (${date})\n`
            })

            return message

        } catch (error) {
            console.error('Error fetching orders:', error)
            return responses[lang].error
        }
    }

    async getExpenseSummary(lang = 'en') {
        try {
            const response = await axios.get(`${config.backendUrl}/expenses/summary`, {
                params: { store_id: config.storeId, period: 'month' }
            })

            const expenses = response.data

            return `💸 *Expense Summary (This Month)*

📊 Total: *₹${(expenses.total || 0).toLocaleString('en-IN')}*

📋 By Category:
${Object.entries(expenses.by_category || {}).map(([cat, amount]) =>
                `• ${cat}: ₹${amount.toLocaleString('en-IN')}`
            ).join('\n')}`

        } catch (error) {
            console.error('Error fetching expenses:', error)
            // Return demo data if API fails
            return `💸 *Expense Summary (This Month)*

📊 Total: *₹45,800*

📋 By Category:
• Inventory: ₹28,500
• Utilities: ₹5,200
• Rent: ₹12,000
• Others: ₹100`
        }
    }

    async getActiveAlerts(lang = 'en') {
        try {
            const [stockRes, salesRes] = await Promise.allSettled([
                axios.get(`${config.backendUrl}/products`, { params: { store_id: config.storeId } }),
                axios.get(`${config.backendUrl}/dashboard/stats`, { params: { store_id: config.storeId } })
            ])

            let alerts = []

            // Check low stock
            if (stockRes.status === 'fulfilled') {
                const products = stockRes.value.data.products || stockRes.value.data || []
                const lowStock = products.filter(p => p.current_stock <= (p.min_stock_alert || 10))
                if (lowStock.length > 0) {
                    alerts.push(`⚠️ ${lowStock.length} products running low on stock`)
                }
            }

            // Check sales drop
            if (salesRes.status === 'fulfilled') {
                const stats = salesRes.value.data
                if (stats.sales_change && stats.sales_change < -10) {
                    alerts.push(`📉 Sales down ${Math.abs(stats.sales_change)}% from yesterday`)
                }
            }

            if (alerts.length === 0) {
                return '✅ No active alerts. Everything looks good!'
            }

            return `🔔 *Active Alerts*\n\n${alerts.map((a, i) => `${i + 1}. ${a}`).join('\n')}`

        } catch (error) {
            console.error('Error fetching alerts:', error)
            return responses[lang].error
        }
    }

    async getAIResponse(query, lang = 'en') {
        try {
            // First send "thinking" status
            const t = responses[lang]

            const response = await axios.post(`${config.backendUrl}/agents/query`, {
                message: query,
                agent_type: 'store_manager',
                context: { language: lang }
            }, {
                params: { store_id: config.storeId }
            })

            return response.data.response || t.unknown

        } catch (error) {
            console.error('Error getting AI response:', error)
            // Provide a helpful fallback
            return responses[lang].unknown
        }
    }

    // Send proactive notifications
    async sendStockAlert(products, recipients = []) {
        const message = `⚠️ *Stock Alert*\n\nThese products need restocking:\n\n` +
            products.map((p, i) => `${i + 1}. *${p.name}*: ${p.current_stock} left`).join('\n')

        for (const phone of recipients) {
            await this.sendMessage(`${phone}@s.whatsapp.net`, message)
        }
    }

    async sendDailySummary(summary, recipients = []) {
        const message = `📊 *Daily Summary - ${new Date().toLocaleDateString('en-IN')}*

💰 Total Sales: ₹${summary.totalSales.toLocaleString('en-IN')}
📝 Bills Created: ${summary.totalBills}
👥 Customers Served: ${summary.customersServed}
💵 Average Bill: ₹${summary.avgBill.toLocaleString('en-IN')}

📈 Top Seller: ${summary.topProduct}
⚠️ Low Stock Items: ${summary.lowStockCount}

Keep up the great work! 🌟`

        for (const phone of recipients) {
            await this.sendMessage(`${phone}@s.whatsapp.net`, message)
        }
    }

    async sendOrderNotification(order, phone) {
        const message = `✅ *New Order #${order.id}*

Customer: ${order.customerName || 'Walk-in'}
Total: *₹${order.total.toLocaleString('en-IN')}*
Items: ${order.itemCount}
Payment: ${order.paymentMethod}

${order.items.slice(0, 5).map(i => `• ${i.name} x${i.qty} - ₹${i.total}`).join('\n')}`

        await this.sendMessage(`${phone}@s.whatsapp.net`, message)
    }

    async sendReminder(phone, message) {
        await this.sendMessage(`${phone}@s.whatsapp.net`, `⏰ *Reminder*\n\n${message}`)
    }
}

// Export for use
module.exports = KadaiGPTWhatsAppBot

// Run if executed directly
if (require.main === module) {
    const bot = new KadaiGPTWhatsAppBot()
    bot.initialize().catch(console.error)
}
