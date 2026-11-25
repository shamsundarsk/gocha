import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, FontWeight, Radius, Spacing, Type } from '@/constants/theme';
import { Press } from '../ui/kit';
import { ProgressRing } from '../ui/ProgressRing';
import { safeFormat, fmt } from '@/utils/formatters';

export interface DaySummaryProps {
  date: Date;
  tasks: {
    planned: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
  focusMinutes: number;
  distanceKm?: number;
  steps?: number;
  momentsCaptured: number;
  screenTimeMinutes?: number;
  moodScore?: number;
  nextBlock?: {
    title: string;
    start: string;
    end: string;
  } | null;
  onPress?: () => void;
  style?: ViewStyle;
}

export function DaySummaryWidget({
  date,
  tasks,
  focusMinutes,
  distanceKm,
  steps,
  momentsCaptured,
  screenTimeMinutes,
  moodScore,
  nextBlock,
  onPress,
  style,
}: DaySummaryProps) {
  const pct = tasks.planned > 0 ? tasks.completed / tasks.planned : 0;
  const isComplete = pct === 1 && tasks.planned > 0;

  const moodConfig = moodScore !== undefined
    ? moodScore >= 80
      ? { label: 'Locked in', color: Colors.accent.teal }
      : moodScore >= 60
      ? { label: 'Momentum', color: Colors.brand.primary }
      : moodScore >= 40
      ? { label: 'Warming up', color: Colors.accent.amber }
      : moodScore > 0
      ? { label: 'Reset day', color: Colors.accent.rose }
      : { label: 'Blank canvas', color: Colors.text.tertiary }
    : null;

  return (
    <Press onPress={onPress} style={style} accessibilityLabel={`Day summary for ${safeFormat(date.toISOString(), 'EEEE, MMMM d')}`}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.date}>{safeFormat(date.toISOString(), 'EEEE, MMMM d')}</Text>
          <View style={styles.moodBadge}>
            {moodConfig && (
              <>
                <View style={[styles.moodDot, { backgroundColor: moodConfig.color }]} />
                <Text style={[styles.moodText, { color: moodConfig.color }]}>{moodConfig.label}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.ringWrap}>
            <ProgressRing
              size={72}
              strokeWidth={6}
              progress={pct}
              color={isComplete ? Colors.accent.teal : Colors.brand.primary}
              trackColor={Colors.fill}
            >
              <Text style={styles.ringPct}>{Math.round(pct * 100)}%</Text>
            </ProgressRing>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>
              {isComplete
                ? 'Every task closed.'
                : pct >= 0.5
                ? 'Momentum is holding.'
                : tasks.planned > 0
                ? 'The day is still yours.'
                : 'Nothing planned yet.'}
            </Text>
            <Text style={styles.heroSub}>
              {tasks.completed} of {tasks.planned} complete
              {tasks.inProgress > 0 && ` · ${tasks.inProgress} active`}
              {tasks.pending > 0 && ` · ${tasks.pending} pending`}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricsGrid}>
          <MetricItem
            icon="checkmark-circle"
            value={`${tasks.completed}/${tasks.planned}`}
            label="Tasks"
            color={Colors.accent.teal}
          />
          <MetricItem
            icon="timer"
            value={fmt(focusMinutes)}
            label="Focus"
            color={Colors.brand.primary}
          />
          <MetricItem
            icon="walk"
            value={distanceKm ? `${distanceKm.toFixed(1)}km` : steps ? `${(steps / 1000).toFixed(1)}k` : '—'}
            label={distanceKm ? 'Distance' : 'Steps'}
            color={Colors.accent.amber}
          />
          <MetricItem
            icon="camera"
            value={`${momentsCaptured}`}
            label="Moments"
            color={Colors.emotion.snap}
          />
        </View>

        {screenTimeMinutes !== undefined && (
          <>
            <View style={styles.divider} />
            <View style={styles.screenTimeRow}>
              <View style={styles.screenItem}>
                <Ionicons name="phone-portrait" size={16} color={screenTimeMinutes > 240 ? Colors.error : Colors.text.tertiary} />
                <Text style={[styles.screenLabel, { color: screenTimeMinutes > 240 ? Colors.error : Colors.text.secondary }]}>
                  Screen time: {fmt(screenTimeMinutes)}
                </Text>
              </View>
              {screenTimeMinutes > 240 && (
                <View style={styles.screenWarning}>
                  <Ionicons name="alert-circle" size={14} color={Colors.error} />
                  <Text style={styles.screenWarningText}>High</Text>
                </View>
              )}
            </View>
          </>
        )}

        {nextBlock && (
          <>
            <View style={styles.divider} />
            <View style={styles.nextBlock}>
              <View style={styles.nextBlockIcon}>
                <Ionicons name="play-circle" size={16} color={Colors.brand.secondary} />
              </View>
              <View style={styles.nextBlockContent}>
                <Text style={styles.nextBlockLabel}>Up next</Text>
                <Text style={styles.nextBlockTitle} numberOfLines={1}>{nextBlock.title}</Text>
              </View>
              <View style={styles.nextBlockTime}>
                <Text style={styles.nextBlockTimeText}>{safeFormat(String(nextBlock.start), 'h:mm a')}</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </Press>
  );
}

function MetricItem({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={styles.metricItem}>
      <View style={[styles.metricIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={`${icon}-outline` as any} size={15} color={color} />
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  date: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.text.tertiary,
    letterSpacing: 0.2,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.fill,
    borderRadius: 999,
  },
  moodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moodText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.3,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    marginBottom: Spacing.md,
  },
  ringWrap: {
    flexShrink: 0,
  },
  ringPct: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  heroCopy: {
    flex: 1,
    gap: 3,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  heroSub: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  screenTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
  },
  screenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  screenLabel: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
  },
  screenWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.error + '12',
    borderRadius: 999,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  screenWarningText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
  },
  nextBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  nextBlockIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: Colors.brand.glow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBlockContent: {
    flex: 1,
    gap: 2,
  },
  nextBlockLabel: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.text.tertiary,
    letterSpacing: 0.3,
  },
  nextBlockTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  nextBlockTime: {
    alignItems: 'flex-end',
  },
  nextBlockTimeText: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.brand.secondary,
  },
});