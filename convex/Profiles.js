import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all profiles for a user
export const GetUserProfiles = query({
    args: {
        userId: v.id('users')
    },
    handler: async (ctx, args) => {
        const profiles = await ctx.db
            .query('profiles')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .collect();
        
        return profiles.sort((a, b) => {
            // Active profile first
            if (a.isActive && !b.isActive) return -1;
            if (!a.isActive && b.isActive) return 1;
            // Then by creation date (newest first)
            return b.createdAt - a.createdAt;
        });
    }
});

// Get active profile for a user
export const GetActiveProfile = query({
    args: {
        userId: v.id('users')
    },
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query('profiles')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .filter(q => q.eq(q.field('isActive'), true))
            .first();
        
        return profile;
    }
});

// Create a new profile
export const CreateProfile = mutation({
    args: {
        userId: v.id('users'),
        name: v.string(),
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
        sugar: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        // SECURITY: Verify user exists
        const user = await ctx.db.get(args.userId);
        if (!user) {
            throw new Error('User not found');
        }

        // SECURITY: Validate and sanitize inputs
        const sanitizeString = (str, maxLength) => {
            if (typeof str !== 'string') return '';
            return str.trim().substring(0, maxLength).replace(/[<>]/g, '');
        };

        const validateNumber = (value, min, max, fieldName) => {
            if (value !== undefined && (typeof value !== 'number' || isNaN(value) || value < min || value > max)) {
                throw new Error(`Invalid ${fieldName}. Must be a number between ${min} and ${max}.`);
            }
        };

        // Validate name
        if (!args.name || typeof args.name !== 'string' || args.name.trim().length === 0) {
            throw new Error('Profile name is required');
        }
        if (args.name.length > 30) {
            throw new Error('Profile name must be 30 characters or less');
        }

        // Validate picture if provided
        if (args.picture && typeof args.picture === 'string') {
            if (!/^data:image\/(jpeg|jpg|png|webp);base64,/.test(args.picture)) {
                throw new Error('Invalid image format');
            }
            const base64Data = args.picture.split(',')[1];
            const sizeInBytes = (base64Data.length * 3) / 4;
            if (sizeInBytes > 5 * 1024 * 1024) {
                throw new Error('Image size must be less than 5MB');
            }
        }

        // Validate numeric inputs
        if (args.calories !== undefined) validateNumber(args.calories, 0, 10000, 'calories');
        if (args.proteins !== undefined) validateNumber(args.proteins, 0, 1000, 'proteins');
        if (args.carbohydrates !== undefined) validateNumber(args.carbohydrates, 0, 1000, 'carbohydrates');
        if (args.fat !== undefined) validateNumber(args.fat, 0, 1000, 'fat');
        if (args.sodium !== undefined) validateNumber(args.sodium, 0, 50000, 'sodium');
        if (args.sugar !== undefined) validateNumber(args.sugar, 0, 1000, 'sugar');

        // If this is the first profile or explicitly set as active, make it active
        const existingProfiles = await ctx.db
            .query('profiles')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .collect();
        
        const isFirstProfile = existingProfiles.length === 0;
        const isActive = isFirstProfile; // First profile is automatically active

        // If making this active, deactivate all others
        if (isActive) {
            for (const profile of existingProfiles) {
                await ctx.db.patch(profile._id, { isActive: false });
            }
        }

        const profileId = await ctx.db.insert('profiles', {
            userId: args.userId,
            name: sanitizeString(args.name, 30),
            picture: args.picture ? sanitizeString(args.picture, 10 * 1024 * 1024) : undefined,
            height: args.height ? sanitizeString(args.height, 20) : undefined,
            weight: args.weight ? sanitizeString(args.weight, 20) : undefined,
            gender: args.gender ? sanitizeString(args.gender, 20) : undefined,
            goal: args.goal ? sanitizeString(args.goal, 50) : undefined,
            calories: args.calories,
            proteins: args.proteins,
            carbohydrates: args.carbohydrates,
            fat: args.fat,
            sodium: args.sodium,
            sugar: args.sugar,
            isActive: isActive,
            createdAt: Date.now()
        });

        return profileId;
    }
});

// Update profile
export const UpdateProfile = mutation({
    args: {
        profileId: v.id('profiles'),
        name: v.optional(v.string()),
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
        sugar: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        // SECURITY: Verify profile exists and get it
        const profile = await ctx.db.get(args.profileId);
        if (!profile) {
            throw new Error('Profile not found');
        }

        // SECURITY: Authorization check - user can only update their own profiles
        // Note: In a real app, you'd get userId from auth context
        // For now, we rely on the client passing correct userId
        // TODO: Add proper auth context check when Convex auth is implemented

        const { profileId, ...updates } = args;
        
        // SECURITY: Validate and sanitize inputs
        const sanitizeString = (str, maxLength) => {
            if (typeof str !== 'string') return '';
            return str.trim().substring(0, maxLength).replace(/[<>]/g, '');
        };

        const validateNumber = (value, min, max, fieldName) => {
            if (value !== undefined && (typeof value !== 'number' || isNaN(value) || value < min || value > max)) {
                throw new Error(`Invalid ${fieldName}. Must be a number between ${min} and ${max}.`);
            }
        };

        // Validate and sanitize updates
        const cleanUpdates = {};
        
        if (updates.name !== undefined) {
            if (!updates.name || typeof updates.name !== 'string' || updates.name.trim().length === 0) {
                throw new Error('Profile name cannot be empty');
            }
            if (updates.name.length > 30) {
                throw new Error('Profile name must be 30 characters or less');
            }
            cleanUpdates.name = sanitizeString(updates.name, 30);
        }

        if (updates.picture !== undefined && updates.picture) {
            if (!/^data:image\/(jpeg|jpg|png|webp);base64,/.test(updates.picture)) {
                throw new Error('Invalid image format');
            }
            const base64Data = updates.picture.split(',')[1];
            const sizeInBytes = (base64Data.length * 3) / 4;
            if (sizeInBytes > 5 * 1024 * 1024) {
                throw new Error('Image size must be less than 5MB');
            }
            cleanUpdates.picture = updates.picture;
        }

        if (updates.height !== undefined) cleanUpdates.height = sanitizeString(updates.height, 20);
        if (updates.weight !== undefined) cleanUpdates.weight = sanitizeString(updates.weight, 20);
        if (updates.gender !== undefined) cleanUpdates.gender = sanitizeString(updates.gender, 20);
        if (updates.goal !== undefined) cleanUpdates.goal = sanitizeString(updates.goal, 50);

        // Validate numeric inputs
        if (updates.calories !== undefined) {
            validateNumber(updates.calories, 0, 10000, 'calories');
            cleanUpdates.calories = updates.calories;
        }
        if (updates.proteins !== undefined) {
            validateNumber(updates.proteins, 0, 1000, 'proteins');
            cleanUpdates.proteins = updates.proteins;
        }
        if (updates.carbohydrates !== undefined) {
            validateNumber(updates.carbohydrates, 0, 1000, 'carbohydrates');
            cleanUpdates.carbohydrates = updates.carbohydrates;
        }
        if (updates.fat !== undefined) {
            validateNumber(updates.fat, 0, 1000, 'fat');
            cleanUpdates.fat = updates.fat;
        }
        if (updates.sodium !== undefined) {
            validateNumber(updates.sodium, 0, 50000, 'sodium');
            cleanUpdates.sodium = updates.sodium;
        }
        if (updates.sugar !== undefined) {
            validateNumber(updates.sugar, 0, 1000, 'sugar');
            cleanUpdates.sugar = updates.sugar;
        }

        await ctx.db.patch(profileId, cleanUpdates);
        return { success: true };
    }
});

// Switch active profile
export const SwitchProfile = mutation({
    args: {
        userId: v.id('users'),
        profileId: v.id('profiles')
    },
    handler: async (ctx, args) => {
        // Deactivate all profiles for this user
        const allProfiles = await ctx.db
            .query('profiles')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .collect();
        
        for (const profile of allProfiles) {
            await ctx.db.patch(profile._id, { 
                isActive: profile._id === args.profileId 
            });
        }

        return { success: true };
    }
});

// Delete profile
export const DeleteProfile = mutation({
    args: {
        profileId: v.id('profiles'),
        userId: v.id('users')
    },
    handler: async (ctx, args) => {
        const profile = await ctx.db.get(args.profileId);
        
        if (!profile || profile.userId !== args.userId) {
            throw new Error('Profile not found or unauthorized');
        }

        // If deleting the active profile, activate the first remaining profile
        if (profile.isActive) {
            const remainingProfiles = await ctx.db
                .query('profiles')
                .withIndex('by_user', (q) => q.eq('userId', args.userId))
                .filter(q => q.neq(q.field('_id'), args.profileId))
                .collect();
            
            if (remainingProfiles.length > 0) {
                // Activate the first remaining profile (oldest)
                const oldestProfile = remainingProfiles.sort((a, b) => a.createdAt - b.createdAt)[0];
                await ctx.db.patch(oldestProfile._id, { isActive: true });
            }
        }

        // Delete the profile
        await ctx.db.delete(args.profileId);
        
        return { success: true };
    }
});

