import { Stack } from "expo-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { UserContext } from './../context/UserContext';
import { RefreshDataContext } from './../context/RefreshDataContext';
import { ThemeProvider } from './../context/ThemeContext';
import { LogBox, View, Text } from 'react-native';
import { useState, useEffect } from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from '../components/common/ErrorBoundary';
import ThemedAlert from '../components/common/ThemedAlert';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible while we load resources
SplashScreen.preventAutoHideAsync();

// Pre-load ML Kit model in background (if available) for faster OCR
if (typeof require !== 'undefined') {
    try {
        // Pre-initialize ML Kit model on app start (non-blocking)
        Promise.resolve().then(async () => {
            try {
                const { initializeModel } = require('../services/ocr/LocalOCRService');
                if (initializeModel) {
                    await initializeModel();
                }
            } catch (e) {
                // Silent fail - model will load on first use
            }
        });
    } catch (e) {
        // ML Kit not available - ignore
    }
}

// Suppress the findDOMNode deprecation warning from react-native-actions-sheet
// Suppress keep-awake error (non-critical, happens when module isn't fully initialized)
// Suppress Convex validation errors for scannedFood IDs (handled gracefully)
LogBox.ignoreLogs([
  'findDOMNode is deprecated',
  'Unable to activate keep awake',
  'ArgumentValidationError',
  'does not match the table name'
]);

// Release APKs do not read .env.local — EXPO_PUBLIC_* must be set via EAS Secrets (or app config) at build time.
const CONVEX_URL = (process.env.EXPO_PUBLIC_CONVEX_URL || '').trim();
const convexClient = CONVEX_URL
  ? new ConvexReactClient(CONVEX_URL, { unsavedChangesWarning: false })
  : null;

export default function RootLayout() {
  const [user, setUser] = useState();
  const [refreshData, setRefreshData] = useState();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load ML Kit model in background (non-blocking) for faster OCR
        // Model is bundled with app - this just ensures it's ready
        Promise.resolve().then(async () => {
          try {
            // Dynamically import to avoid blocking if ML Kit not available
            const LocalOCRService = require('../services/ocr/LocalOCRService');
            // Model initialization happens automatically in LocalOCRService
            // This is just to ensure it's ready early
          } catch (e) {
            // ML Kit not available - ignore silently
          }
        });
      } catch (e) {
        // Ignore - model will load on first use
      } finally {
        // Tell the application to render - hide splash screen immediately
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null; // Splash screen will show during this time
  }

  if (!convexClient) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 24,
          backgroundColor: '#f5f5f5',
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#111' }}>
          Missing Convex URL
        </Text>
        <Text style={{ fontSize: 15, color: '#333', lineHeight: 22 }}>
          This install was built without EXPO_PUBLIC_CONVEX_URL. In Expo: Project → Secrets, add
          EXPO_PUBLIC_CONVEX_URL (your Convex deployment URL), then run a new EAS build. Local
          .env.local is not included in store/APK builds.
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SafeAreaProvider>
          <ConvexProvider client={convexClient}>
            <UserContext.Provider value={{ user, setUser }}>
              <RefreshDataContext.Provider value={{ refreshData, setRefreshData }}>
                <ThemedAlert />
                <Stack 
                  screenOptions={{ 
                    headerShown: false,
                    animation: 'fade',
                    animationDuration: 200
                  }}
                >
                  <Stack.Screen name="index" />
                </Stack>
              </RefreshDataContext.Provider>
            </UserContext.Provider>
          </ConvexProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}