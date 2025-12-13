# Landing Image Replacement Guide - Wellus

## 📸 Current Landing Image Usage

### **File: landing.jpg**
- **Location**: `assets/images/landing.jpg`
- **Usage**: Background image on landing/opening screen
- **Current Display**: Full screen background with dark overlay

---

## 🎨 Landing Image Specifications

### **Format:**
- **Format**: JPG or PNG
- **Recommended**: JPG (smaller file size for full-screen images)
- **Alternative**: PNG (if you need transparency)

### **Dimensions:**
- **Recommended**: Match your target device screen sizes
- **Minimum**: 1080x1920 pixels (Full HD mobile)
- **Optimal**: 1440x2560 pixels (2K mobile) or higher
- **Aspect Ratio**: 9:16 (portrait) or match your app orientation
- **Note**: Image will be scaled to fit screen

### **File Size:**
- **Recommended**: Under 2MB (for fast loading)
- **Maximum**: 5MB
- **Optimize**: Compress JPG for web/mobile

### **Design Guidelines:**
- **Style**: Should match your app's premium aesthetic
- **Colors**: Should complement your teal/green logo
- **Content**: Health, wellness, nutrition theme
- **Overlay**: App adds dark overlay (#0707075e) on top
- **Text Area**: Logo and text appear in center, ensure image works with overlay

---

## 📐 Recommended Specifications

```
✅ Format: JPG (or PNG)
✅ Dimensions: 1440x2560 pixels (or higher)
✅ Aspect Ratio: 9:16 (portrait) or match screen
✅ File Size: Under 2MB (optimized)
✅ Colors: Complement teal/green logo
✅ Theme: Health, wellness, nutrition
✅ Location: assets/images/landing.jpg
```

---

## 🎯 Design Tips

### **What Works Well:**
- ✅ Abstract health/wellness backgrounds
- ✅ Nature scenes (subtle, not distracting)
- ✅ Gradient backgrounds (teal/green theme)
- ✅ Minimal, clean designs
- ✅ Premium, modern aesthetic
- ✅ Colors that complement your logo

### **What to Avoid:**
- ❌ Too busy or cluttered
- ❌ High contrast that conflicts with logo
- ❌ Text or words (will conflict with app text)
- ❌ Too bright (dark overlay helps)
- ❌ File size too large (>5MB)

---

## 🛠️ How to Replace

### **Step 1: Create/Choose Your Image**
1. Design or select your landing image
2. Match health/wellness theme
3. Use colors that complement teal/green logo
4. Keep it premium and modern

### **Step 2: Prepare the Image**
1. **Resize** to 1440x2560px (or your target size)
2. **Optimize** - Compress JPG (use TinyJPG or similar)
3. **Format** - Save as JPG (or PNG)
4. **File Size** - Keep under 2MB

### **Step 3: Replace the File**
1. Navigate to: `assets/images/`
2. Replace `landing.jpg` with your new image
3. **Keep same filename**: `landing.jpg`
4. **Keep same format**: JPG (or update code if using PNG)

---

## 🎨 Image Ideas for Wellus

### **Option 1: Gradient Background**
- Teal to green gradient
- Subtle, premium
- Matches logo colors

### **Option 2: Abstract Wellness**
- Abstract shapes
- Health/wellness theme
- Modern, minimal

### **Option 3: Nature Scene (Subtle)**
- Soft nature background
- Blurred or abstract
- Wellness theme

### **Option 4: Geometric Pattern**
- Modern geometric design
- Teal/green colors
- Premium aesthetic

---

## 📱 Current Implementation

The landing image is used like this:
```jsx
<Image source={require('./../assets/images/landing.jpg')}
  style={{ width: '100%', height: Dimensions.get('screen').height }}
/>
```

With dark overlay:
```jsx
<View style={{
  backgroundColor: '#0707075e', // Dark overlay
  // ... logo and text on top
}}>
```

---

## ✅ Replacement Checklist

- [ ] Image created/selected
- [ ] Resized to 1440x2560px (or appropriate size)
- [ ] Optimized (file size under 2MB)
- [ ] Saved as JPG (or PNG)
- [ ] Matches app theme (teal/green)
- [ ] Premium, modern aesthetic
- [ ] Replaced `assets/images/landing.jpg`
- [ ] Tested in app

---

## 🚀 Quick Steps

1. **Create/Choose** your landing image
2. **Resize** to 1440x2560px
3. **Optimize** - Compress to under 2MB
4. **Save** as `landing.jpg`
5. **Replace** `assets/images/landing.jpg`
6. **Test** in your app!

---

## 💡 Pro Tips

1. **Test with overlay** - Remember dark overlay (#0707075e) will be added
2. **Keep it subtle** - Logo and text need to stand out
3. **Optimize file size** - Large images slow down app loading
4. **Match theme** - Should complement your teal/green logo
5. **Premium feel** - Keep it modern and sophisticated

---

**Your landing image sets the first impression - make it premium!** 🎨✨

