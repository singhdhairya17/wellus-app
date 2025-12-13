import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, FlatList } from 'react-native'
import React, { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { Close01Icon, Sun01Icon, Moon01Icon } from '@hugeicons/core-free-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring,
    withTiming
} from 'react-native-reanimated'
import { triggerHaptic } from '../../utils/haptics'

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ThemeSelector() {
    const themeContext = useTheme()
    const { 
        colors = {}, 
        isDark = false, 
        theme = 'light', 
        toggleTheme, 
        colorScheme = 'blue', 
        setColorScheme, 
        colorSchemes = {} 
    } = themeContext || {}
    const [showModal, setShowModal] = useState(false)
    const buttonScale = useSharedValue(1)

    const buttonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
    }))

    const handlePressIn = () => {
        buttonScale.value = withSpring(0.9, { damping: 15, stiffness: 300 })
        triggerHaptic.light()
    }

    const handlePressOut = () => {
        buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 })
    }

    const handleOpen = () => {
        triggerHaptic.medium()
        setShowModal(true)
    }

    const handleQuickToggle = () => {
        if (!toggleTheme) return
        triggerHaptic.medium()
        // Quick toggle: switch between light and dark
        // If system mode, toggle based on current appearance
        // Otherwise, toggle between light and dark
        if (theme === 'system') {
            // If in system mode, switch to explicit light/dark based on current state
            toggleTheme(isDark ? 'light' : 'dark')
        } else {
            // Toggle between light and dark
            toggleTheme(theme === 'dark' ? 'light' : 'dark')
        }
    }

    const themeModes = [
        { key: 'light', label: 'Light Mode', icon: Sun01Icon },
        { key: 'dark', label: 'Dark Mode', icon: Moon01Icon },
        { key: 'system', label: 'System Default', icon: null }
    ]

    // Safety check - don't render if theme context is unavailable
    if (!themeContext || !colors || !toggleTheme) {
        return null
    }

    return (
        <>
            <AnimatedTouchable
                onPress={handleQuickToggle}
                onLongPress={handleOpen}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                    {
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: colors.CARD,
                        borderWidth: 1,
                        borderColor: colors.BORDER,
                        justifyContent: 'center',
                        alignItems: 'center',
                        elevation: 3,
                        shadowColor: colors.PRIMARY,
                        shadowOpacity: colors.isDark ? 0.4 : 0.2,
                        shadowOffset: { width: 0, height: 3 },
                        shadowRadius: 6
                    },
                    buttonAnimatedStyle
                ]}
            >
                <HugeiconsIcon 
                    icon={isDark ? (Sun01Icon || Moon01Icon) : (Moon01Icon || Sun01Icon)} 
                    size={24} 
                    color={colors?.PRIMARY || '#000'} 
                />
            </AnimatedTouchable>

            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <LinearGradient
                        colors={colors.isDark 
                            ? [colors.CARD, colors.SURFACE] 
                            : ['#FFFFFF', '#F8F9FA']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.modalContent, {
                            borderWidth: colors.isDark ? 1 : 0,
                            borderColor: colors.BORDER
                        }]}
                    >
                        <View style={[styles.modalHeader, { borderBottomColor: colors.BORDER }]}>
                            <Text style={[styles.modalTitle, { color: colors.TEXT }]}>Theme Settings</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Text style={[styles.closeButton, { color: colors.TEXT_SECONDARY }]}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            style={styles.modalBody}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            {/* Theme Mode Selection */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>Appearance</Text>
                                <View style={styles.optionsContainer}>
                                    {themeModes && Array.isArray(themeModes) && themeModes.map((mode) => (
                                        <TouchableOpacity
                                            key={mode.key}
                                            onPress={() => {
                                                triggerHaptic.selection()
                                                toggleTheme(mode.key)
                                                setShowModal(false)
                                            }}
                                            style={[
                                                styles.optionCard,
                                                {
                                                    backgroundColor: theme === mode.key 
                                                        ? colors.PRIMARY + '20' 
                                                        : colors.CARD,
                                                    borderColor: theme === mode.key 
                                                        ? colors.PRIMARY 
                                                        : colors.BORDER,
                                                    borderWidth: theme === mode.key ? 2 : 1,
                                                    elevation: theme === mode.key ? 3 : 1,
                                                    shadowColor: theme === mode.key ? colors.PRIMARY : '#000',
                                                    shadowOpacity: theme === mode.key ? 0.3 : 0.1,
                                                    shadowOffset: { width: 0, height: 2 },
                                                    shadowRadius: 4
                                                }
                                            ]}
                                        >
                                            {mode.icon && (
                                                <HugeiconsIcon 
                                                    icon={mode.icon} 
                                                    size={24} 
                                                    color={theme === mode.key ? (colors.PRIMARY || '#000') : (colors.TEXT_SECONDARY || '#666')} 
                                                />
                                            )}
                                            <Text style={[
                                                styles.optionText,
                                                { 
                                                    color: theme === mode.key ? colors.PRIMARY : colors.TEXT,
                                                    fontWeight: theme === mode.key ? '700' : '500'
                                                }
                                            ]}>
                                                {mode.label}
                                            </Text>
                                            {theme === mode.key && (
                                                <View style={[styles.checkmark, { backgroundColor: colors.PRIMARY }]}>
                                                    <Text style={styles.checkmarkText}>✓</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Color Scheme Selection */}
                            {colorSchemes && typeof colorSchemes === 'object' && Object.keys(colorSchemes).length > 0 && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>Color Scheme</Text>
                                <Text style={[{
                                    fontSize: 13,
                                    color: colors.TEXT_SECONDARY,
                                    marginBottom: 16
                                }]}>
                                    Choose your preferred accent color (works in both light and dark modes)
                                </Text>
                                <View style={styles.colorGrid}>
                                    {colorSchemes && typeof colorSchemes === 'object' && !Array.isArray(colorSchemes) && Object.entries(colorSchemes || {}).map(([key, scheme]) => {
                                        const isSelected = colorScheme === key
                                        const schemeColors = scheme && (isDark ? scheme.dark : scheme.light)
                                        if (!schemeColors) return null
                                        return (
                                            <TouchableOpacity
                                                key={key}
                                                onPress={() => {
                                                    if (!setColorScheme) return
                                                    triggerHaptic.selection()
                                                    setColorScheme(key)
                                                }}
                                                style={[
                                                    styles.colorOption,
                                                    {
                                                        borderColor: isSelected ? colors.PRIMARY : colors.BORDER,
                                                        borderWidth: isSelected ? 3 : 1,
                                                        backgroundColor: colors.CARD,
                                                        elevation: isSelected ? 4 : 1,
                                                        shadowColor: isSelected ? colors.PRIMARY : '#000',
                                                        shadowOpacity: isSelected ? 0.3 : 0.1,
                                                        shadowOffset: { width: 0, height: 2 },
                                                        shadowRadius: 4
                                                    }
                                                ]}
                                            >
                                                <LinearGradient
                                                    colors={[schemeColors.PRIMARY, schemeColors.SECONDARY]}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                    style={styles.colorPreview}
                                                >
                                                    {isSelected && (
                                                        <View style={[styles.selectedIndicator, {
                                                            backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)'
                                                        }]}>
                                                            <Text style={[styles.selectedText, {
                                                                color: schemeColors.PRIMARY
                                                            }]}>✓</Text>
                                                        </View>
                                                    )}
                                                </LinearGradient>
                                                <Text style={[
                                                    styles.colorLabel,
                                                    { 
                                                        color: isSelected ? colors.PRIMARY : colors.TEXT,
                                                        fontWeight: isSelected ? '700' : '500'
                                                    }
                                                ]}>
                                                    {scheme.name}
                                                </Text>
                                            </TouchableOpacity>
                                        )
                                    })}
                                </View>
                            </View>
                            )}
                        </ScrollView>
                    </LinearGradient>
                </View>
            </Modal>
        </>
    )
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    closeButton: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    modalBody: {
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    optionsContainer: {
        gap: 12,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorOption: {
        width: '30%',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
    },
    colorPreview: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedIndicator: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    colorLabel: {
        fontSize: 13,
        textAlign: 'center',
    },
})

