import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, FontWeight, Radius, Spacing, Type } from '@/constants/theme';
import { Press } from '../ui/kit';

export interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  thisWeek: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export function StreakWidget({
  currentStreak,
  longestStreak,
  totalDays,
  thisWeek,
  onPress,
  style,
}: StreakWidgetProps) {
  return (
    <Press onPress={onPress} style={style} accessibilityLabel={`Streak: ${currentStreak} days`}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="flame-outline" size={18} color={Colors.accent.amber} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Day Streak</Text>
            <Text style={styles.headerSub}>{thisWeek} of 7 days this week</Text>
          </View>
        </View>

        <View style={styles.streakMain}>
          <Text style={[styles.streakNumber, { color: currentStreak > 0 ? Colors.accent.amber : Colors.text.tertiary }]}>
            {currentStreak}
          </Text>
          <Text style={styles.streakLabel}>
            {currentStreak === 1 ? 'day streak' : currentStreak > 0 ? 'day streak' : 'Start today'}
          </Text>
          {currentStreak > 0 && (
            <View style={styles.streakFire}>
              {[...Array(Math.min(currentStreak, 7))].map((_, i) => (
                <Ionicons key={i} name="flame" size={14} color={Colors.accent.amber} style={{ marginHorizontal: 2 }} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <StreakStat value={longestStreak} label="Longest" icon="trophy" color={Colors.accent.amber} />
          <StatDivider />
          <StreakStat value={totalDays} label="Total Days" icon="calendar" color={Colors.brand.primary} />
          <StatDivider />
          <StreakStat value={thisWeek} label="This Week" icon="calendar-outline" color={Colors.emotion.snap} />
        </View>
      </View>
    </Press>
  );
}

function StreakStat({ value, label, icon, color }: { value: number; label: string; icon: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={`${icon}-outline` as any} size={16} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatDivider() {
  return <View style={styles.statDivider} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accent.amber + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 1,
  },
  streakMain: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: FontWeight.bold,
    lineHeight: 52,
    letterSpacing: -1.5,
  },
  streakLabel: {
    fontSize: 13,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  streakFire: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
    marginVertical: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    color: Colors.text.tertiary,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: Colors.separator,
  },
});