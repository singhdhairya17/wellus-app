/**
 * Security: Input Validation and Sanitization Utilities
 * Prevents injection attacks, XSS, and invalid data
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Name validation (alphanumeric, spaces, hyphens, apostrophes only)
const NAME_REGEX = /^[a-zA-Z0-9\s\-'\.]{1,50}$/;

// Numeric validation (positive numbers only)
const NUMERIC_REGEX = /^[0-9]+(\.[0-9]+)?$/;

/**
 * Sanitize string input - removes potentially dangerous characters
 */
export const sanitizeString = (input, maxLength = 1000) => {
    if (typeof input !== 'string') {
        return '';
    }
    
    // Trim whitespace
    let sanitized = input.trim();
    
    // Limit length
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    
    // Remove null bytes and control characters (except newlines and tabs)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    return sanitized;
};

/**
 * Validate and sanitize email
 */
export const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email is required' };
    }
    
    const sanitized = sanitizeString(email.toLowerCase(), 254);
    
    if (!EMAIL_REGEX.test(sanitized)) {
        return { valid: false, error: 'Invalid email format' };
    }
    
    return { valid: true, value: sanitized };
};

/**
 * Validate and sanitize name
 */
export const validateName = (name) => {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: 'Name is required' };
    }
    
    const sanitized = sanitizeString(name, 50);
    
    if (sanitized.length < 1) {
        return { valid: false, error: 'Name cannot be empty' };
    }
    
    if (sanitized.length > 50) {
        return { valid: false, error: 'Name must be 50 characters or less' };
    }
    
    // Allow names with special characters but sanitize
    if (!NAME_REGEX.test(sanitized)) {
        return { valid: false, error: 'Name contains invalid characters' };
    }
    
    return { valid: true, value: sanitized };
};

/**
 * Validate and sanitize numeric input (weight, height, etc.)
 */
export const validateNumeric = (value, min = 0, max = 10000, fieldName = 'Value') => {
    if (value === null || value === undefined || value === '') {
        return { valid: false, error: `${fieldName} is required` };
    }
    
    const strValue = String(value).trim();
    
    if (!NUMERIC_REGEX.test(strValue)) {
        return { valid: false, error: `${fieldName} must be a valid number` };
    }
    
    const numValue = parseFloat(strValue);
    
    if (isNaN(numValue)) {
        return { valid: false, error: `${fieldName} must be a valid number` };
    }
    
    if (numValue < min) {
        return { valid: false, error: `${fieldName} must be at least ${min}` };
    }
    
    if (numValue > max) {
        return { valid: false, error: `${fieldName} must be at most ${max}` };
    }
    
    return { valid: true, value: numValue };
};

/**
 * Validate weight (kg)
 */
export const validateWeight = (weight) => {
    return validateNumeric(weight, 1, 500, 'Weight');
};

/**
 * Validate height (ft) - accepts format like 5.10 (5 feet 10 inches)
 */
export const validateHeight = (height) => {
    if (!height || typeof height !== 'string') {
        return { valid: false, error: 'Height is required' };
    }
    
    const sanitized = sanitizeString(height, 10);
    
    // Accept format: X.XX or X.X (e.g., 5.10, 6.0)
    const HEIGHT_REGEX = /^[0-9]+\.[0-9]{1,2}$/;
    
    if (!HEIGHT_REGEX.test(sanitized)) {
        return { valid: false, error: 'Height must be in format X.XX (e.g., 5.10 for 5 feet 10 inches)' };
    }
    
    const parts = sanitized.split('.');
    const feet = parseInt(parts[0]);
    const inches = parseInt(parts[1]);
    
    if (feet < 1 || feet > 8) {
        return { valid: false, error: 'Height in feet must be between 1 and 8' };
    }
    
    if (inches < 0 || inches > 11) {
        return { valid: false, error: 'Height in inches must be between 0 and 11' };
    }
    
    return { valid: true, value: sanitized };
};

/**
 * Validate gender
 */
export const validateGender = (gender) => {
    const validGenders = ['Male', 'Female', 'Other'];
    
    if (!gender || typeof gender !== 'string') {
        return { valid: false, error: 'Gender is required' };
    }
    
    const sanitized = sanitizeString(gender, 20);
    
    if (!validGenders.includes(sanitized)) {
        return { valid: false, error: `Gender must be one of: ${validGenders.join(', ')}` };
    }
    
    return { valid: true, value: sanitized };
};

/**
 * Validate goal
 */
export const validateGoal = (goal) => {
    const validGoals = ['Weight Loss', 'Muscle Gain', 'Weight Gain', 'Maintenance'];
    
    if (!goal || typeof goal !== 'string') {
        return { valid: false, error: 'Goal is required' };
    }
    
    const sanitized = sanitizeString(goal, 30);
    
    if (!validGoals.includes(sanitized)) {
        return { valid: false, error: `Goal must be one of: ${validGoals.join(', ')}` };
    }
    
    return { valid: true, value: sanitized };
};

/**
 * Validate profile name
 */
export const validateProfileName = (name) => {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: 'Profile name is required' };
    }
    
    const sanitized = sanitizeString(name, 30);
    
    if (sanitized.length < 1) {
        return { valid: false, error: 'Profile name cannot be empty' };
    }
    
    if (sanitized.length > 30) {
        return { valid: false, error: 'Profile name must be 30 characters or less' };
    }
    
    // Allow alphanumeric, spaces, and common name characters
    if (!/^[a-zA-Z0-9\s\-'\.]{1,30}$/.test(sanitized)) {
        return { valid: false, error: 'Profile name contains invalid characters' };
    }
    
    return { valid: true, value: sanitized };
};

/**
 * Sanitize base64 image data
 */
export const validateBase64Image = (base64String) => {
    if (!base64String || typeof base64String !== 'string') {
        return { valid: false, error: 'Image data is required' };
    }
    
    // Check if it's a valid base64 string
    if (!/^data:image\/(jpeg|jpg|png|webp);base64,/.test(base64String)) {
        return { valid: false, error: 'Invalid image format. Only JPEG, PNG, and WebP are supported.' };
    }
    
    // Limit size (e.g., 5MB max)
    const base64Data = base64String.split(',')[1];
    const sizeInBytes = (base64Data.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (sizeInBytes > maxSize) {
        return { valid: false, error: 'Image size must be less than 5MB' };
    }
    
    return { valid: true, value: base64String };
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
    if (!password || typeof password !== 'string') {
        return { valid: false, error: 'Password is required' };
    }
    
    if (password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters long' };
    }
    
    if (password.length > 128) {
        return { valid: false, error: 'Password must be less than 128 characters' };
    }
    
    // Check for at least one uppercase, one lowercase, and one number
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        return { 
            valid: false, 
            error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
        };
    }
    
    return { valid: true, value: password };
};

/**
 * Sanitize URL
 */
export const validateUrl = (url) => {
    if (!url || typeof url !== 'string') {
        return { valid: false, error: 'URL is required' };
    }
    
    const sanitized = sanitizeString(url, 2048);
    
    try {
        const urlObj = new URL(sanitized);
        
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return { valid: false, error: 'URL must use http or https protocol' };
        }
        
        return { valid: true, value: sanitized };
    } catch (error) {
        return { valid: false, error: 'Invalid URL format' };
    }
};
