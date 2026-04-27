import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Keyboard } from 'react-native'
import React, { useState, useRef, useEffect, useContext, useMemo } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { UserContext } from '../../context/UserContext'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { ChatWithHealthCoach, BuildUserContext } from '../../services/ai/HealthCoachService'
import { LinearGradient } from 'expo-linear-gradient'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import moment from 'moment'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const AnimatedView = Animated.createAnimatedComponent(View)

export default function HealthCoachChat() {
    const themeContext = useTheme()
    const insets = useSafeAreaInsets()
    const { 
        colors = {
            BACKGROUND: '#FFFFFF',
            PRIMARY: '#007AFF',
            SECONDARY: '#5856D6',
            TEXT: '#000000',
            TEXT_SECONDARY: '#8E8E93',
            CARD: '#FFFFFF',
            SURFACE: '#F8F9FA',
            BORDER: '#E5E5EA',
            WHITE: '#FFFFFF',
            RED: '#EF4444',
            isDark: false
        }
    } = themeContext || {}
    const { user } = useContext(UserContext)
    const [messages, setMessages] = useState([])
    const [inputText, setInputText] = useState('')
    const [loading, setLoading] = useState(false)
    const [keyboardHeight, setKeyboardHeight] = useState(0)
    const scrollViewRef = useRef(null)
    
    // Calculate bottom padding to avoid system buttons
    const bottomPadding = Platform.OS === 'ios' 
        ? Math.max(insets.bottom, 20) 
        : Math.max(insets.bottom, 10)
    
    // Handle keyboard show/hide
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
        
        const showSubscription = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates.height)
        })
        const hideSubscription = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0)
        })

        return () => {
            showSubscription.remove()
            hideSubscription.remove()
        }
    }, [])
    
    // Get today's macros
    const dailyMacros = useQuery(
        api.MealPlan.GetDailyMacronutrients,
        user?._id ? { date: moment().format('DD/MM/YYYY'), uid: user._id } : 'skip'
    )
    
    // Get recent meals
    const recentMealsQuery = useQuery(
        api.MealPlan.GetTodaysMealPlan,
        user?._id ? { uid: user._id, date: moment().format('DD/MM/YYYY') } : 'skip'
    )
    const recentMeals = Array.isArray(recentMealsQuery) ? recentMealsQuery : []
    
    // Build user context - only build if we have user data
    const userContext = useMemo(() => {
        if (!user?._id) return ''
        return BuildUserContext(user, dailyMacros || {}, recentMeals, {})
    }, [user, dailyMacros, recentMeals])
    
    useEffect(() => {
        // Add welcome message
        if (messages.length === 0) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: `Hi ${user?.name || 'there'}. I can use your profile, goals, and recent progress to answer questions. What would you like to focus on today?`,
                timestamp: Date.now()
            }])
        }
    }, [])
    
    useEffect(() => {
        // Scroll to bottom when new message arrives
        if (scrollViewRef.current) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true })
            }, 100)
        }
    }, [messages])

    
    const handleSend = async () => {
        if (!inputText.trim() || loading) return
        
        // Dismiss keyboard when sending
        Keyboard.dismiss()
        
        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText.trim(),
            timestamp: Date.now()
        }
        
        setMessages(prev => [...prev, userMessage])
        setInputText('')
        setLoading(true)
        
        try {
            // Build chat history
            const chatHistory = Array.isArray(messages) ? messages.map(m => ({
                role: m?.role || 'user',
                content: m?.content || ''
            })) : []
            
            const response = await ChatWithHealthCoach(
                userMessage.content,
                userContext,
                chatHistory,
                user?._id
            )
            
            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: Date.now()
            }
            
            setMessages(prev => [...prev, assistantMessage])
        } catch (error) {
            console.error('Chat error:', error)
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Sorry, I'm having trouble right now. ${error.message || 'Please try again later.'}`,
                timestamp: Date.now(),
                isError: true
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setLoading(false)
        }
    }
    
    return (
        <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
            <ScrollView
                ref={scrollViewRef}
                style={[styles.messagesContainer, { backgroundColor: colors.BACKGROUND }]}
                contentContainerStyle={[styles.messagesContent, {
                    paddingBottom: 100,
                    paddingTop: 4
                }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
            >
                {Array.isArray(messages) && messages.length > 0 && messages.map((message, index) => {
                    if (!message || !message.id) return null
                    return (
                    <AnimatedView
                        key={message.id || `msg-${index}`}
                        entering={FadeInDown.delay(index * 50)}
                        style={[
                            styles.messageWrapper,
                            message.role === 'user' ? styles.userMessageWrapper : styles.assistantMessageWrapper
                        ]}
                    >
                        <LinearGradient
                            colors={
                                message.isError
                                    ? [colors.RED + '14', colors.RED + '06']
                                    : message.role === 'user'
                                        ? [colors.PRIMARY, colors.SECONDARY]
                                        : colors.isDark
                                            ? [colors.CARD, colors.SURFACE]
                                            : ['#FFFFFF', '#F6F7F9']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                                styles.messageBubble,
                                message.role === 'user' ? styles.bubbleUserRadii : styles.bubbleAssistantRadii,
                                {
                                    borderWidth: message.role === 'assistant' || message.isError ? 1 : 0,
                                    borderColor: message.isError
                                        ? colors.RED + '35'
                                        : message.role === 'assistant'
                                            ? colors.BORDER
                                            : 'transparent',
                                    shadowColor: message.role === 'user' ? colors.PRIMARY : colors.BORDER,
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: message.role === 'user' ? 0.22 : 0.08,
                                    shadowRadius: message.role === 'user' ? 6 : 4,
                                    elevation: message.role === 'user' ? 3 : 1
                                }
                            ]}
                        >
                            <Text style={[
                                styles.messageText,
                                {
                                    color: message.role === 'user' ? colors.WHITE : colors.TEXT
                                }
                            ]}>
                                {message.content}
                            </Text>
                        </LinearGradient>
                    </AnimatedView>
                    )
                })}
                
                {loading && (
                    <AnimatedView entering={FadeIn} style={styles.loadingWrapper}>
                        <View style={[styles.messageBubble, styles.loadingBubble, styles.bubbleAssistantRadii, {
                            backgroundColor: colors.isDark ? colors.CARD : '#FFFFFF',
                            borderColor: colors.BORDER + 'CC'
                        }]}>
                            <ActivityIndicator size="small" color={colors.PRIMARY} />
                            <Text style={[styles.loadingText, { color: colors.TEXT_SECONDARY }]}>
                                Thinking…
                            </Text>
                        </View>
                    </AnimatedView>
                )}
            </ScrollView>
            
            <View style={[styles.inputContainer, {
                backgroundColor: colors.BACKGROUND,
                borderTopColor: colors.BORDER,
                paddingBottom: bottomPadding + 12,
                transform: [{ translateY: keyboardHeight > 0 ? -keyboardHeight : 0 }]
            }]}>
                <TextInput
                    style={[styles.input, {
                        backgroundColor: colors.isDark ? colors.SURFACE : colors.CARD,
                        color: colors.TEXT,
                        borderColor: colors.BORDER
                    }]}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Ask about meals, goals, or habits…"
                    placeholderTextColor={colors.TEXT_SECONDARY}
                    multiline
                    maxLength={500}
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                    blurOnSubmit={false}
                />
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={!inputText.trim() || loading}
                    style={[styles.sendButton, {
                        backgroundColor: inputText.trim() && !loading ? colors.PRIMARY : colors.BORDER,
                        opacity: inputText.trim() && !loading ? 1 : 0.45
                    }]}
                    activeOpacity={0.75}
                    accessibilityLabel="Send message"
                >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={22} color={colors.WHITE} strokeWidth={2.2} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    messagesContainer: {
        flex: 1,
        paddingHorizontal: 18
    },
    messagesContent: {
        flexGrow: 1
    },
    messageWrapper: {
        marginBottom: 14,
        maxWidth: '88%'
    },
    userMessageWrapper: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end'
    },
    assistantMessageWrapper: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start'
    },
    messageBubble: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 1
    },
    bubbleUserRadii: {
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 5
    },
    bubbleAssistantRadii: {
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderBottomRightRadius: 18,
        borderBottomLeftRadius: 5
    },
    messageText: {
        fontSize: 15,
        lineHeight: 23,
        fontWeight: '500'
    },
    loadingWrapper: {
        alignSelf: 'flex-start',
        marginBottom: 16
    },
    loadingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '600'
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        gap: 10
    },
    input: {
        flex: 1,
        minHeight: 46,
        maxHeight: 108,
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 14,
        borderWidth: 1,
        fontSize: 15,
        fontWeight: '500'
    },
    sendButton: {
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 2
    }
})

