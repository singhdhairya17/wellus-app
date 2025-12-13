import { View, Text, StyleSheet, Platform } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HugeiconsIcon } from '@hugeicons/react-native';
import { AnalyticsUpIcon, Home03Icon, SpoonAndForkFreeIcons, SpoonAndForkIcon, UserSquareIcon, Camera01Icon } from '@hugeicons/core-free-icons';
import { useTheme } from '../../context/ThemeContext'

// Custom Scan Icon with Halo Effect
const ScanIconWithHalo = React.memo(({ color, size, focused }) => {
    if (focused) {
        return (
            <View style={styles.haloContainer}>
                {/* Outer glow */}
                <View style={[styles.haloOuter, { backgroundColor: color + '40' }]} />
                {/* Middle glow */}
                <View style={[styles.halo, { backgroundColor: color + '60' }]} />
                {/* Inner glow */}
                <View style={[styles.haloInner, { backgroundColor: color + '80' }]} />
                {/* Icon */}
                <HugeiconsIcon
                    icon={Camera01Icon}
                    size={size + 6}
                    color={color}
                    strokeWidth={2.5}
                />
            </View>
        );
    }
    return (
        <HugeiconsIcon
            icon={Camera01Icon}
            size={size || 24}
            color={color || '#000'}
            strokeWidth={1.5}
        />
    );
});

export default function TabLayout() {
    const insets = useSafeAreaInsets()
    const themeContext = useTheme()
    const { 
        colors = {
            PRIMARY: '#007AFF',
            TEXT_SECONDARY: '#8E8E93',
            BORDER: '#E5E5EA',
            CARD: '#FFFFFF',
            isDark: false
        }
    } = themeContext || {}
    
    // Calculate actual tab bar height for consistent padding
    // Tab bar is typically 60px + safe area bottom (iOS) or 60px + safe area (Android)
    const tabBarHeight = Platform.OS === 'ios' 
        ? 60 + Math.max(insets.bottom, 20) 
        : 60 + Math.max(insets.bottom, 10);
    
    // Total bottom spacing needed: tab bar height + extra padding for buttons
    const bottomPadding = tabBarHeight + 40; // 40px extra for button clearance
    
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: colors.PRIMARY,
            tabBarInactiveTintColor: colors.TEXT_SECONDARY,
            headerShown: false,
            lazy: true,
            detachInactiveScreens: true,
            tabBarStyle: {
                height: tabBarHeight,
                paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : Math.max(insets.bottom, 10),
                paddingTop: 5,
                borderTopWidth: 1,
                borderTopColor: colors.BORDER,
                elevation: 8,
                shadowColor: '#000',
                shadowOpacity: colors.isDark ? 0.3 : 0.1,
                shadowOffset: { width: 0, height: -2 },
                shadowRadius: 4,
                backgroundColor: colors.CARD,
                position: 'relative', // Prevent absolute positioning that causes overlap
            },
            tabBarHideOnKeyboard: true,
        }}>
            <Tabs.Screen name='Home' options={{
                tabBarIcon: ({ color, size }) => <HugeiconsIcon
                    icon={Home03Icon}
                    size={size}
                    color={color}
                    strokeWidth={1.5}
                />
            }} />
            <Tabs.Screen name='Meals'
                options={{
                    tabBarIcon: ({ color, size }) => <HugeiconsIcon
                        icon={SpoonAndForkFreeIcons}
                        size={size}
                        color={color}
                        strokeWidth={1.5}
                    />
                }} />
            <Tabs.Screen 
                name='Scan' 
                options={{
                    tabBarLabel: 'Scan',
                    tabBarIcon: ({ color, size, focused }) => (
                        <ScanIconWithHalo 
                            color={color || '#000'} 
                            size={size || 24} 
                            focused={focused || false} 
                        />
                    ),
                }} 
            />
            <Tabs.Screen name='Progress'
                options={{
                    tabBarIcon: ({ color, size }) => <HugeiconsIcon
                        icon={AnalyticsUpIcon}
                        size={size}
                        color={color}
                        strokeWidth={1.5}
                    />
                }} />
            <Tabs.Screen name='Profile'
                options={{
                    tabBarIcon: ({ color, size }) => <HugeiconsIcon
                        icon={UserSquareIcon}
                        size={size}
                        color={color}
                        strokeWidth={1.5}
                    />
                }} />
        </Tabs>
    )
}

const styles = StyleSheet.create({
    haloContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        height: 70,
    },
    haloOuter: {
        position: 'absolute',
        width: 65,
        height: 65,
        borderRadius: 32.5,
        opacity: 0.3,
    },
    halo: {
        position: 'absolute',
        width: 55,
        height: 55,
        borderRadius: 27.5,
        opacity: 0.5,
    },
    haloInner: {
        position: 'absolute',
        width: 45,
        height: 45,
        borderRadius: 22.5,
        opacity: 0.6,
    },
})