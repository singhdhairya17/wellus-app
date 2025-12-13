// Debug utility to manually clear onboarding for testing
import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearOnboarding = async () => {
    try {
        await AsyncStorage.removeItem('hasSeenOnboarding');
        console.log('✅ Onboarding cleared - will show on next app start');
        return true;
    } catch (error) {
        console.error('❌ Error clearing onboarding:', error);
        return false;
    }
};

export const checkOnboardingStatus = async () => {
    try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        console.log('📊 Onboarding status:', hasSeenOnboarding);
        return hasSeenOnboarding === 'true';
    } catch (error) {
        console.error('❌ Error checking onboarding:', error);
        return null;
    }
};

