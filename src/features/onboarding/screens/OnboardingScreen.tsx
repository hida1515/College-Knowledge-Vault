/**
 * Onboarding Screen
 * College Knowledge Vault
 *
 * 3-page horizontal onboarding flow with paging, page indicators,
 * skip/next/get started controls, and persistence via AsyncStorage & MMKV.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore } from '../../../core/store/authStore';
import { appStorage } from '../../../core/services/mmkvStorage';
import { STORAGE_KEYS } from '../../../core/constants/appConstants';
import type { RootStackParamList } from '../../../core/types/navigation.types';

type OnboardingNavProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

interface OnboardingPageData {
  id: string;
  backgroundColor: string;
  emoji: string;
  title: string;
  description: string;
}

const PAGES: OnboardingPageData[] = [
  {
    id: '1',
    backgroundColor: '#3D52A0',
    emoji: '🎓',
    title: "Don't Let Knowledge Graduate",
    description:
      'Every year, seniors leave with years of hard-won experience. Project mistakes, viva secrets, ideal tech stacks — gone forever. Until now.',
  },
  {
    id: '2',
    backgroundColor: '#7091E6',
    emoji: '📚',
    title: 'Learn From Real Experiences',
    description:
      "Browse knowledge from seniors who've been exactly where you are. Find viva questions, avoid common mistakes, and build better projects.",
  },
  {
    id: '3',
    backgroundColor: '#00B4D8',
    emoji: '🤝',
    title: 'Share Before You Leave',
    description:
      'Graduating? Take 10 minutes to save your experience. Future juniors will thank you — and your knowledge lives on.',
  },
];

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingNavProp>();
  const { width: screenWidth } = useWindowDimensions();
  const { setHasOnboarded } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animated values for dot indicators
  const dotWidths = useRef(PAGES.map((_, i) => new Animated.Value(i === 0 ? 24 : 8))).current;
  const dotOpacities = useRef(PAGES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.4))).current;

  // Complete onboarding function
  const handleCompleteOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem('@onboarding_complete', 'true');
      appStorage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
      setHasOnboarded(true);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Landing' }],
      });
    } catch {
      navigation.navigate('Landing');
    }
  }, [navigation, setHasOnboarded]);

  // Check if onboarding is already completed on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const value = await AsyncStorage.getItem('@onboarding_complete');
        if (value === 'true') {
          handleCompleteOnboarding();
        }
      } catch {
        // Fallback
      }
    }
    checkStatus();
  }, [handleCompleteOnboarding]);

  // Update animated values when currentPage changes
  useEffect(() => {
    PAGES.forEach((_, i) => {
      Animated.parallel([
        Animated.timing(dotWidths[i], {
          toValue: i === currentPage ? 24 : 8,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(dotOpacities[i], {
          toValue: i === currentPage ? 1 : 0.4,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    });
  }, [currentPage, dotWidths, dotOpacities]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / screenWidth);
    if (pageIndex >= 0 && pageIndex < PAGES.length && pageIndex !== currentPage) {
      setCurrentPage(pageIndex);
    }
  };

  const handleNext = () => {
    if (currentPage < PAGES.length - 1) {
      const nextPageIndex = currentPage + 1;
      scrollViewRef.current?.scrollTo({
        x: nextPageIndex * screenWidth,
        animated: true,
      });
    } else {
      handleCompleteOnboarding();
    }
  };

  const currentColor = PAGES[currentPage].backgroundColor;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={currentColor} />
      <View style={[styles.container, { backgroundColor: currentColor }]}>
        {/* Scrollable Pages */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {PAGES.map((page) => (
            <View
              key={page.id}
              style={[
                styles.pageContainer,
                { width: screenWidth, backgroundColor: page.backgroundColor },
              ]}
            >
              {/* Top 60%: Circle with emoji */}
              <View style={styles.topSection}>
                <View style={styles.circle}>
                  <Text style={styles.emojiText}>{page.emoji}</Text>
                </View>
              </View>

              {/* Bottom 40%: Title & Description */}
              <View style={styles.bottomSection}>
                <Text style={styles.titleText}>{page.title}</Text>
                <Text style={styles.descriptionText}>{page.description}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom Fixed Controls */}
        <View style={styles.controlsContainer}>
          {/* Page indicator dots */}
          <View style={styles.dotsContainer}>
            {PAGES.map((page, index) => (
              <Animated.View
                key={page.id}
                style={[
                  styles.dot,
                  {
                    width: dotWidths[index],
                    opacity: dotOpacities[index],
                  },
                ]}
              />
            ))}
          </View>

          {/* Action buttons row */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              onPress={handleCompleteOnboarding}
              style={styles.skipButton}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              style={styles.nextButton}
              activeOpacity={0.85}
            >
              <Text style={[styles.nextText, { color: currentColor }]}>
                {currentPage === PAGES.length - 1 ? 'Get Started' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    paddingHorizontal: 32,
  },
  topSection: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 80,
  },
  bottomSection: {
    flex: 0.4,
    alignItems: 'center',
    paddingTop: 16,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    height: 10,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nextText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default OnboardingScreen;
