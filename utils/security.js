/**
 * Security Utilities
 * Provides security functions for authentication, authorization, and data protection
 */

// Graceful fallback if expo-secure-store is not available
let SecureStore;
try {
    SecureStore = require('expo-secure-store');
} catch (error) {
    console.warn('[Security] expo-secure-store not available, using AsyncStorage fallback');
    SecureStore = null;
}
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Secure storage for sensitive data (uses device keychain/keystore)
 */
export const SecureStorage = {
    /**
     * Store sensitive data securely
     */
    async setItem(key, value) {
        try {
            if (SecureStore) {
                await SecureStore.setItemAsync(key, value, {
                    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
                });
            } else {
                // Fallback to AsyncStorage if SecureStore not available
                await AsyncStorage.setItem(key, value);
            }
            return true;
        } catch (error) {
            console.error(`[Security] Error storing secure item ${key}:`, error);
            return false;
        }
    },

    /**
     * Retrieve sensitive data
     */
    async getItem(key) {
        try {
            if (SecureStore) {
                return await SecureStore.getItemAsync(key);
            } else {
                // Fallback to AsyncStorage if SecureStore not available
                return await AsyncStorage.getItem(key);
            }
        } catch (error) {
            console.error(`[Security] Error retrieving secure item ${key}:`, error);
            return null;
        }
    },

    /**
     * Delete sensitive data
     */
    async removeItem(key) {
        try {
            if (SecureStore) {
                await SecureStore.deleteItemAsync(key);
            } else {
                // Fallback to AsyncStorage if SecureStore not available
                await AsyncStorage.removeItem(key);
            }
            return true;
        } catch (error) {
            console.error(`[Security] Error removing secure item ${key}:`, error);
            return false;
        }
    }
};

/**
 * Rate limiting utility
 */
class RateLimiter {
    constructor() {
        this.requests = new Map();
    }

    /**
     * Check if request should be allowed
     * @param {string} key - Unique identifier (e.g., userId, IP)
     * @param {number} maxRequests - Maximum requests allowed
     * @param {number} windowMs - Time window in milliseconds
     * @returns {boolean} - true if allowed, false if rate limited
     */
    isAllowed(key, maxRequests = 10, windowMs = 60000) {
        const now = Date.now();
        const userRequests = this.requests.get(key) || [];

        // Remove old requests outside the window
        const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);

        if (recentRequests.length >= maxRequests) {
            return false; // Rate limited
        }

        // Add current request
        recentRequests.push(now);
        this.requests.set(key, recentRequests);

        return true; // Allowed
    }

    /**
     * Clear rate limit for a key
     */
    clear(key) {
        this.requests.delete(key);
    }

    /**
     * Clear all rate limits
     */
    clearAll() {
        this.requests.clear();
    }
}

export const rateLimiter = new RateLimiter();

/**
 * Sanitize error messages to prevent information leakage
 */
export const sanitizeError = (error, isDevelopment = false) => {
    // In development, show full errors
    if (isDevelopment) {
        return error;
    }

    // In production, sanitize error messages
    const errorMessage = error?.message || error?.toString() || 'An error occurred';

    // Don't expose internal details
    const sensitivePatterns = [
        /api[_-]?key/gi,
        /password/gi,
        /token/gi,
        /secret/gi,
        /credential/gi,
        /database/gi,
        /sql/gi,
        /connection/gi,
        /stack[_\s]?trace/gi,
        /at\s+\w+\.\w+/gi, // Stack trace lines
    ];

    let sanitized = errorMessage;

    for (const pattern of sensitivePatterns) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    // Generic error messages for common issues
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        return 'Network error. Please check your connection and try again.';
    }

    if (errorMessage.includes('timeout')) {
        return 'Request timed out. Please try again.';
    }

    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        return 'Too many requests. Please wait a moment and try again.';
    }

    if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        return 'Authentication failed. Please sign in again.';
    }

    if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        return 'Access denied. You do not have permission to perform this action.';
    }

    if (errorMessage.includes('404')) {
        return 'Resource not found.';
    }

    if (errorMessage.includes('500') || errorMessage.includes('server error')) {
        return 'Server error. Please try again later.';
    }

    // Return sanitized message or generic error
    return sanitized || 'An unexpected error occurred. Please try again.';
};

/**
 * Generate a secure random token
 */
export const generateSecureToken = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    
    // Use crypto if available (web), otherwise fallback
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            token += chars[array[i] % chars.length];
        }
    } else {
        // Fallback for React Native
        for (let i = 0; i < length; i++) {
            token += chars[Math.floor(Math.random() * chars.length)];
        }
    }
    
    return token;
};

/**
 * Hash a string (simple hash for non-cryptographic purposes)
 */
export const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
};

/**
 * Check if user is authenticated (basic check)
 */
export const isAuthenticated = async () => {
    try {
        const token = await SecureStorage.getItem('authToken');
        return !!token;
    } catch (error) {
        return false;
    }
};

/**
 * Secure logging - removes sensitive data from logs
 */
export const secureLog = (message, data = null, isDevelopment = false) => {
    if (!isDevelopment) {
        // In production, only log message, not data
        console.log(`[Secure] ${message}`);
        return;
    }

    // In development, log everything
    if (data) {
        console.log(`[Dev] ${message}`, data);
    } else {
        console.log(`[Dev] ${message}`);
    }
};

