# Free OCR Setup Guide for WELLUS

## 🆓 Free OCR Services Available

The WELLUS app now supports **multiple free OCR services** with automatic fallback. No credit card required for basic usage!

### Current OCR Fallback Chain:

1. **OCR.space** (Primary - Always Active)
   - ✅ **25,000 requests/month FREE**
   - ✅ **No API key needed** (uses public key)
   - ✅ **No signup required**
   - ✅ **Works immediately** - already configured!

2. **Google Cloud Vision API** (Optional - Free Tier)
   - ✅ **1,000 requests/month FREE**
   - ⚙️ Requires API key setup (optional)
   - 📝 Setup instructions below

3. **Azure Computer Vision** (Optional - Free Tier)
   - ✅ **5,000 requests/month FREE**
   - ⚙️ Requires API key setup (optional)
   - 📝 Setup instructions below

4. **Gemini Vision via OpenRouter** (Optional - Free Tier)
   - ✅ Free tier available
   - ⚙️ Requires OpenRouter API key (if you already have one)

5. **Manual Regex Extraction** (Always Available)
   - ✅ **100% free, no API needed**
   - ✅ Works even if all APIs fail
   - ✅ Extracts: Calories, Protein, Carbs, Fat, Sodium, Sugar

---

## 🚀 Quick Start (No Setup Required!)

**The app works immediately with OCR.space** - no configuration needed! Just scan food labels and it will work.

---

## ⚙️ Optional: Add More Free OCR Services

### Option 1: Google Cloud Vision API (1k/month free)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable "Cloud Vision API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Restrict the API key to "Cloud Vision API" (recommended for security)
6. Copy your API key
7. Add to your `.env` file:
   ```
   EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your_api_key_here
   ```

**Free Tier:** 1,000 requests/month (forever free)

---

### Option 2: Azure Computer Vision (5k/month free)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a new "Computer Vision" resource
3. Choose "Free F0" tier (5,000 transactions/month)
4. Copy your:
   - **API Key** (from "Keys and Endpoint")
   - **Endpoint** (e.g., `https://your-resource.cognitiveservices.azure.com`)
5. Add to your `.env` file:
   ```
   EXPO_PUBLIC_AZURE_VISION_API_KEY=your_api_key_here
   EXPO_PUBLIC_AZURE_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com
   ```

**Free Tier:** 5,000 requests/month (forever free)

---

## 📊 Total Free OCR Capacity

If you set up all optional services:
- **OCR.space**: 25,000/month
- **Google Vision**: 1,000/month
- **Azure Vision**: 5,000/month
- **Total**: **31,000+ free OCR requests per month!**

Plus manual regex extraction as a final fallback (unlimited).

---

## 🔧 How It Works

The app automatically tries OCR services in this order:

```
1. OCR.space (always works, no setup)
   ↓ (if fails)
2. Google Vision (if configured)
   ↓ (if fails)
3. Azure Vision (if configured)
   ↓ (if fails)
4. Gemini Vision (if OpenRouter key exists)
   ↓ (if all fail)
5. Manual Regex Extraction (always works)
```

---

## 💡 Tips for Best Results

1. **Use clear, well-lit images** - Better OCR accuracy
2. **Use "Choose Photo" instead of URL** - More reliable
3. **Ensure nutrition label is clearly visible** - Full label in frame
4. **If OCR fails, use manual entry** - Always available as fallback

---

## 🐛 Troubleshooting

### "OCR.space service unavailable"
- Wait 30-60 seconds and try again
- Use "Choose Photo" instead of URL
- Try a different image

### "All OCR services failed"
- Check your internet connection
- Try with a clearer image
- Use manual entry (always works)

### Rate Limit Errors
- Wait a few minutes before retrying
- The app will automatically use the next service in the chain

---

## ✅ Current Status

- ✅ **OCR.space**: Active (25k/month free)
- ⚙️ **Google Vision**: Optional (add API key to enable)
- ⚙️ **Azure Vision**: Optional (add API key to enable)
- ⚙️ **Gemini Vision**: Optional (uses existing OpenRouter key)
- ✅ **Manual Extraction**: Always active (unlimited)

**The app works great with just OCR.space!** Additional services are optional for extra capacity.

