import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isValid } from 'date-fns';
import { Colors, FontSize, Spacing, Radius, FontWeight, Shadow } from '@/constants/theme';
import { useContextStore } from '@/store/contextStore';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { scheduleApi } from '@/services/api';
import { ScheduleBlock, Task } from '@/types';
import { safeFormat, blockDurationMins } from '@/utils/formatters';
import Toast from 'react-native-toast-message';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { context, fetchContext } = useContextStore();
  const { tasks, fetchTasks, parseAndCreate, updateStatus } = useTaskStore();
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [nextAction, setNextAction] = useState<ScheduleBlock | null>(null);
  const [freeMinutes, setFreeMinutes] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [parsing, setParsing] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  const loadAll = useCallback(async () => {
    await Promise.all([fetchContext(), fetchTasks(today)]);
    try {
      const res = await scheduleApi.get(today);
      setSchedule(res.data.blocks || []);
      setNextAction(res.data.next_action || null);
      setFreeMinutes(res.data.free_minutes_today || 0);
    } catch {}
  }, [today]);

  useEffect(() => { loadAll(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const handleParse = async () => {
    if (!inputText.trim()) return;
    setParsing(true);
    try {
      const created = await parseAndCreate(inputText.trim(), today);
      setInputText('');
      Toast.show({ type: 'success', text1: `Created ${created.length} task${created.length > 1 ? 's' : ''}.` });
      await loadAll();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message });
    } finally {
      setParsing(false);
    }
  };

  const handleStart = async (taskId: string) => {
    if (!taskId) return;
    try {
      await updateStatus(taskId, 'in_progress');
      Toast.show({ type: 'success', text1: 'Task started.' });
    } catch {}
  };

  const pendingTasks = tasks.filter(t => !['completed', 'cancelled', 'abandoned'].includes(t.status));
  const completedToday = tasks.filter(t => t.status === 'completed');

  // Get start/end from block — handles both "start" and "scheduled_start" keys
  const getStart = (b: any): string | undefined => b?.start || b?.scheduled_start;
  const getEnd = (b: any): string | undefined => b?.end || b?.scheduled_end;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>{user?.full_name?.split(' ')[0] || 'You'}</Text>
          </View>
          <View style={styles.dateChip}>
            <Text style={styles.dateText}>{format(new Date(), 'MMM d')}</Text>
          </View>
        </View>

        {/* Quick input */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>What do you need to get done?</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Run at 6, meeting at 3pm, finish report..."
              placeholderTextColor={Colors.text.muted}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.parseButton, (!inputText.trim() || parsing) && { opacity: 0.5 }]}
              onPress={handleParse}
              disabled={!inputText.trim() || parsing}
            >
              {parsing
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={styles.parseButtonText}>→</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Context banners */}
        {context && !context.is_suitable_outdoor && (
          <View style={styles.contextBanner}>
            <Text style={styles.contextBannerEmoji}>🌡️</Text>
            <Text style={styles.contextBannerText}>
              {context.unsuitable_reason || 'Weather unsuitable for outdoor tasks'} — outdoor tasks moved to evening.
            </Text>
          </View>
        )}
        {context && context.screen_time_recreational_minutes >= 45 && (
          <View style={[styles.contextBanner, { borderColor: Colors.warning }]}>
            <Text style={styles.contextBannerEmoji}>📱</Text>
            <Text style={styles.contextBannerText}>
              {context.screen_time_recreational_minutes} min recreational screen time today.
              {pendingTasks[0] ? ` "${pendingTasks[0].title}" is waiting.` : ''}
            </Text>
          </View>
        )}

        {/* Next action card */}
        {nextAction && getStart(nextAction) && (
          <View style={styles.nextCard}>
            <LinearGradient
              colors={[Colors.bg.card, Colors.bg.cardAlt]}
              style={styles.nextCardGradient}
            >
              <Text style={styles.nextLabel}>NEXT</Text>
              <Text style={styles.nextTitle}>{nextAction.title}</Text>
              <Text style={styles.nextMeta}>
                {safeFormat(getStart(nextAction), 'h:mm a')}
                {' · '}
                {blockDurationMins(getStart(nextAction), getEnd(nextAction))} min
              </Text>
              {(nextAction.task_id || (nextAction as any).id) && (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => handleStart(nextAction.task_id || (nextAction as any).id)}
                >
                  <LinearGradient
                    colors={[Colors.brand.primary, Colors.brand.secondary]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.startGradient}
                  >
                    <Text style={styles.startButtonText}>START</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>
        )}

        {/* Progress summary */}
        <View style={styles.summaryRow}>
          <SummaryCard value={`${completedToday.length}`} label="Done" />
          <SummaryCard value={`${pendingTasks.length}`} label="Remaining" />
          <SummaryCard value={`${freeMinutes}m`} label="Free" />
          {context?.steps_today ? (
            <SummaryCard value={`${(context.steps_today / 1000).toFixed(1)}k`} label="Steps" />
          ) : null}
        </View>

        {/* Today's schedule */}
        {schedule.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today</Text>
            {schedule.map((block) => (
              <ScheduleBlockRow key={(block as any).id || block.title} block={block} />
            ))}
          </View>
        )}

        {/* Fallback: pending tasks when no schedule */}
        {schedule.length === 0 && pendingTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending</Text>
            {pendingTasks.map(task => (
              <TaskRow key={task.id} task={task} onStart={() => handleStart(task.id)} />
            ))}
          </View>
        )}

        {/* Nearby events teaser */}
        {context?.nearby_events && context.nearby_events.length > 0 && (
          <View style={styles.eventTeaser}>
            <Text style={styles.eventTeaserEmoji}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventTeaserTitle}>Tonight nearby</Text>
              <Text style={styles.eventTeaserSub}>{context.nearby_events.length} events matching your interests</Text>
            </View>
            <Text style={styles.eventTeaserChevron}>›</Text>
          </View>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function ScheduleBlockRow({ block }: { block: any }) {
  const start = block?.start || block?.scheduled_start;
  return (
    <View style={[styles.blockRow, { borderLeftColor: block.color || Colors.brand.primary }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.blockTime}>{safeFormat(start, 'h:mm a')}</Text>
        <Text style={styles.blockTitle}>{block.title}</Text>
      </View>
      {block.is_fixed && (
        <View style={styles.fixedChip}>
          <Text style={styles.fixedChipText}>Fixed</Text>
        </View>
      )}
    </View>
  );
}

function TaskRow({ task, onStart }: { task: Task; onStart: () => void }) {
  const categoryEmoji: Record<string, string> = {
    work: '💼', fitness: '🏃', health: '❤️', learning: '📚',
    personal: '🏠', social: '👥', errands: '📋', creative: '🎨',
    finance: '💰', other: '📌',
  };
  return (
    <View style={styles.taskRow}>
      <Text style={styles.taskEmoji}>{categoryEmoji[task.category] || '📌'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.taskMeta}>{task.estimated_duration} min · {task.priority}</Text>
      </View>
      <TouchableOpacity style={styles.taskStartBtn} onPress={onStart}>
        <Text style={styles.taskStartText}>Start</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.lg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: Spacing['2xl'],
  },
  greeting: { fontSize: FontSize.base, color: Colors.text.secondary },
  name: { fontSize: FontSize['3xl'], fontWeight: FontWeight.bold, color: Colors.text.primary },
  dateChip: {
    backgroundColor: Colors.bg.card, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderRadius: Radius.full,
  },
  dateText: { fontSize: FontSize.sm, color: Colors.text.secondary, fontWeight: FontWeight.medium },
  inputCard: {
    backgroundColor: Colors.bg.card, borderRadius: Radius.xl,
    padding: Spacing.base, marginBottom: Spacing.base,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  inputLabel: { fontSize: FontSize.sm, color: Colors.text.secondary, marginBottom: Spacing.sm },
  inputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end' },
  textInput: { flex: 1, fontSize: FontSize.base, color: Colors.text.primary, minHeight: 44, maxHeight: 100 },
  parseButton: {
    width: 44, height: 44, backgroundColor: Colors.brand.primary,
    borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
  },
  parseButtonText: { fontSize: FontSize.xl, color: Colors.white, fontWeight: FontWeight.bold },
  contextBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', gap: Spacing.sm,
  },
  contextBannerEmoji: { fontSize: 18 },
  contextBannerText: { flex: 1, fontSize: FontSize.sm, color: Colors.text.secondary, lineHeight: 20 },
  nextCard: { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.base, ...Shadow.brand },
  nextCardGradient: {
    padding: Spacing.xl, borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)', borderRadius: Radius.xl,
  },
  nextLabel: {
    fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.brand.primary,
    letterSpacing: 2, marginBottom: Spacing.sm,
  },
  nextTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.xs },
  nextMeta: { fontSize: FontSize.sm, color: Colors.text.secondary, marginBottom: Spacing.base },
  startButton: { borderRadius: Radius.lg, overflow: 'hidden', alignSelf: 'flex-start' },
  startGradient: { paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md },
  startButtonText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1 },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  summaryCard: {
    flex: 1, backgroundColor: Colors.bg.card, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  summaryValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text.primary },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.text.secondary, marginTop: 2 },
  section: { marginBottom: Spacing.base },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text.secondary,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.md,
  },
  blockRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderLeftWidth: 3,
  },
  blockTime: { fontSize: FontSize.xs, color: Colors.text.secondary, marginBottom: 2 },
  blockTitle: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.text.primary },
  fixedChip: {
    backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: Spacing.sm,
    paddingVertical: 3, borderRadius: Radius.full,
  },
  fixedChipText: { fontSize: FontSize.xs, color: Colors.brand.primary },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md,
  },
  taskEmoji: { fontSize: 20 },
  taskTitle: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.text.primary },
  taskMeta: { fontSize: FontSize.xs, color: Colors.text.secondary, marginTop: 2 },
  taskStartBtn: {
    backgroundColor: Colors.brand.primary, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderRadius: Radius.md,
  },
  taskStartText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.white },
  eventTeaser: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg, padding: Spacing.base, marginTop: Spacing.sm,
    gap: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  eventTeaserEmoji: { fontSize: 22 },
  eventTeaserTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  eventTeaserSub: { fontSize: FontSize.sm, color: Colors.text.secondary },
  eventTeaserChevron: { fontSize: FontSize.xl, color: Colors.text.muted },
});
