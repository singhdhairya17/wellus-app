# API Keys Summary - Wellus App

## 📋 Complete List of Services Using API Keys

### ✅ **REQUIRED Keys** (App won't work without these)

#### 1. **Convex Backend** (REQUIRED)
- **Key:** `EXPO_PUBLIC_CONVEX_URL`
- **Type:** Backend URL (not an API key, but required)
- **Used in:** `app/_layout.tsx`
- **Purpose:** Database and backend services
- **Cost:** Free tier available
- **Payment:** Not needed for basic usage
- **Status:** ✅ Already configured

---

### 🤖 **AI Services** (Optional - for AI features)

#### 2. **OpenAI API** (OPTIONAL)
- **Key:** `EXPO_PUBLIC_OPENAI_API_KEY`
- **Used in:**
  - `services/ai/AiModel.jsx` - AI recipe generation, calorie calculation
  - `services/ai/HealthCoachService.jsx` - Health coach chat
  - `services/ocr/OCRService.jsx` - OCR text extraction (via OpenRouter)
- **Purpose:** 
  - Generate AI recipes
  - Health coach conversations
  - Nutrition calculations
- **Cost:** Pay-as-you-go (~$0.15 per 1M tokens for GPT-4o-mini)
- **Payment:** ✅ **Debit card accepted**
- **Free Tier:** $5 free credits for new accounts
- **Status:** Optional - app works without it (uses fallbacks)

#### 3. **OpenRouter API** (OPTIONAL - Alternative to OpenAI)
- **Key:** `EXPO_PUBLIC_OPENROUTER_API_KEY`
- **Used in:**
  - `services/ai/AiModel.jsx` - AI recipe generation
  - `services/ai/HealthCoachService.jsx` - Health coach chat
  - `services/ocr/OCRService.jsx` - OCR via Gemini Vision
- **Purpose:** 
  - Access to multiple AI models (Gemini, Claude, GPT, etc.)
  - Free tier with Gemini
- **Cost:** Free tier available (Gemini free), paid models vary
- **Payment:** ✅ **Debit card accepted**
- **Status:** Optional - alternative to OpenAI

#### 4. **AI Guru Lab** (OPTIONAL - for recipe images)
- **Key:** `EXPO_PUBLIC_AIRGURU_LAB_API_KEY`
- **Used in:** `services/ai/AiModel.jsx` - Recipe image generation
- **Purpose:** Generate images for AI recipes
- **Cost:** Varies
- **Payment:** Check their website
- **Status:** Optional - only for recipe images

---

### 👁️ **OCR Services** (Optional - for scanning food labels)

#### 5. **Google Cloud Vision API** (OPTIONAL)
- **Key:** `EXPO_PUBLIC_GOOGLE_VISION_API_KEY`
- **Used in:** `services/ocr/OCRService.jsx`
- **Purpose:** Extract text from food label images
- **Cost:** 1,000 requests/month FREE, then pay-as-you-go
- **Payment:** ✅ **Debit card accepted**
- **Status:** Optional - app works without it (uses OCR.space as primary)

#### 6. **Azure Computer Vision** (OPTIONAL)
- **Key:** `EXPO_PUBLIC_AZURE_VISION_API_KEY`
- **Endpoint:** `EXPO_PUBLIC_AZURE_VISION_ENDPOINT`
- **Used in:** `services/ocr/OCRService.jsx`
- **Purpose:** Extract text from food label images
- **Cost:** 5,000 requests/month FREE, then pay-as-you-go
- **Payment:** ✅ **Debit card accepted**
- **Status:** Optional - app works without it

---

### 🔥 **Firebase** (REQUIRED for authentication)

#### 7. **Firebase API Key** (REQUIRED)
- **Key:** `EXPO_PUBLIC_FIREBASE_API_KEY`
- **Used in:** `services/FirebaseConfig.jsx`
- **Purpose:** User authentication (Sign In/Sign Up)
- **Cost:** Free tier available (generous limits)
- **Payment:** Not needed for basic usage
- **Status:** ✅ Already configured (hardcoded in FirebaseConfig.jsx)

---

## 📊 Summary Table

| Service | Key Name | Required? | Cost | Debit Card? | Purpose |
|---------|----------|-----------|------|-------------|---------|
| **Convex** | `EXPO_PUBLIC_CONVEX_URL` | ✅ Yes | Free tier | N/A | Database |
| **Firebase** | `EXPO_PUBLIC_FIREBASE_API_KEY` | ✅ Yes | Free tier | N/A | Auth |
| **OpenAI** | `EXPO_PUBLIC_OPENAI_API_KEY` | ❌ No | Pay-as-you-go | ✅ Yes | AI features |
| **OpenRouter** | `EXPO_PUBLIC_OPENROUTER_API_KEY` | ❌ No | Free tier available | ✅ Yes | AI features |
| **Google Vision** | `EXPO_PUBLIC_GOOGLE_VISION_API_KEY` | ❌ No | 1k/month free | ✅ Yes | OCR |
| **Azure Vision** | `EXPO_PUBLIC_AZURE_VISION_API_KEY` | ❌ No | 5k/month free | ✅ Yes | OCR |
| **AI Guru Lab** | `EXPO_PUBLIC_AIRGURU_LAB_API_KEY` | ❌ No | Varies | Check | Recipe images |

---

## 🎯 What You Actually Need

### **Minimum Setup (App Works):**
- ✅ Convex URL (already configured)
- ✅ Firebase API Key (already configured)
- ✅ OCR.space (no key needed - already working)

### **For Full AI Features:**
- 🤖 **OpenAI API Key** OR **OpenRouter API Key** (choose one)
  - OpenAI: Better models, pay-as-you-go
  - OpenRouter: Free tier with Gemini, multiple models

### **For Better OCR (Optional):**
- 👁️ Google Vision API Key (1k/month free)
- 👁️ Azure Vision API Key (5k/month free)

---

## 💳 Payment Methods Accepted

All services that require payment accept:
- ✅ **Debit cards** (Visa, Mastercard, etc.)
- ✅ **Credit cards**
- ✅ **Prepaid cards** (usually work)

---

## 🚀 Recommended Setup

### **For Development/Testing:**
1. Use **OpenRouter** (free tier with Gemini)
2. Use **OCR.space** (already working, no key needed)
3. No payment needed!

### **For Production:**
1. **OpenAI API Key** (for best AI features)
   - Debit card accepted ✅
   - $5 free credits for new accounts
2. **Google Vision** (optional, 1k/month free)
3. **Azure Vision** (optional, 5k/month free)

---

## 📝 Current Status

**App works right now without any API keys!**
- ✅ OCR works (OCR.space - no key needed)
- ✅ Database works (Convex - already configured)
- ✅ Auth works (Firebase - already configured)
- ⚠️ AI features need OpenAI or OpenRouter key

**To enable AI features, you only need ONE key:**
- Either `EXPO_PUBLIC_OPENAI_API_KEY` OR `EXPO_PUBLIC_OPENROUTER_API_KEY`

