/**
 * Pure unit-conversion + BMI helpers shared by client and Convex backend.
 *
 * IMPORTANT: parseFloat("5.10") === 5.1, so callers MUST NOT use parseFloat
 * on the legacy "X.YY" feet+inches strings. Use parseLegacyHeight instead.
 */

const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;

/** Convert (feet, inches) into centimeters. */
export const feetInchesToCm = (feet, inches) => {
    const f = Number.isFinite(feet) ? feet : 0;
    const i = Number.isFinite(inches) ? inches : 0;
    return (f * INCHES_PER_FOOT + i) * CM_PER_INCH;
};

/** Convert cm into { feet, inches } (inches rounded to nearest int). */
export const cmToFeetInches = (cm) => {
    if (!Number.isFinite(cm) || cm <= 0) return { feet: 0, inches: 0 };
    const totalInches = cm / CM_PER_INCH;
    let feet = Math.floor(totalInches / INCHES_PER_FOOT);
    let inches = Math.round(totalInches - feet * INCHES_PER_FOOT);
    if (inches === 12) {
        feet += 1;
        inches = 0;
    }
    return { feet, inches };
};

/**
 * Parse the legacy "X.YY" feet+inches string (e.g. "5.10" -> { feet: 5, inches: 10 }).
 * Returns null if the string can't be parsed.
 */
export const parseLegacyHeight = (legacy) => {
    if (legacy == null) return null;
    const s = String(legacy).trim();
    if (!s) return null;
    const match = s.match(/^([0-9]+)(?:\.([0-9]{1,2}))?$/);
    if (!match) return null;
    const feet = parseInt(match[1], 10);
    const inches = match[2] ? parseInt(match[2], 10) : 0;
    if (!Number.isFinite(feet) || !Number.isFinite(inches)) return null;
    if (inches > 11) return null;
    return { feet, inches };
};

/** Legacy "X.YY" -> centimeters. Returns null if unparseable. */
export const legacyHeightToCm = (legacy) => {
    const parsed = parseLegacyHeight(legacy);
    if (!parsed) return null;
    return feetInchesToCm(parsed.feet, parsed.inches);
};

/**
 * Resolve height in cm given either:
 *  - a numeric heightCm field (preferred), or
 *  - a legacy "X.YY" string in `height`.
 * Returns null if neither is usable.
 */
export const resolveHeightCm = ({ heightCm, height } = {}) => {
    if (Number.isFinite(heightCm) && heightCm > 0) return heightCm;
    return legacyHeightToCm(height);
};

/** BMI from kg + cm. Returns null on bad input. */
export const bmiFromKgCm = (weightKg, heightCm) => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
    const meters = h / 100;
    return w / (meters * meters);
};

export const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
};

export const ACTIVITY_LEVELS = Object.keys(ACTIVITY_MULTIPLIERS);

/** Look up an activity multiplier; falls back to moderate. */
export const activityMultiplier = (level) => {
    if (typeof level !== 'string') return ACTIVITY_MULTIPLIERS.moderate;
    const key = level.trim().toLowerCase().replace(/\s+/g, '_');
    return ACTIVITY_MULTIPLIERS[key] ?? ACTIVITY_MULTIPLIERS.moderate;
};
