# Wellus Project Structure

## 📁 Directory Organization

```
wellus/
├── app/                          # Expo Router app directory
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── _layout.jsx          # Tab layout configuration
│   │   ├── Home.jsx             # Home screen
│   │   ├── Meals.jsx            # Meals/Recipes screen
│   │   ├── Scan.jsx             # OCR Scan screen
│   │   ├── Progress.jsx         # Progress tracking screen
│   │   └── Profile.jsx          # User profile screen
│   ├── auth/                     # Authentication screens
│   │   ├── SignIn.jsx
│   │   └── SignUp.jsx
│   ├── billing/                  # Billing screen
│   │   └── index.jsx
│   ├── generate-ai-recipe/      # AI recipe generation
│   │   └── index.jsx
│   ├── preferance/               # User preferences setup
│   │   └── index.jsx
│   ├── recipe-detail/            # Recipe detail view
│   │   └── index.jsx
│   ├── scan-label/               # Legacy scan (can be removed)
│   │   └── index.jsx
│   ├── _layout.tsx               # Root layout
│   └── index.jsx                 # Landing/onboarding screen
│
├── components/                    # React components
│   ├── common/                   # Shared/common components
│   │   ├── ErrorBoundary.jsx
│   │   ├── LoadingDialog.jsx
│   │   ├── Onboarding.jsx
│   │   └── shared/
│   │       ├── Button.jsx
│   │       └── Input.jsx
│   ├── dashboard/                # Dashboard components
│   │   ├── HomeHeader.jsx
│   │   ├── TodayProgress.jsx
│   │   ├── MacronutrientsDashboard.jsx
│   │   └── AdaptiveInsights.jsx
│   ├── meals/                    # Meal-related components
│   │   ├── MealPlanCard.jsx
│   │   ├── TodaysMealPlan.jsx
│   │   ├── MealPlanCalendar.jsx
│   │   ├── GenerateRecipeCard.jsx
│   │   ├── AddManualMeal.jsx
│   │   └── AddToMealActionSheet.jsx
│   ├── recipes/                  # Recipe components
│   │   ├── RecipeCard.jsx
│   │   ├── RecipeIntro.jsx
│   │   ├── RecipeIngredients.jsx
│   │   ├── RecipeSteps.jsx
│   │   └── RecipeOptionList.jsx
│   └── ui/                       # UI components
│       └── DateSelectionCard.jsx
│
├── services/                      # Business logic services
│   ├── ai/                       # AI-related services
│   │   ├── AiModel.jsx
│   │   └── XAIService.jsx
│   ├── ocr/                      # OCR services
│   │   ├── OCRService.jsx
│   │   └── LocalOCRService.jsx
│   ├── monitoring/               # Monitoring services
│   │   └── AdaptiveMonitoringService.jsx
│   ├── calculation/              # Calculation services
│   │   └── ManualCalculationService.jsx
│   └── FirebaseConfig.jsx       # Firebase configuration
│
├── context/                      # React Context providers
│   ├── UserContext.jsx
│   ├── ThemeContext.jsx
│   └── RefreshDataContext.jsx
│
├── convex/                       # Convex backend
│   ├── _generated/              # Auto-generated files
│   ├── schema.js                # Database schema
│   ├── Users.js                 # User mutations/queries
│   ├── Recipes.js               # Recipe mutations/queries
│   ├── MealPlan.jsx             # Meal plan mutations/queries
│   ├── AdaptiveMonitoring.jsx   # Monitoring mutations/queries
│   ├── Billing.js               # Billing mutations/queries
│   └── seed.ts                  # Database seed script
│
├── utils/                        # Utility functions
│   ├── logger.js                # Logging utility
│   └── validation.js            # Input validation
│
├── constants/                    # App constants
│   ├── colors.js                # Color constants (legacy)
│   └── prompts.js               # AI prompts
│
├── assets/                       # Static assets
│   ├── images/                  # Image assets
│   └── fonts/                   # Font files
│
├── docs/                         # Documentation
│   ├── setup/                   # Setup guides
│   ├── features/                # Feature documentation
│   └── deployment/              # Deployment guides
│
├── scripts/                      # Build/utility scripts
│   └── reset-project.js
│
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── babel.config.js              # Babel config
├── eas.json                      # EAS build config
└── README.md                     # Project README
```

## 📋 Organization Principles

### 1. **Feature-Based Components**
Components are organized by feature/domain:
- `dashboard/` - Home screen components
- `meals/` - Meal planning components
- `recipes/` - Recipe-related components
- `common/` - Shared/reusable components

### 2. **Service Organization**
Services are grouped by functionality:
- `ai/` - AI model interactions
- `ocr/` - OCR processing
- `monitoring/` - Adaptive monitoring
- `calculation/` - Nutrition calculations

### 3. **Clear Separation**
- **app/** - Routing and screens only
- **components/** - Reusable UI components
- **services/** - Business logic
- **context/** - State management
- **utils/** - Pure utility functions
- **constants/** - Configuration constants

### 4. **Documentation**
All documentation organized in `docs/` folder:
- Setup guides
- Feature documentation
- Deployment guides

## 🔄 Migration Plan

1. Move components to feature folders
2. Organize services by domain
3. Move utilities to proper locations
4. Consolidate constants
5. Organize documentation
6. Update all imports
7. Clean up unused files

