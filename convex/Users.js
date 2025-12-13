import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const CreateNewUser = mutation({
    args: {
        email: v.string(),
        name: v.string()
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.query('users')
            .filter(q => q.eq(q.field('email'), args.email))
            .collect()

        if (user?.length == 0) {
            const data = {
                name: args.name,
                email: args.email,
                credits: 10
            }
            const result = await ctx.db.insert('users', {
                ...data
            });

            return data;
        }
        return user[0];
    }
})

export const GetUser = query({
    // Make email optional to avoid validator errors when callers accidentally omit it.
    args: {
        email: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        // Defensive: if no email was provided, return null instead of failing.
        if (!args.email) {
            return null;
        }
        const user = await ctx.db.query('users')
            .filter(q => q.eq(q.field('email'), args.email))
            .collect()

        return user[0] ?? null
    }
})

export const UpdateUserPref = mutation({
    args: {
        uid: v.id('users'),
        height: v.string(),
        weight: v.string(),
        gender: v.string(),
        goal: v.string(),
        goalWeight: v.optional(v.number()), // Goal weight in kg
        calories: v.optional(v.number()),
        proteins: v.optional(v.number()),
        carbohydrates: v.optional(v.number()),
        fat: v.optional(v.number()),
        sodium: v.optional(v.number()),
        sugar: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        // SECURITY: Verify user exists and validate input
        const user = await ctx.db.get(args.uid);
        if (!user) {
            throw new Error('User not found');
        }

        // SECURITY: Validate numeric inputs to prevent injection
        const validateNumber = (value, min, max, fieldName) => {
            if (value !== undefined && (typeof value !== 'number' || isNaN(value) || value < min || value > max)) {
                throw new Error(`Invalid ${fieldName}. Must be a number between ${min} and ${max}.`);
            }
        };

        if (args.calories !== undefined) validateNumber(args.calories, 0, 10000, 'calories');
        if (args.proteins !== undefined) validateNumber(args.proteins, 0, 1000, 'proteins');
        if (args.carbohydrates !== undefined) validateNumber(args.carbohydrates, 0, 1000, 'carbohydrates');
        if (args.fat !== undefined) validateNumber(args.fat, 0, 1000, 'fat');
        if (args.sodium !== undefined) validateNumber(args.sodium, 0, 50000, 'sodium');
        if (args.sugar !== undefined) validateNumber(args.sugar, 0, 1000, 'sugar');

        // SECURITY: Sanitize string inputs
        const sanitizeString = (str, maxLength) => {
            if (typeof str !== 'string') return '';
            return str.trim().substring(0, maxLength).replace(/[<>]/g, '');
        };

        const result = await ctx.db.patch(args.uid, {
            height: sanitizeString(args.height, 20),
            weight: sanitizeString(args.weight, 20),
            goal: sanitizeString(args.goal, 50),
            gender: sanitizeString(args.gender, 20),
            goalWeight: args.goalWeight,
            proteins: args.proteins,
            calories: args.calories,
            carbohydrates: args.carbohydrates,
            fat: args.fat,
            sodium: args.sodium,
            sugar: args.sugar
        });
        return result
    }
})

export const UpdateUserPicture = mutation({
    args: {
        uid: v.id('users'),
        picture: v.string()
    },
    handler: async (ctx, args) => {
        // SECURITY: Verify user exists
        const user = await ctx.db.get(args.uid);
        if (!user) {
            throw new Error('User not found');
        }

        // SECURITY: Validate base64 image format and size
        if (!args.picture || typeof args.picture !== 'string') {
            throw new Error('Invalid picture data');
        }

        // Check if it's a valid base64 image
        if (!/^data:image\/(jpeg|jpg|png|webp);base64,/.test(args.picture)) {
            throw new Error('Invalid image format. Only JPEG, PNG, and WebP are supported.');
        }

        // Limit size (5MB max)
        const base64Data = args.picture.split(',')[1];
        const sizeInBytes = (base64Data.length * 3) / 4;
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (sizeInBytes > maxSize) {
            throw new Error('Image size must be less than 5MB');
        }

        const result = await ctx.db.patch(args.uid, {
            picture: args.picture
        });
        return result
    }
})