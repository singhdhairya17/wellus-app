import React, { useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Camera01Icon, ImageAddIcon, Close01Icon } from '@hugeicons/core-free-icons';

const ProfilePicturePicker = ({ visible, onClose, onCameraPress, onGalleryPress }) => {
    const themeContext = useTheme();
    const colors = useMemo(() => {
        const themeColors = themeContext?.colors || {};
        return {
            BACKGROUND: themeColors.BACKGROUND || '#FFFFFF',
            CARD: themeColors.CARD || '#FFFFFF',
            SURFACE: themeColors.SURFACE || '#F8F9FA',
            TEXT: themeColors.TEXT || '#000000',
            TEXT_SECONDARY: themeColors.TEXT_SECONDARY || '#666666',
            BORDER: themeColors.BORDER || '#E5E5EA',
            PRIMARY: themeColors.PRIMARY || '#3B82F6',
            WHITE: themeColors.WHITE || '#FFFFFF',
            isDark: themeColors.isDark || false
        };
    }, [themeContext?.colors]);

    const gradientColors = useMemo(() => 
        colors.isDark ? [colors.CARD, colors.SURFACE] : ['#FFFFFF', '#F8F9FA'],
        [colors.isDark, colors.CARD, colors.SURFACE]
    );

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.modalContent, {
                            borderWidth: colors.isDark ? 1 : 0,
                            borderColor: colors.BORDER,
                            shadowColor: colors.PRIMARY,
                            shadowOpacity: colors.isDark ? 0.3 : 0.1,
                        }]}
                    >
                        {/* Header */}
                        <View style={[styles.header, { borderBottomColor: colors.BORDER }]}>
                            <Text style={[styles.title, { color: colors.TEXT }]}>
                                Change Profile Picture
                            </Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                {Close01Icon ? (
                                    <HugeiconsIcon
                                        icon={Close01Icon}
                                        size={24}
                                        color={colors.TEXT_SECONDARY}
                                    />
                                ) : (
                                    <Text style={{ color: colors.TEXT_SECONDARY, fontSize: 24 }}>✕</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Message */}
                        <Text style={[styles.message, { color: colors.TEXT_SECONDARY }]}>
                            Choose an option
                        </Text>

                        {/* Options */}
                        <View style={styles.optionsContainer}>
                            <TouchableOpacity
                                onPress={() => {
                                    onClose();
                                    onCameraPress();
                                }}
                                style={[styles.optionButton, {
                                    backgroundColor: colors.isDark ? colors.SURFACE : colors.BACKGROUND,
                                    borderColor: colors.BORDER,
                                }]}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconContainer, {
                                    backgroundColor: colors.PRIMARY + '20'
                                }]}>
                                    {Camera01Icon && (
                                        <HugeiconsIcon
                                            icon={Camera01Icon}
                                            size={28}
                                            color={colors.PRIMARY}
                                            strokeWidth={2}
                                        />
                                    )}
                                </View>
                                <Text style={[styles.optionText, { color: colors.TEXT }]}>
                                    Camera
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    onClose();
                                    onGalleryPress();
                                }}
                                style={[styles.optionButton, {
                                    backgroundColor: colors.isDark ? colors.SURFACE : colors.BACKGROUND,
                                    borderColor: colors.BORDER,
                                }]}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconContainer, {
                                    backgroundColor: colors.PRIMARY + '20'
                                }]}>
                                    {ImageAddIcon && (
                                        <HugeiconsIcon
                                            icon={ImageAddIcon}
                                            size={28}
                                            color={colors.PRIMARY}
                                            strokeWidth={2}
                                        />
                                    )}
                                </View>
                                <Text style={[styles.optionText, { color: colors.TEXT }]}>
                                    Gallery
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Cancel Button */}
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.cancelButton}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.cancelText, { color: colors.TEXT_SECONDARY }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
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
    modalContent: {
        borderRadius: 24,
        padding: 24,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 20,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    optionsContainer: {
        gap: 12,
        marginBottom: 16,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    cancelButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default React.memo(ProfilePicturePicker);

