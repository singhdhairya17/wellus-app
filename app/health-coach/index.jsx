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
                <View style={[styles.header, { 
                    paddingTop: insets.top + 12,
                    borderBottomColor: colors.BORDER || 'rgba(0,0,0,0.08)'
                }]}>
                    <TouchableOpacity 
                        onPress={() => router.back()} 
                        style={[styles.backButton, {
                            backgroundColor: colors.PRIMARY + '12',
                            borderWidth: 1,
                            borderColor: colors.PRIMARY + '28',
                            shadowColor: colors.PRIMARY,
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.12,
                            shadowRadius: 3,
                            elevation: 2
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
                            colors={[colors.PRIMARY + '22', colors.PRIMARY + '08']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.titleIconContainer, {
                                borderWidth: 1,
                                borderColor: colors.PRIMARY + '25'
                            }]}
                        >
                            <HugeiconsIcon icon={Chat01Icon} size={26} color={colors.PRIMARY} />
                        </LinearGradient>
                        <View style={styles.titleTextContainer}>
                            <Text style={[styles.title, { color: colors.TEXT }]}>Health Coach</Text>
                            <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
                                Guidance based on your profile and goals
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
        paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        alignSelf: 'flex-start'
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    titleIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    titleTextContainer: {
        flex: 1
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.4,
        marginBottom: 3
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20
    }
})

