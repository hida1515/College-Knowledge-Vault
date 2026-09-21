/**
 * Navigation Configuration
 * College Knowledge Vault
 *
 * Auth-gated navigation with computed effective role guards,
 * persistent pending role banners, College Admin panel, and Super Admin panel.
 */

import React, { useEffect } from 'react';
import { supabase } from '../core/services/supabase';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNavigationContainerRef } from '@react-navigation/native';
import Icon, { type MaterialIconsIconName } from '@react-native-vector-icons/material-icons';
import { SubmitFormProvider } from '../features/submitEntry/context/SubmitFormContext';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Type imports
import {
  RootStackParamList,
  TabParamList,
  HomeStackParamList,
  SearchStackParamList,
  SubmitStackParamList,
  ProfileStackParamList,
} from '../core/types/navigation.types';

// Auth store & Role utilities
import { useAuthStore } from '../core/store/authStore';
import { UserProfile, EffectiveRole, UserRole } from '../core/types/user.types';
import {
  computeEffectiveRole,
  canSubmitEntries,
  canManageCollege,
  canAccessSuperAdmin,
} from '../core/utils/roleChecker';

// Screen imports — Auth & Onboarding
import LandingScreen from '../features/auth/screens/LandingScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RoleSelectionScreen from '../features/auth/screens/RoleSelectionScreen';
import PendingAccessScreen from '../features/auth/screens/PendingAccessScreen';
import OnboardingScreen from '../features/onboarding/screens/OnboardingScreen';

// Screen imports — Home
import HomeScreen from '../features/home/screens/HomeScreen';
import EntryDetailScreen from '../features/entryDetail/screens/EntryDetailScreen';
import SubjectBrowseScreen from '../features/home/screens/SubjectBrowseScreen';

// Screen imports — Bookmarks
import BookmarksScreen from '../features/bookmarks/screens/BookmarksScreen';

// Screen imports — Search
import SearchScreen from '../features/search/screens/SearchScreen';

// Screen imports — Submit
import SubmitStep1Type from '../features/submitEntry/screens/SubmitStep1Type';
import SubmitStep2Details from '../features/submitEntry/screens/SubmitStep2Details';
import SubmitStep3Tags from '../features/submitEntry/screens/SubmitStep3Tags';
import SubmitStep4Viva from '../features/submitEntry/screens/SubmitStep4Viva';
import SubmitStep5Review from '../features/submitEntry/screens/SubmitStep5Review';
import ProjectSubmissionFlow from '../features/submitEntry/screens/project/ProjectSubmissionFlow';
import VivaSubmissionFlow from '../features/submitEntry/screens/viva/VivaSubmissionFlow';
import MistakeSubmissionFlow from '../features/submitEntry/screens/mistake/MistakeSubmissionFlow';
import ResourceSubmissionFlow from '../features/submitEntry/screens/resource/ResourceSubmissionFlow';

// Screen imports — Profile & Dashboard
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import DashboardScreen from '../features/dashboard/screens/DashboardScreen';

// Screen imports — Admin & College Admin
import AdminHomeScreen from '../features/admin/screens/AdminHomeScreen';
import ModerationDetailScreen from '../features/admin/screens/ModerationDetailScreen';
import UserManagementScreen from '../features/admin/screens/UserManagementScreen';
import CollegeAdminScreen from '../features/collegeAdmin/screens/CollegeAdminScreen';
import SuperAdminScreen from '../features/superAdmin/screens/SuperAdminScreen';
import FacultyModerationScreen from '../features/faculty/screens/FacultyModerationScreen';
import PrivacyPolicyScreen from '../features/legal/screens/PrivacyPolicyScreen';
import EditProfileScreen from '../features/profile/screens/EditProfileScreen';

// Constants
import { colors } from '../shared/constants/colors';
import { NAV, APP_NAME } from '../core/constants/appConstants';

// ---------- Stack Navigators ----------

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const SubmitStack = createNativeStackNavigator<SubmitStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const Tab = createBottomTabNavigator<TabParamList>();

// ---------- Home Stack ----------

function HomeStackScreen() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="EntryDetail" component={EntryDetailScreen} />
      <HomeStack.Screen name="SubjectBrowse" component={SubjectBrowseScreen} />
      <HomeStack.Screen name="Bookmarks" component={BookmarksScreen} />
    </HomeStack.Navigator>
  );
}

// ---------- Search Stack ----------

function SearchStackScreen() {
  return (
    <SearchStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <SearchStack.Screen name="Search" component={SearchScreen} />
      <SearchStack.Screen name="EntryDetail" component={EntryDetailScreen} />
    </SearchStack.Navigator>
  );
}

// ---------- Submit Stack ----------

function SubmitStackScreen() {
  return (
    <SubmitStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <SubmitStack.Screen name="SubmitStep1Type" component={SubmitStep1Type} />
      <SubmitStack.Screen name="SubmitStep2Details" component={SubmitStep2Details} />
      <SubmitStack.Screen name="SubmitStep3Tags" component={SubmitStep3Tags} />
      <SubmitStack.Screen name="SubmitStep4Viva" component={SubmitStep4Viva} />
      <SubmitStack.Screen name="SubmitStep5Review" component={SubmitStep5Review} />
      <SubmitStack.Screen name="ProjectSubmissionFlow" component={ProjectSubmissionFlow} />
      <SubmitStack.Screen name="VivaSubmissionFlow" component={VivaSubmissionFlow} />
      <SubmitStack.Screen name="MistakeSubmissionFlow" component={MistakeSubmissionFlow} />
      <SubmitStack.Screen name="ResourceSubmissionFlow" component={ResourceSubmissionFlow} />
    </SubmitStack.Navigator>
  );
}

// ---------- Profile Stack ----------

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="Dashboard" component={DashboardScreen} />
      <ProfileStack.Screen name="ModerationQueue" component={FacultyModerationScreen} />
      <ProfileStack.Screen name="Bookmarks" component={BookmarksScreen} />
      <ProfileStack.Screen name="AdminHome" component={AdminHomeScreen} />
      <ProfileStack.Screen name="ModerationDetail" component={ModerationDetailScreen} />
      <ProfileStack.Screen name="UserManagement" component={UserManagementScreen} />
    </ProfileStack.Navigator>
  );
}

// ---------- Tab Navigator ----------

const renderTabBarIcon = (route: { name: string }) => ({ color, size }: { color: string; size: number }) => {
  let iconName: MaterialIconsIconName;

  switch (route.name) {
    case 'HomeTab':
      iconName = 'home';
      break;
    case 'SearchTab':
      iconName = 'search';
      break;
    case 'ReviewTab':
      iconName = 'rate-review';
      break;
    case 'SubmitTab':
      iconName = 'add-circle-outline';
      break;
    case 'ProfileTab':
      iconName = 'person';
      break;
    case 'CollegeAdminTab':
      iconName = 'school';
      break;
    case 'AdminTab':
      iconName = 'admin-panel-settings';
      break;
    default:
      iconName = 'circle';
  }

  return <Icon name={iconName} size={size} color={color} />;
};

function TabNavigator() {
  const user = useAuthStore((state) => state.user) as UserProfile | null;
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const effectiveRole = user ? computeEffectiveRole(user) : EffectiveRole.Student;

  const isSuperAdmin = canAccessSuperAdmin(user as UserProfile);
  const isCollegeAdmin = canManageCollege(user as UserProfile) && !isSuperAdmin;
  const isFaculty = effectiveRole === EffectiveRole.Faculty || user?.role === 'faculty';
  const isPendingCollegeAdmin = user?.pendingRoleRequest === 'college_admin';

  // Determine initial route for each role:
  const initialRouteName = isSuperAdmin
    ? 'AdminTab'
    : isCollegeAdmin
    ? 'CollegeAdminTab'
    : isFaculty
    ? 'ReviewTab'
    : 'HomeTab';

  // Sync latest user profile on tab load if user currently has a pending request
  useEffect(() => {
    if (user?.pendingRoleRequest) {
      refreshProfile();
    }
  }, [refreshProfile, user?.pendingRoleRequest]);

  return (
    <SubmitFormProvider>
      <View style={tabStyles.container}>
        {/* Persistent Banners for Pending Roles */}
        {isPendingCollegeAdmin ? (
          <View style={tabStyles.pendingCollegeAdminBanner} testID="banner-pending-college-admin">
            <Text style={tabStyles.pendingCollegeAdminBannerText}>
              ⏳ College Admin request pending. Platform Super Admin will review shortly.
            </Text>
          </View>
        ) : effectiveRole === EffectiveRole.PendingFaculty ? (
          <View style={tabStyles.pendingFacultyBanner} testID="banner-pending-faculty">
            <Text style={tabStyles.pendingFacultyBannerText}>
              ⏳ Faculty verification pending. Contact your College Admin for approval.
            </Text>
          </View>
        ) : null}

      <Tab.Navigator
        initialRouteName={initialRouteName}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            backgroundColor: colors.tabBackground,
            borderTopColor: colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500' as const,
          },
          tabBarIcon: renderTabBarIcon(route),
        })}>
        {/* Super Admin Tab — Primary tab for Super Admin */}
        {isSuperAdmin && (
          <Tab.Screen
            name="AdminTab"
            component={SuperAdminScreen}
            options={{ tabBarLabel: 'Admin' }}
          />
        )}

        {/* College Admin Tab — Primary tab for College Admin */}
        {isCollegeAdmin && (
          <Tab.Screen
            name="CollegeAdminTab"
            component={CollegeAdminScreen}
            options={{ tabBarLabel: 'College' }}
          />
        )}

        <Tab.Screen
          name="HomeTab"
          component={HomeStackScreen}
          options={{ tabBarLabel: NAV.TAB_HOME }}
        />

        <Tab.Screen
          name="SearchTab"
          component={SearchStackScreen}
          options={{ tabBarLabel: NAV.TAB_SEARCH }}
        />

        {/* Review / Moderation Tab — for Verified Faculty & College Admin */}
        {(isFaculty || isCollegeAdmin) && (
          <Tab.Screen
            name="ReviewTab"
            component={FacultyModerationScreen}
            options={{ tabBarLabel: 'Review' }}
          />
        )}

        {/* Submit Tab — Active for Seniors & Faculty, hidden for Administrative roles */}
        {!isSuperAdmin && !isCollegeAdmin && (
          <Tab.Screen
            name="SubmitTab"
            component={SubmitStackScreen}
            options={{ tabBarLabel: NAV.TAB_SUBMIT }}
            listeners={{
              tabPress: (e) => {
                if (user && !canSubmitEntries(user)) {
                  e.preventDefault();
                  Alert.alert(
                    'Permission Denied',
                    'Only graduating seniors and verified faculty can submit knowledge entries.',
                  );
                }
              },
            }}
          />
        )}

        <Tab.Screen
          name="ProfileTab"
          component={ProfileStackScreen}
          options={{ tabBarLabel: NAV.TAB_PROFILE }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              (navigation as any).navigate('ProfileTab', { screen: 'Profile' });
            },
          })}
        />
      </Tab.Navigator>
    </View>
    </SubmitFormProvider>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pendingFacultyBanner: {
    backgroundColor: '#FFF8E7',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingFacultyBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B78103',
    textAlign: 'center',
  },
  pendingCollegeAdminBanner: {
    backgroundColor: '#FFF3E0',
    borderBottomWidth: 1,
    borderBottomColor: '#FFB74D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCollegeAdminBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
    textAlign: 'center',
  },
});

// ---------- Splash / Loading Screen ----------

function SplashScreen() {
  return (
    <View style={splashStyles.container}>
      <View style={splashStyles.logoIcon}>
        <Text style={splashStyles.logoEmoji}>🎓</Text>
      </View>
      <Text style={splashStyles.appName}>{APP_NAME}</Text>
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={splashStyles.spinner}
      />
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  logoIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: `${colors.primary}25`,
  },
  logoEmoji: {
    fontSize: 44,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  spinner: {
    marginTop: 8,
  },
});

// ---------- Deep Linking Configuration ----------

export const linking = {
  prefixes: ['knowledge-vault://', 'https://knowledgevault.app'],
  config: {
    screens: {
      EntryDetail: 'entry/:entryId',
      MainTabs: {
        screens: {
          ProfileTab: {
            screens: {
              Profile: 'profile/:userId',
            },
          },
        },
      },
    },
  },
};

// ---------- Root Navigator ----------

export function RootNavigator() {
  const { isAuthenticated, isLoading, hasOnboarded, isNewUser, user } = useAuthStore();

  useEffect(() => {
    async function verifySession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          useAuthStore.getState().reset();
        }
      } catch {
        useAuthStore.getState().reset();
      }
    }
    verifySession();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  // When user has no college assigned and no pending request, force RoleSelection
  const isUserUnassigned =
    Boolean(user) &&
    !user?.isSuperAdmin &&
    (!user?.collegeId || !user?.college) &&
    !user?.pendingRoleRequest;

  const hasIncompleteFacultyOnboarding = user?.role === UserRole.Faculty && !user?.collegeId;
  const shouldShowRoleSelection = isNewUser || hasIncompleteFacultyOnboarding || isUserUnassigned;

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      {!hasOnboarded && (
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
      )}
      {!isAuthenticated ? (
        <>
          <RootStack.Screen name="Landing" component={LandingScreen} />
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen
            name="RoleSelection"
            component={RoleSelectionScreen}
            options={{ gestureEnabled: true }}
          />
          <RootStack.Screen name="PendingAccess" component={PendingAccessScreen} />
        </>
      ) : shouldShowRoleSelection ? (
        <>
          <RootStack.Screen
            name="RoleSelection"
            component={RoleSelectionScreen}
            options={{ gestureEnabled: isNewUser }}
          />
          <RootStack.Screen name="PendingAccess" component={PendingAccessScreen} />
        </>
      ) : (
        <>
          <RootStack.Screen name="MainTabs" component={TabNavigator} />
          <RootStack.Screen
            name="RoleSelection"
            component={RoleSelectionScreen}
            options={{ gestureEnabled: isNewUser }}
          />
          <RootStack.Screen name="PendingAccess" component={PendingAccessScreen} />
          <RootStack.Screen name="Bookmarks" component={BookmarksScreen} />
          <RootStack.Screen name="SubjectBrowse" component={SubjectBrowseScreen} />
          <RootStack.Screen name="EntryDetail" component={EntryDetailScreen} />
        </>
      )}
      <RootStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
    </RootStack.Navigator>
  );
}
