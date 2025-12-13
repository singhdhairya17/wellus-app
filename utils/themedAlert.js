import { Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * Themed Alert utility that uses the app's theme colors
 * This provides a consistent UI for all alerts, errors, and messages
 */
class ThemedAlertManager {
    constructor() {
        this.theme = null;
    }

    setTheme(theme) {
        this.theme = theme;
    }

    /**
     * Show a themed alert
     * @param {string} title - Alert title
     * @param {string} message - Alert message
     * @param {Array} buttons - Array of button configs [{text, onPress, style}]
     */
    alert(title, message, buttons = [{ text: 'OK' }]) {
        // Use native Alert but with consistent styling
        // Note: React Native Alert doesn't support custom styling,
        // so we'll create a custom modal component for better theming
        Alert.alert(title, message, buttons);
    }

    /**
     * Show a success alert
     */
    success(title, message, onPress) {
        this.alert(
            title || 'Success!',
            message,
            [{ text: 'OK', onPress }]
        );
    }

    /**
     * Show an error alert
     */
    error(title, message, onPress) {
        this.alert(
            title || 'Error',
            message,
            [{ text: 'OK', onPress }]
        );
    }

    /**
     * Show a warning alert
     */
    warning(title, message, onPress) {
        this.alert(
            title || 'Warning',
            message,
            [{ text: 'OK', onPress }]
        );
    }

    /**
     * Show a confirmation alert
     */
    confirm(title, message, onConfirm, onCancel) {
        this.alert(
            title || 'Confirm',
            message,
            [
                { text: 'Cancel', style: 'cancel', onPress: onCancel },
                { text: 'Confirm', onPress: onConfirm }
            ]
        );
    }
}

// Create singleton instance
const themedAlertManager = new ThemedAlertManager();

export default themedAlertManager;

