# 🎨 Fix Splash Screen Size & Quality - Wellus

## ✅ What I Fixed

I've updated your splash screen configuration to improve size and quality:

### **Changes Made:**
- **imageWidth**: `200` → `400` pixels
  - Larger size = better quality and smoother edges
  - 400px is optimal for most devices

---

## 📝 Next Steps to See Changes

### **1. Update splash-icon.png (Higher Resolution)**

For the best quality, your `splash-icon.png` should be **at least 2x the display size**:

**Current setup:**
- Display size: 400px
- **Recommended file size: 800px width** (2x for retina displays)

### **How to Update splash-icon.png:**

1. **Open your `logo.png` in Paint**
2. **Click "Resize" (or Ctrl+W)**
3. **Select "Pixels"**
4. **Set width: 800** (height will auto-adjust)
5. **Check "Maintain aspect ratio"**
6. **Click "OK"**
7. **File → Save As → "PNG picture"**
8. **Name: splash-icon.png**
9. **Save in: `assets/images/` folder (replace existing)**

---

## 🔄 After Updating File

### **1. Stop Current Expo Session**
Press `Ctrl+C` in your terminal

### **2. Clear Cache and Restart**
```bash
npx expo start --clear
```

### **3. Close Expo Go App**
- Completely close Expo Go on your device
- Clear Expo Go cache (Settings → Apps → Expo Go → Clear Cache)

### **4. Scan QR Code Again**
- The new size should show better quality and smoother edges

---

## 📐 Size Recommendations

| Display Size | File Size (2x) | File Size (3x) |
|-------------|----------------|----------------|
| 400px       | 800px          | 1200px         |
| **Current** | **Recommended** | For best quality |

**For smooth edges:**
- Use **800px width** for splash-icon.png (2x the display size)
- This ensures crisp rendering on all devices

---

## 🎯 Quality Tips

1. **Higher resolution = smoother edges**
   - 800px file for 400px display = 2x retina quality
   - Prevents pixelation and jagged edges

2. **PNG format**
   - Use PNG (not JPG) for transparent backgrounds
   - PNG preserves quality better

3. **Transparent background**
   - Keep transparent background in your logo
   - White background is added automatically

---

## ✅ Expected Result

After updating:
- ✅ Logo appears larger and properly sized
- ✅ Edges are smooth (no pixelation)
- ✅ Crisp quality on all devices
- ✅ Professional appearance

---

## 🔍 If Still Not Smooth

If edges are still not smooth after updating:

1. **Check file resolution:**
   - Open splash-icon.png
   - Verify it's at least 800px width

2. **Re-export from source:**
   - Use your original logo file (not a resized copy)
   - Export at 800px directly

3. **Use vector source:**
   - If you have SVG/vector version, use that
   - Export to PNG at 800px for best quality

---

**Update splash-icon.png to 800px width, then restart Expo!** 🎨✨

