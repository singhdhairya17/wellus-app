import React, { useRef, useState, useContext } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/colors';
import Button from './shared/Button';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowRight01Icon, Camera01Icon, AnalyticsUpIcon, StarIcon } from '@hugeicons/core-free-icons';
import { UserContext } from '../../context/UserContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ONBOARDING_DATA = [
    {
        id: 1,
        title: 'Scan Food Labels',
        description: 'Use OCR technology to instantly extract nutrition facts from any food label. Just point and scan!',
        icon: Camera01Icon,
        color: Colors.PRIMARY,
        image: null
    },
    {
        id: 2,
        title: 'Track Your Progress',
        description: 'Monitor your daily macronutrients with beautiful visualizations and real-time progress tracking.',
        icon: AnalyticsUpIcon,
        color: Colors.BLUE,
        image: null
    },
    {
        id: 3,
        title: 'AI-Powered Insights',
        description: 'Get personalized recommendations and explanations powered by Explainable AI and adaptive monitoring.',
        icon: StarIcon,
        color: Colors.GREEN,
        image: null
    }
];

export default function Onboarding({ onComplete }) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useContext(UserContext);
    const scrollX = useRef(new Animated.Value(0)).current;
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        {
            useNativeDriver: false,
            listener: (event) => {
                const offsetX = event.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / SCREEN_WIDTH);
                setCurrentIndex(index);
            }
        }
    );

    const handleNext = () => {
        if (currentIndex < ONBOARDING_DATA.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = async () => {
        console.log('[Onboarding] Completing onboarding');
        
        // Save onboarding status
        try {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        } catch (error) {
            console.error('[Onboarding] Error saving onboarding status:', error);
        }
        
        // If onComplete callback is provided, use it
        if (onComplete) {
            await onComplete();
        } else {
            // Otherwise, navigate based on user state
            // If user is already logged in, go to Home
            // Otherwise, go to SignIn
            if (user?._id) {
                console.log('[Onboarding] User already logged in, navigating to Home');
                router.replace('/(tabs)/Home');
            } else {
                console.log('[Onboarding] User not logged in, navigating to SignIn');
                router.replace('/auth/SignIn');
            }
        }
    };

    const renderItem = ({ item, index }) => {
        const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
        
        const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1, 0.8],
            extrapolate: 'clamp'
        });

        const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: 'clamp'
        });

        const translateX = scrollX.interpolate({
            inputRange,
            outputRange: [50, 0, -50],
            extrapolate: 'clamp'
        });

        return (
            <View style={styles.slide}>
                <Animated.View
                    style={[
                        styles.iconContainer,
                        {
                            transform: [{ scale }, { translateX }],
                            opacity,
                            backgroundColor: item.color + '20'
                        }
                    ]}
                >
                    {item.icon ? (
                        <Animated.View style={{ opacity }}>
                            <HugeiconsIcon 
                                icon={item.icon} 
                                size={80} 
                                color={item.color}
                                strokeWidth={3}
                            />
                        </Animated.View>
                    ) : null}
                </Animated.View>

                <Animated.View
                    style={[
                        styles.textContainer,
                        {
                            opacity,
                            transform: [{ translateX }]
                        }
                    ]}
                >
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </Animated.View>
            </View>
        );
    };

    const renderPagination = () => {
        return (
            <View style={styles.pagination}>
                {ONBOARDING_DATA.map((_, index) => {
                    const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
                    
                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [8, 24, 8],
                        extrapolate: 'clamp'
                    });

                    const dotOpacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp'
                    });

                    // Calculate if this dot should be active based on scroll position
                    const scale = scrollX.interpolate({
                        inputRange,
                        outputRange: [1, 1.2, 1],
                        extrapolate: 'clamp'
                    });

                    return (
                        <Animated.View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    width: dotWidth,
                                    opacity: dotOpacity,
                                    backgroundColor: currentIndex === index ? Colors.PRIMARY : Colors.GRAY,
                                    transform: [{ scale }]
                                }
                            ]}
                        />
                    );
                })}
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Skip Button */}
            <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
            >
                <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            {/* Slider */}
            <Animated.FlatList
                ref={flatListRef}
                data={ONBOARDING_DATA}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                keyExtractor={(item) => item.id.toString()}
                getItemLayout={(data, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                })}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    setCurrentIndex(index);
                }}
                onScrollToIndexFailed={(info) => {
                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                    wait.then(() => {
                        flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                    });
                }}
            />

            {/* Pagination Dots */}
            {renderPagination()}

            {/* Navigation Buttons */}
            <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                {currentIndex < ONBOARDING_DATA.length - 1 ? (
                    <Button
                        title="Next"
                        onPress={handleNext}
                        icon={<HugeiconsIcon icon={ArrowRight01Icon} size={20} color={Colors.WHITE} />}
                    />
                ) : (
                    <Button
                        title="Get Started"
                        onPress={handleComplete}
                        icon={<HugeiconsIcon icon={ArrowRight01Icon} size={20} color={Colors.WHITE} />}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE,
    },
    skipButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    skipText: {
        fontSize: 16,
        color: Colors.GRAY,
        fontWeight: '600',
    },
    slide: {
        width: SCREEN_WIDTH,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 50,
    },
    textContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        textAlign: 'center',
        marginBottom: 20,
    },
    description: {
        fontSize: 16,
        color: Colors.GRAY,
        textAlign: 'center',
        lineHeight: 24,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
        gap: 8,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    buttonContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
});

