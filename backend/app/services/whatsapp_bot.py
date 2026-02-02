"""
WhatsApp Bot Service for KadaiGPT
Handles incoming WhatsApp messages and responds with business data
Uses Evolution API for WhatsApp integration
"""

import httpx
import json
import re
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class WhatsAppBotService:
    """Service for handling WhatsApp bot interactions"""
    
    def __init__(self):
        self.evolution_url = settings.EVOLUTION_API_URL or "http://localhost:8080"
        self.api_key = settings.EVOLUTION_API_KEY or ""
        self.instance_name = settings.EVOLUTION_INSTANCE_NAME or "kadaigpt"
        self.store_name = "KadaiGPT Store"
        
    # ==================== EVOLUTION API METHODS ====================
    
    async def send_message(self, phone: str, message: str) -> Dict[str, Any]:
        """Send a WhatsApp message via Evolution API"""
        try:
            # Format phone number
            clean_phone = self._format_phone(phone)
            
            url = f"{self.evolution_url}/message/sendText/{self.instance_name}"
            
            payload = {
                "number": clean_phone,
                "options": {
                    "delay": 1200,
                    "presence": "composing"
                },
                "textMessage": {
                    "text": message
                }
            }
            
            headers = {
                "apikey": self.api_key,
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=30)
                
                if response.status_code == 200 or response.status_code == 201:
                    return {"success": True, "data": response.json()}
                else:
                    logger.error(f"Failed to send message: {response.text}")
                    return {"success": False, "error": response.text}
                    
        except Exception as e:
            logger.error(f"Error sending WhatsApp message: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_welcome_message(self, phone: str, user_name: str) -> Dict[str, Any]:
        """Send welcome message to new user"""
        message = f"""🎉 *Welcome to {self.store_name}!*

Namaste {user_name}! 🙏

Thank you for registering with us. I'm your KadaiGPT AI assistant, here to help you manage your business.

*Here's what I can do for you:*

📊 *Reports*
• Type "sales" - Today's sales summary
• Type "expense" - Today's expenses
• Type "profit" - Income vs Expense
• Type "stock" - Low stock alerts

🧾 *Data Access*
• Type "bills" - Recent bills
• Type "customers" - Customer list
• Type "products" - Product inventory

⚙️ *Settings*
• Type "help" - Show all commands
• Type "hi" - Say hello!

Start by typing any command! 💬

_Powered by KadaiGPT AI_ 🤖"""

        return await self.send_message(phone, message)
    
    async def process_incoming_message(self, phone: str, message: str, user_id: Optional[int] = None) -> str:
        """Process incoming message and generate response"""
        
        # Clean and lowercase the message
        clean_msg = message.strip().lower()
        
        # Greeting patterns
        if any(greet in clean_msg for greet in ['hi', 'hello', 'hai', 'hey', 'vanakkam', 'namaste']):
            return self._get_greeting_response()
        
        # Help command
        if 'help' in clean_msg or 'commands' in clean_msg or '?' in clean_msg:
            return self._get_help_response()
        
        # Sales query
        if any(word in clean_msg for word in ['sales', 'revenue', 'sell', 'sold', 'விற்பனை']):
            return await self._get_sales_response(user_id)
        
        # Expense query
        if any(word in clean_msg for word in ['expense', 'cost', 'spending', 'செலவு']):
            return await self._get_expense_response(user_id)
        
        # Profit/Income query
        if any(word in clean_msg for word in ['profit', 'income', 'earning', 'லாபம்']):
            return await self._get_profit_response(user_id)
        
        # Stock query
        if any(word in clean_msg for word in ['stock', 'inventory', 'low', 'restock', 'சரக்கு']):
            return await self._get_stock_response(user_id)
        
        # Bills query
        if any(word in clean_msg for word in ['bill', 'invoice', 'receipt', 'பில்']):
            return await self._get_bills_response(user_id)
        
        # Customers query
        if any(word in clean_msg for word in ['customer', 'client', 'buyer', 'வாடிக்கையாளர்']):
            return await self._get_customers_response(user_id)
        
        # Products query
        if any(word in clean_msg for word in ['product', 'item', 'goods', 'பொருள்']):
            return await self._get_products_response(user_id)
        
        # GST query
        if any(word in clean_msg for word in ['gst', 'tax', 'வரி']):
            return await self._get_gst_response(user_id)
        
        # Report/Summary
        if any(word in clean_msg for word in ['report', 'summary', 'daily', 'today', 'இன்று']):
            return await self._get_daily_report(user_id)
        
        # Thank you
        if any(word in clean_msg for word in ['thank', 'thanks', 'நன்றி']):
            return "You're welcome! 🙏 Let me know if you need anything else."
        
        # Default response
        return self._get_default_response()
    
    # ==================== RESPONSE GENERATORS ====================
    
    def _get_greeting_response(self) -> str:
        hour = datetime.now().hour
        if hour < 12:
            greeting = "Good Morning"
        elif hour < 17:
            greeting = "Good Afternoon"
        else:
            greeting = "Good Evening"
            
        return f"""👋 *{greeting}!*

I'm your KadaiGPT AI assistant. How can I help you today?

Quick commands:
• *sales* - Today's sales
• *expense* - Today's expenses
• *stock* - Low stock items
• *report* - Daily summary
• *help* - All commands

Just type any command! 💬"""

    def _get_help_response(self) -> str:
        return """📚 *KadaiGPT Bot Commands*

*📊 Reports*
• `sales` - Today's sales summary
• `expense` - Today's expenses
• `profit` - Profit/Loss report
• `report` - Full daily summary
• `gst` - GST report

*📦 Inventory*
• `stock` - Low stock alerts
• `products` - Product list

*🧾 Transactions*
• `bills` - Recent bills
• `customers` - Customer list

*💬 General*
• `hi` or `hello` - Greeting
• `help` - This help menu
• `thanks` - You're welcome!

_Type any command to get started!_"""

    def _get_default_response(self) -> str:
        return """🤔 I didn't understand that.

Try these commands:
• *sales* - Today's sales
• *expense* - Expenses
• *stock* - Low stock
• *report* - Daily summary
• *help* - All commands

Or just say *hi* to get started! 👋"""

    async def _get_sales_response(self, user_id: Optional[int]) -> str:
        """Get sales data response"""
        # In production, fetch from database
        # For now, return template
        today = datetime.now().strftime("%d %b %Y")
        
        # TODO: Fetch actual data from database
        # For now using placeholder that will be replaced with real DB queries
        return f"""📊 *Sales Report*
📅 {today}

💰 *Today's Sales*: ₹0
🧾 *Bills Created*: 0
📈 *Avg Bill Value*: ₹0

💳 *Payment Breakdown*
• Cash: ₹0
• UPI: ₹0
• Card: ₹0
• Credit: ₹0

_Updated just now_
Type *report* for full summary."""

    async def _get_expense_response(self, user_id: Optional[int]) -> str:
        """Get expense data response"""
        today = datetime.now().strftime("%d %b %Y")
        
        return f"""💸 *Expense Report*
📅 {today}

📉 *Total Expenses*: ₹0
📝 *Transactions*: 0

*By Category*
• Inventory: ₹0
• Utilities: ₹0
• Salary: ₹0
• Other: ₹0

_Updated just now_
Type *profit* to see net profit."""

    async def _get_profit_response(self, user_id: Optional[int]) -> str:
        """Get profit/loss response"""
        today = datetime.now().strftime("%d %b %Y")
        
        return f"""💹 *Profit & Loss*
📅 {today}

📈 *Income*: ₹0
📉 *Expenses*: ₹0
━━━━━━━━━━━━━
✅ *Net Profit*: ₹0

_Updated just now_"""

    async def _get_stock_response(self, user_id: Optional[int]) -> str:
        """Get low stock response"""
        return """📦 *Stock Status*

⚠️ *Low Stock Items*: 0
❌ *Out of Stock*: 0

No items need restocking right now! ✅

_Updated just now_
Type *products* for full inventory."""

    async def _get_bills_response(self, user_id: Optional[int]) -> str:
        """Get recent bills response"""
        today = datetime.now().strftime("%d %b %Y")
        
        return f"""🧾 *Recent Bills*
📅 {today}

No bills found for today.

Create bills from the KadaiGPT app to see them here.

_Updated just now_"""

    async def _get_customers_response(self, user_id: Optional[int]) -> str:
        """Get customers response"""
        return """👥 *Customers*

📊 *Total Customers*: 0
🆕 *New This Month*: 0

Add customers from the KadaiGPT app.

_Updated just now_"""

    async def _get_products_response(self, user_id: Optional[int]) -> str:
        """Get products response"""
        return """📦 *Products*

📊 *Total Products*: 0
✅ *In Stock*: 0
⚠️ *Low Stock*: 0
❌ *Out of Stock*: 0

Add products from the KadaiGPT app.

_Updated just now_"""

    async def _get_gst_response(self, user_id: Optional[int]) -> str:
        """Get GST response"""
        return """📋 *GST Summary*

💰 *Taxable Sales*: ₹0
📊 *CGST*: ₹0
📊 *SGST*: ₹0
━━━━━━━━━━━━━
💵 *Total GST*: ₹0

_Updated just now_"""

    async def _get_daily_report(self, user_id: Optional[int]) -> str:
        """Get full daily report"""
        today = datetime.now().strftime("%A, %d %B %Y")
        time_now = datetime.now().strftime("%I:%M %p")
        
        return f"""📊 *DAILY BUSINESS REPORT*
📅 {today}
🕐 Generated at {time_now}

━━━━━━━━━━━━━━━━━━━

💰 *SALES*
• Total: ₹0
• Bills: 0
• Avg Bill: ₹0

💸 *EXPENSES*
• Total: ₹0

💹 *PROFIT*
• Net: ₹0

📦 *INVENTORY*
• Low Stock: 0 items
• Out of Stock: 0 items

👥 *CUSTOMERS*
• Total: 0

━━━━━━━━━━━━━━━━━━━

_Powered by KadaiGPT AI_ 🤖
_Type *help* for more commands_"""

    # ==================== HELPER METHODS ====================
    
    def _format_phone(self, phone: str) -> str:
        """Format phone number for WhatsApp"""
        # Remove all non-digits
        digits = re.sub(r'\D', '', phone)
        
        # Add country code if not present
        if len(digits) == 10:
            digits = '91' + digits
        elif digits.startswith('0'):
            digits = '91' + digits[1:]
            
        return digits
    
    async def check_connection(self) -> Dict[str, Any]:
        """Check Evolution API connection status"""
        try:
            url = f"{self.evolution_url}/instance/connectionState/{self.instance_name}"
            headers = {"apikey": self.api_key}
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "connected": data.get("state") == "open",
                        "state": data.get("state"),
                        "instance": self.instance_name
                    }
                else:
                    return {"connected": False, "error": response.text}
                    
        except Exception as e:
            return {"connected": False, "error": str(e)}
    
    async def get_qr_code(self) -> Dict[str, Any]:
        """Get QR code for connecting WhatsApp"""
        try:
            url = f"{self.evolution_url}/instance/connect/{self.instance_name}"
            headers = {"apikey": self.api_key}
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "qrcode": data.get("base64"),
                        "code": data.get("code")
                    }
                else:
                    return {"success": False, "error": response.text}
                    
        except Exception as e:
            return {"success": False, "error": str(e)}


# Singleton instance
whatsapp_bot = WhatsAppBotService()
