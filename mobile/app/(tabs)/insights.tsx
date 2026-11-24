import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format, subDays } from 'date-fns';
import { Colors, FontSize, Spacing, Radius, FontWeight } from '@/constants/theme';
import { wrappedApi } from '@/services/api';
import { DayWrapped } from '@/types';
import { safeFormat } from '@/utils/formatters';

interface Insight {
  emoji: string;
  text: string;
  confidence: 'high' | 'medium' | 'low';
}

function deriveInsights(data: DayWrapped[]): Insight[] {
  if (data.length < 3) return [];

  const insights: Insight[] = [];
  const withData = data.filter((d) => d.tasks_planned > 0);

  // Completion rate
  const avgCompletion = withData.length > 0
    ? withData.reduce((s, d) => s + (d.tasks_completed / Math.max(d.tasks_planned, 1)), 0) / withData.length
    : 0;

  if (avgCompletion >= 0.8) {
    insights.push({ emoji: '🎯', text: `You complete ${Math.round(avgCompletion * 100)}% of your planned tasks.`, confidence: 'high' });
  } else if (avgCompletion < 0.5 && withData.length >= 5) {
    insights.push({ emoji: '📉', text: `Completion rate is ${Math.round(avgCompletion * 100)}%. You may be overplanning.`, confidence: 'medium' });
  }

  // Focus time
  const avgFocus = data.reduce((s, d) => s + d.focus_minutes, 0) / data.length;
  if (avgFocus > 0) {
    insights.push({ emoji: '⏱', text: `Average daily focus: ${Math.round(avgFocus)} minutes.`, confidence: 'high' });
  }

  // Activity
  const activeDays = data.filter((d) => (d.distance_km || 0) > 0.5 || (d.active_minutes || 0) > 15).length;
  if (data.length >= 7) {
    insights.push({
      emoji: '🏃',
      text: `You were active ${activeDays} out of the last ${data.length} days.`,
      confidence: 'high',
    });
  }

  // Screen time
  const screenDays = data.filter((d) => (d.screen_time_minutes || 0) > 180);
  if (screenDays.length > data.length * 0.5) {
    insights.push({
      emoji: '📱',
      text: `More than half your tracked days had 3+ hours of screen time.`,
      confidence: 'medium',
    });
  }

  // Postpone pattern
  const avgPostpone = withData.length > 0
    ? withData.reduce((s, d) => s + d.tasks_postponed, 0) / withData.length
    : 0;
  if (avgPostpone >= 1) {
    insights.push({
      emoji: '⏭',
      text: `You postpone ${avgPostpone.toFixed(1)} tasks per day on average.`,
      confidence: 'medium',
    });
  }

  return insights;
}

export default function InsightsScreen() {
  const [weekData, setWeekData] = useState<DayWrapped[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const days: DayWrapped[] = [];
    for (let i = 0; i < 14; i++) {
      try {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const res = await wrappedApi.getDay(date);
        if (res.data?.tasks_planned > 0) days.push(res.data);
      } catch {}
    }
    setWeekData(days);
    setLoading(false);
  };

  const insights = deriveInsights(weekData);
  const totalCompleted = weekData.reduce((s, d) => s + d.tasks_completed, 0);
  const totalFocus = weekData.reduce((s, d) => s + d.focus_minutes, 0);
  const totalDistance = weekData.reduce((s, d) => s + (d.distance_km || 0), 0);
  const totalEvents = weekData.reduce((s, d) => s + d.events_attended, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Patterns from your actual behavior</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.brand.primary} size="large" />
          </View>
        )}

        {!loading && weekData.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>Not enough data yet</Text>
            <Text style={styles.emptySub}>Complete tasks over several days to see your patterns.</Text>
          </View>
        )}

        {!loading && weekData.length > 0 && (
          <>
            {/* 2-week summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Last {weekData.length} days</Text>
              <View style={styles.summaryGrid}>
                <SummaryTile emoji="✅" value={`${totalCompleted}`} label="Tasks Done" />
                <SummaryTile emoji="⏱" value={`${Math.floor(totalFocus / 60)}h`} label="Focused" />
                <SummaryTile emoji="🏃" value={`${totalDistance.toFixed(0)}km`} label="Distance" />
                <SummaryTile emoji="🎉" value={`${totalEvents}`} label="Events" />
              </View>
            </View>

            {/* Daily bar chart */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daily completions</Text>
              <View style={styles.barChart}>
                {weekData.slice(0, 7).reverse().map((d, i) => {
                  const pct = d.tasks_planned > 0 ? d.tasks_completed / d.tasks_planned : 0;
                  return (
                    <View key={d.date} style={styles.barCol}>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { height: `${pct * 100}%` }]} />
                      </View>
                      <Text style={styles.barLabel}>{safeFormat(d.date, 'EEE', '?')[0]}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Insights */}
            {insights.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Patterns</Text>
                {insights.map((insight, i) => (
                  <View key={i} style={styles.insightCard}>
                    <Text style={styles.insightEmoji}>{insight.emoji}</Text>
                    <Text style={styles.insightText}>{insight.text}</Text>
                  </View>
                ))}
              </View>
            )}

            {insights.length === 0 && (
              <View style={styles.insightPending}>
                <Text style={styles.insightPendingText}>
                  Collecting more data before surfacing insights. Keep tracking.
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryTile({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryEmoji}>{emoji}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize['3xl'], fontWeight: FontWeight.bold, color: Colors.text.primary },
  subtitle: { fontSize: FontSize.sm, color: Colors.text.secondary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.lg },
  center: { paddingTop: Spacing['5xl'], alignItems: 'center', gap: Spacing.base },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  emptySub: { fontSize: FontSize.base, color: Colors.text.secondary, textAlign: 'center' },

  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.text.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },

  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  summaryEmoji: { fontSize: 20 },
  summaryValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.primary },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.text.muted },

  barChart: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
    height: 120,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  barCol: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barTrack: {
    flex: 1,
    width: '70%',
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    maxHeight: 80,
  },
  barFill: { width: '100%', backgroundColor: Colors.brand.primary, borderRadius: Radius.sm },
  barLabel: { fontSize: FontSize.xs, color: Colors.text.muted },

  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  insightEmoji: { fontSize: 22, marginTop: 1 },
  insightText: { flex: 1, fontSize: FontSize.base, color: Colors.text.secondary, lineHeight: 22 },

  insightPending: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  insightPendingText: { fontSize: FontSize.base, color: Colors.text.muted, textAlign: 'center', lineHeight: 22 },
});
