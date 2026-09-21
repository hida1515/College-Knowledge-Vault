/**
 * Subject Browse Screen
 * College Knowledge Vault
 *
 * Displays academic subjects grouped by semester, allowing students
 * to tap any subject to view all corresponding knowledge entries.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/material-icons';
import { supabase } from '../../../core/services/supabase';
import { useAuthStore } from '../../../core/store/authStore';

interface SubjectItem {
  subject: string;
  semester: number;
  count: number;
}

export const SubjectBrowseScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [subjectsBySem, setSubjectsBySem] = useState<Record<number, SubjectItem[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadSubjects() {
      try {
        let query = supabase
          .from('entries')
          .select('subject, semester')
          .eq('status', 'approved')
          .eq('is_deleted', false);

        if (user?.collegeId) {
          query = query.eq('college_id', user.collegeId);
        }

        const { data, error } = await query;
        if (error || !data) {
          setIsLoading(false);
          return;
        }

        const grouped: Record<number, Record<string, number>> = {};
        for (const row of data) {
          const sem = row.semester || 1;
          const sub = (row.subject || 'General').trim();
          if (!grouped[sem]) grouped[sem] = {};
          grouped[sem][sub] = (grouped[sem][sub] || 0) + 1;
        }

        const result: Record<number, SubjectItem[]> = {};
        for (const sStr of Object.keys(grouped)) {
          const s = parseInt(sStr, 10);
          result[s] = Object.entries(grouped[s]).map(([subject, count]) => ({
            subject,
            semester: s,
            count,
          }));
        }

        setSubjectsBySem(result);
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }

    loadSubjects();
  }, [user?.collegeId]);

  const semesters = Object.keys(subjectsBySem)
    .map((s) => parseInt(s, 10))
    .sort((a, b) => a - b);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          testID="button-subjects-back"
        >
          <Icon name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browse by Subject</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer} testID="subjects-loading">
          <ActivityIndicator size="large" color="#3D52A0" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {semesters.length === 0 ? (
            <View style={styles.emptyContainer} testID="subjects-empty-state">
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyTitle}>No subjects recorded yet</Text>
              <Text style={styles.emptyText}>
                Be the first to submit a guide or resource under your semester subjects!
              </Text>
            </View>
          ) : (
            semesters.map((sem) => (
              <View key={sem} style={styles.semesterSection} testID={`semester-section-${sem}`}>
                <Text style={styles.semHeader}>Semester {sem}</Text>
                <View style={styles.subjectGrid}>
                  {subjectsBySem[sem].map((subItem) => (
                    <TouchableOpacity
                      key={subItem.subject}
                      style={styles.subjectCard}
                      onPress={() => {
                        navigation.navigate('HomeTab', {
                          screen: 'Home',
                          params: { subject: subItem.subject, semester: sem },
                        });
                      }}
                      testID={`subject-card-${subItem.subject.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <Text style={styles.subjectName}>{subItem.subject}</Text>
                      <Text style={styles.subjectCount}>{subItem.count} entries</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },
  semesterSection: { marginBottom: 20 },
  semHeader: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 10 },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: '45%',
    flex: 1,
  },
  subjectName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  subjectCount: { fontSize: 11, color: '#64748B', marginTop: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 44, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  emptyText: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 20 },
});

export default SubjectBrowseScreen;
