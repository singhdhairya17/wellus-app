/**
 * Skeleton Card Components for Loading States
 */

import { View, StyleSheet } from 'react-native'
import React from 'react'
import { useTheme } from '../../context/ThemeContext'
import SkeletonLoader from './SkeletonLoader'
import { LinearGradient } from 'expo-linear-gradient'

export function SkeletonMacroCard() {
    const { colors } = useTheme()
    
    return (
        <LinearGradient
            colors={colors.isDark 
                ? [colors.CARD, colors.SURFACE, colors.CARD] 
                : ['#FFFFFF', '#FAFBFC', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, {
                borderWidth: colors.isDark ? 1.5 : 1,
                borderColor: colors.BORDER + '60'
            }]}
        >
            <View style={styles.header}>
                <SkeletonLoader width={80} height={16} borderRadius={8} />
                <SkeletonLoader width={100} height={20} borderRadius={8} />
            </View>
            <SkeletonLoader width="100%" height={8} borderRadius={4} style={{ marginTop: 12 }} />
            <SkeletonLoader width={60} height={14} borderRadius={4} style={{ marginTop: 8, alignSelf: 'flex-end' }} />
        </LinearGradient>
    )
}

export function SkeletonMealCard() {
    const { colors } = useTheme()
    
    return (
        <LinearGradient
            colors={colors.isDark 
                ? [colors.CARD, colors.SURFACE] 
                : ['#FFFFFF', '#F8F9FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.mealCard, {
                borderWidth: colors.isDark ? 1 : 0,
                borderColor: colors.BORDER
            }]}
        >
            <SkeletonLoader width={100} height={100} borderRadius={18} />
            <View style={styles.mealContent}>
                <SkeletonLoader width="70%" height={18} borderRadius={4} />
                <SkeletonLoader width="50%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
                <SkeletonLoader width="40%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
        </LinearGradient>
    )
}

export function SkeletonProgressCard() {
    const { colors } = useTheme()
    
    return (
        <LinearGradient
            colors={colors.isDark 
                ? [colors.CARD, colors.SURFACE, colors.CARD] 
                : ['#FFFFFF', '#F8F9FA', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, {
                borderWidth: colors.isDark ? 1.5 : 1,
                borderColor: colors.BORDER + '60'
            }]}
        >
            <SkeletonLoader width={120} height={24} borderRadius={8} />
            <SkeletonLoader width={80} height={16} borderRadius={4} style={{ marginTop: 8 }} />
            <View style={styles.progressContainer}>
                <SkeletonLoader width="60%" height={12} borderRadius={6} style={{ marginTop: 20 }} />
            </View>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    card: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 16
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    mealCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 18,
        marginBottom: 12,
        gap: 12
    },
    mealContent: {
        flex: 1
    },
    progressContainer: {
        marginTop: 16
    }
})

