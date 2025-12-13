# 🚀 Quick OpenAI API Key Setup (5 Minutes)

## Step 1: Get Your API Key (2 minutes)

1. Go to: https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Name it: "Wellus App"
4. **Copy the key** (starts with `sk-proj-...`)
5. **Add payment method** (if not done):
   - Go to: https://platform.openai.com/account/billing
   - Click "Add payment method"
   - ✅ **Debit cards work!**
   - You get **$5 free credits** for new accounts

---

## Step 2: Add to Your App (1 minute)

1. **Create `.env` file** in your project root (same folder as `package.json`)

2. **Add this line:**
   ```env
   EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-paste-your-key-here
   ```

3. **Save the file**

---

## Step 3: Restart App (1 minute)

1. **Stop your current server** (Ctrl+C in terminal)
2. **Restart with:**
   ```bash
   npx expo start --clear
   ```

---

## Step 4: Test It (1 minute)

1. Open your app
2. Go to **"Generate AI Recipe"**
3. Try generating a recipe
4. If it works → ✅ **You're done!**

---

## ✅ Done!

Your OpenAI API key is now configured!

**Cost:** ~$0.0001 per recipe generation  
**Free Credits:** $5 for new accounts (enough for ~25,000 recipes!)

---

## 🐛 Troubleshooting

**"No API key available"?**
- Make sure `.env` file is in the root directory
- Variable name must be exactly: `EXPO_PUBLIC_OPENAI_API_KEY`
- Restart your server after adding the key

**"Invalid API key"?**
- Check you copied the entire key (starts with `sk-proj-`)
- No spaces or quotes around the key

**Need more help?** See: `docs/setup/OPENAI_API_KEY_SETUP.md`

