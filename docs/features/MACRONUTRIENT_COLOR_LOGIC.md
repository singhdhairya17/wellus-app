# 🎨 Macronutrient Color Logic - Complete Guide

## 📊 Two Types of Colors

Each macronutrient has **TWO different color systems**:

1. **Theme Color** (Static) - The card's accent color
2. **Status Color** (Dynamic) - Traffic light & progress bar color based on consumption

---

## 🎨 Theme Colors (Static - Card Accent)

**Location:** `components/dashboard/MacronutrientsDashboard.jsx` (lines 450-455)

These colors are **fixed** and represent the macronutrient's identity:

| Macronutrient | Theme Color | Hex Code | Purpose |
|--------------|-------------|----------|---------|
| **Calories** | `PRIMARY` (Teal) | `#14B8A6` | App's primary brand color |
| **Protein** | `BLUE` | `#4287f5` | Represents strength/muscle |
| **Carbs** | `PINK` | `#F542b3` | Represents energy |
| **Fat** | `GREEN` | `#39b981` | Represents healthy fats |
| **Sodium** | `GRAY` | `gray` | Neutral/warning color |
| **Sugar** | `RED` | `red` | Warning/limit color |

**Note:** These colors are **NOT used** for traffic lights or progress bars - they're just for visual distinction.

---

## 🚦 Status Colors (Dynamic - Traffic Light & Progress Bar)

**Location:** `components/dashboard/MacronutrientsDashboard.jsx` (lines 356-400)

These colors **change** based on consumption percentage vs goal:

### **1. Protein** 🥩

**Logic:**
- 🟢 **Green**: `>= 80%` (Good - "Excellent!" or "More needed")
- 🟡 **Yellow**: `< 80%` (Warning - "Add more")
- 🔴 **Never Red** (Explanation never shows 'danger' for protein)

**Why:**
- Protein is essential - more is generally better
- Never shows red because low protein is a warning, not a danger
- Matches explanation: `>= 80%` = 'good', `< 80%` = 'warning'

**Example:**
- 100g / 100g goal (100%) → 🟢 Green
- 60g / 100g goal (60%) → 🟡 Yellow
- 30g / 100g goal (30%) → 🟡 Yellow (not red!)

---

### **2. Sodium** 🧂

**Logic:**
- 🔴 **Red**: `>= 100%` (Danger - "Exceeded limit!")
- 🟡 **Yellow**: `>= 80%` (Warning - "Close to limit")
- 🟢 **Green**: `< 80%` (Good - "Within limit")

**Why:**
- Sodium is a **limit** - exceeding is dangerous
- Red at 100% because it's a health risk
- Green when low because less is better

**Example:**
- 2500mg / 2300mg goal (109%) → 🔴 Red
- 2000mg / 2300mg goal (87%) → 🟡 Yellow
- 1500mg / 2300mg goal (65%) → 🟢 Green

---

### **3. Sugar** 🍬

**Logic:**
- 🔴 **Red**: `>= 100%` (Danger - "Exceeded limit!")
- 🟡 **Yellow**: `>= 80%` (Warning - "Close to limit")
- 🟢 **Green**: `< 80%` (Good - "Within limit")

**Why:**
- Sugar is a **limit** - exceeding is unhealthy
- Red at 100% because excess sugar causes health issues
- Green when low because less is better

**Example:**
- 60g / 50g goal (120%) → 🔴 Red
- 45g / 50g goal (90%) → 🟡 Yellow
- 30g / 50g goal (60%) → 🟢 Green

---

### **4. Calories** 🔥

**Logic:**
- 🔴 **Red**: `>= 100%` (Warning - "Goal reached/exceeded")
- 🟡 **Yellow**: `>= 80%` (Warning - "Close to goal")
- 🟢 **Green**: `< 80%` (Good - "Below goal")

**Why:**
- Calories are a **target** - exceeding means overeating
- Red at 100% warns about overconsumption
- Green when low means room for more food

**Example:**
- 2200 kcal / 2000 kcal goal (110%) → 🔴 Red
- 1800 kcal / 2000 kcal goal (90%) → 🟡 Yellow
- 1400 kcal / 2000 kcal goal (70%) → 🟢 Green

---

### **5. Carbs** 🍞

**Logic:**
- 🔴 **Red**: `>= 100%` (Warning - "Goal reached/exceeded")
- 🟡 **Yellow**: `>= 80%` (Warning - "Close to goal")
- 🟢 **Green**: `< 80%` (Good - "Below goal")

**Why:**
- Carbs are a **target** - exceeding means too many carbs
- Red at 100% warns about overconsumption
- Green when low means room for more carbs

**Example:**
- 250g / 225g goal (111%) → 🔴 Red
- 200g / 225g goal (89%) → 🟡 Yellow
- 150g / 225g goal (67%) → 🟢 Green

---

### **6. Fat** 🥑

**Logic:**
- 🔴 **Red**: `>= 100%` (Warning - "Goal reached/exceeded")
- 🟡 **Yellow**: `>= 80%` (Warning - "Close to goal")
- 🟢 **Green**: `< 80%` (Good - "Below goal")

**Why:**
- Fat is a **target** - exceeding means too much fat
- Red at 100% warns about overconsumption
- Green when low means room for more healthy fats

**Example:**
- 70g / 56g goal (125%) → 🔴 Red
- 50g / 56g goal (89%) → 🟡 Yellow
- 35g / 56g goal (63%) → 🟢 Green

---

## 📋 Summary Table

| Macronutrient | Theme Color | Status Logic | Red Threshold | Yellow Threshold | Green Threshold |
|--------------|-------------|--------------|---------------|------------------|-----------------|
| **Calories** | Teal | Target | `>= 100%` | `>= 80%` | `< 80%` |
| **Protein** | Blue | More is better | Never | `< 80%` | `>= 80%` |
| **Carbs** | Pink | Target | `>= 100%` | `>= 80%` | `< 80%` |
| **Fat** | Green | Target | `>= 100%` | `>= 80%` | `< 80%` |
| **Sodium** | Gray | Limit | `>= 100%` | `>= 80%` | `< 80%` |
| **Sugar** | Red | Limit | `>= 100%` | `>= 80%` | `< 80%` |

---

## 🎯 Key Differences

### **Protein (Unique Logic):**
- ✅ **Only macro that never shows red**
- ✅ **Green when >= 80%** (most macros show red at 100%)
- ✅ **Yellow when < 80%** (warning to add more)

### **Sodium & Sugar (Limit Logic):**
- ✅ **Red at >= 100%** (danger - exceeded limit)
- ✅ **Green when low** (good - within safe limit)

### **Calories, Carbs, Fat (Target Logic):**
- ✅ **Red at >= 100%** (warning - goal reached/exceeded)
- ✅ **Green when low** (good - room for more)

---

## 💡 Design Rationale

### **Why Different Colors for Each Macro?**
- **Visual Distinction**: Makes it easy to identify each macro at a glance
- **Brand Consistency**: Calories uses app's primary color
- **Intuitive**: Red for sugar (warning), Blue for protein (strength), etc.

### **Why Dynamic Status Colors?**
- **Immediate Feedback**: Users instantly see if they're on track
- **Traffic Light System**: Universal understanding (red = stop, yellow = caution, green = go)
- **Matches Explanations**: Visual matches text for consistency

---

## 🔍 Code Reference

**Theme Colors:**
```javascript
{ label: "Calories", color: colors.PRIMARY },  // Teal
{ label: "Protein", color: colors.BLUE },      // Blue
{ label: "Carbs", color: colors.PINK },        // Pink
{ label: "Fat", color: colors.GREEN },         // Green
{ label: "Sodium", color: colors.GRAY },       // Gray
{ label: "Sugar", color: colors.RED }          // Red
```

**Status Colors:**
```javascript
// Protein: Green >= 80%, Yellow < 80%
if (macroName === 'Protein') {
    if (percentage >= 80) return 'green';
    return 'yellow';
}

// Sodium/Sugar: Red >= 100%, Yellow >= 80%, Green < 80%
if (macroName === 'Sodium' || macroName === 'Sugar') {
    if (percentage >= 100) return 'red';
    if (percentage >= 80) return 'yellow';
    return 'green';
}

// Default (Calories, Carbs, Fat): Red >= 100%, Yellow >= 80%, Green < 80%
if (percentage >= 100) return 'red';
if (percentage >= 80) return 'yellow';
return 'green';
```

---

**Last Updated:** After traffic light fix  
**Status:** ✅ Complete and consistent

