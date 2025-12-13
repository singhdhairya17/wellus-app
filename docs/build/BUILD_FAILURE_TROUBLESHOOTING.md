# 🔧 Build Failure Troubleshooting

## ❌ Build Failed

**Build Logs:** https://expo.dev/accounts/dhairyasingh17/projects/ai-diet-planner/builds/18078f48-8c4b-413a-b982-83c21fbac750

## 🔍 Common Issues & Fixes

### 1. **Check Build Logs**
Open the link above to see the detailed error message in the "Prepare project" phase.

### 2. **New Architecture Compatibility**
Your app has `newArchEnabled: true` which might cause issues with some packages.

**Option A: Disable New Architecture (Recommended for now)**
```json
// app.json
"newArchEnabled": false
```

**Option B: Keep New Architecture**
- Some packages may not support it yet
- Check build logs for specific package errors

### 3. **Missing Dependencies**
Some native modules might need additional configuration.

### 4. **Icon/Splash Files**
Verify all icon files exist and are valid:
- `assets/images/icon.png`
- `assets/images/adaptive-icon.png`
- `assets/images/splash-icon.png`

### 5. **Android Permissions Format**
Your permissions look correct, but verify format:
```json
"permissions": [
  "android.permission.CAMERA",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.RECORD_AUDIO"
]
```

## 🚀 Quick Fixes to Try

### Fix 1: Disable New Architecture
```bash
# Edit app.json - change:
"newArchEnabled": false

# Then rebuild:
eas build --profile development --platform android
```

### Fix 2: Clear Cache and Rebuild
```bash
eas build --profile development --platform android --clear-cache
```

### Fix 3: Check Build Logs
1. Open: https://expo.dev/accounts/dhairyasingh17/projects/ai-diet-planner/builds/18078f48-8c4b-413a-b982-83c21fbac750
2. Look for specific error in "Prepare project" phase
3. Share the error message for specific fix

## 📋 Next Steps

1. **Check the build logs** (link above) for the specific error
2. **Try disabling new architecture** if packages aren't compatible
3. **Retry build** with `--clear-cache` flag

---

**Most likely issue:** New Architecture compatibility with some packages. Try disabling it first.

