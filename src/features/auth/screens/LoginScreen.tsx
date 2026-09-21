/**
 * Login Screen
 * College Knowledge Vault
 *
 * Full screen sign-in screen with top hero section, Google OAuth,
 * error state, auto-account creation message, back navigation,
 * and post-login role context validation.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import GoogleSignInButton from '../components/GoogleSignInButton';
import { signInWithGoogle } from '../../../core/services/authService';
import { useAuthStore } from '../../../core/store/authStore';
import { ERRORS } from '../../../core/constants/appConstants';
import type { RootStackParamList } from '../../../core/types/navigation.types';
import { UserRole } from '../../../core/types/user.types';

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
type LoginRouteProp = RouteProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavProp>();
  const route = useRoute<LoginRouteProp>();
  const {
    setUser,
    setSession,
    setIsNewUser,
    setAuthenticating,
    setSelectedContextRole,
    signOut,
  } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contextRole = route.params?.contextRole;

  // Persist selected context role to authStore
  React.useEffect(() => {
    if (contextRole) {
      setSelectedContextRole(contextRole);
    }
  }, [contextRole, setSelectedContextRole]);

  // Dynamic subtitle based on contextRole
  const getSubtitle = () => {
    switch (contextRole) {
      case UserRole.Student:
      case UserRole.Senior:
        return 'Sign in to access your college knowledge vault';
      case UserRole.Faculty:
        return 'Sign in with your institutional email to access faculty portal';
      case 'college_admin':
        return 'Sign in to manage your college knowledge vault';
      case 'super_admin':
        return 'Platform Developer Access — System Administration';
      default:
        return 'Sign in to access knowledge from your seniors';
    }
  };

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Landing');
    }
  }, [navigation]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setAuthenticating(true);
      setError(null);

      const result = await signInWithGoogle();

      // Super Admin Guard: No RoleSelection at all
      if (contextRole === 'super_admin') {
        if (!result.user.isSuperAdmin) {
          Alert.alert(
            'Access Restricted',
            'This Google account does not have Super Admin privileges. Please use the Student, Faculty, or College Admin portal.',
            [
              {
                text: 'OK',
                onPress: () => {
                  signOut();
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Landing' }],
                  });
                },
              },
            ],
          );
          return;
        }

        // Verified Super Admin
        setSession(result.session);
        setUser(result.user);
        setIsNewUser(false);
        try {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        } catch {
          // Declarative navigation
        }
        return;
      }

      setSession(result.session);
      setUser(result.user);
      setIsNewUser(result.isNewUser);

      // ── FACULTY CONTEXT CASES ──
      if (contextRole === UserRole.Faculty) {
        // CASE 1: Returning user, role='faculty', is_verified=true (Approved)
        if (result.user.role === UserRole.Faculty && result.user.isVerified) {
          try {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          } catch {}
          return;
        }

        // CASE 2: Pending faculty request
        if (
          (result.user.role === UserRole.Faculty && !result.user.isVerified) ||
          result.user.pendingRoleRequest === 'faculty'
        ) {
          navigation.navigate('PendingAccess', {
            requestType: 'faculty',
            collegeName: result.user.collegeName || result.user.college,
            department: result.user.department,
          });
          return;
        }

        // CASE 3: New user (no college_id set)
        const isNew = result.isNewUser || !result.user.collegeId;
        if (isNew) {
          try {
            navigation.reset({
              index: 0,
              routes: [{ name: 'RoleSelection', params: { contextRole: UserRole.Faculty } }],
            });
          } catch {}
          return;
        }

        // CASE 4: Returning user, role='student' or 'senior'
        Alert.alert(
          'No Faculty Access',
          "This account doesn't have faculty access. Would you like to request it?",
          [
            {
              text: 'Request Faculty Access',
              onPress: () => {
                setSelectedContextRole(UserRole.Faculty);
                navigation.navigate('RoleSelection', {
                  contextRole: UserRole.Faculty,
                  initialStep: 3,
                  initialRole: UserRole.Faculty,
                });
              },
            },
            {
              text: 'Continue as Student',
              onPress: () => {
                try {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                  });
                } catch {}
              },
            },
          ],
        );
        return;
      }

      // ── COLLEGE ADMIN CONTEXT ──
      if (contextRole === 'college_admin') {
        // CASE 1: Approved College Admin
        if (result.user.isCollegeAdmin) {
          try {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          } catch {}
          return;
        }

        // CASE 2: Pending College Admin Request
        if (result.user.pendingRoleRequest === 'college_admin') {
          navigation.navigate('PendingAccess', {
            requestType: 'college_admin',
            collegeName: result.user.collegeName || result.user.college,
          });
          return;
        }

        // CASE 3: New user (no college_id set)
        const isNew = result.isNewUser || !result.user.collegeId;
        if (isNew) {
          try {
            navigation.reset({
              index: 0,
              routes: [{ name: 'RoleSelection', params: { contextRole: 'college_admin' } }],
            });
          } catch {}
          return;
        }

        Alert.alert(
          'College Admin Status Not Found',
          'Your account is not registered as a College Admin.',
          [
            {
              text: 'Request Admin Access',
              onPress: () => {
                setSelectedContextRole('college_admin');
                navigation.navigate('RoleSelection', {
                  contextRole: 'college_admin',
                  initialStep: 3,
                });
              },
            },
            {
              text: 'Continue to App',
              onPress: () => {
                try {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                  });
                } catch {}
              },
            },
          ],
        );
        return;
      }

      // ── DEFAULT STUDENT / SENIOR CONTEXT ──
      if (result.isNewUser) {
        try {
          navigation.reset({
            index: 0,
            routes: [
              contextRole
                ? { name: 'RoleSelection', params: { contextRole } }
                : { name: 'RoleSelection' },
            ],
          });
        } catch {
          // Navigation handled declaratively by AuthStore state change
        }
        return;
      }

      // CASE 2: Returning Student / Senior User -> Reset navigation directly to MainTabs!
      try {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } catch {
        // Navigation handled declaratively by AuthStore state change
      }
      return;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : ERRORS.AUTH_FAILED;

      if (!message.includes('cancel') && !message.includes('CANCELED')) {
        setError(message);
      }
    } finally {
      setIsLoading(false);
      setAuthenticating(false);
    }
  }, [
    navigation,
    contextRole,
    setUser,
    setSession,
    setIsNewUser,
    setAuthenticating,
    setSelectedContextRole,
    signOut,
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#3D52A0" />
      <View style={styles.container}>
        {/* Top Section (45% height) */}
        <View style={styles.topSection}>
          <TouchableOpacity
            testID="login-back-button"
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back">
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>KV</Text>
          </View>
          <Text style={styles.appNameText}>Knowledge Vault</Text>
          <Text style={styles.taglineText}>
            Don't let knowledge graduate with you
          </Text>
        </View>

        {/* Bottom Section (55% height) */}
        <View style={styles.bottomSection}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.subtitleText}>{getSubtitle()}</Text>

          <GoogleSignInButton
            onPress={handleGoogleSignIn}
            isLoading={isLoading}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Text style={styles.footerNote}>
            New here? Your account is created automatically
          </Text>

          <View style={styles.legalFooter} testID="login-legal-footer">
            <Text style={styles.legalText}>
              By signing in you agree to our{' '}
              <Text
                style={styles.legalLink}
                onPress={() => navigation.navigate('PrivacyPolicy')}
                testID="link-terms-of-service"
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                style={styles.legalLink}
                onPress={() => navigation.navigate('PrivacyPolicy')}
                testID="link-privacy-policy"
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#3D52A0',
  },
  container: {
    flex: 1,
    backgroundColor: '#3D52A0',
  },
  topSection: {
    height: '45%',
    backgroundColor: '#3D52A0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3D52A0',
  },
  appNameText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  taglineText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 6,
    textAlign: 'center',
  },
  bottomSection: {
    height: '55%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  subtitleText: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 32,
    marginTop: 6,
  },
  errorText: {
    color: '#DC3545',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  footerNote: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
    marginTop: 16,
  },
  legalFooter: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  legalText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: '#3D52A0',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
