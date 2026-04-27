import { View, Text, Pressable, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Image } from 'expo-image'
import React, { useContext, useState, useEffect } from 'react'
import Input from '../../components/common/shared/Input'
import Button from '../../components/common/shared/Button'
import { Link, useRouter } from 'expo-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../services/FirebaseConfig'
import { useConvex } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { UserContext } from '../../context/UserContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '../../context/ThemeContext'
import { validateEmail } from '../../utils/validation'
import { sanitizeError, rateLimiter } from '../../utils/security'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
// Removed animations for faster rendering
import { showError, showWarning } from '../../utils/showAlert'

export default function SignIn() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState();
    const [password, setPassword] = useState();
    const [rememberMe, setRememberMe] = useState(false);
    const convex = useConvex();
    const { user, setUser } = useContext(UserContext);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Load saved email if "remember me" was checked
    useEffect(() => {
        const loadSavedEmail = async () => {
            try {
                const savedEmail = await AsyncStorage.getItem('rememberedEmail');
                const rememberMeValue = await AsyncStorage.getItem('rememberMe');
                if (savedEmail && rememberMeValue === 'true') {
                    setEmail(savedEmail);
                    setRememberMe(true);
                }
            } catch (error) {
                console.error('Error loading saved email:', error);
            }
        };
        loadSavedEmail();
    }, []);

    const onSignIn = async () => {
        // SECURITY: Input validation
        if (!email || !password) {
            showError('Missing Fields!', 'Enter all field values')
            return;
        }

        // SECURITY: Validate email format
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            showError('Invalid Email', emailValidation.error);
            return;
        }

        // SECURITY: Rate limiting - prevent brute force attacks
        const rateLimitKey = `signin_${emailValidation.value}`;
        if (!rateLimiter.isAllowed(rateLimitKey, 5, 60000)) { // 5 attempts per minute
            showWarning('Too Many Attempts', 'Please wait a minute before trying again.');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, emailValidation.value, password);
            const user = userCredential.user;
            const userData = await convex.query(api.Users.GetUser, {
                email: (email).toLowerCase()
            });

            console.log('[SignIn] Loaded user data:', {
                _id: userData?._id,
                email: userData?.email,
                hasPicture: !!userData?.picture,
            });
            setUser(userData);

            // Check if user is new (created within last 30 minutes) and should see onboarding
            let shouldShowOnboarding = false;
            if (userData?._creationTime) {
                const creationTime = userData._creationTime;
                const now = Date.now();
                const thirtyMinutesAgo = now - (30 * 60 * 1000); // 30 minutes window
                
                // If user was created recently, they should see onboarding
                if (creationTime > thirtyMinutesAgo) {
                    console.log('[SignIn] New user detected (created', Math.round((now - creationTime) / 1000 / 60), 'minutes ago)');
                    
                    // Check if they've seen onboarding
                    const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
                    if (hasSeenOnboarding !== 'true') {
                        console.log('[SignIn] New user hasn\'t seen onboarding, will show it');
                        shouldShowOnboarding = true;
                    }
                }
            }

            // Handle "Remember Me"
            if (rememberMe) {
                // Save email and preference
                await AsyncStorage.setItem('rememberMe', 'true');
                await AsyncStorage.setItem('rememberedEmail', email.toLowerCase());
            } else {
                // Clear saved data
                await AsyncStorage.removeItem('rememberMe');
                await AsyncStorage.removeItem('rememberedEmail');
            }

            // If new user who hasn't seen onboarding, navigate to index (which will show onboarding)
            // Otherwise, go directly to Home
            if (shouldShowOnboarding) {
                console.log('[SignIn] Navigating to index for onboarding');
                router.replace('/');
            } else {
                console.log('[SignIn] Navigating to Home');
                router.replace('/(tabs)/Home');
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            // SECURITY: Sanitize error messages to prevent information leakage
            const safeError = sanitizeError(error, __DEV__);
            console.log('[SignIn] Error:', __DEV__ ? error : safeError);
            showError("Sign In Failed", safeError);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.BACKGROUND }}>
            <LinearGradient
                colors={colors.isDark 
                    ? [colors.BACKGROUND, colors.PRIMARY + '10', colors.BACKGROUND]
                    : [colors.BACKGROUND, colors.PRIMARY + '05', colors.BACKGROUND]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
            >
                <KeyboardAvoidingView 
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <ScrollView 
                        contentContainerStyle={{
                            flexGrow: 1,
                            padding: 20,
                            paddingTop: insets.top + 20,
                            paddingBottom: Math.max(insets.bottom, 20),
                        }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                    >
                    <View 
                        style={{ alignItems: 'center', marginTop: 20 }}
                    >
                        <View style={[styles.logoContainer, { 
                            backgroundColor: colors.CARD,
                            shadowColor: colors.PRIMARY,
                        }]}>
                            <Image 
                                source={require('./../../assets/images/logo.png')}
                                style={styles.logo}
                                contentFit="contain"
                                transition={100}
                                cachePolicy="memory-disk"
                            />
                        </View>
                    </View>

                    <View 
                        style={{ marginTop: 40 }}
                    >
                        <Text style={[styles.title, { color: colors.TEXT }]}>
                            Welcome Back
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
                            Sign in to continue your wellness journey
                        </Text>
                    </View>

                    <View 
                        style={{ marginTop: 30, width: '100%' }}
                    >
                        <Input 
                            placeholder={'Email'} 
                            value={email} 
                            onChangeText={setEmail}
                            label="Email Address"
                        />
                        <Input 
                            placeholder={'Password'} 
                            password={true} 
                            onChangeText={setPassword}
                            label="Password"
                        />

                        {/* Remember Me Checkbox */}
                        <TouchableOpacity
                            style={styles.rememberMeContainer}
                            onPress={() => setRememberMe(!rememberMe)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.checkbox, 
                                { 
                                    borderColor: rememberMe ? colors.PRIMARY : colors.BORDER,
                                    backgroundColor: rememberMe ? colors.PRIMARY : 'transparent'
                                }
                            ]}>
                                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={[styles.rememberMeText, { color: colors.TEXT }]}>
                                Remember Me
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View 
                        style={{ marginTop: 25, width: '100%' }}
                    >
                        <Button 
                            title={'Sign In'}
                            onPress={() => onSignIn()}
                            loading={loading}
                        />

                        <View style={styles.signUpContainer}>
                            <Text style={[styles.signUpText, { color: colors.TEXT_SECONDARY }]}>
                                Don't have an account?{' '}
                            </Text>
                            <Link href={'/auth/SignUp'}>
                                <Text style={[styles.signUpLink, { color: colors.PRIMARY }]}>
                                    Create New Account
                                </Text>
                            </Link>
                        </View>
                    </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </View>
    )
}

const styles = StyleSheet.create({
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 5,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderRadius: 6,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    rememberMeText: {
        fontSize: 15,
        fontWeight: '500',
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    signUpText: {
        fontSize: 15,
    },
    signUpLink: {
        fontSize: 15,
        fontWeight: '700',
    },
})