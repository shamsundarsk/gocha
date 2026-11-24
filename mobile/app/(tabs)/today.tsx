import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, isToday } from 'date-fns';
import { Colors, FontSize, Spacing, Radius, FontWeight } from '@/constants/theme';
import { useTaskStore } from '@/store/taskStore';
import { scheduleApi } from '@/services/api';
import { Task, ScheduleBlock } from '@/types';
import { safeFormat, blockDurationMins } from '@/utils/formatters';
import Toast from 'react-native-toast-message';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  planned: { label: 'Planned', color: Colors.text.secondary, bg: Colors.bg.card },
  scheduled: { label: 'Scheduled', color: Colors.brand.primary, bg: 'rgba(99,102,241,0.1)' },
  in_progress: { label: 'In Progress', color: Colors.warning, bg: 'rgba(245,158,11,0.1)' },
  completed: { label: 'Done', color: Colors.success, bg: 'rgba(16,185,129,0.1)' },
  postponed: { label: 'Postponed', color: Colors.warning, bg: 'rgba(245,158,11,0.1)' },
  cancelled: { label: 'Cancelled', color: Colors.text.muted, bg: Colors.bg.card },
  abandoned: { label: 'Abandoned', color: Colors.error, bg: 'rgba(239,68,68,0.1)' },
};

const CATEGORY_EMOJI: Record<string, string> = {
  work: '💼', fitness: '🏃', health: '❤️', learning: '📚',
  personal: '🏠', social: '👥', errands: '📋', creative: '🎨',
  finance: '💰', other: '📌',
};

export default function TodayScreen() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { tasks, fetchTasks, updateStatus } = useTaskStore();
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'timeline' | 'list'>('timeline');

  const load = useCallback(async () => {
    await fetchTasks(today);
    try {
      const res = await scheduleApi.get(today);
      setSchedule(res.data.blocks || []);
    } catch {}
  }, [today]);

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleStatusChange = (task: Task) => {
    const options: Array<{ label: string; status: string }> = [];
    if (task.status !== 'in_progress') options.push({ label: 'Start', status: 'in_progress' });
    if (task.status !== 'completed') options.push({ label: 'Mark Complete', status: 'completed' });
    if (task.status !== 'postponed') options.push({ label: 'Postpone', status: 'postponed' });
    if (task.status !== 'cancelled') options.push({ label: 'Cancel', status: 'cancelled' });

    Alert.alert(task.title, 'Update status', [
      ...options.map(({ label, status }) => ({
        text: label,
        onPress: async () => {
          try {
            await updateStatus(task.id, status);
            Toast.show({ type: 'success', text1: `${label} ✓` });
          } catch {}
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const activeTasks = tasks.filter((t) => t.status === 'in_progress');
  const pendingTasks = tasks.filter((t) => ['planned', 'scheduled'].includes(t.status));
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const postponedTasks = tasks.filter((t) => t.status === 'postponed');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.subtitle}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'timeline' && styles.toggleActive]}
            onPress={() => setView('timeline')}
          >
            <Text style={[styles.toggleText, view === 'timeline' && styles.toggleTextActive]}>Timeline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, view === 'list' && styles.toggleActive]}
            onPress={() => setView('list')}
          >
            <Text style={[styles.toggleText, view === 'list' && styles.toggleTextActive]}>List</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress bar */}
        {tasks.length > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>{completedTasks.length}/{tasks.length} complete</Text>
              <Text style={styles.progressPct}>
                {Math.round((completedTasks.length / tasks.length) * 100)}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(completedTasks.length / tasks.length) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}

        {/* Timeline view */}
        {view === 'timeline' && schedule.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            {schedule.map((block, idx) => (
              <TimelineBlock
                key={block.id}
                block={block}
                isLast={idx === schedule.length - 1}
                task={tasks.find((t) => t.id === block.task_id)}
                onPress={(t) => t && handleStatusChange(t)}
              />
            ))}
          </View>
        )}

        {/* List view */}
        {(view === 'list' || schedule.length === 0) && (
          <>
            {activeTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>In Progress</Text>
                {activeTasks.map((t) => <TaskCard key={t.id} task={t} onPress={() => handleStatusChange(t)} />)}
              </View>
            )}

            {pendingTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending</Text>
                {pendingTasks.map((t) => <TaskCard key={t.id} task={t} onPress={() => handleStatusChange(t)} />)}
              </View>
            )}

            {completedTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Completed</Text>
                {completedTasks.map((t) => <TaskCard key={t.id} task={t} onPress={() => handleStatusChange(t)} />)}
              </View>
            )}

            {postponedTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Postponed</Text>
                {postponedTasks.map((t) => <TaskCard key={t.id} task={t} onPress={() => handleStatusChange(t)} />)}
              </View>
            )}

            {tasks.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyTitle}>Nothing planned yet</Text>
                <Text style={styles.emptySub}>Go to Home and tell us what you want to get done today.</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function TimelineBlock({
  block, isLast, task, onPress,
}: {
  block: any;
  isLast: boolean;
  task?: Task;
  onPress: (t?: Task) => void;
}) {
  const start = block?.start || block?.scheduled_start;
  const end = block?.end || block?.scheduled_end;
  return (
    <TouchableOpacity onPress={() => onPress(task)} activeOpacity={task ? 0.7 : 1}>
      <View style={styles.timelineRow}>
        {/* Time column */}
        <View style={styles.timeCol}>
          <Text style={styles.timeText}>{safeFormat(start, 'h:mm')}</Text>
          <Text style={styles.timeAmPm}>{safeFormat(start, 'a')}</Text>
        </View>

        {/* Line */}
        <View style={styles.lineCol}>
          <View style={[styles.dot, { backgroundColor: block.color || Colors.brand.primary }]} />
          {!isLast && <View style={styles.line} />}
        </View>

        {/* Block */}
        <View style={[styles.timelineBlock, { borderLeftColor: block.color || Colors.brand.primary }]}>
          <Text style={styles.timelineTitle}>{block.title}</Text>
          <View style={styles.timelineMeta}>
            <Text style={styles.timelineMetaText}>
              {blockDurationMins(start, end)} min
            </Text>
            {block.is_fixed && (
              <View style={styles.fixedBadge}>
                <Text style={styles.fixedBadgeText}>Fixed</Text>
              </View>
            )}
            {task && (
              <View style={[
                styles.statusBadge,
                { backgroundColor: STATUS_CONFIG[task.status]?.bg || Colors.bg.card },
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  { color: STATUS_CONFIG[task.status]?.color || Colors.text.secondary },
                ]}>
                  {STATUS_CONFIG[task.status]?.label || task.status}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TaskCard({ task, onPress }: { task: Task; onPress: () => void }) {
  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.planned;
  return (
    <TouchableOpacity style={[styles.taskCard, task.status === 'completed' && { opacity: 0.6 }]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.taskEmoji}>{CATEGORY_EMOJI[task.category] || '📌'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.taskTitle, task.status === 'completed' && styles.taskTitleDone]}>
          {task.title}
        </Text>
        <Text style={styles.taskMeta}>
          {task.estimated_duration} min · {task.priority}
          {task.scheduled_start ? ` · ${safeFormat(task.scheduled_start, 'h:mm a')}` : ''}
        </Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  title: { fontSize: FontSize['3xl'], fontWeight: FontWeight.bold, color: Colors.text.primary },
  subtitle: { fontSize: FontSize.sm, color: Colors.text.secondary },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.md,
    padding: 3,
  },
  toggleBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.sm },
  toggleActive: { backgroundColor: Colors.brand.primary },
  toggleText: { fontSize: FontSize.sm, color: Colors.text.secondary, fontWeight: FontWeight.medium },
  toggleTextActive: { color: Colors.white },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.sm },

  progressSection: { marginBottom: Spacing.lg },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  progressText: { fontSize: FontSize.sm, color: Colors.text.secondary },
  progressPct: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  progressTrack: { height: 6, backgroundColor: Colors.bg.card, borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.brand.primary, borderRadius: Radius.full },

  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.text.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },

  timelineRow: { flexDirection: 'row', marginBottom: Spacing.sm, alignItems: 'flex-start' },
  timeCol: { width: 52, alignItems: 'flex-end', paddingRight: Spacing.sm, paddingTop: 2 },
  timeText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  timeAmPm: { fontSize: FontSize.xs, color: Colors.text.muted },
  lineCol: { alignItems: 'center', width: 20, marginRight: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  line: { width: 2, flex: 1, backgroundColor: Colors.bg.card, marginTop: 2 },
  timelineBlock: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderLeftWidth: 3,
    minHeight: 60,
  },
  timelineTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  timelineMeta: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs, flexWrap: 'wrap' },
  timelineMetaText: { fontSize: FontSize.xs, color: Colors.text.muted },
  fixedBadge: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  fixedBadgeText: { fontSize: FontSize.xs, color: Colors.brand.primary },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },

  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  taskEmoji: { fontSize: 20 },
  taskTitle: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.text.primary },
  taskTitleDone: { textDecorationLine: 'line-through', color: Colors.text.muted },
  taskMeta: { fontSize: FontSize.xs, color: Colors.text.secondary, marginTop: 2 },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusPillText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },

  empty: { alignItems: 'center', paddingTop: Spacing['5xl'] },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.text.primary, marginBottom: Spacing.sm },
  emptySub: { fontSize: FontSize.base, color: Colors.text.secondary, textAlign: 'center', paddingHorizontal: Spacing['2xl'] },
});
