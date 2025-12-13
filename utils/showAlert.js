/**
 * Utility to show themed alerts throughout the app
 * This replaces Alert.alert with themed versions
 */

import { showThemedAlert, showSuccess, showError, showWarning, showInfo, showConfirm } from '../components/common/ThemedAlert';

// Export all alert functions for easy import
export {
    showThemedAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm
};

// Default export for convenience
export default {
    alert: showThemedAlert,
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    confirm: showConfirm,
};

