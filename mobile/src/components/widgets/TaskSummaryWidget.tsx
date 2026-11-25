import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, FontWeight, Radius, Spacing, Type } from '@/constants/theme';
import { ProgressRing } from '../ui/ProgressRing';
import { Press } from '../ui/kit';

export interface TaskSummaryProps {
  done: number;
  total: number;
  pending: number;
  inProgress: number;
  freeMinutes: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export function TaskSummaryWidget({
  done,
  total,
  pending,
  inProgress,
  freeMinutes,
  onPress,
  style,
}: TaskSummaryProps) {
  const pct = total > 0 ? done / total : 0;

  return (
    <Press onPress={onPress} style={style} accessibilityLabel={`Tasks: ${done} of ${total} complete`}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle-outline" size={18} color={Colors.accent.teal} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Today's Progress</Text>
            <Text style={styles.headerSub}>{total > 0 ? `${done} of ${total} complete` : 'No tasks yet'}</Text>
          </View>
        </View>

        <View style={styles.ringWrap}>
          <ProgressRing
            size={84}
            strokeWidth={7}
            progress={pct}
            color={pct === 1 ? Colors.accent.teal : Colors.brand.primary}
            trackColor={Colors.fill}
          >
            <Text style={styles.ringPct}>{Math.round(pct * 100)}%</Text>
          </ProgressRing>
        </View>

        <View style={styles.statsRow}>
          <StatItem value={done} label="Done" color={Colors.accent.teal} icon="checkmark" />
          <StatDivider />
          <StatItem value={inProgress} label="Active" color={Colors.brand.primary} icon="play" />
          <StatDivider />
          <StatItem value={pending} label="Left" color={Colors.accent.amber} icon="time" />
          <StatDivider />
          <StatItem value={`${freeMinutes}m`} label="Free" color={Colors.emotion.snap} icon="timer" />
        </View>
      </View>
    </Press>
  );
}

function StatItem({ value, label, color, icon }: { value: string | number; label: string; color: string; icon: string }) {
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
    backgroundColor: Colors.accent.teal + '14',
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
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
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