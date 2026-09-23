/**
 * Landing Screen
 * College Knowledge Vault
 *
 * Pre-Login Role Selection Landing Screen (Linways style UX routing).
 * Roles selected here set the UI context on LoginScreen.
 * Server-side authentication and role computation always enforce actual permissions.
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/types/navigation.types';
import { UserRole } from '../../../core/types/user.types';
import { colors } from '../../../shared/constants/colors';
import { APP_NAME } from '../../../core/constants/appConstants';

type LandingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Landing'
>;

interface Props {
  navigation: LandingScreenNavigationProp;
}

interface RoleCardData {
  id: string;
  testID: string;
  emoji: string;
  title: string;
  description: string;
  badge?: string;
  contextRole: UserRole | 'college_admin';
}

const ROLE_CARDS: RoleCardData[] = [
  {
    id: 'student',
    testID: 'card-student',
    emoji: '🎓',
    title: 'Student / Senior Login',
    description:
      'Browse knowledge, submit experiences, learn from seniors & placement records.',
    badge: 'Popular',
    contextRole: UserRole.Student,
  },
  {
    id: 'faculty',
    testID: 'card-faculty',
    emoji: '👨‍🏫',
    title: 'Faculty Login',
    description:
      'Verify student posts, endorse valuable insights, and access faculty portal.',
    contextRole: UserRole.Faculty,
  },
  {
    id: 'college_admin',
    testID: 'card-college-admin',
    emoji: '🏫',
    title: 'College Admin Login',
    description:
      'Manage college invite codes, oversee faculty approvals, and govern campus vault.',
    contextRole: 'college_admin',
  },
];

export default function LandingScreen({ navigation }: Props) {
  const handleRoleSelect = (contextRole: UserRole | 'super_admin' | 'college_admin') => {
    navigation.navigate('Login', { contextRole });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../../assets/images/logo_icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>
            Preserving college knowledge, one batch at a time
          </Text>
        </View>

        {/* Role Selection Label */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select Your Portal</Text>
          <Text style={styles.sectionSubtitle}>
            Choose your role to continue to the relevant sign-in option
          </Text>
        </View>

        {/* Middle Section: Role Cards */}
        <View style={styles.cardsContainer}>
          {ROLE_CARDS.map(card => (
            <TouchableOpacity
              key={card.id}
              testID={card.testID}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => handleRoleSelect(card.contextRole)}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Text style={styles.emoji}>{card.emoji}</Text>
                </View>
                {card.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{card.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDescription}>{card.description}</Text>
              <View style={styles.arrowRow}>
                <Text style={styles.arrowText}>Continue</Text>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer: Subtle Super Admin link */}
        <View style={styles.footer}>
          <TouchableOpacity
            testID="card-super-admin"
            style={styles.superAdminButton}
            onPress={() => handleRoleSelect('super_admin')}
            activeOpacity={0.7}>
            <Text style={styles.superAdminText}>
              Platform Admin?
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  logoImage: {
    width: 52,
    height: 52,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  badge: {
    backgroundColor: 'rgba(61, 82, 160, 0.3)',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 14,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#60A5FA',
    marginRight: 6,
  },
  arrowIcon: {
    fontSize: 15,
    color: '#60A5FA',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  superAdminButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  superAdminText: {
    fontSize: 12,
    color: '#64748B',
    textDecorationLine: 'underline',
  },
});
