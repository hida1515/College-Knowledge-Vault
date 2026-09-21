/**
 * Submit Step 3 — Add Tags
 * College Knowledge Vault
 *
 * Screen 3 of 5 in knowledge entry submission flow.
 * Allows selecting predefined tech stack tags or adding custom tags.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSubmitContext } from '../context/SubmitFormContext';
import { SubmitProgressHeader } from '../components/SubmitProgressHeader';
import { TagPill } from '../../../shared/components/TagPill';
import { useTags } from '../../../core/hooks/useEntries';
import type { SubmitStackParamList } from '../../../core/types/navigation.types';

type SubmitNavProp = NativeStackNavigationProp<
  SubmitStackParamList,
  'SubmitStep3Tags'
>;

const DEFAULT_PREDEFINED_TAGS = [
  'React Native',
  'React',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Python',
  'Java',
  'Kotlin',
  'Flutter',
  'Supabase',
  'Firebase',
  'MongoDB',
  'PostgreSQL',
  'MySQL',
  'AWS',
  'Docker',
  'Git',
  'REST API',
];

const SubmitStep3Tags: React.FC = () => {
  const navigation = useNavigation<SubmitNavProp>();
  const {
    selectedTags,
    addTag,
    removeTag,
    nextStep,
    previousStep,
  } = useSubmitContext();

  const { data: dbTags } = useTags();
  const availableTags =
    dbTags && dbTags.length > 0 ? dbTags : DEFAULT_PREDEFINED_TAGS;

  const [inputCustomTag, setInputCustomTag] = useState('');

  const handleAddCustomTag = () => {
    if (inputCustomTag.trim()) {
      addTag(inputCustomTag.trim());
      setInputCustomTag('');
    }
  };

  const isFormValid = selectedTags.length >= 1;

  const handleNext = () => {
    if (isFormValid) {
      nextStep();
      navigation.navigate('SubmitStep4Viva');
    }
  };

  const handleBack = () => {
    previousStep();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <SubmitProgressHeader
          currentStep={2}
          title="Add Tags"
          subtitle="Add relevant tags for discoverability (at least 1 required)"
          onBack={handleBack}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Selected Tags Display */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              Selected Tags ({selectedTags.length})
            </Text>
            {selectedTags.length === 0 ? (
              <Text style={styles.emptyTagsText}>
                No tags selected yet. Tap a tag below or add a custom tag.
              </Text>
            ) : (
              <View style={styles.tagsContainer}>
                {selectedTags.map((tag) => (
                  <TagPill
                    key={tag}
                    name={tag}
                    isSelected
                    onRemove={() => removeTag(tag)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Predefined Tech Stack Chips */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Tech Stack & Topics</Text>
            <View style={styles.tagsContainer}>
              {availableTags.map((tag) => {
                const isSelected = selectedTags.some(
                  (t) => t.toLowerCase() === tag.toLowerCase(),
                );
                return (
                  <TagPill
                    key={tag}
                    name={tag}
                    isSelected={isSelected}
                    onPress={() =>
                      isSelected ? removeTag(tag) : addTag(tag)
                    }
                  />
                );
              })}
            </View>
          </View>

          {/* Custom Tag Input */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Add Custom Tag</Text>
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customInput}
                placeholder="e.g. GraphQL, Redux, Jetpack"
                placeholderTextColor="#999999"
                value={inputCustomTag}
                onChangeText={setInputCustomTag}
                onSubmitEditing={handleAddCustomTag}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddCustomTag}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !isFormValid && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!isFormValid}
            activeOpacity={0.85}
            testID="step3-next-button"
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
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 10,
  },
  emptyTagsText: {
    fontSize: 13,
    color: '#6C757D',
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A2E',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#3D52A0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
});

export default SubmitStep3Tags;
