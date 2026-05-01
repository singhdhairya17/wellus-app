import { api } from '../convex/_generated/api'

/** One warm-up per JS runtime (Strict Mode double-mount still dedupes). */
let healthCoachWarmScheduled = false

/**
 * Warms Convex + OpenAI path ahead of Health Coach (minimal token cost).
 * Safe to call from multiple screens; runs at most once until app reload.
 */
export function scheduleHealthCoachWarmup(convex) {
    if (!convex || healthCoachWarmScheduled) return
    healthCoachWarmScheduled = true
    convex.action(api.Ai.PingHealthCoachBackend, {}).catch(() => {})
}
