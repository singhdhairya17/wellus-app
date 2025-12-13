# 🚀 Quick Development Build Guide - Fix Splash Screen

## ⚠️ The Problem

**Expo Go caches splash screens on their servers** - even reinstalling doesn't help. The splash screen you see during "Bundling" is **Expo Go's own splash screen**, not your app's.

---

## ✅ Solution: Development Build

I've already configured `eas.json` with a development profile. Now just run:

### **Step 1: Install EAS CLI (if not installed)**

```bash
npm install -g eas-cli
```

### **Step 2: Login to Expo**

```bash
eas login
```

(Create account at https://expo.dev if needed)

### **Step 3: Create Development Build**

```bash
eas build --platform android --profile development
```

**This will:**
- ✅ Build your app with your **actual splash screen** (1200px file)
- ✅ Take about 10-15 minutes
- ✅ Give you a download link
- ✅ **Bypass all Expo Go caches**

### **Step 4: Install & Use**

1. **Download the APK** from the build link (sent to your email/terminal)
2. **Install on your Android device** (enable "Install from unknown sources" if needed)
3. **Run:** `npx expo start --dev-client`
4. **Scan QR code** with the **development build app** (not Expo Go)

---

## 🎯 Why This Works

**Development Build:**
- ✅ Splash screen is **embedded in native app** (no server cache)
- ✅ Uses your **actual 1200px splash-icon.png**
- ✅ Shows **immediately** (no "Bundling" screen)
- ✅ **Full control** over splash screen

**Expo Go:**
- ❌ Splash screens cached on Expo's servers
- ❌ "Bundling" screen is Expo Go's own splash
- ❌ Your splash only shows after bundle loads (if at all)

---

## 📝 What You'll See

**With Development Build:**
- Your splash screen shows **immediately** when app opens
- Proper size (from 1200px file)
- Smooth edges (no pixelation)
- Professional appearance

**With Expo Go:**
- Expo Go's "Bundling" screen (not yours)
- Your splash may show after bundle loads (if cached correctly)

---

## 🚀 Quick Commands

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Create build
eas build --platform android --profile development

# 4. After build completes, install APK on device

# 5. Start dev server
npx expo start --dev-client

# 6. Scan QR code with development build app
```

---

## ✅ Expected Result

After installing development build:
- ✅ Your splash screen shows **immediately**
- ✅ Proper size and smooth edges
- ✅ No cache issues
- ✅ Professional appearance

---

**This is the only reliable way to see your splash screen!** 🎨✨

