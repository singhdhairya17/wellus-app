# Logo Format Specifications for Wellus

## 📐 Required Format for `logo.png`

### **File Format:**
- **Format**: PNG (Portable Network Graphics)
- **Extension**: `.png`
- **Background**: **Transparent** (alpha channel required)
- **Color Mode**: RGB
- **Bit Depth**: 32-bit (with alpha channel) or 24-bit

### **Dimensions:**
- **Minimum Size**: 512x512 pixels
- **Recommended Size**: 1024x1024 pixels (for high-resolution displays)
- **Maximum Size**: 2048x2048 pixels (optional, for future-proofing)
- **Aspect Ratio**: **1:1 (Square)** - CRITICAL

### **File Size:**
- **Recommended**: Under 500KB
- **Maximum**: 1MB (for performance)
- **Optimized**: Compressed PNG (use tools like TinyPNG)

---

## 🎨 Design Requirements

### **Color Specifications:**
- **Colors**: Teal (#14B8A6) and Green (#10B981) as per your requirements
- **Background**: **Transparent** (no white/colored background)
- **Format**: Two-tone or gradient between teal and green
- **Compatibility**: Must work on:
  - White backgrounds
  - Dark backgrounds (#1F1F1F)
  - Light gray backgrounds (#F5F5F5)

### **Design Guidelines:**
- **Style**: Modern, premium, minimalist
- **Details**: Subtle sophisticated details
- **Icon Type**: Icon-only (no text)
- **Shape**: Square format, but logo can be circular or any shape within
- **Scalability**: Must look good at 100x100 pixels (smallest use case)

---

## 📱 Usage in App (Current Sizes)

### **1. Landing Page (`app/index.jsx`):**
- **Display Size**: 150x150 pixels
- **Location**: Centered on landing screen
- **Background**: Dark overlay

### **2. Sign In Page (`app/auth/SignIn.jsx`):**
- **Display Size**: 100x100 pixels
- **Container**: 120x120 pixels (circular with shadow)
- **Background**: Theme-aware (light/dark)

### **3. Sign Up Page (`app/auth/SignUp.jsx`):**
- **Display Size**: 100x100 pixels
- **Container**: 120x120 pixels (circular with shadow)
- **Background**: Theme-aware (light/dark)

---

## ✅ Export Checklist

When creating/exporting your logo:

- [ ] **Format**: PNG
- [ ] **Dimensions**: 512x512px minimum (1024x1024px recommended)
- [ ] **Aspect Ratio**: 1:1 (Square)
- [ ] **Background**: Transparent (alpha channel)
- [ ] **Colors**: Teal (#14B8A6) and Green (#10B981)
- [ ] **File Size**: Under 500KB
- [ ] **Optimized**: Compressed for web/mobile
- [ ] **Tested**: Works at 100x100px size
- [ ] **Compatible**: Works on light and dark backgrounds

---

## 🛠️ How to Export from Design Tools

### **From Canva:**
1. Design your logo
2. Click "Download"
3. Select "PNG"
4. Check "Transparent background"
5. Size: "Large" or "Original"
6. Download

### **From Figma:**
1. Select your logo
2. Right-click → "Export"
3. Format: PNG
4. Size: 2x (1024px) or 3x (1536px)
5. Export

### **From Photoshop:**
1. File → Export → Export As
2. Format: PNG
3. Check "Transparency"
4. Dimensions: 1024x1024px
5. Quality: High
6. Export

### **From Illustrator:**
1. File → Export → Export As
2. Format: PNG
3. Resolution: 300 DPI (or 72 DPI for web)
4. Background: Transparent
5. Dimensions: 1024x1024px
6. Export

---

## 🎯 Quick Export Settings

### **Optimal Settings:**
```
Format: PNG
Dimensions: 1024x1024 pixels
Background: Transparent
Color Mode: RGB
Bit Depth: 32-bit (with alpha)
Compression: Optimized
File Size: < 500KB
```

### **Minimum Settings:**
```
Format: PNG
Dimensions: 512x512 pixels
Background: Transparent
Color Mode: RGB
Bit Depth: 24-bit or 32-bit
```

---

## 📂 File Location

Save your logo as:
```
assets/images/logo.png
```

**Path**: `C:\Users\singh\OneDrive\Desktop\base_final1\assets\images\logo.png`

---

## 🔍 Testing Your Logo

After replacing the file:

1. **Check Landing Page**: Should display at 150x150px
2. **Check Sign In**: Should display at 100x100px in circular container
3. **Check Sign Up**: Should display at 100x100px in circular container
4. **Test Light Theme**: Logo should be visible
5. **Test Dark Theme**: Logo should be visible
6. **Test Small Size**: Should be clear at 100x100px

---

## 💡 Pro Tips

1. **Always use transparent background** - Required for app
2. **Square format is critical** - App expects 1:1 ratio
3. **High resolution** - 1024x1024px for crisp display
4. **Optimize file size** - Use TinyPNG or similar tools
5. **Test at small sizes** - Ensure details are visible at 100px
6. **Test on both themes** - Light and dark backgrounds

---

## 🚨 Common Mistakes to Avoid

❌ **Don't use**: JPG (no transparency)
❌ **Don't use**: SVG (app uses PNG)
❌ **Don't use**: White background (needs transparency)
❌ **Don't use**: Non-square dimensions (must be 1:1)
❌ **Don't use**: Low resolution (< 512px)
❌ **Don't use**: Large file size (> 1MB)

✅ **Do use**: PNG with transparency
✅ **Do use**: Square format (1:1)
✅ **Do use**: High resolution (1024x1024px)
✅ **Do use**: Optimized file size (< 500KB)
✅ **Do use**: Teal and Green colors
✅ **Do use**: Modern, premium design

---

## 📋 Final Checklist

Before replacing `logo.png`:

- [ ] PNG format
- [ ] 1024x1024 pixels (or minimum 512x512)
- [ ] Square (1:1 aspect ratio)
- [ ] Transparent background
- [ ] Teal (#14B8A6) and Green (#10B981) colors
- [ ] File size under 500KB
- [ ] Optimized and compressed
- [ ] Tested at 100x100px
- [ ] Works on light and dark backgrounds
- [ ] Saved as `logo.png` in `assets/images/` folder

---

**Your logo is ready when it meets all these specifications!** 🎨✨

