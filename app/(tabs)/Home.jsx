import { View, Text, Platform, FlatList, TouchableOpacity, Alert } from 'react-native'
import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { UserContext } from './../../context/UserContext'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../context/ThemeContext'
import HomeHeader from '../../components/dashboard/HomeHeader'
import TodayProgress from '../../components/dashboard/TodayProgress'
import { RefreshDataContext } from '../../context/RefreshDataContext'
import MacronutrientsDashboard from '../../components/dashboard/MacronutrientsDashboard'
import AdaptiveInsights from '../../components/dashboard/AdaptiveInsights'
import WaterIntakeTracker from '../../components/tracking/WaterIntakeTracker'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { Chat01Icon } from '@hugeicons/core-free-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { triggerHaptic } from '../../utils/haptics'
import { getConvexClient } from '../../utils/convexClient'
import { scheduleHealthCoachWarmup } from '../../utils/healthCoachWarmup'

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

function Home() {
    const { user } = useContext(UserContext)
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { refreshData, setRefreshData } = useContext(RefreshDataContext)
    const insets = useSafeAreaInsets()
    const { colors } = useTheme()

    useEffect(() => {
        if (!user?.weight) {
            router.replace('/preferance')
        }
        if (!user?._id) {
            router.replace('/')
        }
    }, [user])

    // Warm Health Coach AI path while user is on Home so first reply feels faster on APK/cold starts.
    useEffect(() => {
        if (!user?._id) return
        scheduleHealthCoachWarmup(getConvexClient())
    }, [user?._id])

    // Calculate tab bar height for proper spacing
    // Tab bar is typically 60px + safe area bottom (iOS) or 60px (Android)
    const tabBarHeight = Platform.OS === 'ios' 
        ? 60 + Math.max(insets.bottom - 10, 0) 
        : 60;
    // Add extra padding to ensure buttons don't overlap (tab bar + 120px clearance for large buttons)
    const bottomPadding = tabBarHeight + 120;

    // FAB animation
    const fabScale = useSharedValue(1)
    const fabAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: fabScale.value }],
    }))

    const handleFabPressIn = () => {
        fabScale.value = withSpring(0.9, { damping: 15, stiffness: 300 })
        triggerHaptic.light()
    }

    const handleFabPressOut = () => {
        fabScale.value = withSpring(1, { damping: 15, stiffness: 300 })
    }

    const handleFabPress = useCallback(() => {
        if (!user?._id) {
            Alert.alert('Error', 'Please login first')
            return
        }
        
        // Navigate to health coach page
        try {
            router.push('/health-coach')
        } catch (error) {
            Alert.alert('Error', 'Failed to open Health Coach. Please try again.')
        }
    }, [user?._id, router])

    const handleRefresh = useCallback(() => {
        setRefreshData(Date.now())
    }, [setRefreshData])

    // Fresh header each render so Convex subscriptions (e.g. TodayProgress) are not stuck behind a stale memoized tree.
    const listHeader = (
        <View style={{
            paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 10) : Math.max(insets.top + 10, 20),
            paddingHorizontal: 20,
            paddingBottom: 20
        }}>
            <HomeHeader />
            <TodayProgress />
            <MacronutrientsDashboard />
            <WaterIntakeTracker />
            <AdaptiveInsights />
        </View>
    )

    // Memoize content container style
    const contentContainerStyle = useMemo(() => ({
        paddingBottom: Platform.OS === 'ios' 
            ? bottomPadding + Math.max(insets.bottom, 20) + 20
            : bottomPadding + 20
    }), [bottomPadding, insets.bottom])

    // Calculate FAB position (above bottom nav bar) - very close to nav bar
    // Position it just above the tab bar with minimal spacing
    const fabBottom = Platform.OS === 'ios' 
        ? Math.max(insets.bottom, 10) + 15  // 15px above bottom (very close to nav bar)
        : 15  // 15px above bottom on Android

    return (
        <View style={{ flex: 1, backgroundColor: colors.BACKGROUND }}>
            <FlatList
                data={[]}
                renderItem={() => null}
                onRefresh={handleRefresh}
                refreshing={loading}
                ListHeaderComponent={listHeader}
                contentContainerStyle={contentContainerStyle}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                initialNumToRender={10}
                windowSize={10}
            />
            
            {/* Floating Action Button - Health Coach */}
            <AnimatedTouchable
                onPress={handleFabPress}
                onPressIn={handleFabPressIn}
                onPressOut={handleFabPressOut}
                style={[
                    {
                        position: 'absolute',
                        right: 20,
                        bottom: fabBottom,
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: colors.PRIMARY,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.4,
                        shadowRadius: 12,
                        elevation: 8,
                        zIndex: 1000
                    },
                    fabAnimatedStyle
                ]}
            >
                <LinearGradient
                    colors={[colors.PRIMARY, colors.SECONDARY]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    <HugeiconsIcon icon={Chat01Icon} size={28} color={colors.WHITE} />
                </LinearGradient>
            </AnimatedTouchable>
        </View>
    )
}

export default React.memo(Home)