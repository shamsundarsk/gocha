import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/constants/theme';
import { useTaskStore } from '@/store/taskStore';
import { isOutdoorTask, useMissionStore } from '@/store/missionStore';
import { useLiveLocation } from '@/hooks/useLiveLocation';
import { LocationMap } from '@/components/map/LocationMap';
import { tasksApi } from '@/services/api';
import { Task } from '@/types';
import { clamp, formatDistance, haversineMeters } from '@/utils/geo';

export default function MissionScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const taskId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { tasks } = useTaskStore();
  const { missions, createMission, getMission, hydrate, hydrated } = useMissionStore();
  const live = useLiveLocation();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const [remoteTask, setRemoteTask] = useState<Task | null>(null);
  const [loadingTask, setLoadingTask] = useState(false);

  const storeTask = tasks.find((t) => t.id === taskId) || null;
  const task = storeTask || remoteTask;
  const mission = taskId ? missions[taskId] || getMission(taskId) : undefined;

  useEffect(() => {
    if (!taskId || storeTask) return;
    let cancelled = false;
    setLoadingTask(true);
    tasksApi
      .get(taskId)
      .then((res) => {
        if (!cancelled) setRemoteTask(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingTask(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId, storeTask]);

  useEffect(() => {
    if (hydrated && !mission && task && live.coords && isOutdoorTask(task)) {
      createMission(task, live.coords);
    }
  }, [hydrated, mission, task, live.coords, createMission]);

  const distance =
    mission && live.coords ? haversineMeters(live.coords, mission.destination) : null;
  const inRange = !!mission && distance !== null && distance <= mission.radiusMeters;
  const progress =
    mission && distance !== null
      ? mission.completed
        ? 1
        : clamp(
            (mission.startDistanceMeters - distance) /
              Math.max(1, mission.startDistanceMeters - mission.radiusMeters),
            0,
            1
          )
      : 0;

  const remaining = mission && distance !== null ? Math.max(0, distance - mission.radiusMeters) : 0;

  const navigate = () => {
    if (!mission) return;
    const { latitude, longitude } = mission.destination;
    const url = Platform.select({
      ios: `maps://?daddr=${latitude},${longitude}&dirflg=w`,
      android: `google.navigation:q=${latitude},${longitude}&mode=w`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });
    if (url) Linking.openURL(url).catch(() => {});
  };

  const openCamera = () => {
    if (!mission) return;
    router.push(`/capture/${mission.taskId}` as any);
  };

  if (!taskId || (!task && !loadingTask)) {
    return (
      <View style={s.root}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <Header />
          <View style={s.center}>
            <View style={s.emptyIcon}>
              <Ionicons name="compass-outline" size={26} color={Colors.text.tertiary} />
            </View>
            <Text style={s.emptyTitle}>Mission not found</Text>
            <Text style={s.emptySub}>This task may have been removed.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Header title={task?.title} />

          {loadingTask && !task ? (
            <View style={s.center}>
              <ActivityIndicator color={Colors.brand.primary} size="large" />
            </View>
          ) : (
            <>
              <View style={s.mapWrap}>
                <LocationMap
                  user={live.coords || (live.isDemo ? live.demoLocation : null)}
                  destination={mission?.destination || null}
                  radiusMeters={mission?.radiusMeters || 130}
                  city={live.city}
                  locked={!!mission && !mission.completed}
                  height={286}
                />
                {mission && (
                  <View style={s.mapBadgeWrap} pointerEvents="none">
                    <View style={s.mapBadge}>
                      <View style={s.mapBadgeIcon}>
                        <Ionicons name="flag" size={17} color={Colors.brand.secondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.mapBadgePlace} numberOfLines={1}>{mission.placeName}</Text>
                        <Text style={s.mapBadgeMeta}>
                          {mission.completed
                            ? 'Moment captured'
                            : inRange
                            ? 'You are inside the unlock zone'
                            : `${formatDistance(distance || 0)} away`}
                        </Text>
                      </View>
                      <View style={[s.mapBadgeState, inRange && s.mapBadgeStateReady]}>
                        <Text style={[s.mapBadgeStateText, inRange && s.mapBadgeStateTextReady]}>
                          {mission.completed ? 'Done' : inRange ? 'Ready' : 'Locked'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {live.error ? (
                <View style={s.demoBanner}>
                  <Ionicons name="location-outline" size={14} color={Colors.text.tertiary} />
                  <Text style={s.demoBannerText}>{live.error}</Text>
                </View>
              ) : null}

              {mission?.completed && mission.photoUri ? (
                <View style={s.photoCard}>
                  <Image source={{ uri: mission.photoUri }} style={s.photo} />
                  <View style={s.photoOverlay}>
                    <Text style={s.photoEyebrow}>Moment captured</Text>
                    <Text style={s.photoTitle}>{mission.photoCaption || mission.title}</Text>
                    <Text style={s.photoMeta}>
                      {mission.placeName}
                      {mission.capturedAt ? ` · ${format(new Date(mission.capturedAt), 'h:mm a')}` : ''}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={s.heroCard}>
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.brand.glow }]} />
                  <Text style={s.heroEyebrow}>Finish line</Text>
                  <Text style={s.heroTitle}>{mission?.placeName || task?.title}</Text>
                  <Text style={s.heroSub}>
                    {inRange
                      ? 'You made it. The camera is unlocked.'
                      : `Get within ${mission?.radiusMeters || 130}m to unlock the camera.`}
                  </Text>
                  <View style={s.heroStats}>
                    <View style={s.heroStat}>
                      <Text style={s.heroStatValue}>{distance !== null ? formatDistance(distance) : '—'}</Text>
                      <Text style={s.heroStatLabel}>distance</Text>
                    </View>
                    <View style={s.heroStatDivider} />
                    <View style={s.heroStat}>
                      <Text style={s.heroStatValue}>{mission?.radiusMeters || 130}m</Text>
                      <Text style={s.heroStatLabel}>unlock zone</Text>
                    </View>
                    <View style={s.heroStatDivider} />
                    <View style={s.heroStat}>
                      <Text style={s.heroStatValue}>{Math.round(progress * 100)}%</Text>
                      <Text style={s.heroStatLabel}>of the way</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Path to the photo */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>Path to the photo</Text>
                <View style={s.pathCard}>
                  <PathStep
                    index="1"
                    title="Finish line locked"
                    subtitle={mission?.placeName || 'We pin the destination when the task is created.'}
                    done
                    accent={Colors.emotion.spark}
                  />
                  <PathStep
                    index="2"
                    title="Reach the unlock zone"
                    subtitle={
                      inRange
                        ? 'You are inside the zone.'
                        : remaining > 0
                        ? `${formatDistance(remaining)} to go · ${mission?.radiusMeters || 130}m radius`
                        : 'Waiting for a GPS fix.'
                    }
                    done={inRange || mission?.completed}
                    accent={Colors.emotion.move}
                  >
                    <View style={s.stepProgressTrack}>
                      <View
                        style={[
                          s.stepProgressFill,
                          {
                            width: `${Math.round(progress * 100)}%`,
                            backgroundColor: inRange ? Colors.accent.teal : Colors.brand.primary,
                          },
                        ]}
                      />
                    </View>
                  </PathStep>
                  <PathStep
                    index="3"
                    title="Take the proof"
                    subtitle={
                      mission?.completed
                        ? 'Captured. This is your evidence for the day.'
                        : inRange
                        ? 'Camera unlocked. One shot is enough.'
                        : 'The camera stays locked until you arrive.'
                    }
                    done={!!mission?.completed}
                    last
                    accent={Colors.emotion.snap}
                  />
                </View>
              </View>

              {/* CTA */}
              {mission?.completed ? (
                <View style={s.actions}>
                  <TouchableOpacity
                    style={s.primaryBtn}
                    onPress={() => router.push('/(tabs)/wrapped')}
                    activeOpacity={0.86}
                  >
                    <Text style={s.primaryBtnText}>See it in Day Wrapped</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.secondaryBtn} onPress={openCamera} activeOpacity={0.8}>
                    <Text style={s.secondaryBtnText}>Retake photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.actions}>
                  <TouchableOpacity
                    style={[s.primaryBtn, !inRange && s.primaryBtnLocked]}
                    onPress={inRange ? openCamera : navigate}
                    activeOpacity={0.86}
                  >
                    <Text style={s.primaryBtnText}>
                      {inRange ? 'Open camera' : `Navigate to ${formatDistance(distance || 0)}`}
                    </Text>
                  </TouchableOpacity>
                  {!inRange && (
                    <TouchableOpacity
                      style={s.secondaryBtn}
                      onPress={() => router.push(`/capture/${mission?.taskId || taskId}?demo=1` as any)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.secondaryBtnText}>Demo: simulate arrival</Text>
                    </TouchableOpacity>
                  )}
                  {inRange && (
                    <TouchableOpacity style={s.secondaryBtn} onPress={navigate} activeOpacity={0.8}>
                      <Text style={s.secondaryBtnText}>Open walking directions</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={s.noteCard}>
                <Ionicons name="lock-closed" size={15} color={Colors.text.tertiary} style={{ marginTop: 1 }} />
                <Text style={s.noteText}>
                  The finish line is locked for this task. It does not move, so you always know exactly
                  where the photo has to happen.
                </Text>
              </View>

              <View style={{ height: 120 }} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Header({ title }: { title?: string }) {
  return (
    <View style={s.header}>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
        <Text style={s.backIcon}>←</Text>
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={s.headerEyebrow}>Mission</Text>
        <Text style={s.headerTitle} numberOfLines={1}>{title || 'Locked destination'}</Text>
      </View>
      <View style={s.headerLock}>
        <Ionicons name="lock-closed" size={15} color={Colors.emotion.snap} />
      </View>
    </View>
  );
}

function PathStep({
  index,
  title,
  subtitle,
  done,
  last,
  accent,
  children,
}: {
  index: string;
  title: string;
  subtitle: string;
  done?: boolean;
  last?: boolean;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={s.stepRow}>
      <View style={s.stepRail}>
        <View
          style={[
            s.stepDot,
            {
              backgroundColor: done ? accent : Colors.bg.elevated,
              borderColor: done ? accent : Colors.bg.cardBorder,
            },
          ]}
        >
          {done ? (
            <Ionicons name="checkmark" size={14} color={Colors.white} />
          ) : (
            <Text style={[s.stepDotText, { color: Colors.text.tertiary }]}>{index}</Text>
          )}
        </View>
        {!last && <View style={s.stepLine} />}
      </View>
      <View style={s.stepBody}>
        <Text style={s.stepTitle}>{title}</Text>
        <Text style={s.stepSubtitle}>{subtitle}</Text>
        {children}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.sm },
  center: { paddingTop: Spacing['5xl'], alignItems: 'center', gap: Spacing.md },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.fill,
    borderWidth: 1,
    borderColor: Colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: FontSize.lg, color: Colors.text.primary, marginTop: -1 },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: Colors.text.tertiary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    letterSpacing: -0.35,
  },
  headerLock: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.emotion.snap + '18',
    borderWidth: 1,
    borderColor: Colors.emotion.snap + '38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLockIcon: { fontSize: 15 },

  mapWrap: { marginBottom: Spacing.base },
  mapBadgeWrap: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  mapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(20,20,22,0.94)',
    borderRadius: Radius.lg,

    padding: Spacing.md,
  },
  mapBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.brand.glow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBadgePlace: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text.primary },
  mapBadgeMeta: { fontSize: 10, color: Colors.text.secondary, marginTop: 1 },
  mapBadgeState: {
    backgroundColor: Colors.emotion.snap + '18',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.emotion.snap + '38',
  },
  mapBadgeStateReady: {
    backgroundColor: Colors.accent.teal + '1C',
    borderColor: Colors.accent.teal + '55',
  },
  mapBadgeStateText: { fontSize: 10, fontWeight: FontWeight.semibold, color: Colors.emotion.snap },
  mapBadgeStateTextReady: { color: Colors.accent.teal },

  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bg.glass,
    borderRadius: Radius.sm,

    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.base,
  },
  demoBannerText: { fontSize: 13, color: Colors.text.tertiary, flex: 1 },

  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: Colors.brand.secondary,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.black,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  heroSub: { fontSize: FontSize.sm, color: Colors.text.secondary, marginTop: Spacing.xs, lineHeight: 20 },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.base,
    backgroundColor: Colors.fill,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: FontSize.md, fontWeight: FontWeight.black, color: Colors.text.primary },
  heroStatLabel: { fontSize: 9, color: Colors.text.muted, marginTop: 2, letterSpacing: 0.5 },
  heroStatDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.08)' },

  photoCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,

    ...Shadow.md,
  },
  photo: { width: '100%', height: 300 },
  photoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.base,
    paddingTop: Spacing['3xl'],
  },
  photoEyebrow: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: Colors.accent.teal,
  },
  photoTitle: { fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white, marginTop: 3 },
  photoMeta: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.text.tertiary,
    marginBottom: Spacing.md,
  },
  pathCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.separator,
    padding: Spacing.base,
  },
  stepRow: { flexDirection: 'row', gap: Spacing.md },
  stepRail: { alignItems: 'center', width: 28 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotText: { fontSize: 11, fontWeight: FontWeight.black },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.separator,
    marginVertical: 4,
    minHeight: 26,
  },
  stepBody: { flex: 1, paddingBottom: Spacing.base },
  stepTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text.primary },
  stepSubtitle: { fontSize: FontSize.xs, color: Colors.text.muted, marginTop: 2, lineHeight: 17 },
  stepProgressTrack: {
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.fill,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  stepProgressFill: { height: '100%', borderRadius: Radius.full },

  actions: { gap: Spacing.sm, marginBottom: Spacing.base },
  primaryBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base + 2,
    alignItems: 'center',
    ...Shadow.brand,
  },
  primaryBtnLocked: { backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.brand.primary + '40' },
  primaryBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },
  secondaryBtn: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.bg.card,
  },
  secondaryBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text.secondary },

  noteCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },

  noteText: { flex: 1, fontSize: 13, color: Colors.text.tertiary, lineHeight: 18 },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: { fontSize: 20, fontWeight: FontWeight.bold, color: Colors.text.primary },
  emptySub: { fontSize: 17, color: Colors.text.tertiary, textAlign: 'center' },
});
