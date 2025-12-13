# 🔑 OpenAI API Key Setup Guide

## 📋 Step-by-Step Instructions

### **Step 1: Get Your OpenAI API Key**

1. **Go to OpenAI Platform:**
   - Visit: https://platform.openai.com/
   - Sign up or log in to your account

2. **Add Payment Method:**
   - Go to: https://platform.openai.com/account/billing
   - Click "Add payment method"
   - ✅ **Debit cards are accepted!** (Visa, Mastercard, etc.)
   - Add your debit card details
   - Confirm your payment method

3. **Get Your API Key:**
   - Go to: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Give it a name (e.g., "Wellus App")
   - **Copy the key immediately** - you won't see it again!
   - Example format: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

4. **Free Credits:**
   - New accounts get **$5 free credits**
   - This is enough for testing and initial usage
   - You'll only be charged after credits are used

---

### **Step 2: Add API Key to Your App**

#### **Option A: Using .env File (Recommended for Development)**

1. **Create `.env` file in your project root:**
   ```bash
   # In your project root (same folder as package.json)
   # Create a new file named: .env
   ```

2. **Add your API key:**
   ```env
   EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-your-actual-api-key-here
   ```

3. **Important Notes:**
   - Replace `sk-proj-your-actual-api-key-here` with your actual key
   - Don't add quotes around the key
   - Don't add spaces before or after the `=` sign
   - The `.env` file should be in the root directory (same level as `package.json`)

4. **Restart your development server:**
   ```bash
   # Stop your current server (Ctrl+C)
   # Then restart:
   npx expo start --clear
   ```

#### **Option B: Using EAS Secrets (For Production Builds)**

If you're building with EAS (Expo Application Services):

1. **Set the secret:**
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_OPENAI_API_KEY --value your-api-key-here
   ```

2. **It will be automatically available in your builds**

---

### **Step 3: Verify It's Working**

1. **Check if the key is loaded:**
   - Open your app
   - Try generating an AI recipe
   - If it works, the key is configured correctly!

2. **Check the logs:**
   - Look for any errors in the console
   - If you see "No API key available", the key isn't being loaded

---

## 🔒 Security Best Practices

### **✅ DO:**
- ✅ Keep your `.env` file **local only** (never commit to Git)
- ✅ Use different keys for development and production
- ✅ Rotate your keys periodically
- ✅ Set usage limits in OpenAI dashboard

### **❌ DON'T:**
- ❌ **Never commit `.env` to Git** (it's already in `.gitignore`)
- ❌ Don't share your API key publicly
- ❌ Don't hardcode keys in your source code
- ❌ Don't use the same key for multiple projects

---

## 📊 Cost Information

### **Pricing:**
- **GPT-4o-mini** (used in your app): ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Free credits:** $5 for new accounts
- **Pay-as-you-go:** Only charged for what you use

### **Typical Usage:**
- **1 AI recipe generation:** ~500-1000 tokens (~$0.0001-0.0002)
- **1 Health Coach message:** ~200-500 tokens (~$0.00005-0.0001)
- **$5 free credits:** ~25,000-50,000 recipe generations!

---

## 🐛 Troubleshooting

### **Problem: "No API key available"**
- **Solution:** Check that your `.env` file is in the root directory
- **Solution:** Make sure the variable name is exactly `EXPO_PUBLIC_OPENAI_API_KEY`
- **Solution:** Restart your development server after adding the key

### **Problem: "Invalid API key"**
- **Solution:** Check that you copied the entire key (starts with `sk-`)
- **Solution:** Make sure there are no extra spaces or quotes
- **Solution:** Verify the key is active in OpenAI dashboard

### **Problem: "Rate limit exceeded"**
- **Solution:** You've used your free credits or hit rate limits
- **Solution:** Add payment method in OpenAI dashboard
- **Solution:** Check your usage at https://platform.openai.com/usage

### **Problem: Key not working in production build**
- **Solution:** Use EAS secrets instead of `.env` file
- **Solution:** Make sure the secret name matches exactly

---

## 📝 Example .env File

Create a file named `.env` in your project root with:

```env
# OpenAI API Key (for AI recipe generation and health coach)
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: OpenRouter API Key (alternative to OpenAI)
# EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Google Vision API Key (for better OCR)
# EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your-google-vision-key-here

# Optional: Azure Vision API Key (for better OCR)
# EXPO_PUBLIC_AZURE_VISION_API_KEY=your-azure-key-here
# EXPO_PUBLIC_AZURE_VISION_ENDPOINT=https://your-resource.cognitiveservices.azure.com
```

---

## ✅ Quick Checklist

- [ ] Created OpenAI account
- [ ] Added payment method (debit card accepted)
- [ ] Generated API key
- [ ] Created `.env` file in project root
- [ ] Added `EXPO_PUBLIC_OPENAI_API_KEY=your-key` to `.env`
- [ ] Restarted development server
- [ ] Tested AI recipe generation
- [ ] Verified `.env` is in `.gitignore` (should be automatic)

---

## 🎯 Next Steps

Once your API key is set up:
1. ✅ Test AI recipe generation
2. ✅ Test Health Coach chat
3. ✅ Monitor usage in OpenAI dashboard
4. ✅ Set up usage alerts (optional)

---

## 💡 Alternative: OpenRouter (Free Tier Available)

If you want to try a free alternative first:
- **OpenRouter** offers free tier with Gemini
- See: `docs/API_KEYS_SUMMARY.md` for details
- Use `EXPO_PUBLIC_OPENROUTER_API_KEY` instead

---

**Need Help?** Check the OpenAI documentation: https://platform.openai.com/docs

