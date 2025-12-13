# Wellus Logo Replacement Guide

## Current Logo Usage

The Wellus logo is currently used in **3 locations**:

### 1. Landing Page (`app/index.jsx`)
- **Size**: 150x150 pixels
- **Location**: `assets/images/logo.png`
- **Display**: Centered on the landing screen

### 2. Sign In Page (`app/auth/SignIn.jsx`)
- **Size**: 100x100 pixels (inside a 120x120 circular container)
- **Location**: `assets/images/logo.png`
- **Display**: Circular container with shadow effect

### 3. Sign Up Page (`app/auth/SignUp.jsx`)
- **Size**: 100x100 pixels (inside a 120x120 circular container)
- **Location**: `assets/images/logo.png`
- **Display**: Circular container with shadow effect

## Recommended Logo Specifications

### For Best Results:
- **Format**: PNG with transparent background
- **Dimensions**: 
  - **Minimum**: 300x300 pixels (for high-resolution displays)
  - **Recommended**: 512x512 pixels or higher
- **Aspect Ratio**: 1:1 (square)
- **Background**: Transparent (PNG with alpha channel)
- **File Size**: Keep under 500KB for optimal performance

### Design Tips:
- The logo will be displayed in a circular container on auth screens
- Ensure important elements are centered (edges may be cropped in circular view)
- Use high contrast colors for visibility on both light and dark backgrounds
- Test on both light and dark themes

## How to Replace the Logo

### Step 1: Create Your Logo
1. Design your logo in a square format (1:1 aspect ratio)
2. Export as PNG with transparent background
3. Save at high resolution (512x512 or higher)

### Step 2: Replace the File
1. Navigate to: `assets/images/`
2. Replace the existing `logo.png` file with your new logo
3. **Keep the same filename**: `logo.png`
4. **Keep the same format**: PNG

### Step 3: Test the Logo
1. Run the app and check:
   - Landing page (opening screen)
   - Sign In page
   - Sign Up page
2. Verify it looks good on:
   - Light theme
   - Dark theme
   - Different screen sizes

## Optional: Additional Logo Assets

If you want to replace other app icons:

- **App Icon**: `assets/images/icon.png` (1024x1024 recommended)
- **Adaptive Icon** (Android): `assets/images/adaptive-icon.png` (1024x1024)
- **Splash Screen Icon**: `assets/images/splash-icon.png` (200px width)
- **Favicon** (Web): `assets/images/favicon.png` (32x32 or 64x64)

## Current Logo Styling

The logo containers have the following styling:
- **Circular border radius**: 50% (makes it circular)
- **Shadow effect**: For depth and premium look
- **Theme-aware background**: Adapts to light/dark mode

Your logo will automatically inherit these styles when you replace the file.

