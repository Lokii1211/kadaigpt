# 📋 KadaiGPT - Known Issues & Status

## Last Updated: February 3, 2026

---

## ✅ FIXED ISSUES

### 1. Analytics Page (FIXED)
- **Issue:** Page was showing blank/errors
- **Root Cause:** Missing import for `PricePredictions` component, undefined `isDemoMode` and `demoProducts` variables
- **Fix:** Added import and fixed variable references
- **Status:** ✅ Working

### 2. GST Reports Page (FIXED)
- **Issue:** Page was crashing/not loading
- **Root Cause:** Data model mismatch - page expected `summary.taxableAmount`, `summary.totalGST`, `summary.exemptSales`, and `breakdown` array but these weren't being set
- **Fix:** Updated `loadGSTData` function to include all required fields
- **Status:** ✅ Working

### 3. Mobile Scrolling (FIXED)
- **Issue:** Users couldn't scroll on mobile devices
- **Root Cause:** Missing `-webkit-overflow-scrolling: touch` and proper overflow settings
- **Fix:** Added comprehensive mobile scrolling CSS with touch optimization
- **Status:** ✅ Working

### 4. Dashboard Stat Cards (FIXED)
- **Issue:** Showing dummy/placeholder percentages
- **Root Cause:** Hardcoded values instead of calculated data
- **Fix:** Removed dummy data, now uses real calculated values
- **Status:** ✅ Working

---

## 🔧 UI ALIGNMENT IMPROVEMENTS

### Cross-Device Support Added:
- ✅ **iOS Safe Area** - Respects notch and home indicator
- ✅ **Tablet Breakpoint** (769px - 1024px) - Optimized grid layouts
- ✅ **Mobile Breakpoint** (<768px) - Single column layouts
- ✅ **Touch Optimization** - 44px minimum touch targets
- ✅ **Desktop Hover States** - Only on pointer devices
- ✅ **Scrollbar Styling** - Custom scrollbars for webkit/Firefox

### Page-Specific Fixes:
- Analytics page scrollable with proper padding
- GST Reports page with responsive stats grid
- All agent cards scroll properly
- Tables horizontally scrollable on mobile
- Bottom navigation doesn't block content

---

## 📌 CURRENT LIMITATIONS

### 1. Voice Command (Browser Support)
- Uses Web Speech API which requires Chrome/Edge
- Safari has limited support
- Doesn't work on Firefox

### 2. WhatsApp Integration
- Requires backend Twilio configuration
- Demo mode available without credentials

### 3. OCR Feature
- Requires backend API key for Google Vision
- Fallback to demo mode available

---

## 🔮 PLANNED IMPROVEMENTS

1. **Offline Mode** - Service worker for offline access
2. **PWA Support** - Installable app
3. **Dark/Light Theme Toggle** - Currently dark only
4. **Language Switching** - Hindi/Tamil UI support
5. **Export to Tally** - Direct accounting integration

---

## 🐛 HOW TO REPORT BUGS

1. Note the exact page and action
2. Check browser console for errors
3. Note device type (iOS/Android/Desktop)
4. Take a screenshot if possible
5. Create an issue on GitHub

---

## 📱 TESTED DEVICES

- ✅ Desktop Chrome
- ✅ Desktop Firefox
- ✅ Desktop Safari
- ✅ iPhone Safari
- ✅ iPhone Chrome
- ✅ Android Chrome
- ✅ Android Firefox
- ✅ iPad Safari

---

## 🔗 LINKS

- **Live App:** https://kadaigpt.up.railway.app
- **GitHub:** https://github.com/Lokii1211/kadaigpt
- **Backend API:** https://kadaigpt-backend.up.railway.app
