# KadaiGPT Bug Fixes & Feature Implementation Plan

## 🐛 Critical Bugs to Fix

### 1. Login Fails After Logout
- **Issue**: User logs out, then tries to login with same credentials - shows "Invalid credentials"
- **Root Cause**: Token might not be properly cleared or backend session issue
- **Fix**: Ensure logout properly clears all tokens and session data

### 2. Products/Bills Not Showing
- **Issue**: When user adds products or bills, they don't appear
- **Root Cause**: Demo data being used instead of real API data
- **Fix**: Implement proper API calls for CRUD operations, separate demo mode logic

### 3. "Vyapar" Branding → "KadaiGPT"
- **Files to update**: whatsapp.js, demoData.js, api.js, multiple pages
- **Fix**: Global find/replace VyaparAI → KadaiGPT

### 4. OCR Not Extracting Correct Details
- **Issue**: Bill upload not working properly
- **Fix**: Improve OCR processing and extraction logic

### 5. Dummy Data for Real Users
- **Issue**: Registered users see dummy data instead of their real data
- **Fix**: Check if user is in demo mode, only show demo data for demo users

## ✨ Features to Add

### 1. Show Password Toggle
- Add eye icon to password fields in Login/Register forms

### 2. Real-time GST Verification
- Integrate GST API to verify GSTIN numbers

### 3. Email Verification on Registration
- Send OTP/verification link to email

### 4. WhatsApp Notifications
- Order confirmations
- Stock alerts
- Bill receipts
- Payment reminders

### 5. Remove Hindi/Tamil Text
- Keep only English for clean UI

## 📋 Implementation Order

1. Fix branding (Vyapar → KadaiGPT)
2. Add show password toggle
3. Fix demo data vs real data logic
4. Fix login/logout flow
5. Remove Hindi text
6. Add WhatsApp notification features
7. Improve OCR
8. Add GST verification
9. Add email verification

