# 🔄 Force Expo Go to Update Splash Screen - Wellus

## ⚠️ The Problem

Expo Go **caches splash screens on their servers**. Even though we've updated:
- ✅ Configuration (600px width)
- ✅ Files (splash-icon.png)
- ✅ Version numbers

Expo Go is still showing the old cached version.

---

## 🚀 Solution: Complete Refresh

I've already:
- ✅ Incremented version to `1.0.2`
- ✅ Incremented versionCode to `3`
- ✅ Incremented buildNumber to `3`
- ✅ Cleared local Expo cache

---

## 📝 What You Need to Do NOW:

### **Step 1: Verify splash-icon.png File**

**CRITICAL:** Make sure `splash-icon.png` is **1200px width** for smooth edges:

1. Open `assets/images/splash-icon.png` in Paint
2. Check the width (Image → Attributes or Resize)
3. If it's NOT 1200px, update it:
   - Open `logo.png`
   - Resize to **1200px width**
   - Save as `splash-icon.png`

### **Step 2: Stop Expo Completely**

1. Press `Ctrl+C` in terminal to stop Expo
2. Close the terminal window

### **Step 3: Clear Expo Go App Cache**

**On your Android device:**
1. Settings → Apps → Expo Go
2. Storage → Clear Cache
3. Storage → Clear Data (if needed)
4. Force Stop the app

### **Step 4: Restart Everything**

1. **Open new terminal**
2. **Navigate to project:**
   ```bash
   cd C:\Users\singh\OneDrive\Desktop\base_final1
   ```
3. **Start Expo with cleared cache:**
   ```bash
   npx expo start --clear
   ```
4. **Close Expo Go app completely** (swipe away from recent apps)
5. **Open Expo Go fresh**
6. **Scan QR code again**

---

## ⏰ Wait Time

If still not working:
- **Wait 15-20 minutes** for Expo's server cache to clear
- Then try again

---

## 🎯 Alternative: Create Development Build

**For immediate results, create a development build instead:**

```bash
# Install EAS CLI (if not installed)
npm install -g eas-cli

# Login
eas login

# Create development build
eas build --platform android --profile development
```

**Development builds:**
- ✅ Use your actual splash screen (no server cache)
- ✅ Immediate updates
- ✅ Better performance
- ✅ Full control

---

## ✅ Verification Checklist

Before trying again, verify:
- [ ] `splash-icon.png` is **1200px width** (check in Paint)
- [ ] Version is `1.0.2` in app.json
- [ ] Expo cache cleared (`.expo` folder deleted)
- [ ] Expo Go app cache cleared on device
- [ ] Expo Go app force stopped
- [ ] Fresh Expo start with `--clear` flag

---

## 🔍 If Still Not Working

The issue is **Expo Go's server-side cache**. Options:

1. **Wait longer** (20-30 minutes)
2. **Create development build** (recommended)
3. **Use different Expo account** (forces fresh cache)

---

**Try the steps above - especially clearing Expo Go app cache on your device!** 🔄✨

