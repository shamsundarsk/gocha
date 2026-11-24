import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  ScrollView, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Colors, FontSize, Spacing, Radius, FontWeight } from '@/constants/theme';
import { userApi } from '@/services/api';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    emoji: '🎯',
    title: 'Tell it what you want to do',
    body: 'Speak or type naturally. The system turns your intentions into a smart, adaptive schedule.',
    color: Colors.brand.primary,
  },
  {
    emoji: '🔗',
    title: 'Connect your world',
    body: 'Calendar, fitness, location, and weather all feed into one unified context. Your schedule adapts to reality.',
    color: '#8B5CF6',
  },
  {
    emoji: '⚡',
    title: "Always know what's next",
    body: "The widget and home screen always answer: what should I do right now? No searching, no second-guessing.",
    color: '#06B6D4',
  },
  {
    emoji: '📍',
    title: "Discover what's around you",
    body: 'Events, workshops, meetups nearby — surfaced automatically based on your interests and free time.',
    color: '#10B981',
  },
  {
    emoji: '✨',
    title: 'Remember what actually happened',
    body: 'Day Wrapped shows what you accomplished, how you moved, what you experienced. No journal needed.',
    color: '#F59E0B',
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    setStep(page);
  };

  const goNext = () => {
    if (step < STEPS.length - 1) {
      scrollRef.current?.scrollTo({ x: (step + 1) * width, animated: true });
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    // Request location permission
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch {}
    // Enable demo mode by default for new users
    try {
      await userApi.updatePreferences({ demo_mode: true });
    } catch {}
    router.replace('/(tabs)');
  };

  const currentColor = STEPS[step].color;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[Colors.bg.primary, Colors.bg.secondary]} style={StyleSheet.absoluteFill} />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {STEPS.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={[styles.emojiContainer, { backgroundColor: s.color + '20', borderColor: s.color + '40' }]}>
              <Text style={styles.slideEmoji}>{s.emoji}</Text>
            </View>
            <Text style={styles.slideTitle}>{s.title}</Text>
            <Text style={styles.slideBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === step && [styles.dotActive, { backgroundColor: currentColor }],
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={goNext} style={styles.nextButton} activeOpacity={0.85}>
          <LinearGradient
            colors={[currentColor, currentColor + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextGradient}
          >
            <Text style={styles.nextText}>
              {step < STEPS.length - 1 ? 'Next' : "Let's go"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {step < STEPS.length - 1 && (
          <TouchableOpacity onPress={handleFinish}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  slide: {
    flex: 1,
    paddingHorizontal: Spacing['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing['2xl'],
    paddingBottom: 100,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  slideEmoji: { fontSize: 56 },
  slideTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: FontSize['3xl'] * 1.2,
  },
  slideBody: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.6,
    maxWidth: '85%',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.text.muted,
  },
  dotActive: {
    width: 24,
    height: 6,
    borderRadius: 3,
  },
  footer: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing['3xl'],
    gap: Spacing.md,
  },
  nextButton: { borderRadius: Radius.lg, overflow: 'hidden' },
  nextGradient: {
    paddingVertical: Spacing.base + 2,
    alignItems: 'center',
  },
  nextText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
  skipText: {
    textAlign: 'center',
    fontSize: FontSize.base,
    color: Colors.text.muted,
    paddingVertical: Spacing.sm,
  },
});
