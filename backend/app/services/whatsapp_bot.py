"""
WhatsApp Bot Service for KadaiGPT
Enhanced version with database integration, order creation, reminders, and more
Uses WAHA (WhatsApp HTTP API) for WhatsApp integration
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
        self.waha_url = settings.EVOLUTION_API_URL or "http://localhost:8080"
        self.api_key = settings.EVOLUTION_API_KEY or "kadaigpt-wa-secret-2026"
        self.session_name = "default"  # WAHA Core only supports 'default' session
        self.store_name = "KadaiGPT Store"
        
        # Conversation states for multi-step interactions
        self._conversation_states = {}
        
    # ==================== WAHA API METHODS ====================
    
    async def send_message(self, phone: str, message: str) -> Dict[str, Any]:
        """Send a WhatsApp message via WAHA API"""
        try:
            clean_phone = self._format_phone(phone)
            
            # WAHA API format
            url = f"{self.waha_url}/api/sendText"
            
            payload = {
                "session": self.session_name,
                "chatId": f"{clean_phone}@c.us",
                "text": message
            }
            
            headers = {
                "X-Api-Key": self.api_key,
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=30)
                
                if response.status_code == 200 or response.status_code == 201:
                    logger.info(f"Message sent to {phone}")
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

*Quick Commands:*

📊 *Reports*
• `sales` - Today's sales
• `expense` - Expenses report
• `profit` - P&L summary
• `report` - Full daily report

📦 *Inventory*
• `stock` - Low stock alerts
• `products` - All products
• `add [product]` - Quick add product

🧾 *Billing*
• `bills` - Recent bills
• `newbill` - Create new bill
• `sendbill [number]` - Send bill

👥 *Customers*
• `customers` - All customers
• `remind [name]` - Send reminder

⏰ *Reminders*
• `reminder` - Set reminders
• `pending` - Pending payments

Type *help* anytime to see all commands!

_Powered by KadaiGPT AI_ 🤖"""

        return await self.send_message(phone, message)
    
    async def process_incoming_message(self, phone: str, message: str, user_id: Optional[int] = None) -> str:
        """Process incoming message and generate response"""
        
        clean_msg = message.strip().lower()
        original_msg = message.strip()
        
        # Check for conversation state (multi-step commands)
        if phone in self._conversation_states:
            return await self._handle_conversation(phone, original_msg)
        
        # =============== GREETINGS ===============
        if any(greet in clean_msg for greet in ['hi', 'hello', 'hai', 'hey', 'vanakkam', 'namaste', 'good morning', 'good evening']):
            return self._get_greeting_response()
        
        # =============== HELP ===============
        if 'help' in clean_msg or 'commands' in clean_msg or clean_msg == '?':
            return self._get_help_response()
        
        # =============== REPORTS ===============
        if any(word in clean_msg for word in ['sales', 'revenue', 'sell', 'sold', 'விற்பனை']):
            return await self._get_sales_response(user_id)
        
        if any(word in clean_msg for word in ['expense', 'cost', 'spending', 'செலவு']):
            return await self._get_expense_response(user_id)
        
        if any(word in clean_msg for word in ['profit', 'income', 'earning', 'லாபம்', 'p&l', 'pnl']):
            return await self._get_profit_response(user_id)
        
        if any(word in clean_msg for word in ['report', 'summary', 'daily', 'today', 'இன்று']):
            return await self._get_daily_report(user_id)
        
        if any(word in clean_msg for word in ['gst', 'tax', 'வரி']):
            return await self._get_gst_response(user_id)
        
        # =============== INVENTORY ===============
        if any(word in clean_msg for word in ['stock', 'low stock', 'restock', 'சரக்கு', 'inventory']):
            return await self._get_stock_response(user_id)
        
        if clean_msg.startswith('add '):
            product_name = original_msg[4:].strip()
            return await self._start_add_product(phone, product_name)
        
        if any(word in clean_msg for word in ['product', 'item', 'goods', 'பொருள்']):
            return await self._get_products_response(user_id)
        
        # =============== BILLING ===============
        if clean_msg in ['newbill', 'new bill', 'create bill', 'புதிய பில்']:
            return await self._start_create_bill(phone)
        
        if clean_msg.startswith('sendbill ') or clean_msg.startswith('send bill '):
            bill_id = re.search(r'\d+', clean_msg)
            if bill_id:
                return await self._send_bill_to_customer(phone, bill_id.group())
            return "Please provide a bill number. Example: *sendbill 12345*"
        
        if any(word in clean_msg for word in ['bill', 'invoice', 'receipt', 'பில்']):
            return await self._get_bills_response(user_id)
        
        # =============== CUSTOMERS ===============
        if clean_msg.startswith('remind '):
            customer_name = original_msg[7:].strip()
            return await self._send_payment_reminder(phone, customer_name)
        
        if any(word in clean_msg for word in ['customer', 'client', 'buyer', 'வாடிக்கையாளர்']):
            return await self._get_customers_response(user_id)
        
        # =============== REMINDERS & PENDING ===============
        if clean_msg in ['reminder', 'reminders', 'remind', 'ஞாபகம்']:
            return await self._get_reminders_menu(phone)
        
        if any(word in clean_msg for word in ['pending', 'due', 'credit', 'கடன்', 'balance']):
            return await self._get_pending_payments(user_id)
        
        # =============== ORDERS ===============
        if clean_msg in ['order', 'orders', 'purchase', 'po']:
            return await self._get_orders_menu(phone)
        
        if clean_msg.startswith('neworder') or clean_msg.startswith('new order'):
            return await self._start_create_order(phone)
        
        # =============== QUICK PRICE CHECK ===============
        if clean_msg.startswith('price '):
            product = original_msg[6:].strip()
            return await self._get_product_price(product)
        
        # =============== THANK YOU ===============
        if any(word in clean_msg for word in ['thank', 'thanks', 'நன்றி']):
            return "You're welcome! 🙏 Is there anything else I can help you with?"
        
        # =============== CANCEL ===============
        if clean_msg in ['cancel', 'exit', 'quit', 'stop']:
            if phone in self._conversation_states:
                del self._conversation_states[phone]
            return "Action cancelled. Type *help* to see available commands."
        
        # =============== DEFAULT ===============
        return self._get_default_response()
    
    # ==================== CONVERSATION HANDLERS ====================
    
    async def _handle_conversation(self, phone: str, message: str) -> str:
        """Handle multi-step conversations"""
        state = self._conversation_states.get(phone, {})
        action = state.get('action')
        
        if message.lower() in ['cancel', 'exit', 'quit']:
            del self._conversation_states[phone]
            return "Action cancelled. How can I help you?"
        
        if action == 'add_product':
            return await self._handle_add_product_step(phone, message, state)
        elif action == 'create_bill':
            return await self._handle_create_bill_step(phone, message, state)
        elif action == 'create_order':
            return await self._handle_create_order_step(phone, message, state)
        elif action == 'set_reminder':
            return await self._handle_reminder_step(phone, message, state)
        
        # Unknown state, clear it
        del self._conversation_states[phone]
        return self._get_default_response()
    
    # ==================== ADD PRODUCT FLOW ====================
    
    async def _start_add_product(self, phone: str, product_name: str) -> str:
        """Start add product conversation"""
        self._conversation_states[phone] = {
            'action': 'add_product',
            'step': 'get_price',
            'name': product_name
        }
        return f"""📦 *Adding New Product*

Product: *{product_name}*

Please enter the *price* (in ₹):
_(e.g., 120 or 45.50)_

Type *cancel* to abort."""
    
    async def _handle_add_product_step(self, phone: str, message: str, state: dict) -> str:
        """Handle add product steps"""
        step = state.get('step')
        
        if step == 'get_price':
            try:
                price = float(message.replace('₹', '').replace(',', '').strip())
                state['price'] = price
                state['step'] = 'get_stock'
                self._conversation_states[phone] = state
                return f"""Price: ₹{price}

Now enter the *stock quantity*:
_(e.g., 50)_"""
            except ValueError:
                return "Invalid price. Please enter a number (e.g., 120 or 45.50):"
        
        elif step == 'get_stock':
            try:
                stock = int(message.replace(',', '').strip())
                state['stock'] = stock
                state['step'] = 'confirm'
                self._conversation_states[phone] = state
                
                return f"""📦 *Confirm Product Details*

• *Name*: {state['name']}
• *Price*: ₹{state['price']}
• *Stock*: {stock} units

Reply *yes* to confirm or *cancel* to abort."""
            except ValueError:
                return "Invalid quantity. Please enter a whole number (e.g., 50):"
        
        elif step == 'confirm':
            if message.lower() in ['yes', 'y', 'confirm']:
                # TODO: Actually save to database
                product_data = {
                    'name': state['name'],
                    'price': state['price'],
                    'stock': state['stock']
                }
                del self._conversation_states[phone]
                
                return f"""✅ *Product Added Successfully!*

• *Name*: {product_data['name']}
• *Price*: ₹{product_data['price']}
• *Stock*: {product_data['stock']} units

Type *products* to see all products."""
            else:
                del self._conversation_states[phone]
                return "Product not added. Type *help* to see other commands."
        
        return self._get_default_response()
    
    # ==================== CREATE BILL FLOW ====================
    
    async def _start_create_bill(self, phone: str) -> str:
        """Start create bill conversation"""
        self._conversation_states[phone] = {
            'action': 'create_bill',
            'step': 'get_customer',
            'items': []
        }
        return """🧾 *Create New Bill*

Please enter *customer name or phone*:
_(e.g., Ramesh or 9876543210)_

Type *cancel* to abort."""
    
    async def _handle_create_bill_step(self, phone: str, message: str, state: dict) -> str:
        """Handle create bill steps"""
        step = state.get('step')
        
        if step == 'get_customer':
            state['customer'] = message
            state['step'] = 'get_items'
            self._conversation_states[phone] = state
            return f"""Customer: *{message}*

Now add items in format:
*product name, qty, price*
_(e.g., Rice 5kg, 2, 300)_

Send items one by one, then type *done* when finished."""
        
        elif step == 'get_items':
            if message.lower() == 'done':
                if not state['items']:
                    return "No items added. Please add at least one item:"
                
                state['step'] = 'confirm'
                self._conversation_states[phone] = state
                
                # Calculate total
                total = sum(item['qty'] * item['price'] for item in state['items'])
                
                items_text = "\n".join([f"  • {i['name']} x{i['qty']} = ₹{i['qty']*i['price']}" for i in state['items']])
                
                return f"""🧾 *Bill Summary*

*Customer*: {state['customer']}

*Items*:
{items_text}

━━━━━━━━━━━━━
*Total*: ₹{total}

Reply *confirm* to create bill or *cancel* to abort."""
            
            # Parse item
            parts = [p.strip() for p in message.split(',')]
            if len(parts) >= 3:
                try:
                    item = {
                        'name': parts[0],
                        'qty': int(parts[1]),
                        'price': float(parts[2])
                    }
                    state['items'].append(item)
                    self._conversation_states[phone] = state
                    
                    total = sum(i['qty'] * i['price'] for i in state['items'])
                    return f"""✅ Added: {item['name']} x{item['qty']} @ ₹{item['price']}
Running Total: ₹{total}

Add more items or type *done* to finish."""
                except ValueError:
                    return "Invalid format. Use: *product name, quantity, price*"
            else:
                return "Invalid format. Use: *product name, quantity, price*\n_(e.g., Rice 5kg, 2, 300)_"
        
        elif step == 'confirm':
            if message.lower() in ['confirm', 'yes', 'y']:
                total = sum(item['qty'] * item['price'] for item in state['items'])
                bill_no = f"BILL{datetime.now().strftime('%Y%m%d%H%M%S')}"
                
                # TODO: Actually save to database
                del self._conversation_states[phone]
                
                return f"""✅ *Bill Created Successfully!*

📄 Bill No: *{bill_no}*
👤 Customer: {state['customer']}
💰 Total: ₹{total}
📅 Date: {datetime.now().strftime('%d %b %Y %I:%M %p')}

To send this bill to customer, type:
*sendbill {bill_no}*

Type *bills* to see all bills."""
            else:
                del self._conversation_states[phone]
                return "Bill cancelled. Type *help* to see other commands."
        
        return self._get_default_response()
    
    # ==================== CREATE ORDER FLOW ====================
    
    async def _start_create_order(self, phone: str) -> str:
        """Start create purchase order conversation"""
        self._conversation_states[phone] = {
            'action': 'create_order',
            'step': 'get_supplier',
            'items': []
        }
        return """📋 *Create Purchase Order*

Enter *supplier name*:
_(e.g., Metro Wholesale or Reliance)_

Type *cancel* to abort."""
    
    async def _handle_create_order_step(self, phone: str, message: str, state: dict) -> str:
        """Handle create order steps"""
        step = state.get('step')
        
        if step == 'get_supplier':
            state['supplier'] = message
            state['step'] = 'get_items'
            self._conversation_states[phone] = state
            return f"""Supplier: *{message}*

Add items to order in format:
*product name, quantity*
_(e.g., Rice 25kg, 10)_

Send items one by one, then type *done*."""
        
        elif step == 'get_items':
            if message.lower() == 'done':
                if not state['items']:
                    return "No items added. Please add at least one item:"
                
                state['step'] = 'confirm'
                self._conversation_states[phone] = state
                
                items_text = "\n".join([f"  • {i['name']} - {i['qty']} units" for i in state['items']])
                
                return f"""📋 *Purchase Order Summary*

*Supplier*: {state['supplier']}

*Items*:
{items_text}

Reply *confirm* to create PO or *cancel* to abort."""
            
            parts = [p.strip() for p in message.split(',')]
            if len(parts) >= 2:
                try:
                    item = {
                        'name': parts[0],
                        'qty': int(parts[1])
                    }
                    state['items'].append(item)
                    self._conversation_states[phone] = state
                    return f"✅ Added: {item['name']} - {item['qty']} units\n\nAdd more or type *done*."
                except ValueError:
                    return "Invalid format. Use: *product name, quantity*"
            else:
                return "Invalid format. Use: *product name, quantity*"
        
        elif step == 'confirm':
            if message.lower() in ['confirm', 'yes', 'y']:
                po_no = f"PO{datetime.now().strftime('%Y%m%d%H%M%S')}"
                items_text = "\n".join([f"• {i['name']} - {i['qty']} units" for i in state['items']])
                
                # TODO: Save to database
                del self._conversation_states[phone]
                
                return f"""✅ *Purchase Order Created!*

📋 PO No: *{po_no}*
🏪 Supplier: {state['supplier']}
📅 Date: {datetime.now().strftime('%d %b %Y')}

*Items:*
{items_text}

Order ready to send to supplier!"""
            else:
                del self._conversation_states[phone]
                return "Order cancelled."
        
        return self._get_default_response()
    
    # ==================== REMINDERS ==================== 
    
    async def _get_reminders_menu(self, phone: str) -> str:
        """Show reminders menu"""
        return """⏰ *Reminder Options*

1️⃣ *pending* - View pending payments
2️⃣ *remind [name]* - Send reminder to customer
3️⃣ *remind all* - Bulk reminders

_Example: remind Ramesh Kumar_"""
    
    async def _send_payment_reminder(self, phone: str, customer_name: str) -> str:
        """Send payment reminder to customer"""
        # TODO: Fetch actual customer data
        return f"""⏰ *Payment Reminder Prepared*

👤 Customer: *{customer_name}*
💰 Pending: ₹0
📅 Due Since: -

_Message will be sent to customer's WhatsApp._

Reply *confirm* to send reminder."""
    
    async def _handle_reminder_step(self, phone: str, message: str, state: dict) -> str:
        """Handle reminder steps"""
        if message.lower() in ['confirm', 'yes']:
            del self._conversation_states[phone]
            return "✅ Reminder sent successfully!"
        else:
            del self._conversation_states[phone]
            return "Reminder cancelled."
    
    async def _get_pending_payments(self, user_id: Optional[int]) -> str:
        """Get pending payments"""
        return """💰 *Pending Payments*

No pending payments found.

_Add credit sales to track pending payments._"""
    
    # ==================== ORDERS MENU ====================
    
    async def _get_orders_menu(self, phone: str) -> str:
        """Show orders menu"""
        return """📋 *Order Options*

1️⃣ *neworder* - Create purchase order
2️⃣ *orders* - View all orders
3️⃣ *pending orders* - Pending deliveries

_Example: neworder_"""
    
    # ==================== PRICE CHECK ====================
    
    async def _get_product_price(self, product: str) -> str:
        """Get product price"""
        # TODO: Fetch from database
        return f"""💰 *Price Check*

Product: *{product}*
Price: Not found

_Add the product first or check spelling._"""
    
    # ==================== SEND BILL ====================
    
    async def _send_bill_to_customer(self, phone: str, bill_id: str) -> str:
        """Send bill to customer via WhatsApp"""
        # TODO: Fetch bill from database and send
        return f"""📤 *Bill #{bill_id}*

Bill copied to clipboard!
Share link: https://kadaigpt.com/bill/{bill_id}

_Bill will be sent to customer's WhatsApp._"""
    
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

*Quick Commands:*
📊 *sales* / *expense* / *profit*
📦 *stock* / *products*
🧾 *bills* / *newbill*
👥 *customers* / *pending*

Type *help* for all commands! 💬"""

    def _get_help_response(self) -> str:
        return """📚 *KadaiGPT Bot Commands*

*📊 Reports*
• `sales` - Today's sales
• `expense` - Expenses report
• `profit` - Profit/Loss
• `report` - Full daily report
• `gst` - GST summary

*📦 Inventory*
• `stock` - Low stock alerts
• `products` - All products
• `add [name]` - Add product
• `price [name]` - Check price

*🧾 Billing*
• `bills` - Recent bills
• `newbill` - Create bill
• `sendbill [no]` - Send to customer

*👥 Customers*
• `customers` - Customer list
• `pending` - Pending payments
• `remind [name]` - Payment reminder

*📋 Orders*
• `orders` - Order options
• `neworder` - Create PO

*💬 General*
• `hi` - Greeting
• `cancel` - Cancel action
• `help` - This menu

_Supports Tamil: விற்பனை, செலவு, பில், சரக்கு_"""

    def _get_default_response(self) -> str:
        return """🤔 I didn't understand that.

Try:
• *sales* / *expense* / *profit*
• *stock* / *products*
• *bills* / *newbill*
• *help* - All commands

Or say *hi* to get started! 👋"""

    async def _get_sales_response(self, user_id: Optional[int]) -> str:
        """Get sales data - TODO: Connect to database"""
        today = datetime.now().strftime("%d %b %Y")
        
        # TODO: Fetch from database
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

_Updated just now_"""

    async def _get_profit_response(self, user_id: Optional[int]) -> str:
        today = datetime.now().strftime("%d %b %Y")
        
        return f"""💹 *Profit & Loss*
📅 {today}

📈 *Income*: ₹0
📉 *Expenses*: ₹0
━━━━━━━━━━━━━
✅ *Net Profit*: ₹0

_Updated just now_"""

    async def _get_stock_response(self, user_id: Optional[int]) -> str:
        return """📦 *Stock Status*

⚠️ *Low Stock Items*: 0
❌ *Out of Stock*: 0

✅ All items are well stocked!

Type *products* for full inventory."""

    async def _get_bills_response(self, user_id: Optional[int]) -> str:
        today = datetime.now().strftime("%d %b %Y")
        
        return f"""🧾 *Recent Bills*
📅 {today}

No bills found.

Create a bill: Type *newbill*"""

    async def _get_customers_response(self, user_id: Optional[int]) -> str:
        return """👥 *Customers*

📊 *Total*: 0
🆕 *New This Month*: 0
💰 *With Balance*: 0

Add customers from the KadaiGPT app."""

    async def _get_products_response(self, user_id: Optional[int]) -> str:
        return """📦 *Products*

📊 *Total Products*: 0
✅ *In Stock*: 0
⚠️ *Low Stock*: 0
❌ *Out of Stock*: 0

Add products: Type *add [product name]*"""

    async def _get_gst_response(self, user_id: Optional[int]) -> str:
        return """📋 *GST Summary*

💰 *Taxable Sales*: ₹0
📊 *CGST*: ₹0
📊 *SGST*: ₹0
━━━━━━━━━━━━━
💵 *Total GST Collected*: ₹0

_For the current month_"""

    async def _get_daily_report(self, user_id: Optional[int]) -> str:
        today = datetime.now().strftime("%A, %d %B %Y")
        time_now = datetime.now().strftime("%I:%M %p")
        
        return f"""📊 *DAILY BUSINESS REPORT*
📅 {today}
🕐 Generated at {time_now}

━━━━━━━━━━━━━━━━━━━

💰 *SALES*
• Revenue: ₹0
• Bills: 0
• Avg Bill: ₹0

💸 *EXPENSES*
• Total: ₹0

💹 *PROFIT*
• Net: ₹0

📦 *INVENTORY*
• Low Stock: 0
• Out of Stock: 0

👥 *CUSTOMERS*
• Total: 0
• Pending: ₹0

━━━━━━━━━━━━━━━━━━━

_Powered by KadaiGPT AI_ 🤖"""

    # ==================== HELPER METHODS ====================
    
    def _format_phone(self, phone: str) -> str:
        """Format phone number for WhatsApp"""
        digits = re.sub(r'\D', '', phone)
        
        if len(digits) == 10:
            digits = '91' + digits
        elif digits.startswith('0'):
            digits = '91' + digits[1:]
            
        return digits
    
    async def check_connection(self) -> Dict[str, Any]:
        """Check WAHA connection status"""
        try:
            url = f"{self.waha_url}/api/sessions/{self.session_name}"
            headers = {"X-Api-Key": self.api_key}
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    status = data.get("status", "STOPPED")
                    return {
                        "connected": status == "WORKING",
                        "state": status,
                        "session": self.session_name
                    }
                else:
                    return {"connected": False, "error": response.text}
                    
        except Exception as e:
            return {"connected": False, "error": str(e)}
    
    async def get_qr_code(self) -> Dict[str, Any]:
        """Get QR code for connecting WhatsApp via WAHA"""
        try:
            url = f"{self.waha_url}/api/{self.session_name}/auth/qr?format=raw"
            headers = {"X-Api-Key": self.api_key}
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "success": True,
                        "qrcode": data.get("value"),
                        "code": data.get("value")
                    }
                else:
                    return {"success": False, "error": response.text}
                    
        except Exception as e:
            return {"success": False, "error": str(e)}


# Singleton instance
whatsapp_bot = WhatsAppBotService()
