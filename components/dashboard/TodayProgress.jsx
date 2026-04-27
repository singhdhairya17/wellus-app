import { View, Text } from 'react-native'
import React, { useContext, useEffect, useMemo } from 'react'
import moment from 'moment'
import { useTheme } from '../../context/ThemeContext'
import { UserContext } from '../../context/UserContext'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    Easing
} from 'react-native-reanimated'
import { triggerHaptic } from '../../utils/haptics'

export default function TodayProgress() {
    const { user } = useContext(UserContext)
    const { colors } = useTheme()

    const progressWidth = useSharedValue(0)
    const calorieCount = useSharedValue(0)

    const userId = useMemo(() => user?._id, [user?._id])
    const todayDate = moment().format('DD/MM/YYYY')

    const totalCaloriesRaw = useQuery(
        api.MealPlan.GetTotalCaloriesConsumed,
        userId ? { date: todayDate, uid: userId } : 'skip'
    )
    const totalCaloriesConsumed = totalCaloriesRaw ?? 0
    const caloriesGoal = Number(user?.calories) || 2000

    const percentage = useMemo(() => 
        Math.min((totalCaloriesConsumed / caloriesGoal) * 100, 100),
        [totalCaloriesConsumed, caloriesGoal]
    )
    
    const progressColor = useMemo(() => 
        percentage >= 100 ? colors.RED : percentage >= 80 ? colors.YELLOW : colors.GREEN,
        [percentage, colors]
    )

    useEffect(() => {
        progressWidth.value = withTiming(percentage, {
            duration: 1200,
            easing: Easing.out(Easing.cubic),
        })
        
        calorieCount.value = withTiming(totalCaloriesConsumed, {
            duration: 1000,
            easing: Easing.out(Easing.ease),
        })

        if (percentage >= 100) {
            triggerHaptic.success()
        } else if (percentage >= 80) {
            triggerHaptic.warning()
        }
    }, [totalCaloriesConsumed, percentage, progressWidth, calorieCount])

    const progressAnimatedStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }), [])

    const getMotivationalMessage = () => {
        if (percentage >= 100) return { text: "Goal achieved! 🎉", color: colors.GREEN }
        if (percentage >= 80) return { text: "Almost there! 💪", color: colors.YELLOW }
        if (percentage >= 50) return { text: "You're doing great! 🎯", color: colors.PRIMARY }
        return { text: "Keep going!", color: colors.PRIMARY }
    }

    const motivation = getMotivationalMessage()

    const gradientColors = useMemo(() => 
        colors.isDark 
            ? [colors.CARD, colors.SURFACE, colors.CARD] 
            : ['#FFFFFF', '#F8F9FA', '#FFFFFF'],
        [colors.isDark, colors.CARD, colors.SURFACE]
    )

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
                }}>of {caloriesGoal} kcal</Text>
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
