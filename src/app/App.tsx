/**
 * App Root Component
 * College Knowledge Vault
 *
 * Phase 2: Initializes auth on mount, configures Google Sign-In,
 * and wraps the app with all required providers.
 */

import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import NetInfo from '@react-native-community/netinfo';
import messaging from '@react-native-firebase/messaging';

import { RootNavigator, linking, navigationRef } from './Navigation';
import { queryClient } from './QueryClient';
import { ErrorBoundary } from './ErrorBoundary';
import { useAuthStore } from '../core/store/authStore';
import { GOOGLE_WEB_CLIENT_ID } from '../core/constants/supabaseConstants';
import { colors } from '../shared/constants/colors';

function OfflineBanner() {
  return (
    <View style={styles.offlineBanner} testID="offline-banner">
      <Text style={styles.offlineBannerText}>⚠️ You're offline. Showing cached content.</Text>
    </View>
  );
}

function App(): React.JSX.Element {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Listen to network status changes
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(Boolean(offline));
    });

    return () => {
      unsubscribeNetInfo();
    };
  }, []);

  useEffect(() => {
    // Handle notification tap when app opened from background
    const unsubscribeOpenedApp = messaging().onNotificationOpenedApp((remoteMessage) => {
      const entryId = remoteMessage.data?.entryId;
      if (entryId && navigationRef.isReady()) {
        (navigationRef as any).navigate('EntryDetail', { entryId });
      }
    });

    // Check whether an initial notification is available (app opened from quit state)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage?.data?.entryId) {
          setTimeout(() => {
            if (navigationRef.isReady()) {
              (navigationRef as any).navigate('EntryDetail', { entryId: remoteMessage.data!.entryId });
            }
          }, 1000);
        }
      });

    return () => {
      unsubscribeOpenedApp();
    };
  }, []);

  useEffect(() => {
    // Configure global error handling for uncaught JS errors
    if (typeof globalThis !== 'undefined' && (globalThis as any).ErrorUtils) {
      const defaultHandler =
        typeof (globalThis as any).ErrorUtils.getGlobalHandler === 'function'
          ? (globalThis as any).ErrorUtils.getGlobalHandler()
          : null;

      (globalThis as any).ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        console.error('Unhandled global error:', error, isFatal);
        if (defaultHandler) {
          defaultHandler(error, isFatal);
        }
      });
    }

    // Configure Google Sign-In with the Web Client ID
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });

    // Restore session and set up auth state listener
    initializeAuth();
  }, [initializeAuth]);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {isOffline && <OfflineBanner />}
          <NavigationContainer ref={navigationRef} linking={linking}>
            <StatusBar
              barStyle="dark-content"
              backgroundColor={colors.background}
            />
            <RootNavigator />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#FFF3CD',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE69C',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  offlineBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
    textAlign: 'center',
  },
});

export default App;
