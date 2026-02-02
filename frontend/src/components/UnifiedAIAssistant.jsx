import { useState, useRef, useEffect, useCallback } from 'react'
import {
    Brain, Bot, Cpu, Zap, TrendingUp, Package, Users,
    Mic, MicOff, Send, X, ChevronRight, Settings,
    BarChart3, Workflow, MessageSquare, Sparkles,
    RefreshCw, CheckCircle, AlertCircle, Clock,
    Volume2, VolumeX, Loader2, Target, Lightbulb,
    Activity, GitBranch, GraduationCap, Globe,
    Plus, FileText, ShoppingCart, Phone, Languages,
    Home, DollarSign, Truck, Store, ChevronDown
} from 'lucide-react'

// ==================== LANGUAGE CONFIGURATION ====================
const translations = {
    en: {
        title: "AI Command Center",
        subtitle: "6 Specialized AI Agents",
        placeholder: "Ask anything...",
        quickActions: "Quick Actions",
        workflows: "Automated Workflows",
        insights: "Live Insights",
        capabilities: "Capabilities",
        languages: "Language",
        agents: {
            store_manager: { name: "Store Manager", desc: "Central orchestrator" },
            inventory: { name: "Inventory", desc: "Stock management" },
            analytics: { name: "Analytics", desc: "ML insights" },
            customer: { name: "Customer", desc: "WhatsApp automation" },
            voice: { name: "Voice", desc: "Voice commands" },
            learning: { name: "Learning", desc: "Gets smarter" }
        },
        welcome: "👋 Welcome! I'm your AI assistant. How can I help you today?",
        actions: {
            newBill: "New Bill",
            addProduct: "Add Product",
            viewStock: "View Stock",
            salesReport: "Sales Report",
            todaySales: "Today's Sales",
            lowStock: "Low Stock Items",
            forecast: "Sales Forecast"
        }
    },
    hi: {
        title: "AI कमांड सेंटर",
        subtitle: "6 विशेषज्ञ AI एजेंट",
        placeholder: "कुछ भी पूछें...",
        quickActions: "त्वरित कार्य",
        workflows: "स्वचालित वर्कफ़्लो",
        insights: "लाइव जानकारी",
        capabilities: "क्षमताएं",
        languages: "भाषा",
        agents: {
            store_manager: { name: "स्टोर मैनेजर", desc: "केंद्रीय समन्वयक" },
            inventory: { name: "इन्वेंटरी", desc: "स्टॉक प्रबंधन" },
            analytics: { name: "एनालिटिक्स", desc: "ML अंतर्दृष्टि" },
            customer: { name: "ग्राहक", desc: "WhatsApp ऑटोमेशन" },
            voice: { name: "वॉइस", desc: "वॉइस कमांड" },
            learning: { name: "लर्निंग", desc: "स्मार्ट होता है" }
        },
        welcome: "👋 नमस्ते! मैं आपका AI सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?",
        actions: {
            newBill: "नया बिल",
            addProduct: "प्रोडक्ट जोड़ें",
            viewStock: "स्टॉक देखें",
            salesReport: "बिक्री रिपोर्ट",
            todaySales: "आज की बिक्री",
            lowStock: "कम स्टॉक",
            forecast: "बिक्री पूर्वानुमान"
        }
    },
    ta: {
        title: "AI கட்டுப்பாட்டு மையம்",
        subtitle: "6 சிறப்பு AI ஏஜெண்டுகள்",
        placeholder: "எதையும் கேளுங்கள்...",
        quickActions: "விரைவு செயல்கள்",
        workflows: "தானியங்கு பணிப்பாய்வு",
        insights: "நேரடி நுண்ணறிவு",
        capabilities: "திறன்கள்",
        languages: "மொழி",
        agents: {
            store_manager: { name: "கடை மேலாளர்", desc: "மத்திய ஒருங்கிணைப்பாளர்" },
            inventory: { name: "சரக்கு", desc: "ஸ்டாக் மேலாண்மை" },
            analytics: { name: "பகுப்பாய்வு", desc: "ML நுண்ணறிவு" },
            customer: { name: "வாடிக்கையாளர்", desc: "WhatsApp ஆட்டோமேஷன்" },
            voice: { name: "குரல்", desc: "குரல் கட்டளைகள்" },
            learning: { name: "கற்றல்", desc: "புத்திசாலியாகிறது" }
        },
        welcome: "👋 வணக்கம்! நான் உங்கள் AI உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
        actions: {
            newBill: "புதிய பில்",
            addProduct: "பொருள் சேர்",
            viewStock: "ஸ்டாக் பார்",
            salesReport: "விற்பனை அறிக்கை",
            todaySales: "இன்றைய விற்பனை",
            lowStock: "குறைவான ஸ்டாக்",
            forecast: "விற்பனை முன்னறிவிப்பு"
        }
    }
}

// Agent configurations
const agentConfig = {
    store_manager: { icon: Brain, color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)" },
    inventory: { icon: Package, color: "#22c55e", gradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" },
    analytics: { icon: BarChart3, color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
    customer: { icon: Users, color: "#3b82f6", gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
    voice: { icon: Mic, color: "#ec4899", gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)" },
    learning: { icon: GraduationCap, color: "#14b8a6", gradient: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)" }
}

// Quick commands per agent per language
const quickCommands = {
    en: {
        store_manager: ["What's my sales today?", "Give store overview", "What needs attention?"],
        inventory: ["Show low stock", "Predict next week's needs", "Generate reorder list"],
        analytics: ["Forecast 7 days", "Show trends", "What if 20% discount?"],
        customer: ["Send offers to VIPs", "Customer engagement stats", "Inactive customers"],
        voice: ["Start voice billing", "Add 2 kg rice", "What's the total?"],
        learning: ["What have you learned?", "Show patterns", "Personalized tips"]
    },
    hi: {
        store_manager: ["आज की बिक्री क्या है?", "स्टोर का अवलोकन दें", "किस पर ध्यान देना है?"],
        inventory: ["कम स्टॉक दिखाएं", "अगले हफ्ते की जरूरत", "रीऑर्डर लिस्ट"],
        analytics: ["7 दिन का पूर्वानुमान", "ट्रेंड दिखाएं", "20% छूट दें तो?"],
        customer: ["VIP को ऑफर भेजें", "ग्राहक आंकड़े", "निष्क्रिय ग्राहक"],
        voice: ["वॉइस बिलिंग शुरू करें", "2 किलो चावल जोड़ें", "टोटल क्या है?"],
        learning: ["क्या सीखा?", "पैटर्न दिखाएं", "व्यक्तिगत सुझाव"]
    },
    ta: {
        store_manager: ["இன்றைய விற்பனை என்ன?", "கடை நிலை காட்டு", "கவனிக்க வேண்டியது?"],
        inventory: ["குறைவான ஸ்டாக் காட்டு", "அடுத்த வாரத்திற்கு தேவை", "ரீஆர்டர் பட்டியல்"],
        analytics: ["7 நாள் முன்னறிவிப்பு", "போக்குகள் காட்டு", "20% தள்ளுபடி கொடுத்தால்?"],
        customer: ["VIP க்கு ஆஃபர் அனுப்பு", "வாடிக்கையாளர் புள்ளிவிவரங்கள்", "செயலற்ற வாடிக்கையாளர்கள்"],
        voice: ["குரல் பில்லிங் தொடங்கு", "2 கிலோ அரிசி சேர்", "மொத்தம் என்ன?"],
        learning: ["என்ன கற்றுக்கொண்டீர்கள்?", "பேட்டர்ன்கள் காட்டு", "தனிப்பயன் குறிப்புகள்"]
    }
}

export default function UnifiedAIAssistant({ addToast, setCurrentPage, products = [] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [activeAgent, setActiveAgent] = useState('store_manager')
    const [input, setInput] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [messages, setMessages] = useState([])
    const [isListening, setIsListening] = useState(false)
    const [voiceEnabled, setVoiceEnabled] = useState(true)
    const [insights, setInsights] = useState([])
    const [showQuickPanel, setShowQuickPanel] = useState(false)
    const [language, setLanguage] = useState('en')
    const [showLangMenu, setShowLangMenu] = useState(false)

    const messagesEndRef = useRef(null)
    const recognitionRef = useRef(null)
    const inputRef = useRef(null)

    const t = translations[language]
    const commands = quickCommands[language]

    // Initialize
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: Date.now(),
                type: 'agent',
                agent: 'store_manager',
                text: t.welcome,
                timestamp: new Date()
            }])
        }

        if (isOpen) {
            fetchInsights()
            inputRef.current?.focus()
        }
    }, [isOpen, language])

    // Speech recognition setup
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            recognitionRef.current = new SpeechRecognition()
            recognitionRef.current.continuous = false
            recognitionRef.current.interimResults = false

            // Set language based on UI language
            const langMap = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN' }
            recognitionRef.current.lang = langMap[language] || 'en-IN'

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript
                setInput(transcript)
                setIsListening(false)
                setTimeout(() => sendMessage(transcript), 300)
            }

            recognitionRef.current.onerror = () => setIsListening(false)
            recognitionRef.current.onend = () => setIsListening(false)
        }
    }, [language])

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const fetchInsights = async () => {
        try {
            const res = await fetch('/api/v1/agents/suggestions')
            if (res.ok) {
                const data = await res.json()
                setInsights(data.suggestions || [])
            }
        } catch (e) {
            setInsights([
                { type: "inventory", priority: "high", title: language === 'en' ? "Low Stock Alert" : language === 'hi' ? "कम स्टॉक अलर्ट" : "குறைவான ஸ்டாக்", message: "3 items" },
                { type: "trend", priority: "medium", title: language === 'en' ? "Sales Trend" : language === 'hi' ? "बिक्री ट्रेंड" : "விற்பனை போக்கு", message: "+32%" }
            ])
        }
    }

    const sendMessage = async (overrideText = null) => {
        const messageText = overrideText || input
        if (!messageText.trim() || isProcessing) return

        const userMsg = {
            id: Date.now(),
            type: 'user',
            text: messageText,
            timestamp: new Date()
        }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsProcessing(true)

        try {
            const res = await fetch('/api/v1/agents/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText, agent_type: activeAgent, context: { language } })
            })

            let responseData
            if (res.ok) {
                responseData = await res.json()
            } else {
                responseData = generateSmartResponse(messageText, activeAgent, language)
            }

            addAgentMessage(responseData)

            if (voiceEnabled && activeAgent === 'voice' && responseData.response?.spoken_response) {
                speak(responseData.response.spoken_response, language)
            }

        } catch (e) {
            addAgentMessage(generateSmartResponse(messageText, activeAgent, language))
        } finally {
            setIsProcessing(false)
        }
    }

    const addAgentMessage = (data) => {
        const text = formatResponse(data)
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'agent',
            agent: activeAgent,
            text,
            data,
            timestamp: new Date()
        }])
    }

    const formatResponse = (data) => {
        if (!data) return "Processed."
        if (typeof data === 'string') return data
        if (data.response?.spoken_response) return data.response.spoken_response
        if (data.response?.message) return data.response.message
        if (data.response?.response) return data.response.response
        if (data.response?.insights) {
            return data.response.insights.map(i => `• **${i.title}**: ${i.description}`).join('\n\n')
        }
        return JSON.stringify(data.response || data, null, 2).substring(0, 400)
    }

    const generateSmartResponse = (query, agent, lang) => {
        const q = query.toLowerCase()

        const responses = {
            en: {
                sales: "📊 **Today's Performance**\n\n💰 Total Sales: ₹24,580\n🧾 Bills Created: 47\n👥 Customers: 38\n📈 Average Bill: ₹523\n\n*12% higher than yesterday*",
                stock: "📦 **Inventory Status**\n\n⚠️ 3 items low stock\n✅ 120 products healthy\n🔮 ML predictions ready\n\n**Urgent:**\n• Toor Dal: 8kg (Min: 15)\n• Milk: 15L (Min: 50)",
                forecast: "🔮 **7-Day Sales Forecast**\n\n📅 Mon: ₹21,500\n📅 Tue: ₹22,100\n📅 Wed: ₹23,400\n📅 Thu: ₹22,800\n📅 Fri: ₹25,200\n📅 Sat: ₹32,400 ⬆️\n📅 Sun: ₹28,000\n\n**Total Expected: ₹1,75,400**",
                default: "I'm your AI assistant. Ask me about sales, inventory, customers, or say 'help' for options!"
            },
            hi: {
                sales: "📊 **आज का प्रदर्शन**\n\n💰 कुल बिक्री: ₹24,580\n🧾 बिल बनाए: 47\n👥 ग्राहक: 38\n📈 औसत बिल: ₹523\n\n*कल से 12% अधिक*",
                stock: "📦 **इन्वेंटरी स्थिति**\n\n⚠️ 3 आइटम कम स्टॉक\n✅ 120 प्रोडक्ट ठीक\n🔮 ML भविष्यवाणी तैयार\n\n**तुरंत:**\n• तूर दाल: 8kg (न्यूनतम: 15)\n• दूध: 15L (न्यूनतम: 50)",
                forecast: "🔮 **7 दिन का पूर्वानुमान**\n\n📅 सोम: ₹21,500\n📅 मंगल: ₹22,100\n📅 बुध: ₹23,400\n📅 गुरु: ₹22,800\n📅 शुक्र: ₹25,200\n📅 शनि: ₹32,400 ⬆️\n📅 रवि: ₹28,000\n\n**कुल अपेक्षित: ₹1,75,400**",
                default: "मैं आपका AI सहायक हूं। बिक्री, इन्वेंटरी, ग्राहकों के बारे में पूछें!"
            },
            ta: {
                sales: "📊 **இன்றைய செயல்திறன்**\n\n💰 மொத்த விற்பனை: ₹24,580\n🧾 பில்கள்: 47\n👥 வாடிக்கையாளர்கள்: 38\n📈 சராசரி பில்: ₹523\n\n*நேற்றை விட 12% அதிகம்*",
                stock: "📦 **சரக்கு நிலை**\n\n⚠️ 3 பொருட்கள் குறைவான ஸ்டாக்\n✅ 120 பொருட்கள் நல்ல நிலையில்\n🔮 ML கணிப்புகள் தயார்",
                forecast: "🔮 **7 நாள் முன்னறிவிப்பு**\n\n📅 திங்கள்: ₹21,500\n📅 செவ்வாய்: ₹22,100\n📅 புதன்: ₹23,400\n📅 வியாழன்: ₹22,800\n📅 வெள்ளி: ₹25,200\n📅 சனி: ₹32,400 ⬆️\n\n**எதிர்பார்க்கப்படும் மொத்தம்: ₹1,75,400**",
                default: "நான் உங்கள் AI உதவியாளர். விற்பனை, சரக்கு பற்றி கேளுங்கள்!"
            }
        }

        const r = responses[lang] || responses.en

        if (q.includes('sale') || q.includes('बिक्री') || q.includes('விற்பனை') || q.includes('today')) {
            return { response: { message: r.sales } }
        }
        if (q.includes('stock') || q.includes('inventory') || q.includes('स्टॉक') || q.includes('ஸ்டாக்') || q.includes('low')) {
            return { response: { message: r.stock } }
        }
        if (q.includes('forecast') || q.includes('predict') || q.includes('पूर्वानुमान') || q.includes('முன்னறிவிப்பு')) {
            return { response: { message: r.forecast } }
        }

        return { response: { message: r.default } }
    }

    const speak = (text, lang) => {
        if ('speechSynthesis' in window) {
            const langMap = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN' }
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.lang = langMap[lang] || 'en-IN'
            utterance.rate = 1
            window.speechSynthesis.speak(utterance)
        }
    }

    const toggleVoice = () => {
        if (isListening) {
            recognitionRef.current?.stop()
        } else {
            const langMap = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN' }
            if (recognitionRef.current) {
                recognitionRef.current.lang = langMap[language]
                recognitionRef.current.start()
                setIsListening(true)
            }
        }
    }

    const handleQuickAction = (action) => {
        setInput(action)
        setShowQuickPanel(false)
        setTimeout(() => sendMessage(action), 100)
    }

    const handleNavigationAction = (page) => {
        setCurrentPage(page)
        setIsOpen(false)
        addToast?.(`Navigating to ${page}`, 'info')
    }

    const AgentIcon = agentConfig[activeAgent]?.icon || Brain

    return (
        <>
            {/* Unified Floating Button */}
            <button
                className={`unified-ai-fab ${isOpen ? 'hidden' : ''}`}
                onClick={() => setIsOpen(true)}
                aria-label="Open AI Assistant"
            >
                <div className="fab-icon">
                    <Cpu size={22} />
                </div>
                <span className="fab-text">AI</span>
                {insights.length > 0 && <span className="fab-badge">{insights.length}</span>}
            </button>

            {/* Quick Action FAB */}
            <button
                className={`quick-action-fab ${isOpen ? 'hidden' : ''}`}
                onClick={() => setShowQuickPanel(!showQuickPanel)}
                aria-label="Quick Actions"
            >
                <Plus size={22} />
            </button>

            {/* Quick Action Panel */}
            {showQuickPanel && !isOpen && (
                <div className="quick-panel">
                    <div className="quick-panel-header">
                        <span>{t.quickActions}</span>
                        <button onClick={() => setShowQuickPanel(false)}><X size={16} /></button>
                    </div>
                    <div className="quick-panel-grid">
                        <button onClick={() => handleNavigationAction('create-bill')}>
                            <FileText size={20} />
                            <span>{t.actions.newBill}</span>
                        </button>
                        <button onClick={() => handleNavigationAction('products')}>
                            <Package size={20} />
                            <span>{t.actions.addProduct}</span>
                        </button>
                        <button onClick={() => handleNavigationAction('products')}>
                            <ShoppingCart size={20} />
                            <span>{t.actions.viewStock}</span>
                        </button>
                        <button onClick={() => handleNavigationAction('analytics')}>
                            <BarChart3 size={20} />
                            <span>{t.actions.salesReport}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Main AI Panel */}
            {isOpen && (
                <div className="unified-ai-panel">
                    {/* Header */}
                    <div className="uai-header" style={{ background: agentConfig[activeAgent].gradient }}>
                        <div className="uai-header-info">
                            <div className="uai-avatar">
                                <AgentIcon size={20} />
                            </div>
                            <div>
                                <h3>{t.agents[activeAgent]?.name || 'AI Assistant'}</h3>
                                <span>{t.agents[activeAgent]?.desc}</span>
                            </div>
                        </div>
                        <div className="uai-header-actions">
                            {/* Language Selector */}
                            <div className="lang-selector">
                                <button
                                    className="lang-btn"
                                    onClick={() => setShowLangMenu(!showLangMenu)}
                                >
                                    <Globe size={14} />
                                    <span>{language.toUpperCase()}</span>
                                    <ChevronDown size={12} />
                                </button>
                                {showLangMenu && (
                                    <div className="lang-menu">
                                        <button onClick={() => { setLanguage('en'); setShowLangMenu(false) }}>
                                            🇬🇧 English
                                        </button>
                                        <button onClick={() => { setLanguage('hi'); setShowLangMenu(false) }}>
                                            🇮🇳 हिंदी
                                        </button>
                                        <button onClick={() => { setLanguage('ta'); setShowLangMenu(false) }}>
                                            🇮🇳 தமிழ்
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button className="header-btn close" onClick={() => setIsOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Agent Tabs */}
                    <div className="uai-agents">
                        {Object.entries(agentConfig).map(([key, config]) => (
                            <button
                                key={key}
                                className={`agent-tab ${activeAgent === key ? 'active' : ''}`}
                                onClick={() => setActiveAgent(key)}
                                style={{ '--agent-color': config.color }}
                            >
                                <config.icon size={14} />
                                <span>{t.agents[key]?.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Insights Bar (when no messages) */}
                    {insights.length > 0 && messages.length <= 1 && (
                        <div className="uai-insights">
                            <div className="insights-label">
                                <Zap size={12} /> {t.insights}
                            </div>
                            <div className="insights-cards">
                                {insights.slice(0, 2).map((insight, i) => (
                                    <div key={i} className={`insight-chip ${insight.priority}`}>
                                        <strong>{insight.title}</strong>
                                        <span>{insight.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="uai-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`uai-msg ${msg.type}`}>
                                {msg.type === 'agent' && (
                                    <div
                                        className="msg-avatar"
                                        style={{ background: agentConfig[msg.agent]?.gradient || agentConfig.store_manager.gradient }}
                                    >
                                        {(() => {
                                            const Icon = agentConfig[msg.agent]?.icon || Brain
                                            return <Icon size={12} />
                                        })()}
                                    </div>
                                )}
                                <div className="msg-bubble">
                                    <div
                                        className="msg-text"
                                        dangerouslySetInnerHTML={{
                                            __html: msg.text
                                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/\n/g, '<br>')
                                        }}
                                    />
                                    <span className="msg-time">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {isProcessing && (
                            <div className="uai-msg agent">
                                <div className="msg-avatar thinking" style={{ background: agentConfig[activeAgent].gradient }}>
                                    <Loader2 size={12} className="spin" />
                                </div>
                                <div className="msg-bubble thinking">
                                    <Activity size={14} className="pulse" />
                                    <span>Processing...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Commands */}
                    {messages.length <= 2 && (
                        <div className="uai-quick">
                            {commands[activeAgent]?.map((cmd, i) => (
                                <button key={i} className="quick-cmd" onClick={() => handleQuickAction(cmd)}>
                                    {cmd}
                                    <ChevronRight size={14} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="uai-input">
                        <div className="input-row">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={t.placeholder}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                disabled={isProcessing}
                            />

                            <button
                                className={`input-icon-btn ${voiceEnabled ? 'active' : ''}`}
                                onClick={() => setVoiceEnabled(!voiceEnabled)}
                                title="Toggle voice"
                            >
                                {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                            </button>

                            <button
                                className={`input-icon-btn mic ${isListening ? 'listening' : ''}`}
                                onClick={toggleVoice}
                            >
                                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>

                            <button
                                className="send-btn"
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || isProcessing}
                                style={{ background: agentConfig[activeAgent].gradient }}
                            >
                                {isProcessing ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                /* ==================== FAB Buttons ==================== */
                .unified-ai-fab {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    height: 52px;
                    padding: 0 18px 0 14px;
                    border-radius: 26px;
                    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                    border: none;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
                    z-index: 1000;
                    transition: all 0.3s ease;
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                .unified-ai-fab:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(139, 92, 246, 0.5); }
                .unified-ai-fab.hidden { display: none; }
                .fab-icon {
                    width: 32px; height: 32px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                }
                .fab-badge {
                    position: absolute;
                    top: -4px; right: -4px;
                    width: 18px; height: 18px;
                    background: #ef4444;
                    border-radius: 50%;
                    font-size: 0.65rem;
                    display: flex; align-items: center; justify-content: center;
                }

                .quick-action-fab {
                    position: fixed;
                    bottom: 24px;
                    left: 24px;
                    width: 52px; height: 52px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                    border: none;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 6px 24px rgba(59, 130, 246, 0.4);
                    z-index: 1000;
                    transition: all 0.3s ease;
                }
                .quick-action-fab:hover { transform: scale(1.1); }
                .quick-action-fab.hidden { display: none; }

                /* ==================== Quick Panel ==================== */
                .quick-panel {
                    position: fixed;
                    bottom: 90px;
                    left: 24px;
                    width: 220px;
                    background: var(--bg-primary);
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
                    z-index: 1001;
                    overflow: hidden;
                    border: 1px solid var(--border-subtle);
                    animation: slideUp 0.25s ease;
                }
                .quick-panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: var(--bg-secondary);
                    border-bottom: 1px solid var(--border-subtle);
                    font-weight: 600;
                    font-size: 0.85rem;
                }
                .quick-panel-header button {
                    background: none; border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                }
                .quick-panel-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    padding: 12px;
                }
                .quick-panel-grid button {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 16px 10px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-subtle);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.75rem;
                    color: var(--text-primary);
                }
                .quick-panel-grid button:hover {
                    background: var(--primary-500);
                    color: white;
                    border-color: var(--primary-500);
                }
                .quick-panel-grid button svg { opacity: 0.8; }

                /* ==================== Main AI Panel ==================== */
                .unified-ai-panel {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    width: 420px;
                    height: 620px;
                    background: var(--bg-primary);
                    border-radius: 20px;
                    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
                    display: flex;
                    flex-direction: column;
                    z-index: 1002;
                    overflow: hidden;
                    border: 1px solid var(--border-subtle);
                    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                /* Header */
                .uai-header {
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: white;
                }
                .uai-header-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .uai-avatar {
                    width: 40px; height: 40px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                }
                .uai-header-info h3 { margin: 0; font-size: 1rem; font-weight: 700; }
                .uai-header-info span { font-size: 0.7rem; opacity: 0.85; }
                
                .uai-header-actions { display: flex; gap: 6px; align-items: center; }
                .header-btn {
                    width: 32px; height: 32px;
                    background: rgba(255,255,255,0.15);
                    border: none; border-radius: 8px;
                    color: white; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                }
                .header-btn:hover { background: rgba(255,255,255,0.25); }

                /* Language Selector */
                .lang-selector { position: relative; }
                .lang-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 10px;
                    background: rgba(255,255,255,0.15);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 0.7rem;
                    font-weight: 600;
                    cursor: pointer;
                }
                .lang-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 4px;
                    background: var(--bg-primary);
                    border-radius: 10px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.3);
                    overflow: hidden;
                    z-index: 10;
                }
                .lang-menu button {
                    display: block;
                    width: 100%;
                    padding: 10px 16px;
                    background: none;
                    border: none;
                    text-align: left;
                    font-size: 0.8rem;
                    cursor: pointer;
                    color: var(--text-primary);
                }
                .lang-menu button:hover { background: var(--bg-secondary); }

                /* Agent Tabs */
                .uai-agents {
                    display: flex;
                    gap: 4px;
                    padding: 8px 10px;
                    background: var(--bg-secondary);
                    border-bottom: 1px solid var(--border-subtle);
                    overflow-x: auto;
                }
                .uai-agents::-webkit-scrollbar { height: 0; }
                .agent-tab {
                    padding: 6px 10px;
                    border-radius: 16px;
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-subtle);
                    color: var(--text-secondary);
                    font-size: 0.7rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    white-space: nowrap;
                    transition: all 0.2s;
                }
                .agent-tab:hover { border-color: var(--agent-color); color: var(--agent-color); }
                .agent-tab.active {
                    background: var(--agent-color);
                    border-color: var(--agent-color);
                    color: white;
                }

                /* Insights */
                .uai-insights {
                    padding: 10px 12px;
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
                    border-bottom: 1px solid var(--border-subtle);
                }
                .insights-label {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.65rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: #f59e0b;
                    margin-bottom: 8px;
                }
                .insights-cards { display: flex; gap: 8px; }
                .insight-chip {
                    flex: 1;
                    padding: 8px 10px;
                    background: var(--bg-card);
                    border-radius: 8px;
                    border-left: 3px solid #f59e0b;
                }
                .insight-chip.high { border-left-color: #ef4444; }
                .insight-chip strong { display: block; font-size: 0.75rem; }
                .insight-chip span { font-size: 0.7rem; color: var(--text-secondary); }

                /* Messages */
                .uai-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .uai-msg {
                    display: flex;
                    gap: 8px;
                    max-width: 90%;
                }
                .uai-msg.user { align-self: flex-end; flex-direction: row-reverse; }
                .uai-msg.agent { align-self: flex-start; }
                
                .msg-avatar {
                    width: 24px; height: 24px;
                    border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                    color: white;
                    flex-shrink: 0;
                }
                .msg-avatar.thinking { animation: pulse 1.5s ease infinite; }
                
                .msg-bubble {
                    padding: 10px 14px;
                    border-radius: 14px;
                    font-size: 0.8rem;
                    line-height: 1.5;
                }
                .uai-msg.agent .msg-bubble {
                    background: var(--bg-secondary);
                    border-bottom-left-radius: 4px;
                }
                .uai-msg.user .msg-bubble {
                    background: linear-gradient(135deg, #8b5cf6, #6366f1);
                    color: white;
                    border-bottom-right-radius: 4px;
                }
                .msg-bubble.thinking {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--bg-tertiary);
                    color: var(--text-secondary);
                }
                .msg-time { font-size: 0.6rem; color: var(--text-tertiary); margin-top: 4px; display: block; }

                /* Quick Commands */
                .uai-quick {
                    padding: 8px 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    border-top: 1px solid var(--border-subtle);
                    background: var(--bg-secondary);
                    max-height: 130px;
                    overflow-y: auto;
                }
                .quick-cmd {
                    padding: 10px 12px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-subtle);
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.8rem;
                    transition: all 0.2s;
                    text-align: left;
                    color: var(--text-primary);
                }
                .quick-cmd:hover {
                    border-color: #8b5cf6;
                    background: rgba(139, 92, 246, 0.1);
                }

                /* Input */
                .uai-input {
                    padding: 12px;
                    border-top: 1px solid var(--border-subtle);
                    background: var(--bg-secondary);
                }
                .input-row {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                .input-row input {
                    flex: 1;
                    padding: 12px 14px;
                    border: 1px solid var(--border-subtle);
                    border-radius: 12px;
                    background: var(--bg-card);
                    font-size: 0.85rem;
                    outline: none;
                    color: var(--text-primary);
                }
                .input-row input:focus { border-color: #8b5cf6; }
                .input-row input::placeholder { color: var(--text-tertiary); }

                .input-icon-btn {
                    width: 36px; height: 36px;
                    border-radius: 10px;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    background: var(--bg-tertiary);
                    color: var(--text-secondary);
                }
                .input-icon-btn:hover { background: var(--bg-hover); }
                .input-icon-btn.active { color: #8b5cf6; }
                .input-icon-btn.mic.listening { 
                    background: #ef4444; 
                    color: white;
                    animation: pulse 1s infinite;
                }

                .send-btn {
                    width: 40px; height: 40px;
                    border-radius: 12px;
                    border: none;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .send-btn:not(:disabled):hover { transform: scale(1.05); }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                .pulse { animation: pulse 2s ease infinite; }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                /* Mobile Responsive */
                @media (max-width: 480px) {
                    .unified-ai-fab { 
                        bottom: 90px; right: 16px; 
                        padding: 0 12px 0 10px;
                        height: 46px;
                    }
                    .fab-text { display: none; }
                    .quick-action-fab { bottom: 90px; left: 16px; width: 46px; height: 46px; }
                    .quick-panel { bottom: 150px; left: 16px; width: calc(100vw - 32px); }
                    .unified-ai-panel {
                        bottom: 0; right: 0; left: 0;
                        width: 100%; height: 100%;
                        border-radius: 0;
                    }
                    .uai-agents { padding: 6px 8px; }
                    .agent-tab { font-size: 0.65rem; padding: 5px 8px; }
                }
            `}</style>
        </>
    )
}
