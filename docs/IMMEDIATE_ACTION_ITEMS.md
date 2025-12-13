# 🎯 Immediate Action Items for Launch

## Start Here - Top 5 Priorities

### 1. ⚖️ Create Privacy Policy (2-3 hours)
**Why:** Required by both App Store and Play Store. Cannot submit without it.

**What to include:**
- Data collection (user info, health data, images)
- Data usage (AI processing, storage)
- Third-party services (Firebase, Convex, OpenAI)
- User rights (data deletion, export)
- Contact information

**Action:**
1. Create `docs/legal/privacy-policy.md`
2. Or use online generator: https://www.privacypolicygenerator.info/
3. Host it (GitHub Pages, your website, or free hosting)
4. Add URL to `app.json`:
   ```json
   "privacy": "https://yoururl.com/privacy-policy"
   ```

---

### 2. 📱 Test on Real Devices (1 day)
**Why:** Emulators don't catch all issues. Real devices reveal problems.

**Action:**
1. **iOS:**
   - Build with `eas build --platform ios`
   - Install on iPhone via TestFlight or direct install
   - Test all features

2. **Android:**
   - Build with `eas build --platform android`
   - Install APK on Android phone
   - Test all features

**Test Checklist:**
- [ ] Sign up / Sign in
- [ ] Onboarding flow
- [ ] OCR scanning (camera)
- [ ] OCR scanning (gallery)
- [ ] Meal plan creation
- [ ] Progress tracking
- [ ] Profile switching
- [ ] AI Health Coach
- [ ] Offline mode
- [ ] App backgrounding/foregrounding

---

### 3. 🖼️ Prepare App Store Screenshots (2-3 hours)
**Why:** Screenshots are the first thing users see. Critical for downloads.

**Action:**
1. **Take screenshots of key screens:**
   - Home dashboard
   - OCR scanning
   - Meal planning
   - Progress tracking
   - AI Health Coach

2. **Edit if needed:**
   - Add captions/annotations
   - Ensure consistent styling
   - Highlight key features

3. **Prepare sizes:**
   - **iOS:** 6.5" (iPhone 14 Pro Max) - 1290 x 2796 pixels
   - **Android:** Phone - 1080 x 1920 pixels minimum

**Tools:**
- Use device simulator to take screenshots
- Or use design tools (Figma, Canva) to create mockups

---

### 4. 🛡️ Set Up Crash Reporting (1 hour)
**Why:** Know when your app crashes. Critical for post-launch monitoring.

**Action:**
1. **Choose service:**
   - **Sentry** (recommended): https://sentry.io/
   - **Firebase Crashlytics** (if using Firebase)

2. **Install:**
   ```bash
   npm install @sentry/react-native
   ```

3. **Configure:**
   - Add to `app/_layout.tsx`
   - Test error reporting

**Benefits:**
- Get crash reports automatically
- See stack traces
- Track error frequency
- Fix issues before users complain

---

### 5. ✅ Final Testing Checklist (1 day)
**Why:** Ensure everything works before submission.

**Action:**
- [ ] **All features work:**
  - OCR scanning
  - Meal planning
  - Progress tracking
  - AI Health Coach
  - Profile management
  - Billing (if applicable)

- [ ] **No critical bugs:**
  - App doesn't crash
  - No data loss
  - No UI glitches
  - No performance issues

- [ ] **Error handling:**
  - Network errors handled
  - Invalid inputs handled
  - Edge cases handled

- [ ] **Performance:**
  - App loads quickly
  - Smooth animations
  - No lag

---

## 📋 Quick Reference

### Files to Update:
1. `app.json` - Add privacy policy URL
2. `package.json` - Update version if needed
3. Create `docs/legal/privacy-policy.md`

### Commands to Run:
```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Test locally
npm start
```

### Store Accounts Needed:
- [ ] App Store Connect (iOS)
- [ ] Google Play Console (Android)

---

## 🚀 After These 5 Items

Once you complete these, you're ready to:
1. Submit to App Store
2. Submit to Play Store
3. Launch! 🎉

**Remember:** Don't wait for perfection. Launch with what you have, then iterate based on user feedback!

