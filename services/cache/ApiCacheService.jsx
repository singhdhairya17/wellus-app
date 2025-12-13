/**
 * API Caching Service
 * Provides request caching, batching, and deduplication
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

const CACHE_PREFIX = '@wellus_cache_'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 50 // Maximum number of cached items

// In-memory cache for faster access
const memoryCache = new Map()

/**
 * Generate cache key from API endpoint and params
 */
const generateCacheKey = (endpoint, params = {}) => {
    const paramString = JSON.stringify(params)
    return `${endpoint}_${paramString}`
}

/**
 * Check if cache entry is still valid
 */
const isCacheValid = (cacheEntry) => {
    if (!cacheEntry) return false
    const now = Date.now()
    return (now - cacheEntry.timestamp) < CACHE_DURATION
}

/**
 * Get cached data
 */
export const getCachedData = async (endpoint, params = {}) => {
    const cacheKey = generateCacheKey(endpoint, params)
    
    // Check memory cache first
    if (memoryCache.has(cacheKey)) {
        const cached = memoryCache.get(cacheKey)
        if (isCacheValid(cached)) {
            return cached.data
        }
        memoryCache.delete(cacheKey)
    }
    
    // Check persistent cache
    try {
        const stored = await AsyncStorage.getItem(CACHE_PREFIX + cacheKey)
        if (stored) {
            const cached = JSON.parse(stored)
            if (isCacheValid(cached)) {
                // Update memory cache
                memoryCache.set(cacheKey, cached)
                return cached.data
            } else {
                // Remove expired cache
                await AsyncStorage.removeItem(CACHE_PREFIX + cacheKey)
            }
        }
    } catch (error) {
        console.error('Error reading cache:', error)
    }
    
    return null
}

/**
 * Set cached data
 */
export const setCachedData = async (endpoint, params = {}, data) => {
    const cacheKey = generateCacheKey(endpoint, params)
    const cacheEntry = {
        data,
        timestamp: Date.now()
    }
    
    // Update memory cache
    memoryCache.set(cacheKey, cacheEntry)
    
    // Limit memory cache size
    if (memoryCache.size > MAX_CACHE_SIZE) {
        const firstKey = memoryCache.keys().next().value
        memoryCache.delete(firstKey)
    }
    
    // Update persistent cache
    try {
        await AsyncStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify(cacheEntry))
    } catch (error) {
        console.error('Error writing cache:', error)
    }
}

/**
 * Clear cache for specific endpoint
 */
export const clearCache = async (endpoint, params = {}) => {
    const cacheKey = generateCacheKey(endpoint, params)
    memoryCache.delete(cacheKey)
    try {
        await AsyncStorage.removeItem(CACHE_PREFIX + cacheKey)
    } catch (error) {
        console.error('Error clearing cache:', error)
    }
}

/**
 * Clear all cache
 */
export const clearAllCache = async () => {
    memoryCache.clear()
    try {
        const keys = await AsyncStorage.getAllKeys()
        const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX))
        await AsyncStorage.multiRemove(cacheKeys)
    } catch (error) {
        console.error('Error clearing all cache:', error)
    }
}

/**
 * Debounce function for API calls
 */
export const debounce = (func, wait) => {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

/**
 * Batch multiple API calls
 */
export const batchApiCalls = async (calls) => {
    return Promise.all(calls.map(call => call()))
}

