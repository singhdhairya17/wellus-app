# 🔐 Remember Me Logic - Complete Documentation

## 📋 Overview

The "Remember Me" feature allows users to stay logged in across app sessions. When enabled, it:
- Saves the user's email address
- Keeps the Firebase authentication session active
- Automatically logs the user in when they reopen the app

---

## 🔄 Complete Flow

### 1. **Sign In Screen (`app/auth/SignIn.jsx`)**

#### **On Component Load:**
```javascript
useEffect(() => {
    // Load saved email if "remember me" was checked previously
    const loadSavedEmail = async () => {
        const savedEmail = await AsyncStorage.getItem('rememberedEmail');
        const rememberMeValue = await AsyncStorage.getItem('rememberMe');
        
        if (savedEmail && rememberMeValue === 'true') {
            setEmail(savedEmail);        // Pre-fill email field
            setRememberMe(true);         // Check the checkbox
        }
    };
    loadSavedEmail();
}, []);
```

**What happens:**
- Checks if "Remember Me" was enabled previously
- If yes, loads saved email and pre-fills the input
- Checks the "Remember Me" checkbox automatically

---

#### **On Sign In Success:**
```javascript
// Handle "Remember Me"
if (rememberMe) {
    // Save email and preference
    await AsyncStorage.setItem('rememberMe', 'true');
    await AsyncStorage.setItem('rememberedEmail', email.toLowerCase());
} else {
    // Clear saved data
    await AsyncStorage.removeItem('rememberMe');
    await AsyncStorage.removeItem('rememberedEmail');
}
```

**What happens:**
- **If checked:** Saves `rememberMe: 'true'` and `rememberedEmail: email`
- **If unchecked:** Removes both values from AsyncStorage

---

### 2. **App Initialization (`app/index.jsx`)**

#### **On App Start:**
```javascript
const checkAuthAndRememberMe = async () => {
    // Check if "Remember Me" is enabled
    const rememberMe = await AsyncStorage.getItem('rememberMe');
    
    if (rememberMe !== 'true') {
        // If "Remember Me" is NOT enabled:
        // 1. Sign out any existing Firebase session
        const currentUser = auth.currentUser;
        if (currentUser) {
            await signOut(auth);
        }
        // 2. Clear user state
        setUser(null);
        return; // Stop here - user must sign in manually
    }

    // If "Remember Me" IS enabled, proceed with auto-login
    unsubscribe = onAuthStateChanged(auth, async (userInfo) => {
        // Firebase auth state listener
        // If user is authenticated, fetch user data and navigate to Home
        // ... (full logic below)
    });
};
```

**What happens:**

**Scenario A: Remember Me = OFF**
1. Checks AsyncStorage for `rememberMe`
2. If not `'true'`, signs out any existing Firebase session
3. Clears user state
4. User must sign in manually

**Scenario B: Remember Me = ON**
1. Checks AsyncStorage for `rememberMe`
2. If `'true'`, sets up Firebase auth state listener
3. If user is authenticated, automatically:
   - Fetches user data from Convex
   - Sets user state
   - Navigates to Home (or shows onboarding if new user)

---

## 🔑 Key Storage Keys

### AsyncStorage Keys:
- **`rememberMe`**: `'true'` or `null` (whether feature is enabled)
- **`rememberedEmail`**: User's email address (lowercase)

### Firebase Auth:
- Firebase maintains the authentication session automatically
- Session persists until explicitly signed out

---

## 🎯 User Experience Flow

### **First Time Sign In (Remember Me = ON):**
1. User enters email/password
2. User checks "Remember Me"
3. User signs in successfully
4. App saves: `rememberMe: 'true'`, `rememberedEmail: 'user@email.com'`
5. Firebase session is active

### **App Reopened (Remember Me = ON):**
1. App checks `rememberMe` in AsyncStorage
2. Finds `'true'` → Proceeds with auto-login
3. Firebase auth state listener fires
4. User is authenticated → Fetches user data
5. User is automatically logged in → Navigates to Home

### **App Reopened (Remember Me = OFF):**
1. App checks `rememberMe` in AsyncStorage
2. Finds `null` or not `'true'` → Signs out Firebase session
3. Clears user state
4. User sees Sign In screen

### **User Unchecks Remember Me:**
1. User signs in with "Remember Me" unchecked
2. App removes `rememberMe` and `rememberedEmail` from AsyncStorage
3. Next time app opens → User must sign in manually

---

## 🔒 Security Considerations

### ✅ What's Stored:
- **Email address only** (in AsyncStorage)
- **NOT password** (never stored)
- **Firebase session token** (managed by Firebase, encrypted)

### ✅ What's NOT Stored:
- Password (never stored)
- Sensitive user data (only email for convenience)

### ✅ Security Features:
- Email is stored in AsyncStorage (device storage)
- Firebase session is managed securely by Firebase
- User can disable "Remember Me" anytime
- Signing out clears all stored data

---

## 📝 Code Locations

### **Sign In Screen:**
- **File:** `app/auth/SignIn.jsx`
- **Lines:** 32-47 (load saved email), 101-110 (save/clear on sign in)

### **App Initialization:**
- **File:** `app/index.jsx`
- **Lines:** 111-189 (check and auto-login logic)

### **UI Component:**
- **File:** `app/auth/SignIn.jsx`
- **Lines:** 202-220 (Remember Me checkbox UI)

---

## 🎨 UI Implementation

### **Checkbox Component:**
```javascript
<TouchableOpacity
    style={styles.rememberMeContainer}
    onPress={() => setRememberMe(!rememberMe)}
>
    <View style={[
        styles.checkbox, 
        { 
            borderColor: rememberMe ? colors.PRIMARY : colors.BORDER,
            backgroundColor: rememberMe ? colors.PRIMARY : 'transparent'
        }
    ]}>
        {rememberMe && <Text style={styles.checkmark}>✓</Text>}
    </View>
    <Text style={[styles.rememberMeText, { color: colors.TEXT }]}>
        Remember Me
    </Text>
</TouchableOpacity>
```

**Visual States:**
- **Unchecked:** Empty checkbox with border
- **Checked:** Filled checkbox with checkmark (✓)

---

## 🔄 State Management

### **Component State:**
- `rememberMe` (boolean) - UI checkbox state

### **Persistent Storage:**
- `AsyncStorage.getItem('rememberMe')` - Whether feature is enabled
- `AsyncStorage.getItem('rememberedEmail')` - Saved email address

### **Firebase Auth:**
- `auth.currentUser` - Current authenticated user
- `onAuthStateChanged()` - Listener for auth state changes

---

## ✅ Summary

**Remember Me Logic:**
1. **On Sign In:** Save email + preference if checked, clear if unchecked
2. **On App Start:** Check preference → If ON, auto-login; If OFF, sign out
3. **Auto-Login:** Use Firebase auth state → Fetch user data → Navigate to Home
4. **Security:** Only email stored, password never stored, Firebase manages session

**Key Points:**
- ✅ Email is pre-filled if "Remember Me" was enabled
- ✅ Firebase session persists automatically
- ✅ User can disable anytime
- ✅ Secure (no password storage)
- ✅ Seamless user experience

---

**This logic ensures users stay logged in when they want to, while maintaining security and giving them control.** 🔐✨

