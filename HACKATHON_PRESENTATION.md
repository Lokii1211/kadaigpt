# 🏆 KadaiGPT - AI AGENT SaaS Platform

## **Agentathon Submission**

---

## 🎯 Vision
**"An AI Agent that runs your retail business while you sleep"**

KadaiGPT is not just software - it's an **intelligent business partner** that thinks, predicts, and acts autonomously to maximize your revenue.

---

## 🤖 AI AGENTS OVERVIEW

### **11 Autonomous AI Agents**

| Agent | Type | Capability |
|-------|------|------------|
| 🎤 **Voice Command Agent** | Conversational | Natural language interaction with voice responses |
| 💬 **WhatsApp NLP Agent** | Conversational | Process business queries via WhatsApp in multiple languages |
| 📊 **Revenue Forecast Agent** | Predictive | ML-powered sales predictions with trend analysis |
| 📦 **Auto-Restock Agent** | Autonomous | Predicts stockouts, generates purchase orders |
| 🎯 **Smart Goals Agent** | Coaching | AI-suggested goals with progress tracking |
| 🔮 **Churn Prediction Agent** | Predictive | Identifies at-risk customers, suggests retention |
| 💰 **Profit Margin Agent** | Advisory | Pricing optimization recommendations |
| 💌 **Customer Engagement Agent** | Marketing | Auto-segments customers, creates personalized campaigns |
| 🛡️ **Anomaly Detection Agent** | Monitoring | Real-time pattern detection, fraud alerts |
| 💡 **AI Copilot** | Contextual | Real-time suggestions based on current activity |
| 📈 **Business Health Agent** | Diagnostic | 10-metric scoring with actionable grades |

---

## 🔥 AGENT CAPABILITIES IN DETAIL

### **1. Voice Command Agent** 🎤
```
User: "What are my sales today?"
Agent: "Today's sales are ₹12,500 from 8 bills. 
        This week's total is ₹78,000."
        [Opens Analytics page]
```
**Features:**
- Speech-to-text recognition
- Natural language understanding
- Text-to-speech responses
- Action execution (navigation, data retrieval)

---

### **2. Revenue Forecast Agent** 📊
**ML Algorithm:**
- 30-day historical analysis
- Trend detection (growth/decline rate)
- Day-of-week seasonality patterns
- Confidence scoring based on data quality

**Output:**
- Next 7-day revenue prediction
- Monthly estimate
- Peak day identification
- Day-of-week performance patterns

---

### **3. Auto-Restock Agent** 📦
**Algorithm:**
1. Calculate sales velocity per product
2. Estimate days until stockout
3. Determine urgency level (CRITICAL/URGENT/SOON)
4. Calculate optimal order quantity (2 weeks + safety)
5. Generate purchase orders

**Urgency Levels:**
| Level | Days to Stockout | Action |
|-------|-----------------|--------|
| CRITICAL | 0 | Immediate order |
| URGENT | 1-3 | Order today |
| SOON | 4-7 | Plan order |
| HEALTHY | 7+ | Monitor |

---

### **4. Churn Prediction Agent** 🔮
**Risk Scoring Algorithm:**
| Factor | Weight | Signal |
|--------|--------|--------|
| Inactivity Days | 30% | >60 days = high risk |
| Declining Visits | 25% | Fewer recent visits |
| Declining Spend | 25% | Lower bill values |
| Low Engagement | 15% | Few total visits |
| No Loyalty | 10% | Not enrolled |

**Output:**
- Risk score (0-100%)
- Risk factors identified
- Suggested actions (Call/WhatsApp/Offer)
- One-click engagement

---

### **5. Customer Engagement Agent** 💌
**Auto-Segmentation:**
| Segment | Criteria | Campaign |
|---------|----------|----------|
| Birthday | This month | 20% Off offer |
| Dormant | 30+ days inactive | Win-back discount |
| VIP | ₹5000+ spent | Double points |
| New | <7 days old | Welcome 10% |
| Milestone | Near 10K points | Reminder nudge |
| Festive | All active | Seasonal sale |

**Expected ROI:** 25-50% per campaign

---

### **6. Anomaly Detection Agent** 🛡️
**Real-time Monitoring:**
| Anomaly Type | Detection | Severity |
|--------------|-----------|----------|
| Sales Spike | >150% of avg | ✅ Positive |
| Sales Drop | <50% of avg | ⚠️ Warning |
| Large Transaction | >3x avg bill | ✅ Info |
| No Sales (business hrs) | 0 transactions | ⚠️ Warning |
| Stock Discrepancy | Negative stock | 🚨 Critical |
| Price Issue | ₹0 or negative | ⚠️ Warning |

**System Health Status:**
- 🟢 Healthy - No issues
- 🟡 Warning - Needs attention
- 🔴 Critical - Urgent action needed

---

### **7. AI Copilot** 💡
**Context-Aware Suggestions:**

| Current Page | Suggestion Type |
|--------------|-----------------|
| Dashboard | Morning briefing, low stock alerts |
| Create Bill | Popular products, customer linking |
| Products | Low margin alerts, pricing tips |
| Customers | Inactive outreach, VIP identification |
| Analytics | Export reminders, insights |

**Features:**
- Page-aware recommendations
- Dismissible tips
- Action buttons
- Minimizable panel

---

## 💬 CONVERSATIONAL AI

### **WhatsApp NLP Agent**
**Supported Queries (Multi-lingual):**
- "आज की बिक्री?" → Today's sales report
- "Low stock items" → Inventory alert
- "Send GST report" → Document generation
- "Add ₹500 expense transport" → Expense tracking

**NLP Features:**
- Fuzzy matching for typos
- Semantic similarity scoring
- Multi-lingual support (EN/HI/TA)
- Entity extraction (amounts, dates, products)

---

## 📈 BUSINESS INTELLIGENCE

### **Business Health Score**
**10 Metrics Analyzed:**
1. Sales Growth
2. Inventory Health
3. Customer Retention
4. Average Bill Value
5. Transaction Frequency
6. Profit Margins
7. Cash Flow
8. Stock Turnover
9. Customer Acquisition
10. Repeat Customer Rate

**Grading:**
| Score | Grade | Status |
|-------|-------|--------|
| 90-100 | A+ | Exceptional |
| 80-89 | A | Excellent |
| 70-79 | B | Good |
| 60-69 | C | Average |
| 50-59 | D | Needs Improvement |
| <50 | F | Critical |

---

## 🚀 TECHNICAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Voice Agent │ AI Copilot │ Dashboard │ Analytics │   │
│  └─────────────────────────────────────────────────┘   │
│                         ↓                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Real Data Service                   │   │
│  │  (Predictions, Health Score, Forecasts)          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ WhatsApp Bot │ NLP Engine │ Auth │ Business Logic│   │
│  └─────────────────────────────────────────────────┘   │
│                         ↓                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                       │
│  WhatsApp API │ Speech API │ Railway Hosting           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎮 DEMO FLOW

1. **Open Dashboard** → All AI agents loading real data
2. **Voice Command** → "What are my sales today?"
3. **AI Copilot** → Shows context-aware suggestions
4. **Scroll to Agents:**
   - Smart Goals → AI-suggested targets
   - Churn Prediction → At-risk customers
   - Auto-Restock → Predicted stockouts
   - Revenue Forecast → Next week prediction
   - Customer Engagement → Ready campaigns
   - Anomaly Detection → System health
5. **WhatsApp Test** → Send "sales report" to bot
6. **Analytics** → Business Health Score

---

## 🏅 WHY WE WIN

| Feature | Traditional Apps | KadaiGPT |
|---------|-----------------|----------|
| Data Display | ✓ | ✓ |
| Predictions | ✗ | ✓ AI-powered |
| Recommendations | ✗ | ✓ Actionable |
| Voice Control | ✗ | ✓ Natural language |
| WhatsApp Integration | ✗ | ✓ NLP enabled |
| Autonomous Actions | ✗ | ✓ Auto-restock, campaigns |
| Real-time Alerts | ✗ | ✓ Anomaly detection |
| Context Awareness | ✗ | ✓ AI Copilot |

---

## 🔗 LINKS

- **Live Demo:** https://kadaigpt.up.railway.app
- **GitHub:** https://github.com/Lokii1211/kadaigpt
- **WhatsApp Bot:** [Configured via Twilio]

---

## 👥 TEAM

**Built for Agentathon 2026**

---

## 📝 SUMMARY

KadaiGPT transforms a simple billing app into an **AI Agent ecosystem** that:

1. **THINKS** - Analyzes patterns, predicts outcomes
2. **SPEAKS** - Voice commands, WhatsApp conversations
3. **ACTS** - Generates orders, sends campaigns, alerts
4. **LEARNS** - Improves predictions with more data

**"Not just software. An AI business partner."**
