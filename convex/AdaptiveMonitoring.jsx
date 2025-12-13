import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Log an eating event for pattern detection
 */
export const LogEatingEvent = mutation({
    args: {
        uid: v.id('users'),
        date: v.string(),
        timestamp: v.string(),
        mealType: v.string(),
        hour: v.number(),
        calories: v.number(),
        protein: v.number(),
        carbohydrates: v.number(),
        fat: v.number(),
        sodium: v.number(),
        sugar: v.number(),
        source: v.string()
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.insert('eatingEvents', {
            uid: args.uid,
            date: args.date,
            timestamp: args.timestamp,
            mealType: args.mealType,
            hour: args.hour,
            calories: args.calories,
            protein: args.protein,
            carbohydrates: args.carbohydrates,
            fat: args.fat,
            sodium: args.sodium,
            sugar: args.sugar,
            source: args.source
        });
        return result;
    }
});

/**
 * Get eating events for the last N days
 */
export const GetEatingEvents = query({
    args: {
        uid: v.id('users'),
        days: v.optional(v.number()) // Default to 7 days
    },
    handler: async (ctx, args) => {
        const days = args.days || 7;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const events = await ctx.db.query('eatingEvents')
            .filter(q => q.eq(q.field('uid'), args.uid))
            .collect();

        // Filter by date (last N days)
        const filteredEvents = events.filter(event => {
            const eventDate = new Date(event.date.split('/').reverse().join('-')); // DD/MM/YYYY to Date
            return eventDate >= cutoffDate;
        });

        return filteredEvents.sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
    }
});

/**
 * Get detected patterns and recommendations
 */
export const GetAdaptiveInsights = query({
    args: {
        uid: v.id('users'),
        days: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        // Get user goals
        const user = await ctx.db.get(args.uid);
        if (!user) {
            return {
                patterns: [],
                recommendations: []
            };
        }

        const userGoals = {
            calories: user.calories || 2000,
            proteins: user.proteins || 100,
            carbohydrates: user.carbohydrates || 225,
            fat: user.fat || 56,
            sodium: user.sodium || 2300,
            sugar: user.sugar || 50
        };

        // Get eating events
        const days = args.days || 7;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const events = await ctx.db.query('eatingEvents')
            .filter(q => q.eq(q.field('uid'), args.uid))
            .collect();

        const filteredEvents = events.filter(event => {
            try {
                const eventDate = new Date(event.date.split('/').reverse().join('-'));
                return eventDate >= cutoffDate;
            } catch {
                return false;
            }
        });

        // Import and use pattern detection (we'll do this client-side for now)
        // For now, return events and goals, let client handle detection
        return {
            events: filteredEvents,
            userGoals,
            totalEvents: filteredEvents.length
        };
    }
});

