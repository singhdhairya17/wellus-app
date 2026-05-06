import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import React, { useContext, useState, useMemo, useCallback } from 'react'
import moment from 'moment'
import { useTheme } from '../../context/ThemeContext'
import { UserContext } from '../../context/UserContext'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { GenerateMacroExplanation } from '../../services/ai/XAIService'
import { LinearGradient } from 'expo-linear-gradient'
import { useIsFocused } from '@react-navigation/native'
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    Easing
} from 'react-native-reanimated'
import { triggerHaptic } from '../../utils/haptics'

// Move MacroItem outside to prevent recreation on every render
function MacroItemComponent({ label, current, goal, unit, color, index = 0, colors, getProgressColor, getTrafficLightStatus }) {
    const [showExplanation, setShowExplanation] = useState(false);
    const percentage = useMemo(() => Math.min((current / (goal || 1)) * 100, 100), [current, goal]);
    const progressColor = useMemo(() => getProgressColor(current, goal, label), [current, goal, label, getProgressColor]);
    const trafficLight = useMemo(() => getTrafficLightStatus(current, goal, label), [current, goal, label, getTrafficLightStatus]);
    
    // Animated values - initialize once
    const progressWidth = useSharedValue(0);
    const cardOpacity = useSharedValue(1); // Start at 1 to avoid conflict
    
    // Get XAI explanation - memoize
    const explanation = useMemo(() => GenerateMacroExplanation(label, current, goal, unit), [label, current, goal, unit]);

    // Animate progress bar - only when values change
    React.useEffect(() => {
        progressWidth.value = withTiming(percentage, {
            duration: 420,
            easing: Easing.out(Easing.cubic),
        });
    }, [percentage, progressWidth]);

    const progressAnimatedStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }), []);

    const handleWhyPress = useCallback(() => {
        triggerHaptic.light();
        setShowExplanation(prev => !prev);
    }, []);

    return (
        <View>
            <LinearGradient
                colors={colors.isDark 
                    ? [colors.CARD, colors.SURFACE, colors.CARD] 
                    : ['#FFFFFF', '#FAFBFC', '#FFFFFF']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.macroItem, 
                    { 
                        borderWidth: colors.isDark ? 1.5 : 1,
                        borderColor: colors.isDark ? colors.BORDER + '80' : colors.BORDER + '60',
                        shadowColor: colors.PRIMARY,
                        shadowOpacity: colors.isDark ? 0.35 : 0.12,
                        shadowOffset: { width: 0, height: 6 },
                        shadowRadius: 16,
                        elevation: 6,
                    }
                ]}
            >
            <View style={styles.macroHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.trafficLightDot, { 
                        color: trafficLight === 'red' ? colors.RED : trafficLight === 'yellow' ? colors.YELLOW : colors.GREEN 
                    }]}>●</Text>
                    <Text style={[styles.macroLabel, { color: colors.isDark ? '#FFFFFF' : '#1A1A1A', fontWeight: '600' }]}>{label}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.macroValue, { color: colors.isDark ? '#FFFFFF' : '#1A1A1A', fontWeight: '700' }]}>
                        {current.toFixed(0)}{unit} / {goal.toFixed(0)}{unit}
                    </Text>
                    <TouchableOpacity 
                        onPress={handleWhyPress}
                        style={[styles.whyButton, { 
                            backgroundColor: colors.isDark ? colors.PRIMARY + '10' : colors.PRIMARY + '08',
                        }]}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.chevronIcon, { color: colors.PRIMARY }]}>
                            {showExplanation ? '▲' : '▼'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={[styles.progressBarContainer, { 
                backgroundColor: colors.isDark ? colors.BACKGROUND + 'CC' : colors.BORDER,
                borderWidth: 0,
                borderColor: 'transparent'
            }]}>
                <Animated.View style={[progressAnimatedStyle, { height: '100%' }]}>
                    <LinearGradient
                        colors={[progressColor, progressColor + 'DD']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBar, { width: '100%' }]}
                    />
                </Animated.View>
            </View>
            <Text style={[styles.macroPercentage, { color: colors.isDark ? '#B0B0B0' : '#666666', fontWeight: '600' }]}>{percentage.toFixed(0)}%</Text>
            
            {/* XAI Explanation Card */}
            {showExplanation && (
                <View
                >
                    <View
                        style={[
                            styles.explanationCard,
                        { 
                            backgroundColor: colors.isDark 
                                ? (explanation.status === 'danger' ? colors.RED + '20' : explanation.status === 'warning' ? colors.YELLOW + '20' : colors.GREEN + '20')
                                : (explanation.status === 'danger' ? colors.RED + '15' : explanation.status === 'warning' ? colors.YELLOW + '15' : colors.GREEN + '15'),
                            borderLeftColor: explanation.status === 'danger' ? colors.RED : explanation.status === 'warning' ? colors.YELLOW : colors.GREEN,
                            borderLeftWidth: 4,
                            borderWidth: 1,
                            borderColor: explanation.status === 'danger' ? colors.RED + '30' : explanation.status === 'warning' ? colors.YELLOW + '30' : colors.GREEN + '30'
                        }
                    ]}
                >
                    <Text style={[styles.explanationMessage, { color: colors.TEXT, fontWeight: '600' }]}>
                        {explanation.message}
                    </Text>
                    {explanation.healthImportance && (
                        <View style={{ marginTop: 6 }}>
                            <Text style={[styles.explanationHealthImportance, { color: colors.TEXT_SECONDARY, lineHeight: 18, fontSize: 13 }]}>
                                {explanation.healthImportance}
                            </Text>
                        </View>
                    )}
                    {explanation.recommendation && (
                        <View style={{ marginTop: 8 }}>
                            <Text style={[styles.explanationRecommendation, { color: colors.TEXT_SECONDARY, lineHeight: 20 }]}>
                                {explanation.recommendation}
                            </Text>
                        </View>
                    )}
                    </View>
                </View>
            )}
            </LinearGradient>
        </View>
    );
}

const MacroItem = React.memo(MacroItemComponent, (prevProps, nextProps) => {
    // Custom comparison - allow re-render if theme or colors change
    if (prevProps.colors?.isDark !== nextProps.colors?.isDark ||
        prevProps.colors?.CARD !== nextProps.colors?.CARD ||
        prevProps.colors?.SURFACE !== nextProps.colors?.SURFACE ||
        prevProps.colors?.TEXT !== nextProps.colors?.TEXT ||
        prevProps.colors?.BORDER !== nextProps.colors?.BORDER) {
        return false; // Re-render if theme colors changed
    }
    // Otherwise, only re-render if data changed
    return prevProps.label === nextProps.label &&
           prevProps.current === nextProps.current &&
           prevProps.goal === nextProps.goal &&
           prevProps.unit === nextProps.unit &&
           prevProps.index === nextProps.index &&
           prevProps.color === nextProps.color;
});

function MacronutrientsDashboard({ selectedDate }) {
    const { user } = useContext(UserContext)
    const { colors } = useTheme()
    const isFocused = useIsFocused()

    const userId = useMemo(() => user?._id, [user?._id])
    const dateToUse = useMemo(
        () => selectedDate || moment().format('DD/MM/YYYY'),
        [selectedDate]
    )

    const macrosFromServer = useQuery(
        api.MealPlan.GetDailyMacronutrients,
        userId && isFocused ? { uid: userId, date: dateToUse } : 'skip'
    )

    const macros = useMemo(() => {
        if (!macrosFromServer) {
            return {
                calories: 0,
                protein: 0,
                carbohydrates: 0,
                fat: 0,
                sodium: 0,
                sugar: 0,
            }
        }
        return macrosFromServer
    }, [macrosFromServer])

    // Get user's personalized goals (from AI calculation)
    const caloriesGoal = user?.calories || 2000;
    const proteinGoal = user?.proteins || 100;
    const carbsGoal = user?.carbohydrates || (caloriesGoal * 0.45) / 4; // Fallback to 45% of calories
    const fatGoal = user?.fat || (caloriesGoal * 0.25) / 9; // Fallback to 25% of calories
    const sodiumGoal = user?.sodium || 2300; // mg (FDA recommendation)
    const sugarGoal = user?.sugar || (caloriesGoal * 0.10) / 4; // Fallback to 10% of calories

    const getProgressColor = useCallback((current, goal, macroName) => {
        const percentage = (current / goal) * 100;
        
        // Special handling for different macros to match explanation logic
        if (macroName === 'Protein') {
            // Protein: Green if >= 80%, Yellow if < 80% (never red - explanation only shows 'good' or 'warning')
            if (percentage >= 80) return colors.GREEN;
            return colors.YELLOW; // All below 80% is yellow (warning), never red
        }
        
        if (macroName === 'Sodium' || macroName === 'Sugar') {
            // Sodium/Sugar: Red if >= 100% (danger), Yellow if >= 80%, Green if < 80%
            if (percentage >= 100) return colors.RED;
            if (percentage >= 80) return colors.YELLOW;
            return colors.GREEN;
        }
        
        // Default for Calories, Carbs, Fat: Red if >= 100%, Yellow if >= 80%, Green if < 80%
        if (percentage >= 100) return colors.RED;
        if (percentage >= 80) return colors.YELLOW;
        return colors.GREEN;
    }, [colors.RED, colors.YELLOW, colors.GREEN]);

    const getTrafficLightStatus = useCallback((current, goal, macroName) => {
        const percentage = (current / goal) * 100;
        
        // Special handling for different macros to match explanation logic
        if (macroName === 'Protein') {
            // Protein: Green if >= 80%, Yellow if < 80% (never red - explanation only shows 'good' or 'warning')
            if (percentage >= 80) return 'green';
            return 'yellow'; // All below 80% is yellow (warning), never red
        }
        
        if (macroName === 'Sodium' || macroName === 'Sugar') {
            // Sodium/Sugar: Red if >= 100% (danger), Yellow if >= 80%, Green if < 80%
            if (percentage >= 100) return 'red';
            if (percentage >= 80) return 'yellow';
            return 'green';
        }
        
        // Default for Calories, Carbs, Fat: Red if >= 100%, Yellow if >= 80%, Green if < 80%
        if (percentage >= 100) return 'red';
        if (percentage >= 80) return 'yellow';
        return 'green';
    }, []);

    // Memoize gradient colors to prevent recreation
    const gradientColors = useMemo(() => 
        colors.isDark 
            ? [colors.CARD, colors.SURFACE, colors.CARD] 
            : [colors.SURFACE, colors.BACKGROUND, colors.SURFACE],
        [colors.isDark, colors.CARD, colors.SURFACE, colors.BACKGROUND]
    );

    return (
        <View>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.container, {
                    borderWidth: colors.isDark ? 1 : 0,
                    borderColor: colors.BORDER,
                    shadowColor: colors.PRIMARY,
                    shadowOpacity: colors.isDark ? 0.3 : 0.12,
                }]}
            >
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8
            }}>
                <View>
                    <Text style={[styles.title, { color: colors.TEXT }]}>Daily Macronutrients</Text>
                </View>
                <View style={{
                    backgroundColor: colors.PRIMARY + '15',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 12
                }}>
                    <Text style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: colors.PRIMARY,
                        letterSpacing: 0.5
                    }}>TRACKING</Text>
                </View>
            </View>

            <View style={styles.macrosGrid}>
                {useMemo(() => [
                    { label: "Calories", current: macros.calories, goal: caloriesGoal, unit: " kcal", color: colors.PRIMARY, index: 0 },
                    { label: "Protein", current: macros.protein, goal: proteinGoal, unit: "g", color: colors.BLUE, index: 1 },
                    { label: "Carbs", current: macros.carbohydrates, goal: carbsGoal, unit: "g", color: colors.PINK, index: 2 },
                    { label: "Fat", current: macros.fat, goal: fatGoal, unit: "g", color: colors.GREEN, index: 3 },
                    { label: "Sodium", current: macros.sodium, goal: sodiumGoal, unit: "mg", color: colors.GRAY, index: 4 },
                    { label: "Sugar", current: macros.sugar, goal: sugarGoal, unit: "g", color: colors.RED, index: 5 },
                ], [macros, caloriesGoal, proteinGoal, carbsGoal, fatGoal, sodiumGoal, sugarGoal, colors.PRIMARY, colors.BLUE, colors.PINK, colors.GREEN, colors.GRAY, colors.RED, colors.isDark, colors.CARD, colors.SURFACE]).map((item) => (
                    <MacroItem
                        key={item.label}
                        label={item.label}
                        current={item.current}
                        goal={item.goal}
                        unit={item.unit}
                        color={item.color}
                        index={item.index}
                        colors={colors}
                        getProgressColor={getProgressColor}
                        getTrafficLightStatus={getTrafficLightStatus}
                    />
                ))}
            </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 0,
        marginBottom: 20,
        padding: 24,
        borderRadius: 24,
        elevation: 6,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 14,
        letterSpacing: -0.5,
    },
    macrosGrid: {
        gap: 14,
    },
    macroItem: {
        marginBottom: 14,
        padding: 16,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    macroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    trafficLightDot: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    macroLabel: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    macroValue: {
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    progressBarContainer: {
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    progressBar: {
        height: '100%',
        borderRadius: 6,
    },
    macroPercentage: {
        fontSize: 13,
        textAlign: 'right',
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    whyButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chevronIcon: {
        fontSize: 12,
        fontWeight: '600',
    },
    explanationCard: {
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
    },
    explanationMessage: {
        fontSize: 15,
        lineHeight: 22,
    },
    explanationRecommendation: {
        fontSize: 14,
        lineHeight: 20,
    },
    explanationPercentage: {
        fontSize: 16,
        fontWeight: '700',
    },
    explanationStats: {
        fontSize: 13,
    },
    explanationWarning: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 8,
    },
});

// Memoize the component to prevent unnecessary re-renders
export default React.memo(MacronutrientsDashboard);
