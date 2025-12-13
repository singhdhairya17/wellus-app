# Wellus - Intelligent Nutrition Tracking App

<div align="center">

**An AI-powered mobile application for personalized nutrition tracking, meal planning, and dietary management**

[![React Native](https://img.shields.io/badge/React%20Native-0.76-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0-black.svg)](https://expo.dev/)
[![Convex](https://img.shields.io/badge/Convex-Backend-orange.svg)](https://convex.dev/)

</div>

## 📱 Overview

Wellus is a comprehensive nutrition tracking application that combines OCR technology, AI-powered meal planning, and adaptive monitoring to help users achieve their health goals. The app features food label scanning, weight tracking, exercise logging, and detailed progress analytics.

## ✨ Key Features

### 🎯 Core Features
- **📸 OCR Food Label Scanning** - Extract nutrition data from food labels using ML Kit (offline) and cloud OCR APIs
- **🤖 AI-Powered Meal Planning** - Generate personalized recipes based on dietary goals and preferences
- **⚖️ Weight Tracking** - Track weight over time with progress charts, goal setting, and trend predictions
- **🏃 Exercise Tracking** - Log exercises and track calories burned
- **📊 Progress Analytics** - Weekly trends, macronutrient tracking, and detailed insights
- **💧 Water Intake Tracking** - Monitor daily hydration goals
- **🔔 Meal Reminders** - Customizable reminders for meals and water intake

### 🧠 Advanced Features
- **Adaptive Monitoring** - Pattern detection for eating habits and personalized recommendations
- **Explainable AI (XAI)** - Clear explanations for nutrition recommendations
- **Multi-Profile Support** - Manage multiple user profiles
- **Dark Mode** - Full dark mode support
- **Offline OCR** - ML Kit Text Recognition works completely offline
- **Calorie-Weight Correlation** - Analyze relationship between calorie intake and weight changes

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tooling
- **Expo Router** - File-based routing
- **React Native Reanimated** - Smooth animations
- **React Native SVG** - Chart rendering

### Backend & Services
- **Convex** - Backend-as-a-Service (database, real-time queries, mutations)
- **Firebase** - Authentication (email/password)
- **OpenAI** - AI meal generation and nutrition analysis
- **ML Kit** - On-device text recognition (bundled with app)

### OCR Services
- **ML Kit Text Recognition** (Primary - Offline, bundled)
- **OCR.space API** (Fallback)
- **Google Vision API** (Fallback)
- **Azure Computer Vision** (Fallback)

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** (Mac) or **Android Emulator** / Physical device
- **Expo Go** app (for development) or **Development Build** (for ML Kit OCR)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/singhdhairya17/wellus-app.git
cd wellus-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Convex
EXPO_PUBLIC_CONVEX_URL=your_convex_deployment_url

# OpenAI (for AI meal generation)
OPENAI_API_KEY=your_openai_api_key

# OCR APIs (optional - ML Kit works offline)
OCR_SPACE_API_KEY=your_ocr_space_key
GOOGLE_VISION_API_KEY=your_google_vision_key
AZURE_VISION_KEY=your_azure_vision_key
AZURE_VISION_ENDPOINT=your_azure_endpoint
```

### 4. Start Development Server

```bash
# Start Expo development server
npx expo start

# Or use npm script
npm start
```

### 5. Run on Device/Emulator

- **Expo Go**: Scan QR code with Expo Go app
- **iOS Simulator**: Press `i` in terminal
- **Android Emulator**: Press `a` in terminal

## 🔧 Development Build (Required for ML Kit OCR)

For offline OCR functionality, you need a development build:

```bash
# Install dev client
npm install expo-dev-client --legacy-peer-deps

# Build for Android (using EAS)
eas build --profile development --platform android

# Or build locally
npx expo run:android
npx expo run:ios
```

**Note**: ML Kit Text Recognition model is bundled with the app (~10MB), so no download is needed at runtime.

## 📁 Project Structure

```
wellus-app/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Main navigation tabs
│   │   ├── Home.jsx              # Dashboard
│   │   ├── Meals.jsx             # Meal planning
│   │   ├── Scan.jsx              # Food label scanning
│   │   ├── Progress.jsx          # Progress tracking
│   │   └── Profile.jsx            # User profile
│   ├── auth/                     # Authentication screens
│   ├── billing/                  # Billing management
│   ├── health-coach/             # AI health coach chat
│   └── meal-reminders/           # Reminder settings
│
├── components/                    # React components
│   ├── common/                   # Shared components
│   ├── dashboard/                # Dashboard components
│   ├── meals/                    # Meal planning components
│   ├── recipes/                  # Recipe components
│   ├── progress/                 # Progress charts
│   ├── tracking/                 # Weight, exercise, water tracking
│   └── ui/                       # UI components
│
├── services/                     # Business logic
│   ├── ai/                       # AI services (OpenAI)
│   ├── ocr/                      # OCR services (ML Kit, APIs)
│   ├── monitoring/               # Adaptive monitoring
│   ├── calculation/              # Nutrition calculations
│   └── notifications/            # Push notifications
│
├── convex/                       # Backend (Convex)
│   ├── schema.js                 # Database schema
│   ├── Users.js                  # User management
│   ├── Recipes.js                # Recipe management
│   ├── MealPlan.jsx              # Meal planning
│   ├── Tracking.js               # Weight, exercise, water tracking
│   └── _generated/               # Auto-generated files
│
├── context/                      # React Context providers
│   ├── UserContext.jsx           # User state
│   ├── ThemeContext.jsx          # Theme (light/dark)
│   └── RefreshDataContext.jsx   # Data refresh triggers
│
├── utils/                        # Utility functions
├── constants/                    # App constants
└── assets/                       # Static assets (images, icons)
```

## 🔑 API Keys Setup

### Convex
1. Create account at [convex.dev](https://convex.dev)
2. Create a new project
3. Copy deployment URL to `.env` as `EXPO_PUBLIC_CONVEX_URL`

### OpenAI
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Create API key in settings
3. Add payment method (required)
4. Copy key to `.env` as `OPENAI_API_KEY`

### OCR APIs (Optional)
- ML Kit works offline (bundled with app)
- OCR APIs are fallbacks if ML Kit unavailable
- See `services/ocr/` for setup instructions

## 📱 Building for Production

### Android

```bash
# Using EAS Build
eas build --platform android --profile production

# Or build locally
npx expo run:android --variant release
```

### iOS

```bash
# Using EAS Build
eas build --platform ios --profile production

# Or build locally (requires Mac)
npx expo run:ios --configuration Release
```

## 🎨 Features in Detail

### OCR Food Scanning
- **Primary**: ML Kit Text Recognition (offline, bundled)
- **Fallbacks**: OCR.space, Google Vision, Azure Vision
- Extracts: Calories, protein, carbs, fat, sodium, sugar
- Saves scanned images locally

### AI Meal Generation
- Personalized recipes based on:
  - Dietary goals (weight loss/gain/maintenance)
  - Allergies and preferences
  - Available ingredients
- Uses OpenAI GPT models

### Weight Tracking
- Daily weight logging
- Progress charts (line graph)
- Goal weight setting
- Weekly/monthly averages
- Trend predictions (linear regression)
- BMI calculation

### Progress Analytics
- Weekly trends for calories, protein, carbs, fat
- Exercise calories burned chart
- Weight progress visualization
- Calorie-weight correlation analysis

## 🧪 Testing

```bash
# Run tests
npm test

# Lint code
npm run lint
```

## 📚 Documentation

Detailed documentation available in `docs/` folder:
- Feature guides
- API documentation
- Setup instructions
- Deployment guides

## 🤝 Contributing

This is a private project. For contributions, please contact the repository owner.

## 📄 License

Private project - All rights reserved

## 👤 Author

**Singh Dhairya**

- GitHub: [@singhdhairya17](https://github.com/singhdhairya17)

## 🙏 Acknowledgments

- Expo team for the amazing development platform
- Convex for the backend infrastructure
- OpenAI for AI capabilities
- Google ML Kit for offline OCR

---

<div align="center">

**Made with ❤️ for better nutrition tracking**

</div>
