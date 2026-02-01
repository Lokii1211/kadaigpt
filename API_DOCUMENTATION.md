# 📚 KadaiGPT API Documentation

Complete API reference for KadaiGPT - India's AI-Powered Retail Operations Platform.

## 🌐 Base URL

- **Production**: `https://kadaigpt.up.railway.app/api/v1`
- **Development**: `http://localhost:8000/api/v1`
- **API Docs (Swagger)**: `/docs`
- **API Docs (ReDoc)**: `/redoc`

---

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header.

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "store@example.com",
  "password": "securepassword",
  "store_name": "My Kirana Store"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "store@example.com",
    "store_name": "My Kirana Store"
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=store@example.com&password=securepassword
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

---

## 📊 Dashboard

### Get Dashboard Stats
```http
GET /dashboard/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "today_sales": 47850,
  "today_bills": 68,
  "low_stock_count": 5,
  "pending_credit": 25000,
  "sales_trend": "up",
  "sales_change_percent": 12.5
}
```

### Get Activity Feed
```http
GET /dashboard/activity
Authorization: Bearer <token>
```

**Response:**
```json
{
  "activities": [
    {
      "id": 1,
      "type": "sale",
      "message": "New sale of ₹1,250",
      "time": "2 minutes ago"
    }
  ]
}
```

### Get AI Insights
```http
GET /dashboard/insights
Authorization: Bearer <token>
```

---

## 📦 Products

### List Products
```http
GET /products
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category |
| `search` | string | Search by name |
| `low_stock` | boolean | Only low stock items |

### Create Product
```http
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Basmati Rice 5kg",
  "sku": "RICE-BAS-5KG",
  "barcode": "8901491101219",
  "price": 450,
  "cost_price": 380,
  "unit": "kg",
  "stock": 50,
  "min_stock": 20,
  "category": "Grains",
  "gst_rate": 5
}
```

### Update Product
```http
PUT /products/{product_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "price": 475,
  "stock": 45
}
```

### Delete Product
```http
DELETE /products/{product_id}
Authorization: Bearer <token>
```

---

## 🧾 Bills

### List Bills
```http
GET /bills
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | string | Filter from date (YYYY-MM-DD) |
| `end_date` | string | Filter to date |
| `payment_mode` | string | Cash, UPI, Card, Credit |
| `status` | string | completed, pending, cancelled |

### Create Bill
```http
POST /bills
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_name": "Rajesh Kumar",
  "customer_phone": "9876543210",
  "items": [
    {
      "product_id": 1,
      "product_name": "Basmati Rice 5kg",
      "quantity": 2,
      "unit_price": 450
    }
  ],
  "payment_mode": "UPI",
  "discount": 50
}
```

### Get Bill Details
```http
GET /bills/{bill_id}
Authorization: Bearer <token>
```

### Print Bill
```http
POST /bills/print
Authorization: Bearer <token>
Content-Type: application/json

{
  "bill_id": 1,
  "printer_name": "Thermal Printer"
}
```

---

## 👥 Customers

### List Customers
```http
GET /customers
Authorization: Bearer <token>
```

### Get Customer Stats
```http
GET /customers/stats/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_customers": 156,
  "total_credit": 45000,
  "customers_with_credit": 23,
  "new_this_month": 12
}
```

### Create Customer
```http
POST /customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Lakshmi Stores",
  "phone": "9876543210",
  "email": "lakshmi@example.com",
  "address": "123 Main Street"
}
```

### Record Payment
```http
POST /customers/{customer_id}/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5000,
  "mode": "UPI",
  "notes": "Partial payment"
}
```

---

## 🏭 Suppliers

### List Suppliers
```http
GET /suppliers
Authorization: Bearer <token>
```

### Get Supplier Stats
```http
GET /suppliers/stats/summary
Authorization: Bearer <token>
```

### Create Purchase Order
```http
POST /suppliers/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "supplier_id": 1,
  "items": [
    {
      "product_name": "Basmati Rice 5kg",
      "quantity": 100,
      "unit_price": 380
    }
  ],
  "expected_delivery": "2026-02-05"
}
```

### Update Order Status
```http
PUT /suppliers/orders/{order_id}/status?new_status=delivered
Authorization: Bearer <token>
```

---

## 📊 Analytics

### Sales Overview
```http
GET /analytics/sales/overview?period=month
Authorization: Bearer <token>
```

**Period Options:** `day`, `week`, `month`, `quarter`, `year`

**Response:**
```json
{
  "period": "month",
  "current": {
    "start_date": "2026-02-01T00:00:00",
    "total_sales": 150000,
    "total_bills": 425,
    "average_bill_value": 353,
    "unique_customers": 180
  },
  "previous": {
    "total_sales": 135000,
    "total_bills": 380
  },
  "change": {
    "sales_change": 11.1,
    "trend": "up"
  }
}
```

### Hourly Sales
```http
GET /analytics/sales/hourly?date=2026-02-01
Authorization: Bearer <token>
```

### Sales by Payment Method
```http
GET /analytics/sales/by-payment?period=month
Authorization: Bearer <token>
```

### Top Selling Products
```http
GET /analytics/products/top-selling?limit=10&period=month
Authorization: Bearer <token>
```

### Slow Moving Products
```http
GET /analytics/products/slow-moving?limit=10
Authorization: Bearer <token>
```

### Category Performance
```http
GET /analytics/products/categories?period=month
Authorization: Bearer <token>
```

### Customer Overview
```http
GET /analytics/customers/overview
Authorization: Bearer <token>
```

### Customer Retention
```http
GET /analytics/customers/retention
Authorization: Bearer <token>
```

### Inventory Health
```http
GET /analytics/inventory/health
Authorization: Bearer <token>
```

### Inventory Predictions
```http
GET /analytics/inventory/predictions
Authorization: Bearer <token>
```

### Profit & Loss
```http
GET /analytics/financial/profit-loss?period=month
Authorization: Bearer <token>
```

### Cash Flow
```http
GET /analytics/financial/cashflow
Authorization: Bearer <token>
```

### Summary Report
```http
GET /analytics/reports/summary?period=month
Authorization: Bearer <token>
```

---

## 📧 Notifications

### Get Email Settings
```http
GET /notifications/email/settings
Authorization: Bearer <token>
```

### Update Email Settings
```http
PUT /notifications/email/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "daily_summary": true,
  "low_stock_alerts": true,
  "payment_reminders": true,
  "weekly_report": false,
  "email": "owner@store.com"
}
```

### Send Test Email
```http
POST /notifications/email/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "test@example.com",
  "template": "welcome"
}
```

**Template Options:** `welcome`, `daily_summary`, `low_stock_alert`

### Trigger Daily Summary
```http
POST /notifications/email/daily-summary
Authorization: Bearer <token>
```

### Get Notification History
```http
GET /notifications/history?limit=20
Authorization: Bearer <token>
```

### Get Service Status
```http
GET /notifications/status
```

---

## 📱 WhatsApp Bot

### Webhook (Verification)
```http
GET /whatsapp/webhook?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE
```

### Webhook (Messages)
```http
POST /whatsapp/webhook
Content-Type: application/json

{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "919876543210",
          "text": {"body": "hi"}
        }]
      }
    }]
  }]
}
```

### Send Message
```http
POST /whatsapp/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "919876543210",
  "message": "Your order is ready!"
}
```

### Get Templates
```http
GET /whatsapp/templates
Authorization: Bearer <token>
```

### Get Bot Stats
```http
GET /whatsapp/stats
Authorization: Bearer <token>
```

### Send Bulk Reminders
```http
POST /whatsapp/bulk-reminder
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_ids": [1, 2, 3],
  "message_type": "payment"
}
```

---

## 📷 OCR

### Process Bill Image
```http
POST /ocr/process
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image_file>
language: en
```

**Language Options:** `en`, `hi`, `ta`, `te`

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "name": "Rice 5kg",
      "quantity": 2,
      "unit_price": 450,
      "total": 900,
      "confidence": 0.95
    }
  ],
  "subtotal": 900,
  "tax": 45,
  "total": 945,
  "confidence": 0.92
}
```

---

## 🖨️ Print

### Get Printer Status
```http
GET /print/status
Authorization: Bearer <token>
```

### Preview Receipt
```http
POST /print/preview
Authorization: Bearer <token>
Content-Type: application/json

{
  "bill_number": "INV-2026-0047",
  "store_name": "My Store",
  "items": [...],
  "total": 1250
}
```

### Test Print
```http
POST /print/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "printer_name": "Thermal Printer"
}
```

---

## 🔒 Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Authentication | 5 requests | 60 seconds |
| OCR Processing | 10 requests | 60 seconds |
| General API | 100 requests | 60 seconds |
| Bulk Operations | 10 requests | 300 seconds |

**Rate Limit Headers:**
```
X-RateLimit-Remaining: 95
Retry-After: 60
```

---

## ❌ Error Responses

```json
{
  "detail": "Error message here"
}
```

| Status Code | Meaning |
|------------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - No permission |
| 404 | Not Found - Resource doesn't exist |
| 422 | Validation Error - Check input format |
| 429 | Too Many Requests - Rate limited |
| 500 | Server Error - Contact support |

---

## 🔗 Webhooks

### Bill Created Webhook
When a new bill is created, a webhook can be triggered:

```json
{
  "event": "bill.created",
  "timestamp": "2026-02-01T10:30:00Z",
  "data": {
    "bill_id": 47,
    "bill_number": "INV-2026-0047",
    "total": 1250,
    "payment_mode": "UPI"
  }
}
```

---

## 📝 Data Types

### Currency
All currency values are in Indian Rupees (INR) as integers (paise) or floats.

### Dates
All dates follow ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`

### Phone Numbers
Indian phone numbers: 10 digits starting with 6-9.

### GSTIN
15-character alphanumeric: `33AABCU9603R1ZM`

---

*Last Updated: February 1, 2026*
*KadaiGPT - Bill Karo, AI Sambhalo*
