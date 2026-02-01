# KadaiGPT Testing Checklist

## Pre-Testing Setup
1. Open browser and go to https://kadaigpt.up.railway.app
2. Open DevTools (F12) → Application → Clear site data
3. Refresh the page

---

## 1. Registration Test
- [ ] Click "Register" tab
- [ ] Fill in:
  - Name: Test User
  - Email: your_email@test.com
  - Store Name: My Test Store  
  - Password: Test@123
- [ ] Click Register
- [ ] Expected: Redirects to Dashboard

## 2. Dashboard Test (After Login)
- [ ] Page loads without errors
- [ ] Stats show zeros (not demo data like ₹24,580)
- [ ] "Recent Activity" is empty or minimal
- [ ] Quick action buttons visible

## 3. Products Test
- [ ] Navigate to Products page
- [ ] Check: "Add Product" button is visible
- [ ] Click "Add Product"
- [ ] Fill in:
  - Name: Basmati Rice
  - SKU: SKU001 (or leave blank for auto)
  - Price: 85
  - Unit: kg
  - Stock: 50
  - Min Stock: 10
  - Category: Grains
- [ ] Click Save
- [ ] Expected: Product appears in list
- [ ] Refresh page - product should persist

## 4. Customers Test
- [ ] Navigate to Customers page
- [ ] Check: Page shows "No customers yet" (not demo data)
- [ ] Check: "Add Customer" button visible (top right or floating)
- [ ] Click "Add Customer"
- [ ] Fill in:
  - Name: Rajesh Kumar
  - Phone: 9876543210
  - Email: rajesh@test.com (optional)
  - Address: (optional)
- [ ] Click Save
- [ ] Expected: Customer appears in list

## 5. Suppliers Test
- [ ] Navigate to Suppliers page
- [ ] Check: Page loads without crash
- [ ] Check: Shows "No suppliers" or empty cards
- [ ] Check: "Add Supplier" button visible
- [ ] Click "Add Supplier"  
- [ ] Fill in:
  - Name: Metro Wholesale
  - Contact Person: Ajay Kumar
  - Phone: 9876543211
  - Category: General
- [ ] Click Save
- [ ] Expected: Supplier appears in list

## 6. Bills Test
- [ ] Navigate to Bills page
- [ ] Check: Shows empty state for new users
- [ ] Navigate to "New Bill" / "Create Bill"
- [ ] Add items and create a bill
- [ ] Check if bill saves and appears in history

## 7. GST Reports Test
- [ ] Navigate to GST Reports page
- [ ] Page should load (may show zeros)
- [ ] Try clicking Export dropdown
- [ ] Select CSV export
- [ ] Expected: CSV file downloads

## 8. Analytics Test
- [ ] Navigate to Analytics page
- [ ] For new user: should show zeros
- [ ] Charts should render (even if empty)

## 9. WhatsApp Integration Test
- [ ] Navigate to WhatsApp page
- [ ] Should show "0 messages sent" for new users
- [ ] Try sending a quick message
- [ ] Should open WhatsApp link

## 10. Demo Mode Test
- [ ] Logout
- [ ] Click "Try Demo" button on login page
- [ ] Dashboard should show demo data (₹24,580, etc.)
- [ ] All pages should have sample data
- [ ] Logout and login with real account
- [ ] Demo data should be gone

---

## Common Issues & Fixes

### Issue: Still seeing demo data
**Fix:** Clear localStorage and refresh, or check kadai_demo_mode in localStorage

### Issue: "Failed to fetch" errors
**Fix:** Check if logged in, try refreshing token

### Issue: Page crashes
**Fix:** Check browser console for specific error

---

## API Endpoints to Test (Optional - Advanced)

```bash
# Health check
GET /health

# Auth
POST /api/v1/auth/register
POST /api/v1/auth/login

# Products
GET /api/v1/products
POST /api/v1/products

# Customers  
GET /api/v1/customers
POST /api/v1/customers

# Suppliers
GET /api/v1/suppliers
POST /api/v1/suppliers

# WhatsApp
GET /api/v1/whatsapp/templates
GET /api/v1/whatsapp/stats
```

---

## Bugs to Report
If you find any bugs, note:
1. Page where bug occurred
2. Steps to reproduce
3. Expected vs actual behavior
4. Any error messages in console
