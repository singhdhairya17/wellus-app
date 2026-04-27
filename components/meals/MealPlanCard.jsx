import { View, Text, StyleSheet, Alert, Modal } from 'react-native'
import { Image } from 'expo-image'
import React, { useContext, useRef, useState } from 'react'
import * as FileSystem from 'expo-file-system/legacy'
import { useTheme } from '../../context/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { HugeiconsIcon } from '@hugeicons/react-native'
import { CheckmarkSquare02Icon, SquareIcon } from '@hugeicons/core-free-icons'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { RefreshDataContext } from '../../context/RefreshDataContext'
import { Link } from 'expo-router'
import Animated, { 
    FadeInDown, 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring,
    withSequence,
    withTiming,
    useAnimatedReaction,
    runOnJS
} from 'react-native-reanimated'
import { Pressable } from 'react-native'
import { triggerHaptic } from '../../utils/haptics'
import ScannedFoodDetailSheet from './ScannedFoodDetailSheet'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function MealPlanCard({ mealPlanInfo, index = 0 }) {
    const { colors } = useTheme()
    const updateStatus = useMutation(api.MealPlan.updateStatus);
    const { setRefreshData } = useContext(RefreshDataContext)
    const checkScale = useSharedValue(1)
    const cardScale = useSharedValue(1)
    const [imageError, setImageError] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const expandHeight = useSharedValue(0)
    const isCompleted = mealPlanInfo?.mealPlan?.status === true;
    const isScannedFood = mealPlanInfo?.mealPlan?.isScannedFood === true;
    const recipe = mealPlanInfo?.recipe;
    const jsonData = recipe?.jsonData || {};
    
    // Get image URI for scanned foods - prioritize mealPlan.imageUri for scanned foods
    const imageUri = isScannedFood 
        ? (mealPlanInfo?.mealPlan?.imageUri || mealPlanInfo?.recipe?.imageUrl || '')
        : (mealPlanInfo?.recipe?.imageUrl || mealPlanInfo?.mealPlan?.imageUri || '')
    
    // Log image URI for debugging
    React.useEffect(() => {
        if (isScannedFood) {
            console.log('[MealPlanCard] Scanned food image URI:', {
                imageUri,
                mealPlanImageUri: mealPlanInfo?.mealPlan?.imageUri,
                recipeImageUrl: mealPlanInfo?.recipe?.imageUrl,
                hasImageUri: !!imageUri
            })
        }
    }, [imageUri, isScannedFood, mealPlanInfo])
    
    // Check if image file exists (for local file URIs) - Non-blocking
    React.useEffect(() => {
        if (imageUri && imageUri.startsWith('file://')) {
            // If it's a cache URI, mark as error immediately (cache gets cleared)
            if (imageUri.includes('/cache/')) {
                console.log('[MealPlanCard] Cache URI detected, marking as error')
                setImageError(true)
                return
            }
            
            // Only check documentDirectory URIs (permanent storage)
            if (imageUri.includes(FileSystem.documentDirectory)) {
                const timeoutId = setTimeout(() => {
                    FileSystem.getInfoAsync(imageUri)
                        .then((info) => {
                            console.log('[MealPlanCard] File exists check:', info.exists, imageUri)
                            if (!info.exists) {
                                setImageError(true)
                            } else {
                                setImageError(false)
                            }
                        })
                        .catch((error) => {
                            console.log('[MealPlanCard] File check error:', error)
                            setImageError(true)
                        })
                }, 0)
                return () => clearTimeout(timeoutId)
            } else {
                // Unknown file path - mark as error to be safe
                console.log('[MealPlanCard] Unknown file path, marking as error')
                setImageError(true)
            }
        } else if (!imageUri) {
            // No image URI - show placeholder
            console.log('[MealPlanCard] No image URI')
            setImageError(true)
        } else {
            // Remote URL - assume valid
            console.log('[MealPlanCard] Remote URL, assuming valid')
            setImageError(false)
        }
    }, [imageUri])

    const onCheck = async (status) => {
        if (mealPlanInfo?.mealPlan?.isScannedFood || !mealPlanInfo?.mealPlan?.recipeId) {
            Alert.alert('Info', 'Scanned food items are always marked as consumed and cannot be changed.');
            return;
        }

        triggerHaptic.medium()
        try {
            await updateStatus({
                id: mealPlanInfo?.mealPlan?._id,
                status: status,
                calories: mealPlanInfo?.recipe?.jsonData?.calories
            });

            checkScale.value = withSequence(
                withSpring(1.2, { damping: 8 }),
                withSpring(1, { damping: 8 })
            )

            if (status) {
                triggerHaptic.success()
            }

            Alert.alert('Great!', 'Status Updated!');
            setRefreshData(Date.now());
        } catch (error) {
            console.error('Update status error:', error);
            Alert.alert('Error', 'Failed to update status. Please try again.');
        }
    }

    const handleCardPress = () => {
        console.log('[MealPlanCard] Card pressed:', {
            isScannedFood,
            hasRecipeId: !!mealPlanInfo?.mealPlan?.recipeId,
            mealPlanInfo: mealPlanInfo?.mealPlan
        })
        
        if (isScannedFood || !mealPlanInfo?.mealPlan?.recipeId) {
            console.log('[MealPlanCard] Opening scanned food sheet')
            triggerHaptic.light()
            
            // Show centered modal
            console.log('[MealPlanCard] Opening centered modal')
            setShowDetailModal(true)
        } else {
            console.log('[MealPlanCard] Expanding recipe card')
            triggerHaptic.light()
            const newExpanded = !isExpanded
            setIsExpanded(newExpanded)
            expandHeight.value = withSpring(newExpanded ? 1 : 0, { 
                damping: 15,
                stiffness: 200
            })
        }
    }

    const checkAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: checkScale.value }],
    }))

    const cardAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: cardScale.value }],
    }))

    const expandAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: expandHeight.value,
            maxHeight: expandHeight.value * 200,
            overflow: 'hidden',
        }
    })

    const handleCardPressIn = () => {
        cardScale.value = withSpring(0.98, { damping: 15, stiffness: 300 })
    }

    const handleCardPressOut = () => {
        cardScale.value = withSpring(1, { damping: 15, stiffness: 300 })
    }
    
    return (
        <>
        <Animated.View 
            entering={FadeInDown.delay(index * 50).springify()}
        >
            <Animated.View style={cardAnimatedStyle}>
                <Pressable
                onPressIn={handleCardPressIn}
                onPressOut={handleCardPressOut}
                onPress={handleCardPress}
            >
                <LinearGradient
                    colors={isCompleted 
                        ? colors.isDark 
                            ? [colors.GREEN + '25', colors.SURFACE, colors.GREEN + '15']
                            : ['#E8F5E9', '#FFFFFF', '#F1F8F4']
                        : colors.isDark
                            ? [colors.CARD, colors.SURFACE, colors.CARD]
                            : ['#FFFFFF', '#FAFBFC', '#FFFFFF']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        padding: 16,
                        flexDirection: 'row',
                        gap: 14,
                        borderRadius: 18,
                        borderWidth: isCompleted ? 2 : 1.5,
                        borderColor: isCompleted ? colors.GREEN + '50' : colors.BORDER + '50',
                        elevation: isCompleted ? 4 : 3,
                        shadowColor: isCompleted ? colors.GREEN : colors.PRIMARY,
                        shadowOpacity: isCompleted ? 0.25 : 0.12,
                        shadowOffset: { width: 0, height: 4 },
                        shadowRadius: 10,
                    }}
                >
                    {/* Compact Image */}
                    {mealPlanInfo?.mealPlan?.recipeId && !isScannedFood ? (
                        <View style={{
                            width: 72,
                            height: 72,
                            borderRadius: 16,
                            overflow: 'hidden',
                            borderWidth: 2,
                            borderColor: colors.BORDER + '50',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 2
                        }}>
                            <Image 
                                source={{ uri: recipe?.imageUrl }}
                                style={{ width: 72, height: 72 }}
                                contentFit="cover"
                                transition={200}
                                placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                                cachePolicy="memory-disk"
                                priority="low"
                            />
                        </View>
                    ) : (
                        <Pressable 
                            onPress={() => {
                                triggerHaptic.light()
                                setShowDetailModal(true)
                            }}
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: 16,
                                overflow: 'hidden',
                                borderWidth: 2,
                                borderColor: colors.BORDER + '50',
                                backgroundColor: colors.BORDER + '20',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 2
                            }}
                        >
                            {imageError || !imageUri ? (
                                <View style={{
                                    width: 72,
                                    height: 72,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: colors.BORDER + '20'
                                }}>
                                    <HugeiconsIcon 
                                        icon={SquareIcon} 
                                        color={colors.TEXT_SECONDARY} 
                                        size={32}
                                    />
                                </View>
                            ) : (
                                <Image 
                                    source={{ uri: imageUri }}
                                    style={{ width: 72, height: 72 }}
                                    contentFit="cover"
                                    transition={200}
                                    cachePolicy="memory-disk"
                                    priority="low"
                                    onError={(error) => {
                                        console.log('[MealPlanCard] Image load error:', error, 'URI:', imageUri)
                                        setImageError(true)
                                    }}
                                    onLoad={() => {
                                        console.log('[MealPlanCard] Image loaded successfully:', imageUri)
                                        setImageError(false)
                                    }}
                                />
                            )}
                        </Pressable>
                    )}

                    {/* Compact Content */}
                    <View style={{ flex: 1, justifyContent: 'space-between' }}>
                        <View>
                            <Text 
                                style={{
                                    fontSize: 17,
                                    fontWeight: '800',
                                    color: colors.TEXT,
                                    marginBottom: 8,
                                    letterSpacing: -0.4
                                }}
                                numberOfLines={1}
                            >
                                {recipe?.recipeName || mealPlanInfo?.mealPlan?.foodName || 'Meal'}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <LinearGradient
                                    colors={[colors.GREEN + '20', colors.GREEN + '15']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{
                                        paddingHorizontal: 10,
                                        paddingVertical: 5,
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        borderColor: colors.GREEN + '25'
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 13,
                                        fontWeight: '800',
                                        color: colors.GREEN,
                                        letterSpacing: 0.2
                                    }}>
                                        {jsonData?.calories || mealPlanInfo?.mealPlan?.calories || 0} kcal
                                    </Text>
                                </LinearGradient>
                                {isCompleted && (
                                    <View style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 10,
                                        backgroundColor: colors.GREEN + '20',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <HugeiconsIcon icon={CheckmarkSquare02Icon} size={14} color={colors.GREEN} />
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Compact Checkbox */}
                    <AnimatedPressable
                        onPress={(e) => {
                            e.stopPropagation()
                            onCheck(!isCompleted)
                        }}
                        disabled={isScannedFood || !mealPlanInfo?.mealPlan?.recipeId}
                        style={[
                            {
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: isCompleted ? colors.GREEN + '25' : colors.BORDER + '30',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 2,
                                borderColor: isCompleted ? colors.GREEN + '60' : colors.BORDER + '60',
                                opacity: (isScannedFood || !mealPlanInfo?.mealPlan?.recipeId) ? 0.4 : 1,
                                shadowColor: isCompleted ? colors.GREEN : '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: isCompleted ? 0.2 : 0.05,
                                shadowRadius: 4,
                                elevation: isCompleted ? 2 : 1
                            },
                            checkAnimatedStyle
                        ]}
                    >
                        <HugeiconsIcon 
                            icon={isCompleted ? CheckmarkSquare02Icon : SquareIcon} 
                            color={isCompleted ? colors.GREEN : colors.TEXT_SECONDARY}
                            size={22}
                            strokeWidth={isCompleted ? 2.5 : 2}
                        />
                    </AnimatedPressable>
                </LinearGradient>

                {/* Expandable Details */}
                {!isScannedFood && mealPlanInfo?.mealPlan?.recipeId && isExpanded && (
                    <Animated.View style={expandAnimatedStyle}>
                        <View style={{
                            paddingTop: 12,
                            paddingHorizontal: 14,
                            paddingBottom: 8,
                            backgroundColor: colors.isDark ? colors.SURFACE + '80' : colors.BACKGROUND + '80',
                            borderBottomLeftRadius: 16,
                            borderBottomRightRadius: 16,
                            marginTop: -4,
                        }}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                {jsonData?.proteins > 0 && (
                                    <View style={{
                                        backgroundColor: colors.BLUE + '15',
                                        paddingHorizontal: 10,
                                        paddingVertical: 6,
                                        borderRadius: 8,
                                    }}>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.BLUE }}>
                                            {jsonData.proteins}g protein
                                        </Text>
                                    </View>
                                )}
                                {jsonData?.carbohydrates > 0 && (
                                    <View style={{
                                        backgroundColor: colors.PINK + '15',
                                        paddingHorizontal: 10,
                                        paddingVertical: 6,
                                        borderRadius: 8,
                                    }}>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.PINK }}>
                                            {jsonData.carbohydrates}g carbs
                                        </Text>
                                    </View>
                                )}
                                {jsonData?.fat > 0 && (
                                    <View style={{
                                        backgroundColor: colors.GREEN + '15',
                                        paddingHorizontal: 10,
                                        paddingVertical: 6,
                                        borderRadius: 8,
                                    }}>
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.GREEN }}>
                                            {jsonData.fat}g fat
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Link href={'/recipe-detail?recipeId=' + recipe?._id}>
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingVertical: 8,
                                    backgroundColor: colors.PRIMARY + '15',
                                    borderRadius: 10,
                                    marginTop: 4,
                                }}>
                                    <Text style={{
                                        fontSize: 13,
                                        fontWeight: '700',
                                        color: colors.PRIMARY,
                                        marginRight: 6
                                    }}>
                                        View Full Details
                                    </Text>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: '800',
                                        color: colors.PRIMARY
                                    }}>
                                        ›
                                    </Text>
                                </View>
                            </Link>
                        </View>
                    </Animated.View>
                )}
                </Pressable>
            </Animated.View>
        </Animated.View>
        
        {/* Centered Modal for Scanned Food Details */}
        <Modal
            visible={showDetailModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowDetailModal(false)}
        >
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20
            }}>
                <View style={{
                    backgroundColor: colors.BACKGROUND,
                    borderRadius: 20,
                    width: '100%',
                    maxWidth: 400,
                    maxHeight: '85%',
                    minHeight: 300,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    elevation: 10,
                    overflow: 'hidden'
                }}>
                    <ScannedFoodDetailSheet 
                        scannedFood={mealPlanInfo} 
                        hideActionSheet={() => {
                            console.log('[MealPlanCard] Hiding modal')
                            setShowDetailModal(false)
                        }} 
                    />
                </View>
            </View>
        </Modal>
        </>
    )
}

export default React.memo(MealPlanCard, (prevProps, nextProps) => {
    return prevProps.mealPlanInfo?.mealPlan?._id === nextProps.mealPlanInfo?.mealPlan?._id &&
           prevProps.mealPlanInfo?.mealPlan?.status === nextProps.mealPlanInfo?.mealPlan?.status &&
           prevProps.index === nextProps.index
})

const styles = StyleSheet.create({})
