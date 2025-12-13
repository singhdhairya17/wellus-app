import { View, StyleSheet } from 'react-native'
import React, { useEffect } from 'react'
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated'
import { useTheme } from '../../context/ThemeContext'

export default function SkeletonLoader({ width, height, borderRadius = 8, style }) {
    const { colors } = useTheme()
    const opacity = useSharedValue(0.3)

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(1, {
                duration: 1000,
                easing: Easing.inOut(Easing.ease),
            }),
            -1,
            true
        )
    }, [])

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }))

    return (
        <Animated.View
            style={[
                {
                    width: width || '100%',
                    height: height || 20,
                    borderRadius,
                    backgroundColor: colors.isDark ? colors.SURFACE : '#E0E0E0',
                },
                animatedStyle,
                style,
            ]}
        />
    )
}

export function SkeletonCard() {
    const { colors } = useTheme()
    
    return (
        <View style={[styles.card, { backgroundColor: colors.CARD, borderColor: colors.BORDER }]}>
            <SkeletonLoader width={80} height={80} borderRadius={12} />
            <View style={styles.content}>
                <SkeletonLoader width="60%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                <SkeletonLoader width="40%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
                <SkeletonLoader width="30%" height={12} borderRadius={4} />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        gap: 12,
        borderWidth: 1,
    },
    content: {
        flex: 1,
    },
})

