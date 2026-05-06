/**
 * Reconciles Convex `mealReminders` preferences with the OS-scheduled local
 * notifications. Local schedules disappear when app data is cleared or after a
 * reinstall; the Convex prefs survive those events. Without this sync, the UI
 * shows reminders as "Active" while the OS has nothing scheduled, so they
 * silently never fire.
 *
 * Safe to call multiple times: cancels and re-creates `wellus-reminder-*`
 * identifiers each run, so repeated calls are idempotent.
 */

import { Platform } from 'react-native'
import {
    loadExpoNotifications,
    requestPermissionsAsyncSafe,
    isExpoGo,
} from '../../utils/expoNotificationsGate'
import { api } from '../../convex/_generated/api'
import { scheduleMealReminder } from './MealReminderScheduler'

let inFlightUid = null

const SCHEDULE_PREFIX = 'wellus-reminder-'

/**
 * @param {object} options
 * @param {object} options.convex   The Convex client (from useConvex / getConvexClient).
 * @param {string} options.uid      The Convex `users` _id.
 * @returns {Promise<{ status: string, scheduled?: number, reason?: string }>}
 */
export const syncRemindersOnStartup = async ({ convex, uid } = {}) => {
    if (!convex || !uid) {
        return { status: 'skipped', reason: 'missing convex client or uid' }
    }

    // Avoid concurrent syncs for the same user.
    if (inFlightUid === uid) {
        return { status: 'skipped', reason: 'already syncing' }
    }
    inFlightUid = uid

    try {
        if (isExpoGo) {
            return { status: 'skipped', reason: 'expo go (no notifications module)' }
        }

        const Notifications = await loadExpoNotifications()
        if (!Notifications) {
            return { status: 'skipped', reason: 'notifications module unavailable' }
        }

        const perm = await requestPermissionsAsyncSafe()
        if (perm?.status !== 'granted') {
            return { status: 'permission_denied' }
        }

        const reminders = await convex.query(api.Reminders.GetMealReminders, { uid })
        const list = Array.isArray(reminders) ? reminders : []

        // Cancel all of our previously-scheduled identifiers so we never leak
        // an old time after the user changes one.
        try {
            const allScheduled = await Notifications.getAllScheduledNotificationsAsync()
            const wellusOnly = (allScheduled || []).filter((s) => {
                const id = s?.identifier || ''
                return typeof id === 'string' && id.startsWith(SCHEDULE_PREFIX)
            })
            await Promise.all(
                wellusOnly.map((s) =>
                    Notifications.cancelScheduledNotificationAsync(s.identifier).catch(() => null)
                )
            )
        } catch (err) {
            // Non-fatal; rescheduling below replaces same-id schedules anyway.
            if (__DEV__) console.warn('[syncReminders] cancel-all failed:', err?.message)
        }

        let scheduled = 0
        for (const r of list) {
            if (!r?.enabled) continue
            const hour = Number.isFinite(r.hour) ? r.hour : 0
            const minute = Number.isFinite(r.minute) ? r.minute : 0
            try {
                await scheduleMealReminder(r.mealType, hour, minute)
                scheduled += 1
            } catch (err) {
                if (__DEV__) console.warn('[syncReminders] schedule failed:', r.mealType, err?.message)
            }
        }

        return { status: 'ok', scheduled, total: list.length }
    } catch (err) {
        if (__DEV__) console.error('[syncReminders] error:', err)
        return { status: 'error', reason: err?.message || 'unknown' }
    } finally {
        inFlightUid = null
    }
}
