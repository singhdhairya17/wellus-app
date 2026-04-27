import { View, Text, Image, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import React, { useContext, useState } from 'react'
import Input from '../../components/common/shared/Input'
import Button from '../../components/common/shared/Button'
import { Link, useRouter } from 'expo-router'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../services/FirebaseConfig'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { UserContext } from '../../context/UserContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Onboarding from '../../components/common/Onboarding'
import { validateEmail, validateName, validatePassword } from '../../utils/validation'
import { sanitizeError } from '../../utils/security'
import { useTheme } from '../../context/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import { showError, showWarning } from '../../utils/showAlert'


export default function SignUp() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [name, setName] = useState();
    const [email, setEmail] = useState();
    const [password, setPassword] = useState();
    const createNewUser = useMutation(api.Users.CreateNewUser)
    const { user, setUser } = useContext(UserContext);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [newUserData, setNewUserData] = useState(null);
    const onSignUp = async () => {
        // SECURITY: Input validation
        if (!name || !email || !password) {
            showError('Missing Fields!', 'Enter all field values')
            return;
        }

        // SECURITY: Validate inputs
        const nameValidation = validateName(name);
        if (!nameValidation.valid) {
            showError('Invalid Name', nameValidation.error);
            return;
        }

        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            showError('Invalid Email', emailValidation.error);
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            showWarning('Weak Password', passwordValidation.error);
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, emailValidation.value, passwordValidation.value);
            const user = userCredential.user;
            console.log('[SignUp] Firebase user created:', {
                uid: user?.uid,
                email: user?.email,
            });
            if (user) {
                const result = await createNewUser({
                    name: nameValidation.value,
                    email: emailValidation.value
                });

                    console.log('[SignUp] Convex createNewUser:', {
                        _id: result?._id,
                        email: result?.email,
                    });
                    setUser(result);
                    setNewUserData(result); // Store for onboarding completion
                    
                    // Clear onboarding for new users so they see it
                    try {
                        await AsyncStorage.removeItem('hasSeenOnboarding');
                        console.log('[SignUp] ✅ Cleared onboarding for new user');
                    } catch (error) {
                        console.error('[SignUp] Error clearing onboarding:', error);
                    }
                    
                    // Show onboarding immediately after account creation
                    console.log('[SignUp] ✅ Account created successfully!');
                    console.log('[SignUp] ✅ User data created:', {
                        _id: result?._id,
                        email: result?.email,
                    });
                    console.log('[SignUp] ✅ Setting showOnboarding to TRUE - onboarding will show NOW');
                    
                    // Set state immediately - React will handle the update
                    setShowOnboarding(true);
                    setLoading(false);
                    
                console.log('[SignUp] ✅ State updated - onboarding should render');
            }
        } catch (error) {
            // SECURITY: Sanitize error messages
            const safeError = sanitizeError(error, __DEV__);
            console.log('[SignUp] Error:', __DEV__ ? error : safeError);
            showError('Sign Up Failed', safeError);
            setLoading(false);
        }

    }

    const handleOnboardingComplete = async () => {
        try {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            setShowOnboarding(false);
            
            // Use newUserData or user from context
            const currentUser = newUserData || user;
            
            console.log('[SignUp] Onboarding complete, navigating...');
            
            // After onboarding, navigate to preferences (new users need to set up their profile)
            if (currentUser?._id) {
                // Always go to preferences first for new users
                console.log('[SignUp] Navigating to preferences');
                router.replace('/preferance');
            } else {
                console.log('[SignUp] No user data, navigating to SignIn');
                router.replace('/auth/SignIn');
            }
        } catch (error) {
            console.error('[SignUp] Error saving onboarding status:', error);
            setShowOnboarding(false);
        }
    };

    // Show onboarding if account was just created
    if (showOnboarding) {
        console.log('[SignUp] ✅✅✅ RENDERING ONBOARDING COMPONENT - 3 PAGES WILL SHOW');
        return <Onboarding onComplete={handleOnboardingComplete} />;
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
                    <Animated.View 
                        entering={FadeIn.duration(600)}
                        style={{ alignItems: 'center', marginTop: 20 }}
                    >
                        <View style={[styles.logoContainer, { 
                            backgroundColor: colors.CARD,
                            shadowColor: colors.PRIMARY,
                        }]}>
                            <Image 
                                source={require('./../../assets/images/logo.png')}
                                style={styles.logo}
                            />
                        </View>
                    </Animated.View>

                    <Animated.View 
                        entering={FadeInDown.delay(200).duration(600)}
                        style={{ marginTop: 40 }}
                    >
                        <Text style={[styles.title, { color: colors.TEXT }]}>
                            Create Account
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.TEXT_SECONDARY }]}>
                            Join Wellus and start your personalized wellness journey
                        </Text>
                    </Animated.View>

                    <Animated.View 
                        entering={FadeInDown.delay(400).duration(600)}
                        style={{ marginTop: 30, width: '100%' }}
                    >
                        <Input 
                            placeholder={'Full Name'} 
                            onChangeText={setName}
                            label="Full Name"
                            value={name}
                        />
                        <Input 
                            placeholder={'Email'} 
                            onChangeText={setEmail}
                            label="Email Address"
                            value={email}
                        />
                        <Input 
                            placeholder={'Password'} 
                            password={true} 
                            onChangeText={setPassword}
                            label="Password"
                            value={password}
                        />
                    </Animated.View>

                    <Animated.View 
                        entering={FadeInDown.delay(600).duration(600)}
                        style={{ marginTop: 25, width: '100%' }}
                    >
                        <Button 
                            title={'Create Account'}
                            onPress={() => onSignUp()}
                            loading={loading}
                        />

                        <View style={styles.signInContainer}>
                            <Text style={[styles.signInText, { color: colors.TEXT_SECONDARY }]}>
                                Already have an account?{' '}
                            </Text>
                            <Link href={'/auth/SignIn'}>
                                <Text style={[styles.signInLink, { color: colors.PRIMARY }]}>
                                    Sign In Here
                                </Text>
                            </Link>
                        </View>
                    </Animated.View>
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
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    signInText: {
        fontSize: 15,
    },
    signInLink: {
        fontSize: 15,
        fontWeight: '700',
    },
})