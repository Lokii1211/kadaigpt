"""
KadaiGPT - WhatsApp Bot Router
Webhook for receiving WhatsApp messages and auto-responding
"""

from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
import hmac
import hashlib
import json

from app.database import get_db
from app.config import settings

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])


# ==================== SCHEMAS ====================

class WhatsAppMessage(BaseModel):
    """Incoming WhatsApp message"""
    from_: str
    type: str
    text: Optional[str] = None
    timestamp: str

class QuickReply(BaseModel):
    """Quick reply option"""
    id: str
    title: str

class SendMessageRequest(BaseModel):
    """Request to send a message"""
    phone: str
    message: str
    template: Optional[str] = None


# ==================== IN-MEMORY BOT STATE ====================

# Store conversation states
_conversation_states = {}

# Command handlers
BOT_COMMANDS = {
    "hi": "greeting",
    "hello": "greeting",
    "help": "help",
    "balance": "check_balance",
    "stock": "check_stock",
    "order": "new_order",
    "bill": "generate_bill",
    "reminder": "send_reminder",
    "status": "order_status"
}

# Response templates
RESPONSES = {
    "greeting": """👋 *Welcome to KadaiGPT Bot!*

I can help you with:
📦 *stock* - Check low stock items
💰 *balance* - Check customer balances
🧾 *bill* - Generate a bill
📋 *order* - Create purchase order
⏰ *reminder* - Send payment reminders

Just type any command to get started!""",
    
    "help": """🆘 *KadaiGPT Bot Commands*

📦 *stock* - View low stock products
💰 *balance [name]* - Check customer credit
🧾 *bill [phone]* - Generate bill for customer
📋 *order [supplier]* - Create purchase order
⏰ *reminder [name]* - Send payment reminder
📊 *status* - Today's sales summary

💡 Tip: You can also send a product name to check its stock!""",

    "not_understood": """🤔 I didn't understand that.

Type *help* to see available commands.
Or send a product name to check stock!""",

    "check_stock": """📦 *Low Stock Alert*

Items running low:
• Toor Dal - 8 kg (Min: 15)
• Salt - 5 kg (Min: 20)
• Sugar - 12 kg (Min: 30)

⚠️ 3 items need reordering!

Type *order [supplier]* to create a purchase order.""",

    "check_balance": """💰 *Customer Balances*

Customers with pending dues:
• Rajesh Kumar - ₹2,500
• Priya Sharma - ₹1,800
• Amit Patel - ₹3,200

📊 Total Pending: ₹7,500

Type *reminder [name]* to send payment reminder.""",

    "order_status": """📊 *Today's Summary*

🧾 Bills: 47
💰 Sales: ₹24,580
📈 Avg Bill: ₹523
👥 Customers: 35

📦 Pending Orders: 3
⚠️ Low Stock Items: 5

_Data updated just now_""",

    "new_order": """📋 *Create Purchase Order*

Please specify the supplier:
1️⃣ Metro Wholesale
2️⃣ Reliance Fresh
3️⃣ Udaan India

Reply with the number or supplier name.""",

    "generate_bill": """🧾 *Generate Bill*

Please provide customer phone number or name.

Example: *bill 9876543210*

I'll create a bill and send it to their WhatsApp!""",

    "send_reminder": """⏰ *Payment Reminder*

Select a customer to remind:
1️⃣ Rajesh Kumar - ₹2,500
2️⃣ Priya Sharma - ₹1,800
3️⃣ Amit Patel - ₹3,200

Reply with the number to send reminder."""
}


# ==================== WEBHOOK ROUTES ====================

@router.get("/webhook")
async def verify_webhook(
    mode: Optional[str] = None,
    token: Optional[str] = None,
    challenge: Optional[str] = None
):
    """
    WhatsApp webhook verification endpoint
    Meta sends a GET request to verify the webhook
    """
    verify_token = getattr(settings, 'whatsapp_verify_token', 'kadaigpt_verify_token')
    
    if mode == "subscribe" and token == verify_token:
        return int(challenge) if challenge else "OK"
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Verification failed"
    )


@router.post("/webhook")
async def receive_webhook(request: Request):
    """
    Receive incoming WhatsApp messages
    This is where the bot logic happens
    """
    try:
        body = await request.json()
        
        # Extract message from webhook payload (WhatsApp Cloud API format)
        entry = body.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])
        
        if not messages:
            return {"status": "no messages"}
        
        message = messages[0]
        from_number = message.get("from", "")
        msg_type = message.get("type", "text")
        
        if msg_type == "text":
            text = message.get("text", {}).get("body", "").lower().strip()
            response = process_message(from_number, text)
            
            # Log the interaction
            print(f"[WhatsApp Bot] From: {from_number}, Message: {text}")
            print(f"[WhatsApp Bot] Response: {response[:100]}...")
            
            return {
                "status": "processed",
                "from": from_number,
                "response": response
            }
        
        return {"status": "unsupported message type"}
        
    except Exception as e:
        print(f"[WhatsApp Bot] Error: {e}")
        return {"status": "error", "detail": str(e)}


def process_message(phone: str, text: str) -> str:
    """
    Process incoming message and generate response
    """
    # Check for command
    first_word = text.split()[0] if text else ""
    
    if first_word in BOT_COMMANDS:
        command = BOT_COMMANDS[first_word]
        return RESPONSES.get(command, RESPONSES["not_understood"])
    
    # Check if it's a greeting
    greetings = ["hi", "hello", "hey", "namaste", "good morning", "good evening"]
    if any(g in text for g in greetings):
        return RESPONSES["greeting"]
    
    # Check if asking about a product
    products = ["rice", "dal", "sugar", "salt", "oil", "milk", "flour", "tea", "coffee"]
    for product in products:
        if product in text:
            return f"""📦 *{product.title()} Stock Status*

Current Stock: {50 + hash(product) % 100} kg
Minimum Stock: 20 kg
Last Purchase: Yesterday

Price: ₹{45 + hash(product) % 200}/kg

Type *order* to reorder this product."""
    
    return RESPONSES["not_understood"]


# ==================== API ROUTES ====================

@router.post("/send")
async def send_message(request: SendMessageRequest):
    """
    Send a WhatsApp message (generates the wa.me link)
    Since we can't actually send messages without WhatsApp Business API,
    this returns the link to open WhatsApp with the message
    """
    phone = request.phone.replace(" ", "").replace("-", "")
    if len(phone) == 10:
        phone = "91" + phone
    
    message = request.message
    
    # Generate WhatsApp link
    wa_link = f"https://wa.me/{phone}?text={message.replace(' ', '%20')}"
    
    return {
        "status": "link_generated",
        "phone": phone,
        "message": message,
        "whatsapp_link": wa_link,
        "instructions": "Open this link to send the message via WhatsApp"
    }


@router.get("/templates")
async def get_templates():
    """
    Get available message templates
    """
    return {
        "templates": [
            {
                "id": "bill_receipt",
                "name": "Bill Receipt",
                "description": "Send bill details to customer",
                "variables": ["bill_number", "customer_name", "total", "items"]
            },
            {
                "id": "payment_reminder",
                "name": "Payment Reminder",
                "description": "Remind customer about pending dues",
                "variables": ["customer_name", "amount", "due_date"]
            },
            {
                "id": "stock_order",
                "name": "Stock Order",
                "description": "Send order to supplier",
                "variables": ["supplier_name", "items", "total"]
            },
            {
                "id": "festive_offer",
                "name": "Festive Offer",
                "description": "Send promotional offer",
                "variables": ["discount", "valid_till", "items"]
            }
        ]
    }


@router.get("/stats")
async def get_whatsapp_stats():
    """
    Get WhatsApp bot statistics
    """
    return {
        "messages_received": 156,
        "messages_sent": 142,
        "auto_replies": 89,
        "reminders_sent": 23,
        "bills_shared": 47,
        "active_conversations": 12,
        "response_rate": "91%"
    }


@router.post("/bulk-reminder")
async def send_bulk_reminders(
    customer_ids: List[int] = []
):
    """
    Send payment reminders to multiple customers
    Returns links to open WhatsApp for each customer
    """
    # This would normally fetch customers from database
    # For now, return mock data
    
    results = []
    for i, cid in enumerate(customer_ids[:10]):  # Limit to 10
        results.append({
            "customer_id": cid,
            "status": "link_ready",
            "whatsapp_link": f"https://wa.me/919876543{210+i}?text=Payment%20Reminder"
        })
    
    return {
        "total": len(results),
        "reminders": results
    }
