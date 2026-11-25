import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, FontWeight, Radius, Spacing, Type } from '@/constants/theme';
import { ProgressRing } from '../ui/ProgressRing';
import { Press } from '../ui/kit';
import { fmt } from '@/utils/formatters';

export interface FocusWidgetProps {
  focusMinutes: number;
  targetMinutes?: number;
  sessions?: number;
  longestSession?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export function FocusWidget({
  focusMinutes,
  targetMinutes = 120,
  sessions = 0,
  longestSession = 0,
  onPress,
  style,
}: FocusWidgetProps) {
  const pct = targetMinutes > 0 ? Math.min(focusMinutes / targetMinutes, 1) : 0;
  const isComplete = pct >= 1;

  return (
    <Press onPress={onPress} style={style} accessibilityLabel={`Focus: ${fmt(focusMinutes)} of ${fmt(targetMinutes)}`}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="timer-outline" size={18} color={Colors.brand.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Focus Time</Text>
            <Text style={styles.headerSub}>{fmt(focusMinutes)} / {fmt(targetMinutes)}</Text>
          </View>
        </View>

        <View style={styles.ringWrap}>
          <ProgressRing
            size={76}
            strokeWidth={6}
            progress={pct}
            color={isComplete ? Colors.accent.teal : Colors.brand.primary}
            trackColor={Colors.fill}
          >
            <Text style={[styles.ringPct, { color: isComplete ? Colors.accent.teal : Colors.brand.primary }]}>
              {Math.round(pct * 100)}%
            </Text>
          </ProgressRing>
        </View>

        {isComplete && (
          <View style={styles.completeBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.accent.teal} />
            <Text style={styles.completeText}>Target reached!</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <FocusStat
            value={`${sessions}`}
            label="Sessions"
            icon="ellipse"
          />
          <StatDivider />
          <FocusStat
            value={fmt(longestSession)}
            label="Longest"
            icon="timer"
          />
          <StatDivider />
          <FocusStat
            value={fmt(focusMinutes - longestSession)}
            label="Other"
            icon="time"
          />
        </View>
      </View>
    </Press>
  );
}

function FocusStat({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={`${icon}-outline` as any} size={14} color={Colors.text.tertiary} />
      <Text style={styles.statValue}>{value}</Text>
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
    backgroundColor: Colors.brand.glow,
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
  ringWrap: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  ringPct: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Colors.accent.teal + '12',
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginBottom: Spacing.md,
  },
  completeText: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: Colors.accent.teal,
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
    fontSize: 17,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    color: Colors.text.tertiary,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: Colors.separator,
  },
});