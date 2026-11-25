import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import {
  Colors,
  FontWeight,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';
import { useTaskStore } from '@/store/taskStore';
import { useMissionStore } from '@/store/missionStore';
import { useLiveLocation } from '@/hooks/useLiveLocation';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { EmptyState, Press, SectionLabel, Segmented } from '@/components/ui/kit';
import { scheduleApi } from '@/services/api';
import { Task } from '@/types';
import { safeFormat, blockDurationMins } from '@/utils/formatters';
import { formatDistance, haversineMeters } from '@/utils/geo';
import Toast from 'react-native-toast-message';

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  planned: { label: 'Planned', color: Colors.text.tertiary },
  scheduled: { label: 'Scheduled', color: Colors.brand.primary },
  in_progress: { label: 'In progress', color: Colors.accent.amber },
  completed: { label: 'Done', color: Colors.accent.teal },
  postponed: { label: 'Postponed', color: Colors.accent.amber },
  cancelled: { label: 'Cancelled', color: Colors.text.tertiary },
  abandoned: { label: 'Abandoned', color: Colors.error },
};

const CAT_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  work: 'briefcase-outline',
  fitness: 'barbell-outline',
  health: 'heart-outline',
  learning: 'book-outline',
  personal: 'home-outline',
  social: 'people-outline',
  errands: 'cart-outline',
  creative: 'color-palette-outline',
  finance: 'wallet-outline',
  other: 'ellipse-outline',
};

const CAT_COLOR: Record<string, string> = {
  work: Colors.category.work,
  fitness: Colors.category.fitness,
  health: Colors.category.health,
  learning: Colors.category.learning,
  personal: Colors.category.personal,
  social: Colors.category.social,
  errands: Colors.category.errands,
  creative: Colors.category.creative,
  finance: Colors.category.finance,
  other: Colors.category.other,
};

export default function TodayScreen() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { tasks, fetchTasks, updateStatus } = useTaskStore();
  const { missions, ensureMissions, hydrate, hydrated } = useMissionStore();
  const live = useLiveLocation();
  const [blocks, setBlocks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'timeline' | 'list'>('timeline');

  const load = useCallback(async () => {
    await fetchTasks(today);
    try {
      const res = await scheduleApi.get(today);
      setBlocks(res.data.blocks || []);
    } catch {}
  }, [today, fetchTasks]);

  useEffect(() => {
    hydrate();
    load();
  }, [hydrate, load]);

  useEffect(() => {
    if (hydrated && live.coords) ensureMissions(tasks, live.coords);
  }, [hydrated, live.coords, tasks, ensureMissions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([load(), live.refresh()]);
    setRefreshing(false);
  }, [load, live]);

  const changeStatus = (task: Task) => {
    const opts = [
      { label: 'Start', status: 'in_progress' },
      { label: 'Mark complete', status: 'completed' },
      { label: 'Postpone', status: 'postponed' },
      { label: 'Cancel', status: 'cancelled' },
    ].filter((o) => o.status !== task.status);

    Alert.alert(task.title, 'Update status', [
      ...opts.map((o) => ({
        text: o.label,
        onPress: async () => {
          try {
            await updateStatus(task.id, o.status);
            Toast.show({ type: 'success', text1: o.label });
          } catch {}
        },
      })),
      { text: 'Dismiss', style: 'cancel' },
    ]);
  };

  const openTask = (task: Task) => {
    const mission = missions[task.id];
    if (mission) {
      router.push(`/mission/${task.id}` as any);
      return;
    }
    changeStatus(task);
  };

  const done = tasks.filter((t) => t.status === 'completed');
  const active = tasks.filter((t) => t.status === 'in_progress');
  const pending = tasks.filter((t) => ['planned', 'scheduled'].includes(t.status));
  const other = tasks.filter((t) => ['postponed', 'cancelled', 'abandoned'].includes(t.status));
  const pct = tasks.length > 0 ? done.length / tasks.length : 0;

  const missionTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          missions[t.id] &&
          !missions[t.id].completed &&
          !['completed', 'cancelled', 'abandoned'].includes(t.status)
      ),
    [tasks, missions]
  );

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={s.header}>
          <Text style={s.eyebrow}>{format(new Date(), 'EEEE')}</Text>
          <Text style={s.title}>Today</Text>
        </View>

        <View style={s.segmentWrap}>
          <Segmented
            options={[
              { value: 'timeline', label: 'Timeline', icon: 'time-outline' },
              { value: 'list', label: 'List', icon: 'list-outline' },
            ]}
            value={view}
            onChange={setView}
          />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.text.secondary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {tasks.length > 0 && (
            <View style={s.summary}>
              <ProgressRing
                size={76}
                strokeWidth={7}
                progress={pct}
                color={pct === 1 ? Colors.accent.teal : Colors.brand.primary}
                trackColor={Colors.fill}
              >
                <Text style={s.summaryPct}>{Math.round(pct * 100)}%</Text>
              </ProgressRing>
              <View style={s.summaryCopy}>
                <Text style={s.summaryTitle}>
                  {pct === 1
                    ? 'Every task closed.'
                    : pct >= 0.5
                    ? 'Momentum is holding.'
                    : 'The day is still yours.'}
                </Text>
                <Text style={s.summarySub}>
                  {done.length} of {tasks.length} complete
                  {' · '}
                  {pending.length + active.length} left
                </Text>
                <View style={s.track}>
                  <View
                    style={[
                      s.fill,
                      {
                        width: `${Math.round(pct * 100)}%`,
                        backgroundColor: pct === 1 ? Colors.accent.teal : Colors.brand.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          )}

          {missionTasks.length > 0 && (
            <View style={s.section}>
              <SectionLabel action={`${missionTasks.length} open`}>Missions</SectionLabel>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.missionScroll}
              >
                {missionTasks.map((task) => {
                  const mission = missions[task.id];
                  const distance = live.coords
                    ? haversineMeters(live.coords, mission.destination)
                    : null;
                  const inRange = distance !== null && distance <= mission.radiusMeters;
                  return (
                    <Press
                      key={task.id}
                      style={s.missionCard}
                      onPress={() => router.push(`/mission/${task.id}` as any)}
                    >
                      <View style={s.missionTop}>
                        <View
                          style={[
                            s.missionIcon,
                            { backgroundColor: (inRange ? Colors.accent.teal : Colors.brand.primary) + '22' },
                          ]}
                        >
                          <Ionicons
                            name={inRange ? 'flag' : 'lock-closed'}
                            size={16}
                            color={inRange ? Colors.accent.teal : Colors.brand.secondary}
                          />
                        </View>
                        <Text
                          style={[
                            s.missionState,
                            { color: inRange ? Colors.accent.teal : Colors.text.tertiary },
                          ]}
                        >
                          {inRange ? 'Ready' : 'Locked'}
                        </Text>
                      </View>
                      <Text style={s.missionTitle} numberOfLines={2}>
                        {task.title}
                      </Text>
                      <Text style={s.missionPlace} numberOfLines={1}>
                        {mission.placeName}
                      </Text>
                      <View style={s.missionFooter}>
                        <Text style={s.missionDistance}>
                          {distance !== null ? formatDistance(distance) : '—'}
                        </Text>
                        <Ionicons name="arrow-forward" size={15} color={Colors.text.tertiary} />
                      </View>
                    </Press>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {view === 'timeline' && blocks.length > 0 && (
            <View style={s.section}>
              <SectionLabel>The day</SectionLabel>
              <View style={s.timelineGroup}>
                {blocks.map((b, i) => {
                  const start = b?.start || b?.scheduled_start;
                  const end = b?.end || b?.scheduled_end;
                  const task = tasks.find((t) => t.id === b.task_id || t.id === b.id);
                  const mission = task ? missions[task.id] : undefined;
                  const cfg = STATUS_CFG[task?.status || 'planned'];
                  return (
                    <Press
                      key={b.id || i}
                      onPress={() => task && openTask(task)}
                      style={[
                        s.tlRow,
                        i < blocks.length - 1 && s.rowDivider,
                      ]}
                    >
                      <View style={s.tlTimeCol}>
                        <Text style={s.tlHour}>{safeFormat(start, 'h:mm')}</Text>
                        <Text style={s.tlApm}>{safeFormat(start, 'a')}</Text>
                      </View>
                      <View style={[s.tlBar, { backgroundColor: b.color || Colors.brand.primary }]} />
                      <View style={s.tlCopy}>
                        <Text
                          style={[
                            s.tlTitle,
                            task?.status === 'completed' && s.strikethrough,
                          ]}
                          numberOfLines={2}
                        >
                          {b.title}
                        </Text>
                        <View style={s.tlMetaRow}>
                          <Text style={s.tlMeta}>
                            {blockDurationMins(start, end)} min
                            {b.is_fixed ? ' · Fixed' : ''}
                          </Text>
                          {mission ? (
                            <Text style={s.tlMission}>
                              {mission.completed ? 'Captured' : 'Mission'}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      {task ? (
                        <View style={[s.statusDot, { backgroundColor: cfg.color }]} />
                      ) : null}
                    </Press>
                  );
                })}
              </View>
            </View>
          )}

          {(view === 'list' || blocks.length === 0) && (
            <>
              {active.length > 0 && (
                <TaskGroup title="In progress" tasks={active} missions={missions} onPress={openTask} />
              )}
              {pending.length > 0 && (
                <TaskGroup title="Pending" tasks={pending} missions={missions} onPress={openTask} />
              )}
              {done.length > 0 && (
                <TaskGroup title="Completed" tasks={done} missions={missions} onPress={openTask} dim />
              )}
              {other.length > 0 && (
                <TaskGroup title="Other" tasks={other} missions={missions} onPress={openTask} dim />
              )}
              {tasks.length === 0 && (
                <EmptyState
                  icon="calendar-outline"
                  title="Nothing planned yet"
                  body="Go home and tell Gocha what you need to get done. Add a run and we will pin the finish line."
                  action="Plan my day"
                  onAction={() => router.push('/(tabs)')}
                />
              )}
            </>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function TaskGroup({
  title,
  tasks,
  missions,
  onPress,
  dim,
}: {
  title: string;
  tasks: Task[];
  missions: Record<string, any>;
  onPress: (t: Task) => void;
  dim?: boolean;
}) {
  return (
    <View style={s.section}>
      <SectionLabel>{title}</SectionLabel>
      <View style={s.group}>
        {tasks.map((t, i) => (
          <TaskRow
            key={t.id}
            task={t}
            mission={missions[t.id]}
            onPress={() => onPress(t)}
            dim={dim}
            last={i === tasks.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

function TaskRow({
  task,
  mission,
  onPress,
  dim,
  last,
}: {
  task: Task;
  mission?: any;
  onPress: () => void;
  dim?: boolean;
  last?: boolean;
}) {
  const cfg = STATUS_CFG[task.status] || STATUS_CFG.planned;
  const color = CAT_COLOR[task.category] || Colors.text.tertiary;
  return (
    <Press onPress={onPress}>
      <View style={[s.taskRow, !last && s.rowDivider, dim && { opacity: 0.5 }]}>
        <View style={[s.taskIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={CAT_ICON[task.category] || 'ellipse-outline'} size={16} color={color} />
        </View>
        <View style={s.tlCopy}>
          <Text
            style={[s.taskTitle, task.status === 'completed' && s.strikethrough]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <Text style={s.taskMeta} numberOfLines={1}>
            {task.estimated_duration} min · {task.priority}
            {task.scheduled_start ? ` · ${safeFormat(task.scheduled_start, 'h:mm a')}` : ''}
            {mission ? ' · Mission' : ''}
          </Text>
        </View>
        <Text style={[s.taskStatus, { color: cfg.color }]}>
          {mission?.completed ? 'Captured' : cfg.label}
        </Text>
      </View>
    </Press>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
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

  segmentWrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  scroll: { paddingHorizontal: Spacing.lg },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryPct: {
    fontSize: 17,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  summaryCopy: { flex: 1, gap: 3 },
  summaryTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  summarySub: { fontSize: 13, color: Colors.text.tertiary },
  track: {
    height: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.fill,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  fill: { height: '100%', borderRadius: Radius.full },

  section: { marginBottom: Spacing.lg },
  group: { backgroundColor: Colors.bg.card, borderRadius: Radius.lg, overflow: 'hidden' },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },

  missionScroll: { gap: Spacing.sm, paddingRight: Spacing.sm },
  missionCard: {
    width: 200,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  missionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  missionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionState: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  missionTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    letterSpacing: -0.2,
  },
  missionPlace: { fontSize: 12, color: Colors.text.tertiary, marginTop: 2 },
  missionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  missionDistance: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.brand.secondary,
  },

  timelineGroup: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  tlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    minHeight: 66,
  },
  tlTimeCol: { width: 42 },
  tlHour: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  tlApm: { fontSize: 11, color: Colors.text.dim },
  tlBar: { width: 3, alignSelf: 'stretch', borderRadius: 2, minHeight: 34 },
  tlCopy: { flex: 1, gap: 2 },
  tlTitle: {
    fontSize: 16,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  tlMetaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tlMeta: { fontSize: 12, color: Colors.text.tertiary },
  tlMission: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.brand.secondary,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    minHeight: 60,
  },
  taskIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  taskMeta: { fontSize: 12, color: Colors.text.tertiary },
  taskStatus: { fontSize: 12, fontWeight: FontWeight.semibold },

  strikethrough: { textDecorationLine: 'line-through', color: Colors.text.tertiary },
});
