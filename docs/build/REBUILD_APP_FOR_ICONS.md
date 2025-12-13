# 🔄 Rebuild App to See New Icons - Wellus

## ⚠️ Important: Icons Are Embedded During Build

**App icons and splash screens are embedded during the build process**, not loaded at runtime. This means:
- ✅ Updating the files is correct
- ❌ But you **MUST rebuild** the app to see changes
- ❌ Just reloading won't work

---

## 🚀 Step-by-Step: Clear Cache & Rebuild

### **Step 1: Stop Current Expo Session**
1. Press `Ctrl+C` in your terminal to stop Expo
2. Close the Expo Go app on your device (if using)

### **Step 2: Clear All Caches**

Run these commands in your project folder:

```bash
# Clear Expo cache
npx expo start --clear

# Or manually clear:
# Delete .expo folder
# Delete node_modules/.cache
# Delete .metro folder (if exists)
```

### **Step 3: Rebuild the App**

#### **Option A: Development Build (Expo Go)**
```bash
# Start with cleared cache
npx expo start --clear

# Then scan QR code again with Expo Go
```

#### **Option B: Production Build (EAS Build)**
```bash
# Clear cache and build
eas build --platform android --clear-cache

# Or for iOS
eas build --platform ios --clear-cache
```

#### **Option C: Local Build**
```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

### **Step 4: Uninstall Old App**
- **Remove the old Wellus app** from your device completely
- This ensures no cached icons remain

### **Step 5: Install Fresh Build**
- Install the newly built app
- The new logo should appear on:
  - ✅ Home screen icon
  - ✅ Splash screen
  - ✅ App screens

---

## 🧹 Complete Cache Clear (If Still Not Working)

### **Delete These Folders:**
1. `.expo/` folder
2. `node_modules/.cache/` folder
3. `.metro/` folder (if exists)
4. `android/.gradle/` folder (if exists)
5. `ios/Pods/` folder (if exists)

### **Then Reinstall:**
```bash
# Reinstall dependencies
npm install

# Start fresh
npx expo start --clear
```

---

## ✅ Verification Checklist

Before rebuilding, verify:
- [ ] `icon.png` - Updated with new logo (1024x1024px)
- [ ] `adaptive-icon.png` - Updated with new logo (1024x1024px)
- [ ] `splash-icon.png` - Updated with new logo (200px width)
- [ ] `favicon.png` - Updated with new logo (64x64px)
- [ ] All files saved in `assets/images/` folder

After rebuilding:
- [ ] Old app uninstalled
- [ ] New build installed
- [ ] Home screen icon shows new logo
- [ ] Splash screen shows new logo

---

## 🔍 Troubleshooting

### **Still seeing old icon?**
1. **Check file dates** - Make sure files were saved recently
2. **Verify file sizes** - icon.png should be ~1024x1024px
3. **Check app.json** - Verify paths are correct
4. **Clear device cache** - Uninstall app completely
5. **Rebuild from scratch** - Delete build folders

### **Splash screen still old?**
1. Check `splash-icon.png` is updated
2. Verify `app.json` splash config
3. Clear Expo cache: `npx expo start --clear`
4. Rebuild the app

---

## 📝 Quick Command Reference

```bash
# Clear cache and start
npx expo start --clear

# Build for Android
eas build --platform android --clear-cache

# Build for iOS
eas build --platform ios --clear-cache

# Local Android build
npx expo run:android

# Local iOS build
npx expo run:ios
```

---

**After rebuilding, your new logo will appear everywhere!** 🎨✨

