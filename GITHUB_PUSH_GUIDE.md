# Guide: Push to Private GitHub Repository

## Current Status
- ✅ Git is initialized
- ✅ Remote is configured: `https://github.com/singhdhairya17/PERSONALISED-NUTRITION-APP.git`
- ✅ .gitignore is updated with sensitive file exclusions

## Steps to Push to Private GitHub Repo

### Option 1: Use Existing Repository (Make it Private)

1. **Make the existing repo private on GitHub:**
   - Go to: https://github.com/singhdhairya17/PERSONALISED-NUTRITION-APP
   - Click **Settings** → Scroll to **Danger Zone** → Click **Change visibility** → Select **Make private**

2. **Stage all changes:**
   ```bash
   git add .
   ```

3. **Commit your changes:**
   ```bash
   git commit -m "Add weight tracking features, progress charts, and UI improvements"
   ```

4. **Push to GitHub:**
   ```bash
   git push origin main
   ```

### Option 2: Create a New Private Repository

1. **Create a new private repo on GitHub:**
   - Go to https://github.com/new
   - Repository name: `wellus-app` (or your preferred name)
   - Set visibility to **Private**
   - **Don't** initialize with README, .gitignore, or license
   - Click **Create repository**

2. **Update remote URL:**
   ```bash
   git remote set-url origin https://github.com/singhdhairya17/YOUR-NEW-REPO-NAME.git
   ```

3. **Stage and commit:**
   ```bash
   git add .
   git commit -m "Initial commit: Wellus nutrition tracking app"
   ```

4. **Push to new repo:**
   ```bash
   git push -u origin main
   ```

## Important: Before Pushing

### Check for Sensitive Information

Make sure these files are NOT committed (they should be in .gitignore):
- `.env` files
- API keys in code
- Firebase credentials
- Convex deployment keys
- Any `.pem`, `.key`, or certificate files

### Files That Should Be Committed:
- ✅ Source code
- ✅ `package.json` and `package-lock.json`
- ✅ `app.json` (but check for sensitive keys)
- ✅ `convex/schema.js`
- ✅ Component files
- ✅ Configuration files (metro.config.js, etc.)

### Files That Should NOT Be Committed:
- ❌ `node_modules/`
- ❌ `.expo/`
- ❌ `.env` files
- ❌ Build artifacts (`.apk`, `.ipa`)
- ❌ Private keys and certificates
- ❌ `convex/_generated/` (if you want to regenerate)

## Quick Commands Summary

```bash
# Check what will be committed
git status

# Stage all changes
git add .

# Commit
git commit -m "Your commit message"

# Push to GitHub
git push origin main
```

## If You Need to Remove Sensitive Files Already Committed

If you accidentally committed sensitive files:

```bash
# Remove from git but keep locally
git rm --cached .env
git rm --cached path/to/sensitive-file

# Commit the removal
git commit -m "Remove sensitive files"

# Push
git push origin main
```

## Verify Repository is Private

After pushing, verify:
1. Go to your GitHub repository
2. Check that it shows "Private" badge
3. Only you (and collaborators you add) can see it


