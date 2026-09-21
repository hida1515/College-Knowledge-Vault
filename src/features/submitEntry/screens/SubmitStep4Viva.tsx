/**
 * Submit Step 4 — Viva Questions
 * College Knowledge Vault
 *
 * Screen 4 of 5 in knowledge entry submission flow.
 * Optional step allowing users to add up to 20 viva Q&A pairs with difficulty rating.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSubmitContext } from '../context/SubmitFormContext';
import { SubmitProgressHeader } from '../components/SubmitProgressHeader';
import type { SubmitStackParamList } from '../../../core/types/navigation.types';

type SubmitNavProp = NativeStackNavigationProp<
  SubmitStackParamList,
  'SubmitStep4Viva'
>;

const SubmitStep4Viva: React.FC = () => {
  const navigation = useNavigation<SubmitNavProp>();
  const {
    vivaQuestions,
    addVivaQuestion,
    removeVivaQuestion,
    nextStep,
    previousStep,
  } = useSubmitContext();

  const [modalVisible, setModalVisible] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    'medium',
  );

  const handleSaveQuestion = () => {
    if (question.trim() && answer.trim()) {
      addVivaQuestion({
        question: question.trim(),
        answer: answer.trim(),
        difficulty,
      });
      setQuestion('');
      setAnswer('');
      setDifficulty('medium');
      setModalVisible(false);
    }
  };

  const handleNext = () => {
    nextStep();
    navigation.navigate('SubmitStep5Review');
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
          currentStep={3}
          title="Viva Questions"
          subtitle="Optional — Add real questions you faced in viva"
          onBack={handleBack}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Add Question Button */}
          <TouchableOpacity
            style={styles.addCardButton}
            onPress={() => setModalVisible(true)}
            disabled={vivaQuestions.length >= 20}
            activeOpacity={0.8}
            testID="add-viva-button"
          >
            <Text style={styles.addCardPlus}>+</Text>
            <Text style={styles.addCardText}>
              {vivaQuestions.length >= 20
                ? 'Maximum 20 Questions Reached'
                : 'Add Viva Question'}
            </Text>
          </TouchableOpacity>

          {/* List of Questions */}
          <Text style={styles.listHeader}>
            Added Questions ({vivaQuestions.length}/20)
          </Text>

          {vivaQuestions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No viva questions added yet. You can skip this step if not applicable.
              </Text>
            </View>
          ) : (
            vivaQuestions.map((q, index) => (
              <View key={index} style={styles.qCard}>
                <View style={styles.qCardHeader}>
                  <View
                    style={[
                      styles.diffBadge,
                      q.difficulty === 'easy' && styles.diffEasy,
                      q.difficulty === 'medium' && styles.diffMedium,
                      q.difficulty === 'hard' && styles.diffHard,
                    ]}
                  >
                    <Text style={styles.diffText}>
                      {q.difficulty.toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeVivaQuestion(index)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.qText} numberOfLines={2}>
                  Q: {q.question}
                </Text>
                <Text style={styles.aText} numberOfLines={2}>
                  A: {q.answer}
                </Text>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.85}
            testID="step4-next-button"
          >
            <Text style={styles.nextButtonText}>
              {vivaQuestions.length === 0 ? 'Skip / Next Step' : 'Next Step'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal Form for adding a Question */}
        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Viva Question</Text>

              <Text style={styles.inputLabel}>Question *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. What is the difference between state and props?"
                placeholderTextColor="#999999"
                value={question}
                onChangeText={setQuestion}
                multiline
              />

              <Text style={styles.inputLabel}>Answer *</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Write the expected or ideal answer..."
                placeholderTextColor="#999999"
                value={answer}
                onChangeText={setAnswer}
                multiline
              />

              <Text style={styles.inputLabel}>Difficulty</Text>
              <View style={styles.diffSelectorRow}>
                {(['easy', 'medium', 'hard'] as const).map((level) => {
                  const isSelected = difficulty === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.diffChip,
                        isSelected && styles.diffChipSelected,
                      ]}
                      onPress={() => setDifficulty(level)}
                    >
                      <Text
                        style={[
                          styles.diffChipText,
                          isSelected && styles.diffChipTextSelected,
                        ]}
                      >
                        {level.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalSaveButton,
                    (!question.trim() || !answer.trim()) &&
                      styles.modalSaveDisabled,
                  ]}
                  onPress={handleSaveQuestion}
                  disabled={!question.trim() || !answer.trim()}
                >
                  <Text style={styles.modalSaveText}>Add Question</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF0FB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#3D52A0',
    padding: 16,
    marginBottom: 20,
  },
  addCardPlus: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3D52A0',
    marginRight: 8,
  },
  addCardText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3D52A0',
  },
  listHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#6C757D',
    textAlign: 'center',
  },
  qCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  qCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diffBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  diffEasy: { backgroundColor: '#E8F5E9' },
  diffMedium: { backgroundColor: '#FFF8E1' },
  diffHard: { backgroundColor: '#FFEBEE' },
  diffText: { fontSize: 10, fontWeight: '700', color: '#1A1A2E' },
  deleteButton: { padding: 4 },
  deleteText: { fontSize: 14, color: '#DC3545', fontWeight: '700' },
  qText: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  aText: { fontSize: 13, color: '#6C757D' },
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
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#1A1A2E',
    marginBottom: 12,
  },
  modalTextArea: { minHeight: 70 },
  diffSelectorRow: { flexDirection: 'row', marginBottom: 20 },
  diffChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  diffChipSelected: { backgroundColor: '#3D52A0', borderColor: '#3D52A0' },
  diffChipText: { fontSize: 12, color: '#6C757D', fontWeight: '600' },
  diffChipTextSelected: { color: '#FFFFFF' },
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalCancelButton: { paddingVertical: 10, paddingHorizontal: 16, marginRight: 8 },
  modalCancelText: { color: '#6C757D', fontSize: 14, fontWeight: '600' },
  modalSaveButton: { backgroundColor: '#3D52A0', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  modalSaveDisabled: { opacity: 0.5 },
  modalSaveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});

export default SubmitStep4Viva;
