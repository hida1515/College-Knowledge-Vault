/**
 * Submit Step 1 — Type Selection
 * College Knowledge Vault
 *
 * Screen 1 of 5 in knowledge entry submission flow.
 * Displays 2x2 grid of entry types (Project, Viva, Mistake, Resource).
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSubmitContext } from '../context/SubmitFormContext';
import { SubmitProgressHeader } from '../components/SubmitProgressHeader';
import { EntryType } from '../../../core/types/entry.types';
import { SUBMISSION_DRAFT_KEY } from '../hooks/useSubmitForm';
import type { SubmitStackParamList } from '../../../core/types/navigation.types';
import { useAuthStore } from '../../../core/store/authStore';
import { computeEffectiveRole, canSubmitEntries } from '../../../core/utils/roleChecker';
import { EffectiveRole, UserProfile } from '../../../core/types/user.types';

type SubmitNavProp = NativeStackNavigationProp<
  SubmitStackParamList,
  'SubmitStep1Type'
>;

interface TypeOption {
  type: EntryType;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    type: EntryType.Project,
    title: 'Project Summary',
    description: 'Share your complete project experience',
    icon: '📁',
    color: '#3D52A0',
    bgColor: '#EEF0FB',
  },
  {
    type: EntryType.Viva,
    title: 'Viva Q&A',
    description: 'Share questions you faced in viva',
    icon: '💬',
    color: '#00B4D8',
    bgColor: '#E6F8FC',
  },
  {
    type: EntryType.Mistake,
    title: 'Mistake & Fix',
    description: 'Share a mistake and how you solved it',
    icon: '🐛',
    color: '#FF6B6B',
    bgColor: '#FFEAEA',
  },
  {
    type: EntryType.Resource,
    title: 'Resource Link',
    description: 'Share a useful resource or tool',
    icon: '🔗',
    color: '#28A745',
    bgColor: '#E8F5E9',
  },
];

const SubmitStep1Type: React.FC = () => {
  const navigation = useNavigation<SubmitNavProp>();
  const { selectedType, setType, nextStep, loadDraft, clearDraft, reset } = useSubmitContext();
  const user = useAuthStore((state) => state.user) as UserProfile | null;

  useEffect(() => {
    async function checkDraft() {
      try {
        const saved = await AsyncStorage.getItem(SUBMISSION_DRAFT_KEY);
        if (!saved) return;
        const draft = JSON.parse(saved);
        const age = Date.now() - new Date(draft.savedAt).getTime();
        if (age > 24 * 60 * 60 * 1000) {
          await AsyncStorage.removeItem(SUBMISSION_DRAFT_KEY);
          return;
        }

        Alert.alert(
          'Resume Draft?',
          `You have an unfinished entry from ${draft.savedAt}. Would you like to continue where you left off?`,
          [
            {
              text: 'Start Fresh',
              style: 'destructive',
              onPress: async () => {
                await clearDraft();
                reset();
              },
            },
            {
              text: 'Continue Draft',
              onPress: async () => {
                await loadDraft();
              },
            },
          ],
        );
      } catch {}
    }
    checkDraft();
  }, [clearDraft, loadDraft, reset]);

  const canSubmit = user ? canSubmitEntries(user) : false;
  const effectiveRole = user ? computeEffectiveRole(user) : EffectiveRole.Student;
  const isFaculty = effectiveRole === EffectiveRole.Faculty || user?.role === 'faculty';

  const availableTypes = useMemo(() => {
    if (isFaculty) {
      return TYPE_OPTIONS.filter((item) => item.type !== EntryType.Project);
    }
    return TYPE_OPTIONS;
  }, [isFaculty]);

  if (user && !canSubmit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.lockedContainer} testID="screen-submission-locked">
          <Text style={styles.lockedEmoji}>🔒</Text>
          <Text style={styles.lockedTitle}>Submission Locked</Text>
          <Text style={styles.lockedDescription}>
            {effectiveRole === EffectiveRole.PendingFaculty
              ? 'Your faculty access is pending verification. You can submit knowledge entries once an admin approves your account.'
              : `Only seniors (graduated students) and verified faculty can share knowledge. You will automatically get submission access in ${user.graduationYear || 'your graduation year'}.`}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSelect = (type: EntryType) => {
    setType(type);
  };

  const handleNext = () => {
    if (selectedType) {
      if (selectedType === EntryType.Project) {
        if (isFaculty) {
          Alert.alert('Restricted', 'Project Guide submissions are reserved for student authors.');
          return;
        }
        navigation.navigate('ProjectSubmissionFlow' as any);
      } else if (selectedType === EntryType.Viva) {
        navigation.navigate('VivaSubmissionFlow' as any);
      } else if (selectedType === EntryType.Mistake) {
        navigation.navigate('MistakeSubmissionFlow' as any);
      } else if (selectedType === EntryType.Resource) {
        navigation.navigate('ResourceSubmissionFlow' as any);
      } else {
        nextStep();
        navigation.navigate('SubmitStep2Details');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <SubmitProgressHeader
          currentStep={0}
          title={isFaculty ? 'Faculty Knowledge Share' : 'Share Your Knowledge'}
          subtitle={
            isFaculty
              ? 'Share viva exam questions, common student mistakes, or study resources'
              : 'What type of knowledge are you sharing?'
          }
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.grid}>
            {availableTypes.map((item) => {
              const isSelected = selectedType === item.type;
              return (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.card,
                    isSelected && {
                      borderColor: item.color,
                      backgroundColor: item.bgColor,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => handleSelect(item.type)}
                  activeOpacity={0.8}
                  testID={`type-card-${item.type}`}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${item.color}20` },
                    ]}
                  >
                    <Text style={styles.iconText}>{item.icon}</Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: item.color }]}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardDesc}>{item.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !selectedType && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!selectedType}
            activeOpacity={0.85}
            testID="step1-next-button"
          >
            <Text style={styles.nextButtonText}>Next Step</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    minHeight: 150,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 16,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  nextButton: {
    backgroundColor: '#3D52A0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F8F9FA',
  },
  lockedEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  lockedDescription: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SubmitStep1Type;
