import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useContext, useEffect, useState, useCallback } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { UserContext } from '../../context/UserContext'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { RefreshDataContext } from '../../context/RefreshDataContext'
import { LinearGradient } from 'expo-linear-gradient'
import { HugeiconsIcon } from '@hugeicons/react-native'
import Animated, { FadeInDown, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated'
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg'
import moment from 'moment'
import { triggerHaptic } from '../../utils/haptics'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export default function WaterIntakeTracker() {
    const { colors } = useTheme()
    const { user } = useContext(UserContext)
    const { refreshData } = useContext(RefreshDataContext)
    const [todayIntake, setTodayIntake] = useState(0)
    
    const waterIntake = useQuery(
        api.Tracking.GetWaterIntake,
        user?._id ? { uid: user._id, date: moment().format('DD/MM/YYYY') } : 'skip'
    )
    
    const addWaterIntake = useMutation(api.Tracking.AddWaterIntake)
    
    // Default goal: 2.5L (2500ml) - can be personalized based on weight/activity
    const dailyGoal = 2500 // ml
    
    useEffect(() => {
        if (waterIntake !== undefined && waterIntake !== null) {
            setTodayIntake(waterIntake.total || 0)
        }
    }, [waterIntake, refreshData])
    
    const percentage = Math.min((todayIntake / dailyGoal) * 100, 100)
    
    const handleAddWater = useCallback(async (amount) => {
        if (!user?._id) return
        
        triggerHaptic.light()
        try {
            await addWaterIntake({
                uid: user._id,
                date: moment().format('DD/MM/YYYY'),
                amount: amount
            })
            setTodayIntake(prev => (prev || 0) + amount)
            if (todayIntake + amount >= dailyGoal) {
                triggerHaptic.success()
            }
        } catch (error) {
            console.error('Error adding water intake:', error)
            triggerHaptic.error()
        }
    }, [user, addWaterIntake, todayIntake, dailyGoal])
    
    // Circular progress animation
    const progress = useSharedValue(0)
    
    useEffect(() => {
        progress.value = withTiming(percentage, { duration: 1000 })
    }, [percentage])
    
    const circumference = 2 * Math.PI * 60
    
    const animatedProps = useAnimatedProps(() => {
        const strokeDashoffset = circumference - (progress.value / 100) * circumference
        return {
            strokeDashoffset
        }
    })
    
    return (
        <Animated.View entering={FadeInDown.delay(200)} style={styles.container}>
            <LinearGradient
                colors={colors.isDark 
                    ? [colors.CARD, colors.SURFACE, colors.CARD] 
                    : ['#FFFFFF', '#FAFBFC', '#FFFFFF']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, {
                    borderWidth: colors.isDark ? 1.5 : 1,
                    borderColor: colors.isDark ? colors.BORDER + '80' : colors.BORDER + '60',
                    shadowColor: colors.BLUE,
                    shadowOpacity: colors.isDark ? 0.4 : 0.15,
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 20,
                    elevation: 8
                }]}
            >
                <View style={styles.header}>
                    <LinearGradient
                        colors={[colors.BLUE + '30', colors.BLUE + '20', colors.BLUE + '15']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.iconContainer, {
                            shadowColor: colors.BLUE,
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.4,
                            shadowRadius: 12,
                            elevation: 6,
                            borderWidth: 1,
                            borderColor: colors.BLUE + '20'
                        }]}
                    >
                        <Text style={{ fontSize: 32 }}>💧</Text>
                    </LinearGradient>
                    <View style={styles.headerText}>
                        <Text style={[styles.title, { color: colors.TEXT, letterSpacing: -0.3 }]}>Water Intake</Text>
                        <View style={styles.headerStats}>
                            <Text style={[styles.subtitle, { 
                                color: todayIntake > dailyGoal ? colors.GREEN : colors.TEXT, 
                                fontWeight: '700', 
                                fontSize: 16 
                            }]}>
                                {todayIntake.toLocaleString()}ml
                            </Text>
                            <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY, marginHorizontal: 8, fontSize: 16 }]}>
                                /
                            </Text>
                            <Text style={[styles.subtitle, { color: colors.BLUE, fontWeight: '800', fontSize: 16 }]}>
                                {dailyGoal.toLocaleString()}ml
                            </Text>
                            {todayIntake > dailyGoal && (
                                <Text style={[styles.overflowText, { color: colors.GREEN, marginLeft: 8 }]}>
                                    (+{((todayIntake - dailyGoal) / dailyGoal * 100).toFixed(0)}%)
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
                
                {/* Circular Progress */}
                <View style={styles.progressContainer}>
                    <Svg width="160" height="160" style={styles.svg}>
                        <Defs>
                            <SvgLinearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <Stop offset="0%" stopColor={colors.BLUE} stopOpacity="1" />
                                <Stop offset="50%" stopColor="#60A5FA" stopOpacity="1" />
                                <Stop offset="100%" stopColor="#93C5FD" stopOpacity="1" />
                            </SvgLinearGradient>
                            <SvgLinearGradient id="waterGradientGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                                <Stop offset="0%" stopColor={colors.BLUE + '40'} stopOpacity="0.6" />
                                <Stop offset="100%" stopColor={colors.BLUE + '20'} stopOpacity="0.3" />
                            </SvgLinearGradient>
                        </Defs>
                        {/* Outer glow circle */}
                        <Circle
                            cx="80"
                            cy="80"
                            r="62"
                            stroke="url(#waterGradientGlow)"
                            strokeWidth="2"
                            fill="transparent"
                            opacity="0.5"
                        />
                        {/* Background circle */}
                        <Circle
                            cx="80"
                            cy="80"
                            r="60"
                            stroke={colors.isDark ? colors.BORDER + '30' : colors.BORDER + '50'}
                            strokeWidth="12"
                            fill="transparent"
                        />
                        {/* Progress circle with gradient */}
                        <AnimatedCircle
                            cx="80"
                            cy="80"
                            r="60"
                            stroke="url(#waterGradient)"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 60}
                            strokeLinecap="round"
                            animatedProps={animatedProps}
                            transform="rotate(-90 80 80)"
                        />
                    </Svg>
                    <View style={styles.progressText}>
                        <Text style={[styles.percentage, { color: colors.BLUE }]}>
                            {Math.round(percentage)}%
                        </Text>
                        {percentage < 100 && (
                            <Text style={[styles.remaining, { color: colors.TEXT_SECONDARY, fontSize: 10, marginTop: 6 }]}>
                                {Math.max(0, dailyGoal - todayIntake).toLocaleString()}ml remaining
                            </Text>
                        )}
                    </View>
                </View>
                
                {/* Quick Add Buttons */}
                <View style={styles.buttonsContainer}>
                    {[250, 500, 750, 1000].map((amount) => (
                        <TouchableOpacity
                            key={amount}
                            onPress={() => handleAddWater(amount)}
                            activeOpacity={0.6}
                            style={styles.buttonWrapper}
                        >
                            <View
                                style={[styles.quickButton, {
                                    backgroundColor: colors.isDark 
                                        ? colors.SURFACE 
                                        : colors.BACKGROUND,
                                    borderColor: colors.BLUE + (colors.isDark ? '40' : '30'),
                                    borderWidth: 1.5,
                                    shadowColor: colors.BLUE,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: colors.isDark ? 0.15 : 0.08,
                                    shadowRadius: 4,
                                    elevation: 2
                                }]}
                            >
                                <Text style={[styles.quickButtonText, { color: colors.BLUE }]} numberOfLines={1}>
                                    +{amount}ml
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </LinearGradient>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        marginTop: 0
    },
    card: {
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    headerStats: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    headerText: {
        flex: 1
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 6,
        letterSpacing: -0.5
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500'
    },
    overflowText: {
        fontSize: 13,
        fontWeight: '700'
    },
    progressContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 24,
        position: 'relative',
        height: 160
    },
    svg: {
        position: 'absolute'
    },
    progressText: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        width: '100%',
        height: '100%',
        paddingHorizontal: 10
    },
    percentage: {
        fontSize: 36,
        fontWeight: '800',
        letterSpacing: -1.5
    },
    remaining: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 8
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        gap: 10
    },
    buttonWrapper: {
        flex: 1,
        maxWidth: '23%'
    },
    quickButton: {
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56
    },
    quickButtonText: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.2
    }
})

