import * as Haptics from 'expo-haptics';

/**
 * Premium haptic feedback utility
 * Provides different haptic feedback types for various interactions
 */

export const triggerHaptic = {
    // Light haptic for button taps, selections
    light: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    
    // Medium haptic for important actions
    medium: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    
    // Heavy haptic for critical actions
    heavy: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    },
    
    // Success haptic for goal achievements
    success: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    
    // Warning haptic for exceeding limits
    warning: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
    
    // Error haptic for failures
    error: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
    
    // Selection haptic for pickers, switches
    selection: () => {
        Haptics.selectionAsync();
    }
};

