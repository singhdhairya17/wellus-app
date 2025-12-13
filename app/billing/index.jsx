import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { UserContext } from '../../context/UserContext'
import { useTheme } from '../../context/ThemeContext'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { WalletAdd02Icon, CheckmarkCircleIcon, CrownIcon, StarIcon, ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { useConvex, useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Button from '../../components/common/shared/Button'
import moment from 'moment'

// Subscription Plans (Prices in Indian Rupees)
const SUBSCRIPTION_PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        duration: 'Forever',
        features: [
            '10 credits to start',
            'Basic OCR scanning',
            'Daily macronutrient tracking',
            'Recipe generation (limited)',
            'Basic adaptive insights'
        ],
        credits: 10
    },
    {
        id: 'premium',
        name: 'Premium',
        price: 799,
        duration: 'Monthly',
        features: [
            '100 credits per month',
            'Unlimited OCR scanning',
            'Advanced AI recipe generation',
            'Detailed adaptive insights',
            'Priority support',
            'Export meal plans'
        ],
        credits: 100,
        durationDays: 30
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 6499,
        duration: 'Yearly',
        features: [
            '1500 credits per year',
            'Everything in Premium',
            'Custom meal plans',
            'Nutritionist consultation',
            'Advanced analytics',
            'API access'
        ],
        credits: 1500,
        durationDays: 365
    }
];

// Credit Packages (Prices in Indian Rupees)
const CREDIT_PACKAGES = [
    {
        id: 'small',
        name: 'Small Pack',
        credits: 50,
        price: 399,
        bonus: 0
    },
    {
        id: 'medium',
        name: 'Medium Pack',
        credits: 150,
        price: 999,
        bonus: 20 // 20 bonus credits
    },
    {
        id: 'large',
        name: 'Large Pack',
        credits: 500,
        price: 3199,
        bonus: 100 // 100 bonus credits
    }
];

export default function Billing() {
    const { user } = useContext(UserContext)
    const { colors } = useTheme()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const convex = useConvex()
    
    const [subscriptionStatus, setSubscriptionStatus] = useState(null)
    const [billingHistory, setBillingHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('plans') // 'plans' or 'credits' or 'history'

    const purchaseCredits = useMutation(api.Billing.PurchaseCredits)
    const subscribeToPlan = useMutation(api.Billing.SubscribeToPlan)

    useEffect(() => {
        if (!user?._id) {
            router.replace('/')
            return
        }
        fetchBillingData()
    }, [user])

    const fetchBillingData = async () => {
        try {
            setLoading(true)
            const [status, history] = await Promise.all([
                convex.query(api.Billing.GetSubscriptionStatus, { uid: user._id }),
                convex.query(api.Billing.GetBillingHistory, { uid: user._id })
            ])
            setSubscriptionStatus(status)
            setBillingHistory(history || [])
        } catch (error) {
            console.error('Error fetching billing data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePurchaseCredits = async (packageItem) => {
        Alert.alert(
            'Purchase Credits',
            `Purchase ${packageItem.credits + packageItem.bonus} credits for ₹${packageItem.price.toLocaleString('en-IN')}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Purchase',
                    onPress: async () => {
                        try {
                            setLoading(true)
                            // In a real app, you would integrate with Stripe/PayPal here
                            // For now, we'll simulate a successful purchase
                            const transactionId = `txn_${Date.now()}`
                            
                            await purchaseCredits({
                                uid: user._id,
                                credits: packageItem.credits + packageItem.bonus,
                                amount: packageItem.price,
                                transactionId: transactionId
                            })

                            Alert.alert('Success!', `You've purchased ${packageItem.credits + packageItem.bonus} credits!`)
                            fetchBillingData()
                        } catch (error) {
                            console.error('Purchase error:', error)
                            Alert.alert('Error', 'Failed to purchase credits. Please try again.')
                        } finally {
                            setLoading(false)
                        }
                    }
                }
            ]
        )
    }

    const handleSubscribe = async (plan) => {
        if (plan.id === 'free') {
            Alert.alert('Free Plan', 'You are already on the free plan!')
            return
        }

        Alert.alert(
            'Subscribe',
            `Subscribe to ${plan.name} plan for ₹${plan.price.toLocaleString('en-IN')}/${plan.duration.toLowerCase()}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Subscribe',
                    onPress: async () => {
                        try {
                            setLoading(true)
                            // In a real app, you would integrate with Stripe/PayPal here
                            // For now, we'll simulate a successful subscription
                            const transactionId = `sub_${Date.now()}`
                            
                            await subscribeToPlan({
                                uid: user._id,
                                planName: plan.name,
                                amount: plan.price,
                                duration: plan.durationDays,
                                transactionId: transactionId
                            })

                            Alert.alert('Success!', `You've subscribed to ${plan.name}!`)
                            fetchBillingData()
                        } catch (error) {
                            console.error('Subscription error:', error)
                            Alert.alert('Error', 'Failed to subscribe. Please try again.')
                        } finally {
                            setLoading(false)
                        }
                    }
                }
            ]
        )
    }

    if (loading && !subscriptionStatus) {
        return (
            <View style={[styles.container, { paddingTop: insets.top + 20, backgroundColor: colors.BACKGROUND }]}>
                <ActivityIndicator size="large" color={colors.PRIMARY} />
            </View>
        )
    }

    return (
        <ScrollView 
            style={[styles.container, { paddingTop: insets.top + 20, backgroundColor: colors.BACKGROUND }]}
            contentContainerStyle={{ 
                paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 20) + 100 : 120 
            }}
            showsVerticalScrollIndicator={true}
        >
            <View style={styles.header}>
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
                <Text style={[styles.title, { color: colors.TEXT }]}>💳 Billing & Subscription</Text>
            </View>

            {/* Current Status Card */}
            <View style={[styles.statusCard, { 
                backgroundColor: colors.isDark ? colors.CARD : colors.PRIMARY + '10',
                borderLeftColor: colors.PRIMARY 
            }]}>
                <View style={styles.statusHeader}>
                    <HugeiconsIcon icon={WalletAdd02Icon} size={24} color={colors.PRIMARY} />
                    <Text style={[styles.statusTitle, { color: colors.TEXT_SECONDARY }]}>Current Plan</Text>
                </View>
                <Text style={[styles.planName, { color: colors.PRIMARY }]}>
                    {subscriptionStatus?.planName || 'Free'}
                    {subscriptionStatus?.isActive && ' ✓'}
                </Text>
                {subscriptionStatus?.expiresAt && (
                    <Text style={[styles.expiryText, { color: colors.TEXT_SECONDARY }]}>
                        Expires: {moment(subscriptionStatus.expiresAt).format('MMM DD, YYYY')}
                    </Text>
                )}
                <View style={styles.creditsContainer}>
                    <Text style={[styles.creditsLabel, { color: colors.TEXT_SECONDARY }]}>Available Credits:</Text>
                    <Text style={[styles.creditsValue, { color: colors.PRIMARY }]}>{user?.credits || 0}</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[
                        styles.tab, 
                        { backgroundColor: activeTab === 'plans' ? colors.PRIMARY : (colors.isDark ? colors.CARD : colors.GRAY + '20') }
                    ]}
                    onPress={() => setActiveTab('plans')}
                >
                    <Text style={[styles.tabText, { 
                        color: activeTab === 'plans' ? colors.WHITE : colors.TEXT_SECONDARY 
                    }]}>
                        Plans
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab, 
                        { backgroundColor: activeTab === 'credits' ? colors.PRIMARY : (colors.isDark ? colors.CARD : colors.GRAY + '20') }
                    ]}
                    onPress={() => setActiveTab('credits')}
                >
                    <Text style={[styles.tabText, { 
                        color: activeTab === 'credits' ? colors.WHITE : colors.TEXT_SECONDARY 
                    }]}>
                        Credits
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab, 
                        { backgroundColor: activeTab === 'history' ? colors.PRIMARY : (colors.isDark ? colors.CARD : colors.GRAY + '20') }
                    ]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text style={[styles.tabText, { 
                        color: activeTab === 'history' ? colors.WHITE : colors.TEXT_SECONDARY 
                    }]}>
                        History
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Subscription Plans */}
            {activeTab === 'plans' && (
                <View style={styles.plansContainer}>
                    {SUBSCRIPTION_PLANS.map((plan) => {
                        const isCurrentPlan = subscriptionStatus?.planName === plan.name
                        const isPremium = plan.id !== 'free'
                        
                        return (
                            <View key={plan.id} style={[
                                styles.planCard, 
                                { 
                                    backgroundColor: colors.CARD,
                                    borderColor: isPremium ? colors.PRIMARY : (colors.isDark ? colors.BORDER : colors.GRAY + '30')
                                },
                                isPremium && { 
                                    borderColor: colors.PRIMARY,
                                    shadowColor: colors.PRIMARY 
                                }
                            ]}>
                                {isPremium && (
                                    <View style={[styles.premiumBadge, { backgroundColor: colors.PRIMARY }]}>
                                        <HugeiconsIcon icon={CrownIcon} size={16} color={colors.WHITE} />
                                        <Text style={[styles.premiumBadgeText, { color: colors.WHITE }]}>POPULAR</Text>
                                    </View>
                                )}
                                <View style={styles.planHeader}>
                                    <Text style={[styles.planTitle, { color: colors.PRIMARY }]}>{plan.name}</Text>
                                    <View style={styles.priceContainer}>
                                        <Text style={[styles.price, { color: colors.PRIMARY }]}>
                                            {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}
                                        </Text>
                                        {plan.price > 0 && (
                                            <Text style={[styles.pricePeriod, { color: colors.TEXT_SECONDARY }]}>/{plan.duration}</Text>
                                        )}
                                    </View>
                                </View>
                                
                                <View style={styles.featuresContainer}>
                                    {plan.features.map((feature, idx) => (
                                        <View key={idx} style={styles.featureItem}>
                                            <HugeiconsIcon icon={CheckmarkCircleIcon} size={18} color={colors.GREEN} />
                                            <Text style={[styles.featureText, { color: colors.TEXT }]}>{feature}</Text>
                                        </View>
                                    ))}
                                </View>

                                {isCurrentPlan ? (
                                    <View style={[styles.currentPlanButton, { backgroundColor: colors.GREEN + '20' }]}>
                                        <Text style={[styles.currentPlanText, { color: colors.GREEN }]}>Current Plan</Text>
                                    </View>
                                ) : (
                                    <Button
                                        title={plan.id === 'free' ? 'Current Plan' : 'Subscribe'}
                                        onPress={() => handleSubscribe(plan)}
                                        disabled={plan.id === 'free' || loading}
                                    />
                                )}
                            </View>
                        )
                    })}
                </View>
            )}

            {/* Credit Packages */}
            {activeTab === 'credits' && (
                <View style={styles.creditsPackagesContainer}>
                    <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>Purchase Credits</Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.TEXT_SECONDARY }]}>Buy credits to use for AI features</Text>
                    
                    {CREDIT_PACKAGES.map((packageItem) => (
                        <View key={packageItem.id} style={[
                            styles.creditPackageCard,
                            { 
                                backgroundColor: colors.CARD,
                                borderColor: colors.isDark ? colors.BORDER : colors.GRAY + '30'
                            }
                        ]}>
                            <View style={styles.packageHeader}>
                                <Text style={[styles.packageName, { color: colors.PRIMARY }]}>{packageItem.name}</Text>
                                <View style={styles.packagePriceContainer}>
                                    <Text style={[styles.packagePrice, { color: colors.PRIMARY }]}>₹{packageItem.price.toLocaleString('en-IN')}</Text>
                                </View>
                            </View>
                            <View style={styles.packageCredits}>
                                <Text style={[styles.packageCreditsText, { color: colors.TEXT }]}>
                                    {packageItem.credits + packageItem.bonus} Credits
                                </Text>
                                {packageItem.bonus > 0 && (
                                    <Text style={[styles.bonusText, { color: colors.GREEN }]}>
                                        ({packageItem.credits} + {packageItem.bonus} bonus)
                                    </Text>
                                )}
                            </View>
                            <Button
                                title="Purchase"
                                onPress={() => handlePurchaseCredits(packageItem)}
                                disabled={loading}
                            />
                        </View>
                    ))}
                </View>
            )}

            {/* Billing History */}
            {activeTab === 'history' && (
                <View style={styles.historyContainer}>
                    <Text style={[styles.sectionTitle, { color: colors.TEXT }]}>Billing History</Text>
                    {billingHistory.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyStateText, { color: colors.TEXT_SECONDARY }]}>No billing history yet</Text>
                        </View>
                    ) : (
                        billingHistory.map((item, idx) => (
                            <View key={idx} style={[
                                styles.historyItem,
                                { 
                                    backgroundColor: colors.CARD,
                                    borderColor: colors.isDark ? colors.BORDER : colors.GRAY + '30'
                                }
                            ]}>
                                <View style={styles.historyHeader}>
                                    <Text style={[styles.historyType, { color: colors.TEXT }]}>
                                        {item.type === 'subscription' ? '📅 Subscription' : '💳 Credits'}
                                    </Text>
                                    <Text style={[styles.historyAmount, { color: colors.PRIMARY }]}>₹{item.amount.toLocaleString('en-IN')}</Text>
                                </View>
                                {item.planName && (
                                    <Text style={[styles.historyPlan, { color: colors.TEXT_SECONDARY }]}>{item.planName} Plan</Text>
                                )}
                                {item.credits && (
                                    <Text style={[styles.historyCredits, { color: colors.GREEN }]}>+{item.credits} credits</Text>
                                )}
                                <Text style={[styles.historyDate, { color: colors.TEXT_SECONDARY }]}>
                                    {moment(item.createdAt).format('MMM DD, YYYY hh:mm A')}
                                </Text>
                                <View style={[
                                    styles.statusBadge, 
                                    { backgroundColor: item.status === 'completed' ? colors.GREEN + '20' : (colors.isDark ? colors.CARD : colors.GRAY + '20') }
                                ]}>
                                    <Text style={[
                                        styles.statusBadgeText, 
                                        { color: item.status === 'completed' ? colors.GREEN : colors.TEXT_SECONDARY }
                                    ]}>{item.status}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        alignSelf: 'flex-start'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    statusCard: {
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        borderLeftWidth: 4,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    planName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    expiryText: {
        fontSize: 14,
        marginBottom: 10,
    },
    creditsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
    },
    creditsLabel: {
        fontSize: 16,
    },
    creditsValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    tabsContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    plansContainer: {
        gap: 15,
        marginBottom: 30,
    },
    planCard: {
        borderRadius: 15,
        padding: 20,
        borderWidth: 2,
        position: 'relative',
    },
    premiumBadge: {
        position: 'absolute',
        top: -10,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 15,
    },
    premiumBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    planHeader: {
        marginBottom: 15,
    },
    planTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    pricePeriod: {
        fontSize: 16,
        marginLeft: 5,
    },
    featuresContainer: {
        marginBottom: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    featureText: {
        fontSize: 14,
        flex: 1,
    },
    currentPlanButton: {
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    currentPlanText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    creditsPackagesContainer: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    sectionSubtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    creditPackageCard: {
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        borderWidth: 1,
    },
    packageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    packageName: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    packagePriceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    packagePrice: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    packageCredits: {
        marginBottom: 15,
    },
    packageCreditsText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    bonusText: {
        fontSize: 14,
        marginTop: 5,
    },
    historyContainer: {
        marginBottom: 30,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 16,
    },
    historyItem: {
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        borderWidth: 1,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    historyType: {
        fontSize: 16,
        fontWeight: '600',
    },
    historyAmount: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    historyPlan: {
        fontSize: 14,
        marginBottom: 5,
    },
    historyCredits: {
        fontSize: 14,
        marginBottom: 5,
    },
    historyDate: {
        fontSize: 12,
        marginBottom: 10,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 15,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
})

