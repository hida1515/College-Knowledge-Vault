/**
 * Privacy Policy Screen
 * College Knowledge Vault
 *
 * Full compliance with DPDP Act 2023 & Google Play Store Policies.
 * Readable without sign-in and from Profile settings.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Bar */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            testID="btn-privacy-back"
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle} testID="privacy-policy-title">Privacy Policy</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        testID="privacy-policy-scroll"
      >
        <Text style={styles.effectiveDate}>Effective Date: September 20, 2024</Text>
        <Text style={styles.introText}>
          College Knowledge Vault (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting
          your privacy in compliance with India&apos;s Digital Personal Data Protection (DPDP) Act 2023
          and global platform safety standards. This Privacy Policy details how we handle your information.
        </Text>

        {/* Section 1 */}
        <View style={styles.section} testID="privacy-section-1">
          <Text style={styles.sectionTitle}>1. What We Collect</Text>
          <Text style={styles.paragraph}>
            We collect only the essential information necessary to provide an isolated, academic repository experience:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Google Account Info:</Text> Your name and email address provided via Google Sign-In for authentication.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>College Information:</Text> Your verified college affiliation for institutional content isolation.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Academic Program Details:</Text> Degree, department, and joining year strictly used for automatic academic standing computation (student vs senior).</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Knowledge Submissions:</Text> Project reports, viva questions, guides, and learning resources you choose to publish.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Engagement Data:</Text> Entries you upvote, bookmark, or comment on within your college vault.</Text>
          </View>
        </View>

        {/* Section 2 */}
        <View style={styles.section} testID="privacy-section-2">
          <Text style={styles.sectionTitle}>2. How We Use It</Text>
          <Text style={styles.paragraph}>
            Your information is used exclusively for academic and platform operations:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• To authenticate you and display content relevant to your specific college.</Text>
            <Text style={styles.bulletPoint}>• To calculate your access level (Student vs Senior contributor) automatically.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>We do NOT sell your data</Text> to data brokers, advertisers, or third parties.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>We do NOT share your data</Text> with commercial entities for marketing.</Text>
          </View>
        </View>

        {/* Section 3 */}
        <View style={styles.section} testID="privacy-section-3">
          <Text style={styles.sectionTitle}>3. Who Sees Your Data</Text>
          <Text style={styles.paragraph}>
            Data visibility is governed by multi-tenant college boundaries:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Submitted Entries:</Text> Visible to verified members of your own college once approved.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Public Profile:</Text> Your display name and department are visible to peers in your college.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Bookmarks &amp; Upvotes:</Text> Strictly private to your account.</Text>
          </View>
        </View>

        {/* Section 4 */}
        <View style={styles.section} testID="privacy-section-4">
          <Text style={styles.sectionTitle}>4. Data Deletion</Text>
          <Text style={styles.paragraph}>
            In compliance with Google Play Data Safety policies:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• You can delete your account anytime from your Profile settings via the &quot;Delete Account&quot; option.</Text>
            <Text style={styles.bulletPoint}>• Account deletion permanently removes your personal identity, email, bookmarks, upvotes, and credentials immediately.</Text>
            <Text style={styles.bulletPoint}>• Academic knowledge submissions remain anonymously in the vault to benefit future students without any link to your identity.</Text>
          </View>
        </View>

        {/* Section 5 */}
        <View style={styles.section} testID="privacy-section-5">
          <Text style={styles.sectionTitle}>5. Third-Party Services</Text>
          <Text style={styles.paragraph}>
            We integrate with trusted infrastructure providers that adhere to high security and privacy standards:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Google Sign-In:</Text> User authentication (subject to Google Privacy Policy).</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Supabase:</Text> Encrypted database and backend storage (subject to Supabase Privacy Policy).</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Firebase Cloud Messaging:</Text> Push notifications for moderation alerts (subject to Google Privacy Policy).</Text>
          </View>
        </View>

        {/* Section 6 */}
        <View style={styles.section} testID="privacy-section-6">
          <Text style={styles.sectionTitle}>6. Contact &amp; Grievance Redressal</Text>
          <Text style={styles.paragraph}>
            If you have questions regarding this Privacy Policy or wish to exercise data rights under the DPDP Act 2023:
          </Text>
          <View style={styles.contactCard}>
            <Text style={styles.contactItem}><Text style={styles.bold}>Grievance Officer:</Text> College Knowledge Vault Privacy Team</Text>
            <Text style={styles.contactItem}><Text style={styles.bold}>Email:</Text> privacy@collegekv.app</Text>
            <Text style={styles.contactItem}><Text style={styles.bold}>In-App Data Deletion:</Text> Profile Screen → Settings → Delete Account</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3D52A0',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  effectiveDate: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  introText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletList: {
    paddingLeft: 4,
  },
  bulletPoint: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 6,
  },
  bold: {
    fontWeight: '700',
    color: '#1E293B',
  },
  contactCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  contactItem: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default PrivacyPolicyScreen;
