import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, FontSize, Spacing, Radius, FontWeight } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F14', '#16161D', '#1a1a2e']}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow orb */}
      <View style={styles.glowOrb} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoMark}>
              <Text style={styles.logoLetter}>G</Text>
            </View>
            <Text style={styles.appName}>gocha</Text>
          </View>

          {/* Hero text */}
          <View style={styles.heroContainer}>
            <Text style={styles.heroTitle}>
              Plan.{'\n'}
              Connect.{'\n'}
              Remember.
            </Text>
            <Text style={styles.heroSubtitle}>
              Your execution system. What you planned, what's happening around you, and what actually happened.
            </Text>
          </View>

          {/* Value pillars */}
          <View style={styles.pillarsRow}>
            {[
              { emoji: '🎯', label: 'Execute' },
              { emoji: '🔗', label: 'Connect' },
              { emoji: '📸', label: 'Remember' },
            ].map((p) => (
              <View key={p.label} style={styles.pillar}>
                <Text style={styles.pillarEmoji}>{p.emoji}</Text>
                <Text style={styles.pillarLabel}>{p.label}</Text>
              </View>
            ))}
          </View>

          {/* CTAs */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.brand.primary, Colors.brand.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  glowOrb: {
    position: 'absolute',
    top: height * 0.1,
    left: width / 2 - 150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.brand.primary,
    opacity: 0.07,
  },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing['2xl'],
    justifyContent: 'space-between',
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['3xl'],
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  appName: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    letterSpacing: 1,
  },
  heroContainer: { flex: 1, justifyContent: 'center' },
  heroTitle: {
    fontSize: FontSize['5xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.text.primary,
    lineHeight: FontSize['5xl'] * 1.1,
    marginBottom: Spacing.lg,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: FontSize.md,
    color: Colors.text.secondary,
    lineHeight: FontSize.md * 1.6,
    maxWidth: '90%',
  },
  pillarsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  pillar: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  pillarEmoji: { fontSize: 22 },
  pillarLabel: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    fontWeight: FontWeight.medium,
  },
  ctaContainer: { gap: Spacing.md },
  primaryButton: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  primaryGradient: {
    paddingVertical: Spacing.base + 2,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    fontWeight: FontWeight.medium,
  },
});
