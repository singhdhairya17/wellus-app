import { View, Text } from 'react-native'
import React, { useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react'
import moment from 'moment'
import { useTheme } from '../../context/ThemeContext'
import { UserContext } from '../../context/UserContext'
import { useConvex } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { RefreshDataContext } from '../../context/RefreshDataContext'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withSpring,
    withSequence,
    withDelay,
    Easing
} from 'react-native-reanimated'
import { triggerHaptic } from '../../utils/haptics'
import { logger } from '../../utils/logger'

export default function TodayProgress() {
    const { user } = useContext(UserContext)
    const { colors } = useTheme()
    const convex = useConvex();
    const [totalCaloriesConsumed, setTotalCaloriesConsumed] = useState(0);
    const { refreshData } = useContext(RefreshDataContext)
    
    // Use refs to prevent multiple simultaneous requests
    const isLoadingRef = useRef(false);
    const lastRefreshRef = useRef(null);
    const lastUserIdRef = useRef(null);
    const lastFetchTimeRef = useRef(0);
    const lastCaloriesRef = useRef(null); // Track last set calories to prevent duplicate updates
    const currentRequestIdRef = useRef(null); // Track current request ID
    const hasInitializedRef = useRef(false); // Track if component has initialized
    const timeoutIdRef = useRef(null); // Track scheduled timeout to prevent duplicates
    
    // Animated values - initialize once
    const progressWidth = useSharedValue(0);
    const calorieCount = useSharedValue(0);

    // Memoize user ID to prevent unnecessary re-renders
    const userId = useMemo(() => user?._id, [user?._id]);

    const GetTotalCaloriesConsumed = useCallback(async () => {
        if (!userId) return;
        
        const now = Date.now();
        const timeSinceLastFetch = now - lastFetchTimeRef.current;
        
        // Create a stable request key based on userId and refreshData (not timestamp)
        const requestKey = `${userId}-${refreshData || 'null'}`;
        
        // Prevent multiple simultaneous requests
        if (isLoadingRef.current) {
            logger.debug('[TodayProgress] Request already in progress, skipping...');
            return;
        }
        
        // If this exact request (same userId + refreshData) is already in progress, skip
        if (currentRequestIdRef.current === requestKey) {
            logger.debug('[TodayProgress] Duplicate request detected, skipping...');
            return;
        }
        
        // If userId hasn't changed and refreshData hasn't changed, skip
        if (lastUserIdRef.current === userId && lastRefreshRef.current === refreshData) {
            // Only skip if we fetched recently (within 3 seconds) to prevent rapid re-renders
            if (timeSinceLastFetch < 3000) {
                logger.debug('[TodayProgress] Already fetched for this userId and refreshData, skipping...');
                return;
            }
        }
        
        // Set loading flag IMMEDIATELY to prevent duplicate calls
        isLoadingRef.current = true;
        currentRequestIdRef.current = requestKey;
        lastRefreshRef.current = refreshData;
        lastUserIdRef.current = userId;
        lastFetchTimeRef.current = now;
        
        try {
            logger.debug('[TodayProgress] Fetching calories...', requestKey, now);
            const result = await convex.query(api.MealPlan.GetTotalCaloriesConsumed, {
                date: moment().format('DD/MM/YYYY'),
                uid: userId
            })
            
            const newCalories = result || 0;
            
            // Only update state if data actually changed to prevent duplicate re-renders
            if (lastCaloriesRef.current !== newCalories) {
                lastCaloriesRef.current = newCalories;
                setTotalCaloriesConsumed(newCalories);
                logger.debug('[TodayProgress] Calories fetched and updated successfully', requestKey);
            } else {
                logger.debug('[TodayProgress] Calories unchanged, skipping state update', requestKey);
            }
        } catch (error) {
            logger.error('[TodayProgress] Error fetching calories:', error);
        } finally {
            // Reset immediately for better performance (no delay needed)
            isLoadingRef.current = false;
            currentRequestIdRef.current = null;
        }
    }, [userId, convex, refreshData]);

    useEffect(() => {
        if (!userId) return;
        
        // Skip if timeout is already scheduled (prevents duplicate scheduling from React StrictMode)
        if (timeoutIdRef.current) {
            if (__DEV__) {
                console.log('[TodayProgress] Timeout already scheduled, skipping duplicate...');
            }
            return;
        }
        
        // Skip if we've already initialized and nothing has changed
        if (hasInitializedRef.current && 
            lastUserIdRef.current === userId && 
            lastRefreshRef.current === refreshData) {
            return;
        }
        
        // Skip if already loading (prevents duplicate scheduling)
        if (isLoadingRef.current) {
            logger.debug('[TodayProgress] Already loading, skipping timeout schedule...');
            return;
        }
        
        // Create request key immediately and set it to prevent duplicate scheduling
        const requestKey = `${userId}-${refreshData || 'null'}`;
        
        // If this exact request is already scheduled, skip
        if (currentRequestIdRef.current === requestKey) {
            logger.debug('[TodayProgress] Request already scheduled, skipping duplicate...');
            return;
        }
        
        // Set request ID immediately to prevent duplicate scheduling
        currentRequestIdRef.current = requestKey;
        
        // Use a longer timeout to debounce rapid calls and prevent React StrictMode double calls
        timeoutIdRef.current = setTimeout(() => {
            // Double-check before calling (in case component unmounted or dependencies changed)
            // Also check if this request is still the current one (prevents stale callbacks)
            if (userId && !isLoadingRef.current && currentRequestIdRef.current === requestKey) {
                hasInitializedRef.current = true;
                GetTotalCaloriesConsumed();
            } else {
                logger.debug('[TodayProgress] Timeout callback skipped - request no longer current');
            }
            timeoutIdRef.current = null;
        }, 250); // Increased debounce time to handle React StrictMode
        
        return () => {
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
                timeoutIdRef.current = null;
            }
            // Don't clear currentRequestIdRef here - let it be cleared in the finally block
        };
    }, [userId, refreshData, GetTotalCaloriesConsumed])
    
    // Reset lastCaloriesRef and initialization flag when userId changes to allow fresh data
    useEffect(() => {
        if (userId && lastUserIdRef.current !== userId) {
            lastCaloriesRef.current = null;
            hasInitializedRef.current = false;
        }
    }, [userId])

    const percentage = useMemo(() => 
        Math.min((totalCaloriesConsumed / (user?.calories || 1)) * 100, 100),
        [totalCaloriesConsumed, user?.calories]
    );
    
    const progressColor = useMemo(() => 
        percentage >= 100 ? colors.RED : percentage >= 80 ? colors.YELLOW : colors.GREEN,
        [percentage, colors]
    );

    // Animate progress bar - only when values change
    useEffect(() => {
        progressWidth.value = withTiming(percentage, {
            duration: 1200,
            easing: Easing.out(Easing.cubic),
        });
        
        // Animate calorie count
        calorieCount.value = withTiming(totalCaloriesConsumed, {
            duration: 1000,
            easing: Easing.out(Easing.ease),
        });

        // Haptic feedback on milestones
        if (percentage >= 100) {
            triggerHaptic.success();
        } else if (percentage >= 80) {
            triggerHaptic.warning();
        }
    }, [totalCaloriesConsumed, percentage, progressWidth, calorieCount]);

    const progressAnimatedStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }), []);

    const getMotivationalMessage = () => {
        if (percentage >= 100) return { text: "Goal achieved! 🎉", color: colors.GREEN };
        if (percentage >= 80) return { text: "Almost there! 💪", color: colors.YELLOW };
        if (percentage >= 50) return { text: "You're doing great! 🎯", color: colors.PRIMARY };
        return { text: "Keep going!", color: colors.PRIMARY };
    };

    const motivation = getMotivationalMessage();

    // Memoize gradient colors
    const gradientColors = useMemo(() => 
        colors.isDark 
            ? [colors.CARD, colors.SURFACE, colors.CARD] 
            : ['#FFFFFF', '#F8F9FA', '#FFFFFF'],
        [colors.isDark, colors.CARD, colors.SURFACE]
    );

    return (
        <View>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    marginTop: 0,
                    marginBottom: 20,
                    padding: 28,
                    borderRadius: 24,
                    elevation: 6,
                    shadowColor: colors.PRIMARY,
                    shadowOpacity: colors.isDark ? 0.4 : 0.15,
                    shadowOffset: { width: 0, height: 6 },
                    shadowRadius: 12,
                    borderWidth: colors.isDark ? 1 : 0,
                    borderColor: colors.BORDER,
                    overflow: 'hidden'
                }}>
            {/* Decorative gradient overlay */}
            <View style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: 75,
                backgroundColor: colors.PRIMARY + '08',
            }} />
            
            <View style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20
            }}>
                <View>
                    <Text style={{
                        fontSize: 24,
                        fontWeight: '800',
                        color: colors.TEXT,
                        letterSpacing: -0.5,
                        marginBottom: 4
                    }}>Today's Goal</Text>
                    <Text style={{
                        fontSize: 13,
                        color: colors.TEXT_SECONDARY,
                        fontWeight: '500'
                    }}>{moment().format('dddd, MMM DD')}</Text>
                </View>
                <View style={{
                    backgroundColor: colors.PRIMARY + '15',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12
                }}>
                    <Text style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: colors.PRIMARY,
                        letterSpacing: 0.5
                    }}>{percentage.toFixed(0)}%</Text>
                </View>
            </View>

            <View style={{
                alignItems: 'center',
                marginVertical: 20
            }}>
                <Text style={{
                    fontSize: 48,
                    fontWeight: '800',
                    color: colors.PRIMARY,
                    letterSpacing: -2,
                    marginBottom: 8
                }}>
                    {Math.round(totalCaloriesConsumed)}
                </Text>
                <View style={{
                    height: 2,
                    width: 60,
                    backgroundColor: colors.PRIMARY + '30',
                    borderRadius: 1,
                    marginBottom: 8
                }} />
                <Text style={{
                    fontSize: 20,
                    fontWeight: '600',
                    color: colors.TEXT_SECONDARY,
                    letterSpacing: 0.3
                }}>of {user?.calories} kcal</Text>
            </View>

            <View style={{
                backgroundColor: colors.isDark ? colors.BACKGROUND : '#E8E8E8',
                height: 18,
                borderRadius: 12,
                marginBottom: 16,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2
            }}>
                <Animated.View style={[progressAnimatedStyle, { height: '100%' }]}>
                    <LinearGradient
                        colors={[progressColor, progressColor + 'DD', progressColor]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                            width: '100%',
                            height: 18,
                            borderRadius: 12,
                            justifyContent: 'center',
                            alignItems: 'flex-end',
                            paddingRight: 10
                        }}
                    >
                        {percentage > 15 && (
                            <Text style={{
                                fontSize: 11,
                                fontWeight: '800',
                                color: colors.WHITE,
                                letterSpacing: 0.5
                            }}>{percentage.toFixed(0)}%</Text>
                        )}
                    </LinearGradient>
                </Animated.View>
            </View>

            <View style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.BORDER + '50'
            }}>
                <Text style={{ 
                    fontSize: 13, 
                    color: colors.TEXT_SECONDARY, 
                    fontWeight: '600',
                    letterSpacing: 0.2
                }}>Calories Consumed</Text>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6
                }}>
                    <Text style={{ 
                        fontSize: 14, 
                        fontWeight: '700', 
                        color: motivation.color,
                        letterSpacing: 0.3
                    }}>{motivation.text}</Text>
                </View>
            </View>
            </LinearGradient>
        </View>
    )
}