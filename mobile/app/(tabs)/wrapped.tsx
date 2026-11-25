import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format, subDays } from 'date-fns';
import {
  Colors,
  FontWeight,
  Gradient,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useMissionStore } from '@/store/missionStore';
import { wrappedApi } from '@/services/api';
import { DayWrapped } from '@/types';
import { safeFormat } from '@/utils/formatters';
import { clamp } from '@/utils/geo';

function fmt(mins?: number) {
  if (!mins) return '—';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function headlineFor(pct: number) {
  if (pct >= 0.9) return 'You showed up fully.';
  if (pct >= 0.6) return 'Momentum, made.';
  if (pct > 0) return 'Progress, not perfection.';
  return 'A quiet day.';
}

function moodFor(score: number) {
  if (score >= 80) {
    return {
      label: 'Locked in',
      title: 'You did the thing. All of it.',
      sub: 'Completion, focus and movement all showed up. Remember this rhythm.',
      color: Colors.accent.teal,
    };
  }
  if (score >= 60) {
    return {
      label: 'Momentum',
      title: 'A solid day. The kind that compounds.',
      sub: 'Not perfect, but real. The small wins are stacking up.',
      color: Colors.brand.primary,
    };
  }
  if (score >= 40) {
    return {
      label: 'Warming up',
      title: 'You moved. Tomorrow gets easier.',
      sub: 'A little progress is still progress. Keep the engine warm.',
      color: Colors.accent.amber,
    };
  }
  if (score > 0) {
    return {
      label: 'Reset day',
      title: 'Not every day is a highlight.',
      sub: 'You still showed up. That counts more than a perfect streak.',
      color: Colors.accent.rose,
    };
  }
  return {
    label: 'Blank canvas',
    title: 'No data yet. Tomorrow is a fresh page.',
    sub: 'Add one task and capture one moment. That is enough to start.',
    color: Colors.text.tertiary,
  };
}

const PLACEHOLDER_MOMENTS = [
  { icon: 'sunny-outline' as const, label: 'Morning light', time: '08:40' },
  { icon: 'leaf-outline' as const, label: 'The walk', time: '12:20' },
  { icon: 'partly-sunny-outline' as const, label: 'Golden hour', time: '18:30' },
];

export default function WrappedScreen() {
  const { width } = useWindowDimensions();
  const { missions } = useMissionStore();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [wrapped, setWrapped] = useState<DayWrapped | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), i);
    return {
      date: format(d, 'yyyy-MM-dd'),
      dow: i === 0 ? 'Today' : format(d, 'EEE'),
      day: format(d, 'd'),
    };
  });

  useEffect(() => {
    load(selectedDate);
  }, [selectedDate]);

  const load = async (d: string) => {
    setLoading(true);
    try {
      const res = await wrappedApi.getDay(d);
      setWrapped(res.data);
    } catch {
      setWrapped(null);
    }
    setLoading(false);
  };

  const localMoments = useMemo(
    () =>
      Object.values(missions)
        .filter(
          (m) =>
            m.photoUri &&
            m.capturedAt &&
            format(new Date(m.capturedAt), 'yyyy-MM-dd') === selectedDate
        )
        .sort((a, b) => (a.capturedAt || '').localeCompare(b.capturedAt || '')),
    [missions, selectedDate]
  );

  const pct =
    wrapped && wrapped.tasks_planned > 0
      ? wrapped.tasks_completed / wrapped.tasks_planned
      : 0;
  const momentsCount = Math.max(localMoments.length, wrapped?.moments_captured || 0);

  const moodScore = useMemo(() => {
    if (!wrapped) return 0;
    const move = clamp(
      wrapped.distance_km ? wrapped.distance_km / 5 : (wrapped.steps || 0) / 8000,
      0,
      1
    );
    const focus = clamp((wrapped.focus_minutes || 0) / 120, 0, 1);
    const moments = clamp(momentsCount / 3, 0, 1);
    const screenPenalty = clamp(
      ((wrapped.screen_time_minutes || 0) - 180) / 240,
      0,
      0.25
    );
    return Math.round(
      clamp(pct * 0.5 + focus * 0.2 + move * 0.2 + moments * 0.1 - screenPenalty, 0, 1) * 100
    );
  }, [wrapped, pct, momentsCount]);

  const mood = moodFor(moodScore);

  const worked = useMemo(() => {
    if (!wrapped) return [];
    const items: string[] = [];
    if (pct >= 0.7) items.push('You finished most of what you planned.');
    if ((wrapped.focus_minutes || 0) >= 60) items.push('You protected real focus time.');
    if ((wrapped.distance_km || 0) > 0.5 || (wrapped.steps || 0) > 3000) {
      items.push('You moved your body outside.');
    }
    if (momentsCount > 0) items.push('You captured proof of the day.');
    if (items.length === 0) items.push('You showed up. That is the first win.');
    return items.slice(0, 2);
  }, [wrapped, pct, momentsCount]);

  const tryTomorrow = useMemo(() => {
    if (!wrapped) return [];
    const items: string[] = [];
    if (wrapped.tasks_postponed > 0)
      items.push('Reschedule the postponed task. Do not carry it.');
    if ((wrapped.screen_time_minutes || 0) > 240)
      items.push('Try one phone-free block tomorrow.');
    if (wrapped.tasks_planned === 0) items.push('Plan three things tomorrow, not ten.');
    if (pct > 0 && pct < 0.5) items.push('Fewer tasks, more finished. Shrink the list.');
    if ((wrapped.focus_minutes || 0) < 30) items.push('Protect one 30-minute focus block.');
    if (items.length === 0) items.push('Keep the same rhythm. It is working.');
    return items.slice(0, 2);
  }, [wrapped, pct]);

  const timeline = useMemo(() => {
    if (!wrapped) return [];
    const base = (wrapped.timeline || []).map((item) => ({
      time: item.time,
      icon: item.icon,
      label: item.label,
      value: item.value,
      photoUri: undefined as string | undefined,
    }));

    const photos = localMoments.map((m) => ({
      time: m.capturedAt ? format(new Date(m.capturedAt), 'HH:mm') : '',
      icon: '',
      label: m.photoCaption || m.title,
      value: m.placeName,
      photoUri: m.photoUri,
    }));

    return [...base, ...photos].sort((a, b) => a.time.localeCompare(b.time));
  }, [wrapped, localMoments]);

  const share = async () => {
    if (!wrapped) return;
    const message = [
      `My day in Gocha — ${safeFormat(selectedDate, 'MMMM d')}`,
      `${wrapped.tasks_completed}/${wrapped.tasks_planned} tasks completed`,
      `${fmt(wrapped.focus_minutes)} focused`,
      wrapped.distance_km
        ? `${wrapped.distance_km.toFixed(1)} km moved`
        : wrapped.steps
        ? `${wrapped.steps.toLocaleString()} steps`
        : null,
      momentsCount > 0
        ? `${momentsCount} moment${momentsCount > 1 ? 's' : ''} captured`
        : null,
      mood.title,
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await Share.share({ message });
    } catch {}
  };

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>Your daily edition</Text>
            <Text style={s.title}>Wrapped</Text>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity
              style={s.iconButton}
              onPress={() => router.push('/insights' as any)}
              activeOpacity={0.7}
              accessibilityLabel="Open insights"
            >
              <Ionicons name="analytics-outline" size={19} color={Colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.iconButton}
              onPress={share}
              activeOpacity={0.7}
              accessibilityLabel="Share this day"
            >
              <Ionicons name="share-outline" size={19} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.dayScroll}
          style={s.dayContainer}
        >
          {days.map((d) => {
            const active = selectedDate === d.date;
            return (
              <TouchableOpacity
                key={d.date}
                style={s.dayItem}
                onPress={() => setSelectedDate(d.date)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={d.dow + ' ' + d.day}
              >
                <Text style={[s.dayDow, active && s.dayDowActive]}>{d.dow}</Text>
                <View style={[s.dayCircle, active && s.dayCircleActive]}>
                  <Text style={[s.dayNum, active && s.dayNumActive]}>{d.day}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {loading && (
            <View style={s.center}>
              <ActivityIndicator color={Colors.text.secondary} />
            </View>
          )}

          {!loading && wrapped && (
            <>
              {/* Hero */}
              <View style={s.hero}>
                <Text style={s.heroDate}>{safeFormat(selectedDate, 'EEEE, MMMM d')}</Text>

                <View style={s.heroMain}>
                  <View style={s.heroCopy}>
                    <Text style={s.heroHeadline}>{headlineFor(pct)}</Text>
                    <Text style={s.heroHighlight} numberOfLines={3}>
                      {wrapped.highlight_text || 'One day at a time.'}
                    </Text>
                  </View>
                  <ProgressRing
                    size={96}
                    strokeWidth={8}
                    progress={pct}
                    color={pct >= 0.8 ? Colors.accent.teal : Colors.brand.primary}
                    trackColor={Colors.fill}
                  >
                    <Text style={s.heroPct}>{Math.round(pct * 100)}%</Text>
                  </ProgressRing>
                </View>

                <View style={s.heroStats}>
                  <HeroStat
                    value={`${wrapped.tasks_completed}/${wrapped.tasks_planned}`}
                    label="Tasks"
                  />
                  <View style={s.heroDivider} />
                  <HeroStat value={fmt(wrapped.focus_minutes)} label="Focus" />
                  <View style={s.heroDivider} />
                  <HeroStat
                    value={
                      wrapped.distance_km
                        ? `${wrapped.distance_km.toFixed(1)} km`
                        : wrapped.steps
                        ? `${(wrapped.steps / 1000).toFixed(1)}k`
                        : '—'
                    }
                    label={wrapped.distance_km ? 'Moved' : 'Steps'}
                  />
                </View>
              </View>

              {/* Mood */}
              <View style={s.moodCard}>
                <ProgressRing
                  size={58}
                  strokeWidth={6}
                  progress={moodScore / 100}
                  color={mood.color}
                  trackColor={Colors.fill}
                >
                  <Text style={[s.moodScore, { color: mood.color }]}>{moodScore}</Text>
                </ProgressRing>
                <View style={s.moodCopy}>
                  <Text style={[s.moodLabel, { color: mood.color }]}>{mood.label}</Text>
                  <Text style={s.moodTitle}>{mood.title}</Text>
                  <Text style={s.moodSub}>{mood.sub}</Text>
                </View>
              </View>

              {/* Numbers */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>The numbers</Text>
                <View style={s.grid}>
                  <StatTile
                    icon="checkmark-circle-outline"
                    val={`${wrapped.tasks_completed}/${wrapped.tasks_planned}`}
                    label="Tasks"
                    color={Colors.accent.teal}
                  />
                  <StatTile
                    icon="timer-outline"
                    val={fmt(wrapped.focus_minutes)}
                    label="Focus"
                    color={Colors.brand.primary}
                  />
                  <StatTile
                    icon="walk-outline"
                    val={
                      wrapped.distance_km
                        ? `${wrapped.distance_km.toFixed(1)}km`
                        : wrapped.steps
                        ? `${(wrapped.steps / 1000).toFixed(1)}k`
                        : '—'
                    }
                    label={wrapped.distance_km ? 'Distance' : 'Steps'}
                    color={Colors.accent.amber}
                  />
                  <StatTile
                    icon="flash-outline"
                    val={`${wrapped.active_minutes || 0}m`}
                    label="Active"
                    color={Colors.emotion.move}
                  />
                  <StatTile
                    icon="camera-outline"
                    val={`${momentsCount}`}
                    label="Moments"
                    color={Colors.emotion.snap}
                  />
                  <StatTile
                    icon="phone-portrait-outline"
                    val={fmt(wrapped.screen_time_minutes)}
                    label="Screen"
                    color={
                      (wrapped.screen_time_minutes || 0) > 240
                        ? Colors.error
                        : Colors.text.secondary
                    }
                  />
                </View>
              </View>

              {/* Moments */}
              <View style={s.section}>
                <View style={s.sectionHead}>
                  <Text style={s.sectionTitle}>Moments</Text>
                  <Text style={s.sectionHint}>{momentsCount} captured</Text>
                </View>
                {localMoments.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.momentsScroll}
                  >
                    {localMoments.map((moment) => (
                      <TouchableOpacity
                        key={moment.taskId}
                        style={s.momentCard}
                        activeOpacity={0.9}
                        onPress={() => setSelectedPhoto(moment.photoUri || null)}
                      >
                        <Image source={{ uri: moment.photoUri! }} style={s.momentImage} />
                        <LinearGradient
                          colors={Gradient.photo}
                          locations={[0, 0.55, 1]}
                          style={s.momentFade}
                        >
                          <Text style={s.momentTime}>
                            {moment.capturedAt
                              ? format(new Date(moment.capturedAt), 'h:mm a')
                              : ''}
                          </Text>
                          <Text style={s.momentTitle} numberOfLines={1}>
                            {moment.photoCaption || moment.title}
                          </Text>
                          <Text style={s.momentPlace} numberOfLines={1}>
                            {moment.placeName}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : momentsCount > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.momentsScroll}
                  >
                    {PLACEHOLDER_MOMENTS.slice(0, Math.min(3, momentsCount)).map((moment) => (
                      <View key={moment.label} style={s.momentPlaceholder}>
                        <View style={s.placeholderIcon}>
                          <Ionicons
                            name={moment.icon}
                            size={22}
                            color={Colors.text.tertiary}
                          />
                        </View>
                        <View style={{ flex: 1 }} />
                        <Text style={s.momentPlaceholderTime}>{moment.time}</Text>
                        <Text style={s.momentPlaceholderTitle}>{moment.label}</Text>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <TouchableOpacity
                    style={s.emptyMoment}
                    onPress={() => router.push('/(tabs)')}
                    activeOpacity={0.8}
                  >
                    <View style={s.placeholderIcon}>
                      <Ionicons name="camera-outline" size={20} color={Colors.text.tertiary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.emptyMomentTitle}>No moments captured yet</Text>
                      <Text style={s.emptyMomentSub}>
                        Add an outdoor task. Reach the pin. The camera unlocks there.
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.text.dim} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Worked / Try */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>What worked</Text>
                <View style={s.insightCard}>
                  {worked.map((item, i) => (
                    <View
                      key={item}
                      style={[s.insightRow, i < worked.length - 1 && s.insightDivider]}
                    >
                      <View style={[s.insightIcon, { backgroundColor: Colors.accent.teal + '20' }]}>
                        <Ionicons name="checkmark" size={13} color={Colors.accent.teal} />
                      </View>
                      <Text style={s.insightText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={s.section}>
                <Text style={s.sectionTitle}>Try tomorrow</Text>
                <View style={s.insightCard}>
                  {tryTomorrow.map((item, i) => (
                    <View
                      key={item}
                      style={[s.insightRow, i < tryTomorrow.length - 1 && s.insightDivider]}
                    >
                      <View
                        style={[s.insightIcon, { backgroundColor: Colors.brand.primary + '20' }]}
                      >
                        <Ionicons name="arrow-forward" size={13} color={Colors.brand.secondary} />
                      </View>
                      <Text style={s.insightText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Timeline */}
              {timeline.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>The story of your day</Text>
                  <View style={s.timeline}>
                    {timeline.map((item, i) => (
                      <View key={`${item.time}-${i}`} style={s.tlRow}>
                        <Text style={s.tlTime}>{item.time}</Text>
                        <View style={s.tlRail}>
                          <View
                            style={[
                              s.tlDot,
                              {
                                backgroundColor: item.photoUri
                                  ? Colors.emotion.snap
                                  : Colors.text.dim,
                              },
                            ]}
                          />
                          {i < timeline.length - 1 && <View style={s.tlLine} />}
                        </View>
                        <View style={s.tlContent}>
                          <View style={s.tlHeader}>
                            <Text style={s.tlLabel}>{item.label}</Text>
                            {item.photoUri ? (
                              <View style={s.tlPhotoBadge}>
                                <Text style={s.tlPhotoBadgeText}>Photo</Text>
                              </View>
                            ) : null}
                          </View>
                          {item.value ? <Text style={s.tlValue}>{item.value}</Text> : null}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          {!loading && !wrapped && (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="sparkles-outline" size={26} color={Colors.text.tertiary} />
              </View>
              <Text style={s.emptyTitle}>No data for this day yet</Text>
              <Text style={s.emptySub}>
                Complete a task or capture a moment, then come back tonight.
              </Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => router.push('/(tabs)')}
                activeOpacity={0.8}
              >
                <Text style={s.emptyBtnText}>Plan today</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={s.modalRoot}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedPhoto(null)}
          />
          {selectedPhoto ? (
            <Image source={{ uri: selectedPhoto }} style={s.modalImage} resizeMode="contain" />
          ) : null}
          <TouchableOpacity
            style={s.modalClose}
            onPress={() => setSelectedPhoto(null)}
            accessibilityLabel="Close photo"
          >
            <Ionicons name="close" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.heroStat}>
      <Text style={s.heroStatValue}>{value}</Text>
      <Text style={s.heroStatLabel}>{label}</Text>
    </View>
  );
}

function StatTile({
  icon,
  val,
  label,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  val: string;
  label: string;
  color: string;
}) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={s.statVal}>{val}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  title: { ...Type.largeTitle, color: Colors.text.primary },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dayContainer: { maxHeight: 84 },
  dayScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  dayItem: { alignItems: 'center', gap: 6, minWidth: 44 },
  dayDow: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    color: Colors.text.tertiary,
  },
  dayDowActive: { color: Colors.text.primary },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: { backgroundColor: Colors.white },
  dayNum: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  dayNumActive: { color: Colors.black },

  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  center: { paddingTop: Spacing['5xl'], alignItems: 'center' },

  hero: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  heroDate: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: Colors.text.tertiary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  heroMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    marginTop: Spacing.md,
  },
  heroCopy: { flex: 1, gap: Spacing.xs },
  heroHeadline: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  heroHighlight: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text.tertiary,
  },
  heroPct: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    letterSpacing: -0.4,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatValue: {
    fontSize: 17,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    color: Colors.text.tertiary,
  },
  heroDivider: {
    width: StyleSheet.hairlineWidth,
    height: 26,
    backgroundColor: Colors.separator,
  },

  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  moodCopy: { flex: 1, gap: 2 },
  moodScore: { fontSize: 15, fontWeight: FontWeight.bold },
  moodLabel: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  moodTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  moodSub: { fontSize: 12, lineHeight: 17, color: Colors.text.tertiary },

  section: { marginBottom: Spacing.xl },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
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

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: {
    width: '31.5%',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 3,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  statIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statVal: {
    fontSize: 17,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  statLabel: { fontSize: 11, color: Colors.text.tertiary },

  momentsScroll: { gap: Spacing.md, paddingRight: Spacing.md },
  momentCard: {
    width: 168,
    height: 212,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.bg.card,
  },
  momentImage: { width: '100%', height: '100%' },
  momentFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.md,
    paddingTop: Spacing['3xl'],
  },
  momentTime: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.72)',
  },
  momentTitle: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
    marginTop: 1,
  },
  momentPlace: { fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 1 },
  momentPlaceholder: {
    width: 168,
    height: 212,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    backgroundColor: Colors.bg.card,
  },
  placeholderIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentPlaceholderTime: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.text.tertiary,
  },
  momentPlaceholderTitle: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginTop: 1,
  },

  emptyMoment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  emptyMomentTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  emptyMomentSub: {
    fontSize: 13,
    color: Colors.text.tertiary,
    marginTop: 2,
    lineHeight: 18,
  },

  insightCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  insightDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  insightIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text.secondary,
  },

  timeline: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  tlRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  tlTime: {
    width: 42,
    fontSize: 12,
    color: Colors.text.tertiary,
    fontWeight: FontWeight.medium,
    paddingTop: 2,
  },
  tlRail: { alignItems: 'center', width: 8 },
  tlDot: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  tlLine: {
    width: StyleSheet.hairlineWidth,
    flex: 1,
    backgroundColor: Colors.separator,
    marginTop: 4,
    minHeight: 28,
  },
  tlContent: { flex: 1, paddingBottom: Spacing.base, gap: 2 },
  tlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  tlLabel: {
    fontSize: 15,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
  },
  tlValue: { fontSize: 13, color: Colors.text.tertiary },
  tlPhotoBadge: {
    backgroundColor: Colors.emotion.snap + '1F',
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tlPhotoBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    color: Colors.emotion.snap,
  },

  empty: {
    paddingTop: Spacing['5xl'],
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyTitle: { ...Type.title3, color: Colors.text.primary },
  emptySub: {
    fontSize: 15,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyBtn: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },

  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: { width: '100%', height: '80%' },
  modalClose: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.fillStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
