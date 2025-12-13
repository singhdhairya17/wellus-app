import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CheckmarkCircle02Icon, AlertCircleIcon, InfoCircleIcon } from '@hugeicons/core-free-icons';
// Removed animations as per user request

let alertQueue = [];
let currentAlert = null;
let setAlertState = null;

const ThemedAlert = () => {
    const themeContext = useTheme();
    const themeColors = themeContext?.colors || {};
    const colors = {
        BACKGROUND: themeColors.BACKGROUND || '#FFFFFF',
        CARD: themeColors.CARD || '#FFFFFF',
        SURFACE: themeColors.SURFACE || '#F8F9FA',
        TEXT: themeColors.TEXT || '#000000',
        TEXT_SECONDARY: themeColors.TEXT_SECONDARY || '#666666',
        BORDER: themeColors.BORDER || '#E5E5EA',
        PRIMARY: themeColors.PRIMARY || '#3B82F6',
        GREEN: themeColors.GREEN || '#10B981',
        RED: themeColors.RED || '#EF4444',
        YELLOW: themeColors.YELLOW || '#F59E0B',
        WHITE: themeColors.WHITE || '#FFFFFF',
        isDark: themeColors.isDark || false
    };
    const [alert, setAlert] = useState(null);
    
    const processNextAlert = React.useCallback(() => {
        if (alertQueue.length > 0 && !currentAlert) {
            currentAlert = alertQueue.shift();
            setAlert(currentAlert);
        }
    }, []);

    useEffect(() => {
        setAlertState = setAlert;
        // Process any queued alerts
        if (alertQueue.length > 0 && !alert) {
            processNextAlert();
        }
    }, [alert, processNextAlert]);

    const handleClose = (buttonIndex) => {
        if (alert) {
            const button = alert.buttons?.[buttonIndex];
            const onPressCallback = button?.onPress;
            
            // Close the alert first
            setAlert(null);
            currentAlert = null;
            
            // Call the callback after a brief delay to ensure modal is closed
            if (onPressCallback) {
                setTimeout(() => {
                    try {
                        onPressCallback();
                    } catch (error) {
                        console.error('Error in alert button callback:', error);
                    }
                }, 100);
            }
            
            // Process next alert in queue
            setTimeout(() => processNextAlert(), 300);
        }
    };

    if (!alert) return null;

    const { title, message, buttons = [{ text: 'OK' }], type = 'info' } = alert;

    // Get icon and colors based on type
    const getTypeConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: CheckmarkCircle02Icon,
                    iconColor: colors.GREEN || '#10B981',
                    gradientColors: [(colors.GREEN || '#10B981') + '20', (colors.GREEN || '#10B981') + '10']
                };
            case 'error':
                return {
                    icon: AlertCircleIcon,
                    iconColor: colors.RED || '#EF4444',
                    gradientColors: [(colors.RED || '#EF4444') + '20', (colors.RED || '#EF4444') + '10']
                };
            case 'warning':
                return {
                    icon: AlertCircleIcon,
                    iconColor: colors.YELLOW || '#F59E0B',
                    gradientColors: [(colors.YELLOW || '#F59E0B') + '20', (colors.YELLOW || '#F59E0B') + '10']
                };
            default:
                return {
                    icon: InfoCircleIcon,
                    iconColor: colors.PRIMARY || '#3B82F6',
                    gradientColors: [(colors.PRIMARY || '#3B82F6') + '20', (colors.PRIMARY || '#3B82F6') + '10']
                };
        }
    };

    const typeConfig = getTypeConfig();
    
    // Ensure icon is always defined
    if (!typeConfig || !typeConfig.icon) {
        return null;
    }

    if (!alert) return null;

    return (
        <Modal
            visible={!!alert}
            transparent
            animationType="fade"
            onRequestClose={() => handleClose(0)}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <LinearGradient
                        colors={colors.isDark
                            ? [colors.CARD, colors.SURFACE]
                            : ['#FFFFFF', '#F8F9FA']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.alertContent, {
                            borderWidth: colors.isDark ? 1 : 0,
                            borderColor: colors.BORDER,
                            shadowColor: typeConfig.iconColor,
                            shadowOpacity: colors.isDark ? 0.3 : 0.1,
                        }]}
                    >
                        {/* Icon */}
                        {typeConfig.icon && (
                            <View style={[styles.iconContainer, {
                                backgroundColor: typeConfig.gradientColors?.[0] || colors.PRIMARY + '20'
                            }]}>
                                <HugeiconsIcon
                                    icon={typeConfig.icon}
                                    size={48}
                                    color={typeConfig.iconColor || colors.PRIMARY}
                                    strokeWidth={2}
                                />
                            </View>
                        )}

                        {/* Title */}
                        {title && (
                            <Text style={[styles.title, { color: colors.TEXT }]}>
                                {title}
                            </Text>
                        )}

                        {/* Message */}
                        {message && (
                            <ScrollView
                                style={styles.messageContainer}
                                showsVerticalScrollIndicator={false}
                            >
                                <Text style={[styles.message, { color: colors.TEXT_SECONDARY }]}>
                                    {message}
                                </Text>
                            </ScrollView>
                        )}

                        {/* Buttons */}
                        <View style={styles.buttonContainer}>
                            {buttons.map((button, index) => {
                                const isPrimary = index === buttons.length - 1 && button.style !== 'cancel';
                                const isCancel = button.style === 'cancel';
                                const isLast = index === buttons.length - 1;

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => handleClose(index)}
                                        style={[
                                            styles.button,
                                            isPrimary && {
                                                backgroundColor: colors.PRIMARY,
                                            },
                                            !isPrimary && !isCancel && {
                                                backgroundColor: colors.isDark ? colors.SURFACE : colors.BACKGROUND,
                                                borderWidth: 1,
                                                borderColor: colors.BORDER,
                                            },
                                            isCancel && {
                                                backgroundColor: 'transparent',
                                            }
                                        ]}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.buttonText,
                                                {
                                                    color: isPrimary
                                                        ? colors.WHITE
                                                        : isCancel
                                                            ? colors.TEXT_SECONDARY
                                                            : colors.PRIMARY,
                                                    fontWeight: isPrimary ? '700' : isCancel ? '500' : '600'
                                                }
                                            ]}
                                        >
                                            {button.text}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
};

// Export function to show alert
export const showThemedAlert = (config) => {
    if (setAlertState) {
        setAlertState(config);
    } else {
        alertQueue.push(config);
    }
};

// Convenience functions
export const showSuccess = (title, message, onPress) => {
    showThemedAlert({
        title: title || 'Success!',
        message,
        type: 'success',
        buttons: [{ text: 'OK', onPress }]
    });
};

export const showError = (title, message, onPress) => {
    showThemedAlert({
        title: title || 'Error',
        message,
        type: 'error',
        buttons: [{ text: 'OK', onPress }]
    });
};

export const showWarning = (title, message, onPress) => {
    showThemedAlert({
        title: title || 'Warning',
        message,
        type: 'warning',
        buttons: [{ text: 'OK', onPress }]
    });
};

export const showInfo = (title, message, onPress) => {
    showThemedAlert({
        title: title || 'Info',
        message,
        type: 'info',
        buttons: [{ text: 'OK', onPress }]
    });
};

export const showConfirm = (title, message, onConfirm, onCancel) => {
    showThemedAlert({
        title: title || 'Confirm',
        message,
        type: 'info',
        buttons: [
            { text: 'Cancel', style: 'cancel', onPress: onCancel },
            { text: 'Confirm', onPress: onConfirm }
        ]
    });
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 400,
    },
    alertContent: {
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 20,
        elevation: 8,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    messageContainer: {
        maxHeight: 200,
        width: '100%',
        marginBottom: 24,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        fontFamily: undefined, // Use system default to match app
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        flexWrap: 'wrap',
    },
    button: {
        flex: 1,
        minWidth: 80,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});

export default ThemedAlert;

