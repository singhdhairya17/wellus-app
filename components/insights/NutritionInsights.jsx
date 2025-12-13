import { View, Text, StyleSheet, ScrollView } from 'react-native'
import React, { useContext, useMemo } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { UserContext } from '../../context/UserContext'
import { LinearGradient } from 'expo-linear-gradient'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { StarIcon } from '@hugeicons/core-free-icons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import moment from 'moment'

export default function NutritionInsights() {
    const { colors } = useTheme()
    const { user } = useContext(UserContext)
    
    // Generate insights based on user data
    const insights = useMemo(() => {
        if (!user) return []
        
        const insightsList = []
        
        // Example insights (in production, calculate from actual data)
        if (user.goal === 'Weight Loss') {
            insightsList.push({
                type: 'tip',
                title: 'Weight Loss Tip',
                message: 'Focus on protein-rich meals to stay full longer and preserve muscle mass.',
                icon: '💪'
            })
        }
        
        if (user.goal === 'Muscle Gain') {
            insightsList.push({
                type: 'tip',
                title: 'Muscle Gain Tip',
                message: 'Ensure you\'re getting enough protein (1.6-2.2g per kg body weight) for optimal muscle growth.',
                icon: '🏋️'
            })
        }
        
        insightsList.push({
            type: 'achievement',
            title: 'Weekly Goal',
            message: 'Aim for consistency - track your meals daily for best results.',
            icon: '📊'
        })
        
        return insightsList
    }, [user])
    
    if (insights.length === 0) return null
    
    return (
        <Animated.View entering={FadeInDown.delay(600)} style={styles.container}>
            <LinearGradient
                colors={colors.isDark 
                    ? [colors.CARD, colors.SURFACE] 
                    : ['#FFFFFF', '#F8F9FA']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, {
                    borderWidth: colors.isDark ? 1 : 0,
                    borderColor: colors.BORDER,
                    shadowColor: colors.PRIMARY,
                    shadowOpacity: colors.isDark ? 0.2 : 0.08,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 12,
                    elevation: 4
                }]}
            >
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.YELLOW + '15' }]}>
                        <HugeiconsIcon icon={StarIcon} size={24} color={colors.YELLOW} />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={[styles.title, { color: colors.TEXT }]}>Nutrition Insights</Text>
                        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
                            Personalized tips for you
                        </Text>
                    </View>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.insightsList}>
                    {insights.map((insight, index) => (
                        <View key={index} style={[styles.insightCard, {
                            backgroundColor: colors.BACKGROUND,
                            borderColor: colors.BORDER
                        }]}>
                            <Text style={styles.insightIcon}>{insight.icon}</Text>
                            <Text style={[styles.insightTitle, { color: colors.TEXT }]}>
                                {insight.title}
                            </Text>
                            <Text style={[styles.insightMessage, { color: colors.TEXT_SECONDARY }]}>
                                {insight.message}
                            </Text>
                        </View>
                    ))}
                </ScrollView>
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
        borderRadius: 20,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    headerText: {
        flex: 1
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500'
    },
    insightsList: {
        marginTop: 10
    },
    insightCard: {
        width: 280,
        padding: 16,
        borderRadius: 16,
        marginRight: 12,
        borderWidth: 1
    },
    insightIcon: {
        fontSize: 32,
        marginBottom: 8
    },
    insightTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6
    },
    insightMessage: {
        fontSize: 14,
        lineHeight: 20
    }
})

