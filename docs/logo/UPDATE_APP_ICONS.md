# Update App Icons to Match New Logo - Wellus

## 🔍 Current Issue

Your app icon (shown on home screen) is still showing the old design (plate with spoon/fork). 
It needs to be updated to match your new logo (heart with human figure and leaf in teal/green).

---

## 📱 Icon Files That Need Updating

### **1. icon.png** ⚠️ NEEDS UPDATE
- **Location**: `assets/images/icon.png`
- **Usage**: Main app icon (iOS, Android, App Store)
- **Size**: 1024x1024 pixels
- **Status**: Still has old design

### **2. adaptive-icon.png** ⚠️ NEEDS UPDATE
- **Location**: `assets/images/adaptive-icon.png`
- **Usage**: Android adaptive icon (home screen - what you're seeing)
- **Size**: 1024x1024 pixels
- **Status**: Still has old design

### **3. splash-icon.png** ✅ (Already updated)
- **Location**: `assets/images/splash-icon.png`
- **Usage**: Splash screen
- **Status**: Should be updated

---

## 🎯 How to Update App Icons

### **Step 1: Use Your New Logo**
Your new logo file: `assets/images/logo.png`
- This is your new heart-shaped logo with human figure and leaf
- Colors: Teal and green
- This is what the app icons should look like

### **Step 2: Copy Logo to Icon Files**

#### **For icon.png:**
1. Open your `logo.png` in Paint or any image editor
2. Make sure it's 1024x1024 pixels (resize if needed)
3. Save as `icon.png`
4. Replace: `assets/images/icon.png`

#### **For adaptive-icon.png:**
1. Open your `logo.png` in Paint or any image editor
2. Make sure it's 1024x1024 pixels (resize if needed)
3. Save as `adaptive-icon.png`
4. Replace: `assets/images/adaptive-icon.png`

---

## 🛠️ Quick Method (Using Paint):

### **For icon.png:**
1. Open `logo.png` in Paint
2. Click "Resize" (or Ctrl+W)
3. Select "Pixels"
4. Set width: **1024** and height: **1024**
5. Check "Maintain aspect ratio"
6. Click "OK"
7. File → Save As → "PNG picture"
8. Name: **icon.png**
9. Save in: `assets/images/` folder (replace existing)

### **For adaptive-icon.png:**
1. Open `logo.png` in Paint (fresh copy)
2. Click "Resize" (or Ctrl+W)
3. Select "Pixels"
4. Set width: **1024** and height: **1024**
5. Check "Maintain aspect ratio"
6. Click "OK"
7. File → Save As → "PNG picture"
8. Name: **adaptive-icon.png**
9. Save in: `assets/images/` folder (replace existing)

---

## ✅ Checklist

- [ ] **icon.png** - Updated to match new logo (1024x1024px)
- [ ] **adaptive-icon.png** - Updated to match new logo (1024x1024px)
- [ ] Both files have transparent background
- [ ] Both files are PNG format
- [ ] Both files saved in `assets/images/` folder

---

## 🔄 After Updating

### **To See Changes:**
1. **Rebuild the app** - Icons are embedded during build
2. **Uninstall old app** - Remove from device
3. **Reinstall** - Install fresh build
4. **Check home screen** - New icon should appear

### **Note:**
App icons are embedded during the build process, so you need to:
- Rebuild the app
- Or create a new build
- Icons won't change with just a reload

---

## 📐 File Specifications

### **icon.png:**
- Size: 1024x1024 pixels
- Format: PNG
- Background: Transparent
- Content: Your new logo (heart with human and leaf)

### **adaptive-icon.png:**
- Size: 1024x1024 pixels
- Format: PNG
- Background: Transparent (Android adds white background)
- Content: Your new logo (heart with human and leaf)

---

## 🚨 Important Notes

1. **Icons are cached** - You may need to uninstall and reinstall
2. **Build required** - Icons are embedded during build, not runtime
3. **Both files needed** - icon.png and adaptive-icon.png
4. **Same design** - Both should match your new logo

---

**Update both icon files to match your new logo, then rebuild the app!** 🎨✨

