import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const BENEFITS: { icon: IconName; title: string; detail: string }[] = [
  {
    icon: 'create-outline',
    title: 'Say it naturally',
    detail: 'Turn one sentence into a realistic plan.',
  },
  {
    icon: 'git-compare-outline',
    title: 'Adjust as life changes',
    detail: 'Your plan responds to weather, time, and commitments.',
  },
  {
    icon: 'bookmark-outline',
    title: 'Remember the day',
    detail: 'See what happened without keeping a journal.',
  },
];

export default function WelcomeScreen() {
  const { height } = useWindowDimensions();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={[styles.content, { minHeight: Math.max(620, height - 44) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>g</Text>
            </View>
            <Text style={styles.brandName}>gocha</Text>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>A day that keeps up</Text>
            <Text style={styles.heroTitle}>Make a plan.{`\n`}Keep it real.</Text>
            <Text style={styles.heroBody}>
              Gocha connects what you want to do with the day you are actually having—so your schedule
              stays useful, not just full.
            </Text>
          </View>

          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewLabel}>Next up</Text>
                <Text style={styles.previewDate}>Today · 10:00 AM</Text>
              </View>
              <View style={styles.previewIcon}>
                <Ionicons name="arrow-forward" size={18} color={Colors.brand.secondary} />
              </View>
            </View>

            <Text style={styles.previewTitle}>Finish the project brief</Text>
            <View style={styles.previewMetaRow}>
              <View style={styles.durationBadge}>
                <Ionicons name="time-outline" size={14} color={Colors.text.secondary} />
                <Text style={styles.durationText}>90 min</Text>
              </View>
              <Text style={styles.previewMeta}>Deep work</Text>
            </View>

            <View style={styles.adaptationRow}>
              <View style={styles.adaptationIcon}>
                <Ionicons name="partly-sunny-outline" size={17} color={Colors.accent.amber} />
              </View>
              <View style={styles.adaptationCopy}>
                <Text style={styles.adaptationTitle}>Your run moved to 6:30 PM</Text>
                <Text style={styles.adaptationText}>It will be 38°C at 6 AM.</Text>
              </View>
            </View>
          </View>

          <View style={styles.benefits}>
            {BENEFITS.map((benefit, index) => (
              <View key={benefit.title} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name={benefit.icon} size={18} color={Colors.brand.secondary} />
                </View>
                <View style={styles.benefitCopy}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDetail}>{benefit.detail}</Text>
                </View>
                {index < BENEFITS.length - 1 ? <View style={styles.benefitLine} /> : null}
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => router.push('/(auth)/register')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Create your account</Text>
              <Ionicons name="arrow-forward" size={19} color={Colors.white} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/(auth)/login')}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>I already have an account</Text>
            </Pressable>

            <Text style={styles.legalText}>
              Your location is optional and stored at roughly 1 km precision.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  safe: { flex: 1 },
  content: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: { fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white },
  brandName: { fontSize: 17, color: Colors.text.primary, fontWeight: FontWeight.bold },

  hero: { paddingTop: Spacing['3xl'], paddingBottom: Spacing['2xl'] },
  eyebrow: {
    fontSize: 15,
    color: Colors.brand.secondary,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: 44,
    lineHeight: 48,
    color: Colors.text.primary,
    fontWeight: FontWeight.bold,
    letterSpacing: -1.2,
    marginBottom: Spacing.base,
  },
  heroBody: {
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text.secondary,
    maxWidth: 360,
  },

  previewCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  previewLabel: {
    fontSize: 13,
    color: Colors.accent.teal,
    fontWeight: FontWeight.semibold,
  },
  previewDate: { fontSize: 13, color: Colors.text.tertiary, marginTop: 3 },
  previewIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.glow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 22,
    lineHeight: 28,
    color: Colors.text.primary,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
    marginBottom: Spacing.md,
  },
  previewMetaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  durationText: { fontSize: 13, color: Colors.text.secondary },
  previewMeta: { fontSize: 13, color: Colors.text.tertiary },
  adaptationRow: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  adaptationIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent.amber + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adaptationCopy: { flex: 1 },
  adaptationTitle: { fontSize: 15, color: Colors.text.primary, fontWeight: FontWeight.semibold },
  adaptationText: { fontSize: 13, color: Colors.text.tertiary, marginTop: 2 },

  benefits: { marginBottom: Spacing['2xl'] },
  benefitRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  benefitIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.glow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitCopy: { flex: 1 },
  benefitTitle: { fontSize: 17, color: Colors.text.primary, fontWeight: FontWeight.semibold },
  benefitDetail: { fontSize: 15, color: Colors.text.tertiary, marginTop: 2 },
  benefitLine: {
    position: 'absolute',
    left: 18,
    top: 56,
    bottom: -14,
    width: 1,
    backgroundColor: Colors.separator,
  },

  actions: { marginTop: 'auto' },
  primaryButton: {
    minHeight: 54,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primaryButtonText: { fontSize: 17, color: Colors.white, fontWeight: FontWeight.bold },
  secondaryButton: {
    minHeight: 50,
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { fontSize: 17, color: Colors.text.secondary, fontWeight: FontWeight.semibold },
  legalText: {
    fontSize: 13,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.base,
  },
  pressed: { opacity: 0.72 },
});
