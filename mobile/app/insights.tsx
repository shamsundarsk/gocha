import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { router } from 'expo-router';
import { format, subDays } from 'date-fns';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { wrappedApi } from '@/services/api';
import { DayWrapped } from '@/types';
import { safeFormat } from '@/utils/formatters';
import { clamp } from '@/utils/geo';

const BAR_H = 78;

function deriveInsights(days: DayWrapped[]) {
  if (days.length < 5) return [];
  const insights: { icon: string; text: string }[] = [];
  const withTasks = days.filter((d) => d.tasks_planned > 0);

  if (withTasks.length >= 4) {
    const avg =
      withTasks.reduce((sum, d) => sum + d.tasks_completed / Math.max(d.tasks_planned, 1), 0) /
      withTasks.length;
    if (avg >= 0.8) {
      insights.push({ icon: 'checkmark-circle-outline', text: `You complete ${Math.round(avg * 100)}% of what you plan. That is strong.` });
    } else if (avg < 0.5) {
      insights.push({ icon: 'trending-down-outline', text: `Completion is ${Math.round(avg * 100)}%. You might be overplanning.` });
    }
  }

  const focusDays = days.filter((d) => d.focus_minutes > 0);
  if (focusDays.length >= 4) {
    const avg = focusDays.reduce((sum, d) => sum + d.focus_minutes, 0) / focusDays.length;
    insights.push({ icon: 'time-outline', text: `You average ${Math.round(avg)} minutes of focused work per day.` });
  }

  const activeDays = days.filter(
    (d) => (d.distance_km || 0) > 0.5 || (d.active_minutes || 0) > 15 || (d.steps || 0) > 3000
  );
  if (days.length >= 7) {
    insights.push({
      icon: 'walk-outline',
      text: `You were physically active on ${activeDays.length} of the last ${days.length} days.`,
    });
  }

  const postponing = withTasks.filter((d) => d.tasks_postponed >= 1);
  if (withTasks.length > 0 && postponing.length > withTasks.length * 0.5) {
    insights.push({ icon: 'play-skip-forward-outline', text: 'You postpone at least one task on most days. Try planning fewer things.' });
  }

  const screenDays = days.filter((d) => (d.screen_time_minutes || 0) > 240);
  if (screenDays.length >= 3) {
    insights.push({ icon: 'phone-portrait-outline', text: 'Screen time is high on most days. One phone-free block would change the week.' });
  }

  return insights;
}

export default function InsightsScreen() {
  const [days, setDays] = useState<DayWrapped[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const result: DayWrapped[] = [];
    for (let i = 0; i < 14; i += 1) {
      try {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const res = await wrappedApi.getDay(d);
        if (res.data?.tasks_planned > 0) result.push({ ...res.data, date: d });
      } catch {}
    }
    setDays(result);
    setLoading(false);
  };

  const insights = deriveInsights(days);
  const totalDone = days.reduce((sum, d) => sum + d.tasks_completed, 0);
  const totalFocus = days.reduce((sum, d) => sum + d.focus_minutes, 0);
  const totalDist = days.reduce((sum, d) => sum + (d.distance_km || 0), 0);
  const last7 = days.slice(0, 7).reverse();

  const avgCompletion = useMemo(() => {
    const withTasks = days.filter((d) => d.tasks_planned > 0);
    if (withTasks.length === 0) return 0;
    return (
      withTasks.reduce((sum, d) => sum + d.tasks_completed / Math.max(d.tasks_planned, 1), 0) /
      withTasks.length
    );
  }, [days]);

  const momentumScore = useMemo(() => {
    if (days.length === 0) return 0;
    const focus = clamp(totalFocus / (days.length * 90), 0, 1);
    const move = clamp(totalDist / (days.length * 4), 0, 1);
    return Math.round(clamp(avgCompletion * 0.55 + focus * 0.25 + move * 0.2, 0, 1) * 100);
  }, [days, totalFocus, totalDist, avgCompletion]);

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Insights</Text>
            <Text style={s.subtitle}>Patterns from actual behaviour</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {loading && (
            <View style={s.center}>
              <ActivityIndicator color={Colors.brand.primary} size="large" />
            </View>
          )}

          {!loading && days.length === 0 && (
            <View style={s.center}>
              <View style={s.emptyIcon}>
                <Ionicons name="analytics-outline" size={26} color={Colors.text.tertiary} />
              </View>
              <Text style={s.emptyTitle}>Not enough data yet</Text>
              <Text style={s.emptySub}>Complete tasks over several days to see patterns.</Text>
            </View>
          )}

          {!loading && days.length > 0 && (
            <>
              <View style={s.hero}>
                <View style={s.heroOrb} />
                <View style={{ flex: 1 }}>
                  <Text style={s.heroEyebrow}>Last {days.length} days</Text>
                  <Text style={s.heroTitle}>
                    {momentumScore >= 70
                      ? 'Your rhythm is working.'
                      : momentumScore >= 45
                      ? 'You are building something.'
                      : 'Small changes, compounding.'}
                  </Text>
                  <Text style={s.heroSub}>
                    {totalDone} tasks done · {Math.floor(totalFocus / 60)}h focused
                    {totalDist > 0 ? ` · ${totalDist.toFixed(0)}km moved` : ''}
                  </Text>
                </View>
                <ProgressRing size={78} strokeWidth={7} progress={momentumScore / 100} color={Colors.brand.secondary}>
                  <Text style={s.heroScore}>{momentumScore}</Text>
                  <Text style={s.heroScoreLabel}>score</Text>
                </ProgressRing>
              </View>

              <View style={s.tiles}>
                <Tile icon="checkmark-circle-outline" val={`${totalDone}`} label="Tasks done" color={Colors.accent.teal} />
                <Tile icon="time-outline" val={`${Math.floor(totalFocus / 60)}h`} label="Focused" color={Colors.brand.primary} />
                <Tile
                  icon="walk-outline"
                  val={`${totalDist.toFixed(0)}km`}
                  label="Distance"
                  color={Colors.accent.amber}
                />
              </View>

              {last7.length > 0 && (
                <View style={s.section}>
                  <View style={s.sectionHead}>
                    <Text style={s.sectionTitle}>Daily completion</Text>
                    <Text style={s.sectionHint}>last 7 days</Text>
                  </View>
                  <View style={s.chart}>
                    {last7.map((d, i) => {
                      const pct = d.tasks_planned > 0 ? d.tasks_completed / d.tasks_planned : 0;
                      const barColor =
                        pct >= 0.8 ? Colors.accent.teal : pct >= 0.5 ? Colors.brand.primary : Colors.error;
                      return (
                        <View key={i} style={s.barCol}>
                          <Text style={[s.barPct, { color: barColor }]}>{Math.round(pct * 100)}%</Text>
                          <View style={s.barTrack}>
                            <View
                              style={[s.barFill, { height: `${Math.max(4, Math.round(pct * 100))}%`, backgroundColor: barColor }]}
                            />
                          </View>
                          <Text style={s.barLabel}>{safeFormat(d.date, 'EEEEE', '?')}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {insights.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Patterns</Text>
                  {insights.map((ins, i) => (
                    <View key={i} style={s.insightCard}>
                      <View style={s.insightEmojiWrap}>
                        <Ionicons name={ins.icon as any} size={20} color={Colors.brand.primary} />
                      </View>
                      <Text style={s.insightText}>{ins.text}</Text>
                    </View>
                  ))}
                </View>
              )}

              {insights.length === 0 && days.length < 7 && (
                <View style={s.pendCard}>
                  <Text style={s.pendText}>
                    {7 - days.length} more day{7 - days.length !== 1 ? 's' : ''} of data needed to surface
                    patterns.
                  </Text>
                </View>
              )}

              <View style={s.nextCard}>
                <Text style={s.nextEyebrow}>One thing for next week</Text>
                <Text style={s.nextTitle}>
                  {avgCompletion < 0.5
                    ? 'Plan fewer things. Finish more.'
                    : totalDist < days.length
                    ? 'Add one outdoor mission a day.'
                    : 'Protect the rhythm you already have.'}
                </Text>
                <Text style={s.nextSub}>
                  {avgCompletion < 0.5
                    ? 'Three tasks you actually finish beat ten you carry around.'
                    : totalDist < days.length
                    ? 'A 20-minute walk with a locked finish line changes the whole day.'
                    : 'You are consistent. Do not add noise. Repeat what works.'}
                </Text>
              </View>
            </>
          )}

          <View style={{ height: 118 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Tile({ icon, val, label, color }: { icon: string; val: string; label: string; color: string }) {
  return (
    <View style={s.tile}>
      <View style={[s.tileIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={15} color={color} />
      </View>
      <Text style={s.tileVal}>{val}</Text>
      <Text style={s.tileLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: FontSize.lg, color: Colors.text.primary, marginTop: -1 },
  title: { fontSize: 28, fontWeight: FontWeight.bold, color: Colors.text.primary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: Colors.text.tertiary, marginTop: 2 },

  scroll: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.sm },
  center: { paddingTop: Spacing['5xl'], alignItems: 'center', gap: Spacing.base },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: FontWeight.bold, color: Colors.text.primary },
  emptySub: { fontSize: 15, color: Colors.text.tertiary, textAlign: 'center' },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    borderRadius: Radius['2xl'],
    backgroundColor: Colors.bg.card,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.brand.glow,
    right: -50,
    top: -60,
  },
  heroEyebrow: { fontSize: 12, fontWeight: FontWeight.semibold, color: Colors.brand.secondary },
  heroTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginTop: 4,
    letterSpacing: -0.3,
  },
  heroSub: { fontSize: 13, color: Colors.text.tertiary, marginTop: 4 },
  heroScore: { fontSize: 17, fontWeight: FontWeight.bold, color: Colors.text.primary },
  heroScoreLabel: { fontSize: 9, color: Colors.text.tertiary },

  tiles: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  tile: {
    flex: 1,
    alignItems: 'flex-start',
    padding: Spacing.base,
    borderRadius: Radius.lg,
    gap: 4,
    backgroundColor: Colors.bg.card,
  },
  tileIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tileVal: { fontSize: 22, fontWeight: FontWeight.bold, color: Colors.text.primary, letterSpacing: -0.3 },
  tileLabel: { fontSize: 12, color: Colors.text.tertiary },

  section: { marginBottom: Spacing.lg },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    letterSpacing: -0.3,
    marginBottom: Spacing.md,
  },
  sectionHint: { fontSize: 13, color: Colors.text.tertiary, marginBottom: Spacing.md },

  chart: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-end',
    height: BAR_H + 60,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 5, height: BAR_H + 44, justifyContent: 'flex-end' },
  barPct: { fontSize: 10, fontWeight: FontWeight.semibold },
  barTrack: {
    width: '66%',
    backgroundColor: Colors.fill,
    borderRadius: Radius.xs,
    height: BAR_H,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: Radius.xs, minHeight: 4 },
  barLabel: { fontSize: 12, color: Colors.text.tertiary, fontWeight: FontWeight.medium },

  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  insightEmojiWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.brand.glow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightEmoji: { fontSize: 16 },
  insightText: { flex: 1, fontSize: 15, color: Colors.text.secondary, lineHeight: 21 },

  pendCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  pendText: { fontSize: FontSize.sm, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },

  nextCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  nextEyebrow: { fontSize: 12, fontWeight: FontWeight.semibold, color: Colors.brand.secondary },
  nextTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginTop: 5,
    letterSpacing: -0.3,
  },
  nextSub: { fontSize: 15, color: Colors.text.tertiary, marginTop: 4, lineHeight: 21 },
});
