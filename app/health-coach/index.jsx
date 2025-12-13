import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { UserContext } from '../../context/UserContext'
import { useTheme } from '../../context/ThemeContext'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { Chat01Icon, ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { LinearGradient } from 'expo-linear-gradient'
import HealthCoachChat from '../../components/chat/HealthCoachChat'
import ErrorBoundary from '../../components/common/ErrorBoundary'

export default function HealthCoachPage() {
    const { user } = useContext(UserContext)
    const themeContext = useTheme()
    const { 
        colors = {
            BACKGROUND: '#FFFFFF',
            PRIMARY: '#007AFF',
            TEXT: '#000000',
            TEXT_SECONDARY: '#8E8E93'
        }
    } = themeContext || {}
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const [isReady, setIsReady] = useState(false)
    
    // Redirect if not logged in
    useEffect(() => {
        if (!user?._id) {
            router.replace('/')
        } else {
            // Set ready immediately for faster rendering
            setIsReady(true)
        }
    }, [user, router])
    
    if (!user?._id) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.BACKGROUND }}>
                <ActivityIndicator size="large" color={colors.PRIMARY} />
                <Text style={{ color: colors.TEXT, marginTop: 16 }}>Loading...</Text>
            </View>
        )
    }
    
    if (!isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.BACKGROUND }}>
                <ActivityIndicator size="large" color={colors.PRIMARY} />
                <Text style={{ color: colors.TEXT, marginTop: 16 }}>Preparing Health Coach...</Text>
            </View>
        )
    }
    
    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <TouchableOpacity 
                        onPress={() => router.back()} 
                        style={[styles.backButton, {
                            backgroundColor: colors.PRIMARY + '15',
                            borderWidth: 1,
                            borderColor: colors.PRIMARY + '30',
                            shadowColor: colors.PRIMARY,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 3
                        }]}
                        activeOpacity={0.7}
                    >
                        <HugeiconsIcon 
                            icon={ArrowLeft01Icon} 
                            size={20} 
                            color={colors.PRIMARY}
                            strokeWidth={2.5}
                        />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <LinearGradient
                            colors={[colors.PRIMARY + '20', colors.PRIMARY + '10']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.titleIconContainer, {
                                borderWidth: 1,
                                borderColor: colors.PRIMARY + '30'
                            }]}
                        >
                            <HugeiconsIcon icon={Chat01Icon} size={28} color={colors.PRIMARY} />
                        </LinearGradient>
                        <View style={styles.titleTextContainer}>
                            <Text style={[styles.title, { color: colors.TEXT }]}>AI Health Coach</Text>
                            <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
                                Your personalized health assistant
                            </Text>
                        </View>
                    </View>
                </View>
                
                <HealthCoachChat />
            </View>
        </ErrorBoundary>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)'
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        alignSelf: 'flex-start'
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    titleIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center'
    },
    titleTextContainer: {
        flex: 1
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 4
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500'
    }
})

