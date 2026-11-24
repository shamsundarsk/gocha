import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format, subDays, isValid } from 'date-fns';
import { Colors, FontSize, Spacing, Radius, FontWeight, Shadow } from '@/constants/theme';
import { wrappedApi } from '@/services/api';
import { DayWrapped, TimelineItem } from '@/types';
import { safeFormat } from '@/utils/formatters';

const { width } = Dimensions.get('window');

function formatMinutes(mins?: number): string {
  if (!mins) return '—';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim();
}

export default function WrappedScreen() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [wrapped, setWrapped] = useState<DayWrapped | null>(null);
  const [loading, setLoading] = useState(false);

  const recentDays = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    return { date: format(d, 'yyyy-MM-dd'), label: i === 0 ? 'Today' : format(d, 'EEE'), day: format(d, 'd') };
  });

  useEffect(() => {
    loadWrapped(selectedDate);
  }, [selectedDate]);

  const loadWrapped = async (d: string) => {
    setLoading(true);
    try {
      const res = await wrappedApi.getDay(d);
      setWrapped(res.data);
    } catch {
      setWrapped(null);
    }
    setLoading(false);
  };

  const completionRate = wrapped
    ? wrapped.tasks_planned > 0
      ? Math.round((wrapped.tasks_completed / wrapped.tasks_planned) * 100)
      : 0
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Day selector */}
      <View style={styles.header}>
        <Text style={styles.title}>Wrapped</Text>
        <Text style={styles.subtitle}>What actually happened</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScrollContent} style={styles.dayScroll}>
        {recentDays.map((d) => (
          <TouchableOpacity
            key={d.date}
            style={[styles.dayPill, selectedDate === d.date && styles.dayPillActive]}
            onPress={() => setSelectedDate(d.date)}
          >
            <Text style={[styles.dayPillLabel, selectedDate === d.date && styles.dayPillLabelActive]}>{d.label}</Text>
            <Text style={[styles.dayPillDay, selectedDate === d.date && styles.dayPillDayActive]}>{d.day}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.brand.primary} size="large" />
          </View>
        )}

        {!loading && wrapped && (
          <>
            {/* Hero date */}
            <View style={styles.heroSection}>
              <LinearGradient
                colors={[Colors.bg.card, Colors.bg.cardAlt]}
                style={styles.heroCard}
              >
                <Text style={styles.heroDate}>
                  {safeFormat(selectedDate, 'MMMM d', selectedDate).toUpperCase()}
                </Text>
                {wrapped.highlight_text && (
                  <Text style={styles.heroHighlight}>{wrapped.highlight_text}</Text>
                )}

                {/* Completion ring */}
                <View style={styles.completionRing}>
                  <Text style={styles.completionPct}>{completionRate}%</Text>
                  <Text style={styles.completionLabel}>completed</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Stat grid */}
            <View style={styles.statGrid}>
              <StatCard emoji="✅" value={`${wrapped.tasks_completed}/${wrapped.tasks_planned}`} label="Tasks" />
              <StatCard emoji="⏱" value={formatMinutes(wrapped.focus_minutes)} label="Focus" />
              {wrapped.distance_km ? (
                <StatCard emoji="🏃" value={`${wrapped.distance_km.toFixed(1)} km`} label="Distance" />
              ) : (
                <StatCard emoji="👟" value={wrapped.steps ? `${(wrapped.steps / 1000).toFixed(1)}k` : '—'} label="Steps" />
              )}
              <StatCard emoji="📱" value={formatMinutes(wrapped.screen_time_minutes)} label="Screen" />
              <StatCard emoji="📸" value={`${wrapped.moments_captured}`} label="Moments" />
              <StatCard emoji="🎉" value={`${wrapped.events_attended}`} label="Events" />
            </View>

            {/* Task breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Task Breakdown</Text>
              <View style={styles.breakdownCard}>
                {[
                  { label: 'Completed', value: wrapped.tasks_completed, color: Colors.success },
                  { label: 'Postponed', value: wrapped.tasks_postponed, color: Colors.warning },
                  { label: 'Abandoned', value: wrapped.tasks_abandoned, color: Colors.error },
                ].map((item) => (
                  <View key={item.label} style={styles.breakdownRow}>
                    <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                    <Text style={[styles.breakdownValue, { color: item.color }]}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Timeline */}
            {wrapped.timeline && wrapped.timeline.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {wrapped.timeline.length} Moments
                </Text>
                {wrapped.timeline.map((item, idx) => (
                  <TimelineRow key={idx} item={item} />
                ))}
              </View>
            )}
          </>
        )}

        {!loading && !wrapped && (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>No data yet for this day</Text>
            <Text style={styles.emptySub}>Complete tasks today and check back tonight.</Text>
          </View>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TimelineRow({ item }: { item: TimelineItem }) {
  return (
    <View style={styles.timelineRow}>
      <Text style={styles.timelineTime}>{item.time}</Text>
      <View style={styles.timelineDot} />
      <View style={styles.timelineContent}>
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineIcon}>{item.icon}</Text>
          <Text style={styles.timelineLabel}>{item.label}</Text>
        </View>
        {item.value && <Text style={styles.timelineValue}>{item.value}</Text>}
      </View>
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

  dayScroll: { maxHeight: 80 },
  dayScrollContent: {
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  dayPill: {
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    minWidth: 52,
  },
  dayPillActive: { backgroundColor: Colors.brand.primary },
  dayPillLabel: { fontSize: FontSize.xs, color: Colors.text.muted, fontWeight: FontWeight.medium },
  dayPillLabelActive: { color: 'rgba(255,255,255,0.7)' },
  dayPillDay: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text.secondary },
  dayPillDayActive: { color: Colors.white },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.sm },

  center: { paddingTop: Spacing['5xl'], alignItems: 'center', gap: Spacing.base },

  heroSection: { marginBottom: Spacing.base },
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  heroDate: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.brand.primary,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  heroHighlight: {
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  completionRing: { alignItems: 'center' },
  completionPct: { fontSize: FontSize['5xl'], fontWeight: FontWeight.extrabold, color: Colors.text.primary },
  completionLabel: { fontSize: FontSize.sm, color: Colors.text.secondary },

  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  statCard: {
    width: (width - Spacing['2xl'] * 2 - Spacing.sm * 2) / 3,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.text.muted },

  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },

  breakdownCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { flex: 1, fontSize: FontSize.base, color: Colors.text.secondary },
  breakdownValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold },

  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  timelineTime: {
    width: 48,
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    fontWeight: FontWeight.medium,
    paddingTop: 2,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand.primary,
    marginTop: 5,
  },
  timelineContent: { flex: 1 },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  timelineIcon: { fontSize: 16 },
  timelineLabel: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.text.primary },
  timelineValue: { fontSize: FontSize.sm, color: Colors.text.secondary, marginTop: 2, marginLeft: 24 },

  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  emptySub: { fontSize: FontSize.base, color: Colors.text.secondary, textAlign: 'center' },
});
