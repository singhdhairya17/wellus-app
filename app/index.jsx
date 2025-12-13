import { Dimensions, Text, View } from "react-native";
import { Image } from 'expo-image';
import Colors from '../constants/colors'
import Button from '../components/common/shared/Button'
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from "expo-router";
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './../services/FirebaseConfig'
import { useContext, useEffect, useState, useCallback } from "react";
import { UserContext } from "@/context/UserContext";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RefreshDataContext } from "@/context/RefreshDataContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from '../components/common/Onboarding';

export default function Index() {
  const router = useRouter();
  const { user, setUser } = useContext(UserContext);
  const convex = useConvex();
  const { refreshData } = useContext(RefreshDataContext);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    // Check if onboarding has been shown - optimized for faster rendering
    // Use Promise to avoid blocking
    Promise.resolve().then(async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        // Removed console.logs for faster execution
      } catch (error) {
        // Silent fail - don't block app
      } finally {
        setIsCheckingOnboarding(false);
      }
    });
  }, []);

  // Check onboarding when user is set (for new users) - This runs AFTER user is loaded
  const checkOnboardingForUser = useCallback(async () => {
    // Wait for initial check to complete
    if (isCheckingOnboarding) {
      return;
    }

    // If already showing onboarding, don't check again
    if (showOnboarding) {
      return;
    }

    // If no user, don't check (user might not be logged in)
    if (!user?._id) {
      return;
    }

    try {
      // Check if they've seen onboarding
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      
      // If they haven't seen onboarding, show it
      if (hasSeenOnboarding !== 'true') {
        setShowOnboarding(true);
        return;
      }

      // Check if user is new (created within last 30 minutes) - even if they marked as seen
      if (user._creationTime) {
        const creationTime = user._creationTime;
        const now = Date.now();
        const thirtyMinutesAgo = now - (30 * 60 * 1000); // 30 minutes window
        
        if (creationTime > thirtyMinutesAgo) {
          const minutesAgo = Math.round((now - creationTime) / 1000 / 60);
          
          // Force show onboarding for very new users (within 10 minutes)
          if (minutesAgo < 10) {
            await AsyncStorage.removeItem('hasSeenOnboarding');
            setShowOnboarding(true);
            return;
          }
        }
      }
    } catch (error) {
      console.error('[Onboarding] Error checking onboarding for user:', error);
    }
  }, [user?._id, isCheckingOnboarding, showOnboarding]);

  useEffect(() => {
    // Immediate check without delay for faster rendering
    checkOnboardingForUser();
  }, [checkOnboardingForUser]);

  // Also check when screen comes into focus (e.g., when navigating from SignIn)
  useFocusEffect(
    useCallback(() => {
      checkOnboardingForUser();
    }, [checkOnboardingForUser])
  );

  useEffect(() => {
    // Keep a mounted flag to avoid state updates after unmount
    let mounted = true;
    let unsubscribe = null;

    // Don't check auth if onboarding is showing
    if (showOnboarding || isCheckingOnboarding) {
      return;
    }

    const checkAuthAndRememberMe = async () => {
      // Check if "Remember Me" is enabled - use Promise to avoid blocking
      const rememberMe = await AsyncStorage.getItem('rememberMe').catch(() => null);
      
      if (rememberMe !== 'true') {
        // If "Remember Me" is not enabled, sign out any existing session
        const currentUser = auth.currentUser;
        if (currentUser) {
          signOut(auth).catch(() => {}); // Don't await - non-blocking
        }
        if (!mounted) return;
        setUser(null);
        return;
      }

      // If "Remember Me" is enabled, proceed with auto-login
      unsubscribe = onAuthStateChanged(auth, async (userInfo) => {
        // If no user (signed out), clear state but don't aggressively redirect
        if (!userInfo) {
          if (!mounted) return;
          setUser(null);
          return;
        }

        // If user exists but email missing, log and bail
        const email = userInfo.email?.toLowerCase();
        if (!email) {
          if (!mounted) return;
          setUser(null);
          return;
        }

        try {
          const userData = await convex.query(api.Users.GetUser, { email });

          if (!mounted) return;

          if (!userData) {
            setUser(null);
            router.push('/auth/SignIn');
            return;
          }

          // Set user first - the useEffect will check onboarding
          setUser(userData);
          
          // Check if user is new and should see onboarding
          if (userData._creationTime) {
            const creationTime = userData._creationTime;
            const now = Date.now();
            const thirtyMinutesAgo = now - (30 * 60 * 1000); // 30 minutes window
            
            if (creationTime > thirtyMinutesAgo) {
              const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
              
              if (hasSeenOnboarding !== 'true' && mounted) {
                setShowOnboarding(true);
                return; // Don't navigate to Home, onboarding will handle it
              }
            }
          }

          // If onboarding is showing, don't navigate yet
          const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
          if (hasSeenOnboarding === 'true' && mounted) {
            // Successful: navigate to home only if onboarding was seen
            router.replace('/(tabs)/Home');
          }
        } catch (err) {
          console.error('[Auth] error fetching user:', err);
          if (!mounted) return;
          setUser(null);
          // fail closed: show SignIn so user can re-authenticate
          router.push('/auth/SignIn');
        }
      });
    };

    checkAuthAndRememberMe();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [convex, router, refreshData, setUser, showOnboarding, isCheckingOnboarding]);

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      setShowOnboarding(false);
      
      // If user is logged in, navigate to Home
      // Otherwise, onboarding component will handle navigation
      if (user?._id) {
        router.replace('/(tabs)/Home');
      }
    } catch (error) {
      // Error handled silently - user can still navigate
      setShowOnboarding(false);
    }
  };

  // Removed loading screen to show landing page immediately for faster UX
  // Onboarding check happens in background

  // Show onboarding if it hasn't been seen - this MUST block everything else
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Image 
        source={require('./../assets/images/landing.jpg')}
        style={{ width: '100%', height: Dimensions.get('screen').height }}
        contentFit="cover"
        transition={100}
        cachePolicy="memory-disk"
      />
      <View style={{
        position: 'absolute',
        height: Dimensions.get('screen').height,
        backgroundColor: '#0707075e',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: 20
      }}>
        <Image 
          source={require('./../assets/images/logo.png')}
          style={{ width: 150, height: 150, marginTop: 100 }}
          contentFit="contain"
          transition={100}
          cachePolicy="memory-disk"
        />
        <Text style={{ fontSize: 30, fontWeight: 'bold', color: Colors.WHITE }}>Wellus</Text>
        <Text style={{
          textAlign: 'center',
          marginHorizontal: 20,
          fontSize: 20,
          color: Colors.WHITE,
          marginTop: 15,
          opacity: 0.8,
        }}>
          An Intelligent Dietary Management System with OCR, Adaptive Monitoring, and Explainable AI
        </Text>
      </View>

      <View style={{ position: 'absolute', width: '100%', bottom: 25, padding: 20 }}>
        <Button
          title={'Get Started'}
          onPress={() => router.replace("/auth/SignIn")}
          icon={<Ionicons name="arrow-forward" size={20} color={Colors.WHITE} />}
        />
      </View>
    </View>
  );
}