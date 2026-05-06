/**
 * Hydrate `UserContext` from Convex after a successful login (or auto-login
 * via Remember Me). Performs three things in order:
 *
 *   1. Runs `Migrations.MigrateLegacyProfile` to backfill `heightCm` and
 *      recompute corrupted calorie/macro targets on the active profile.
 *   2. Reads the active profile and merges it into the user object so Home
 *      shows the correct calorie/macro targets on first paint (fixes the
 *      "425 kcal until I open Profile" bug).
 *   3. Fires the local notification reconciler so reminders that the user
 *      previously enabled actually fire after a reinstall / data clear.
 *
 * All steps fail open: any error is logged and the base `userData` is still
 * returned so the rest of the auth flow keeps working.
 */

import { api } from '../convex/_generated/api'
import { syncRemindersOnStartup } from '../services/reminders/syncReminders'

export const hydrateUserSession = async ({ convex, userData }) => {
    if (!convex || !userData?._id) return userData

    const merged = { ...userData }

    try {
        await convex.mutation(api.Migrations.MigrateLegacyProfile, { uid: userData._id })
    } catch (err) {
        if (__DEV__) console.warn('[hydrateUserSession] migration failed:', err?.message)
    }

    try {
        const activeProfile = await convex.query(api.Profiles.GetActiveProfile, {
            userId: userData._id,
        })
        if (activeProfile) {
            // Active profile is the source of truth for body metrics + goals;
            // overlay it on top of the user identity row.
            Object.assign(merged, activeProfile, {
                _id: userData._id,
                email: userData.email,
                name: activeProfile.name || userData.name,
                credits: userData.credits,
                picture: userData.picture ?? activeProfile.picture,
                // Keep users table creation time — profile merge would overwrite with profile._creationTime otherwise
                _creationTime: userData._creationTime,
            })
        }
    } catch (err) {
        if (__DEV__) console.warn('[hydrateUserSession] profile fetch failed:', err?.message)
    }

    // Fire-and-forget; do NOT block sign-in on notification scheduling.
    syncRemindersOnStartup({ convex, uid: userData._id }).catch((err) => {
        if (__DEV__) console.warn('[hydrateUserSession] reminder sync failed:', err?.message)
    })

    return merged
}
