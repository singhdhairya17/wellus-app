import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        picture: v.optional(v.string()),
        subscriptionId: v.optional(v.string()),
        credits: v.number(),
        height: v.optional(v.string()),
        weight: v.optional(v.string()),
        goalWeight: v.optional(v.number()), // Goal weight in kg
        gender: v.optional(v.string()),
        goal: v.optional(v.string()),
        calories: v.optional(v.number()),
        proteins: v.optional(v.number()),
        carbohydrates: v.optional(v.number()),
        fat: v.optional(v.number()),
        sodium: v.optional(v.number()),
        sugar: v.optional(v.number())
    }),
    recipes: defineTable({
        jsonData: v.any(),
        uid: v.id('users'),
        imageUrl: v.string(),
        recipeName: v.any()
    }),

    mealPlan: defineTable({
        recipeId: v.id('recipes'),
        date: v.string(),
        mealType: v.string(),
        uid: v.id('users'),
        status: v.optional(v.boolean()),
        calories: v.optional(v.number())
    }),

    scannedFoods: defineTable({
        uid: v.id('users'),
        date: v.string(),
        mealType: v.string(),
        foodName: v.optional(v.string()),
        calories: v.number(),
        protein: v.number(),
        carbohydrates: v.number(),
        fat: v.number(),
        sodium: v.number(),
        sugar: v.number(),
        servingSize: v.optional(v.string()),
        servingsPerContainer: v.optional(v.number()),
        imageUri: v.optional(v.string())
    }),

    // Adaptive Monitoring: Event logging for pattern detection
    eatingEvents: defineTable({
        uid: v.id('users'),
        date: v.string(),
        timestamp: v.string(), // ISO timestamp
        mealType: v.string(), // Breakfast, Lunch, Dinner, Snack
        hour: v.number(), // Hour of day (0-23)
        calories: v.number(),
        protein: v.number(),
        carbohydrates: v.number(),
        fat: v.number(),
        sodium: v.number(),
        sugar: v.number(),
        source: v.string() // 'scanned' or 'recipe'
    }),

    // Billing: Subscription and payment history
    billingHistory: defineTable({
        uid: v.id('users'),
        type: v.string(), // 'subscription' or 'credits'
        planName: v.optional(v.string()), // 'Free', 'Premium', 'Pro'
        amount: v.number(), // Amount in USD
        credits: v.optional(v.number()), // Credits purchased (if type is 'credits')
        status: v.string(), // 'completed', 'pending', 'failed'
        paymentMethod: v.optional(v.string()), // 'card', 'paypal', etc.
        transactionId: v.optional(v.string()),
        createdAt: v.number(), // Unix timestamp
        expiresAt: v.optional(v.number()) // For subscriptions
    }),

    // Profiles: Multiple profiles per user account
    profiles: defineTable({
        userId: v.id('users'), // Links to the user account
        name: v.string(), // Profile name (e.g., "John", "Mom", "Dad")
        picture: v.optional(v.string()),
        height: v.optional(v.string()),
        weight: v.optional(v.string()),
        gender: v.optional(v.string()),
        goal: v.optional(v.string()),
        calories: v.optional(v.number()),
        proteins: v.optional(v.number()),
        carbohydrates: v.optional(v.number()),
        fat: v.optional(v.number()),
        sodium: v.optional(v.number()),
        sugar: v.optional(v.number()),
        isActive: v.optional(v.boolean()), // Currently selected profile
        createdAt: v.number() // Unix timestamp
    }).index('by_user', ['userId']),

    // Water Intake: Daily water consumption tracking
    waterIntake: defineTable({
        uid: v.id('users'),
        date: v.string(), // DD/MM/YYYY format
        amount: v.number(), // Amount in ml
        timestamp: v.number() // Unix timestamp
    }).index('by_user_date', ['uid', 'date']),

    // Weight Logs: Weight tracking over time
    weightLogs: defineTable({
        uid: v.id('users'),
        date: v.string(), // DD/MM/YYYY format
        weight: v.number(), // Weight in kg
        timestamp: v.number() // Unix timestamp
    }).index('by_user_date', ['uid', 'date']),

    // Exercise Logs: Exercise and calories burned tracking
    exerciseLogs: defineTable({
        uid: v.id('users'),
        date: v.string(), // DD/MM/YYYY format
        exerciseType: v.string(), // e.g., "Walking", "Running", "Cycling"
        duration: v.number(), // Duration in minutes
        caloriesBurned: v.number(), // Estimated calories burned
        timestamp: v.number() // Unix timestamp
    }).index('by_user_date', ['uid', 'date']),

    // Favorite Recipes: User's favorited recipes
    favoriteRecipes: defineTable({
        uid: v.id('users'),
        recipeId: v.id('recipes'),
        createdAt: v.number() // Unix timestamp
    }).index('by_user', ['uid']).index('by_recipe', ['recipeId']),

    // Meal Reminders: User's meal reminder settings
    mealReminders: defineTable({
        uid: v.id('users'),
        mealType: v.string(), // Breakfast, Lunch, Dinner, Snack
        enabled: v.boolean(),
        hour: v.number(), // Hour (0-23)
        minute: v.number(), // Minute (0-59)
        daysOfWeek: v.array(v.number()) // [0,1,2,3,4,5,6] for Sun-Sat
    }).index('by_user', ['uid'])
})