import { View, Text, ActivityIndicator } from 'react-native'
import React from 'react'
import { Pressable } from 'react-native'
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated'
import Colors from '../../../constants/colors'
import { triggerHaptic } from '../../../utils/haptics'
import { useTheme } from '../../../context/ThemeContext'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Button({ title, onPress, icon, loading = false, type = 'primary' }) {
    const { colors } = useTheme()
    const scale = useSharedValue(1)
    const opacity = useSharedValue(1)

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }))

    const handlePressIn = () => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 300 })
        opacity.value = withTiming(0.8, { duration: 100 })
        triggerHaptic.light()
    }

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 })
        opacity.value = withTiming(1, { duration: 100 })
    }

    const handlePress = () => {
        if (!loading && onPress) {
            triggerHaptic.medium()
            onPress()
        }
    }

    const backgroundColor = type === 'primary' 
        ? (colors?.PRIMARY || Colors.PRIMARY)
        : type === 'secondary'
        ? 'transparent'
        : colors?.PRIMARY || Colors.PRIMARY

    const textColor = type === 'primary' 
        ? Colors.WHITE
        : colors?.PRIMARY || Colors.PRIMARY

    const borderColor = type === 'secondary' 
        ? (colors?.PRIMARY || Colors.PRIMARY)
        : 'transparent'

    return (
        <AnimatedPressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={loading}
            style={[
                {
                    padding: 16,
                    backgroundColor,
                    width: '100%',
                    borderRadius: 14,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: type === 'secondary' ? 2 : 0,
                    borderColor,
                    elevation: 3,
                    shadowColor: backgroundColor,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                },
                animatedStyle
            ]}
        >
            {loading ? (
                <ActivityIndicator color={textColor} />
            ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {icon && <View>{icon}</View>}
                    <Text style={{
                        fontSize: 17,
                        color: textColor,
                        textAlign: 'center',
                        fontWeight: '700',
                        letterSpacing: 0.3
                    }}>
                        {title}
                    </Text>
                </View>
            )}
        </AnimatedPressable>
    )
}