import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';
import {
  Colors,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';
import { useContextStore } from '@/store/contextStore';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { isOutdoorTask, useMissionStore } from '@/store/missionStore';
import { useLiveLocation } from '@/hooks/useLiveLocation';
import { LocationMap } from '@/components/map/LocationMap';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Press, SectionLabel, Surface } from '@/components/ui/kit';
import { scheduleApi } from '@/services/api';
import { Task } from '@/types';
import { safeFormat, blockDurationMins } from '@/utils/formatters';
import { clamp, formatDistance, haversineMeters } from '@/utils/geo';

const CAT_COLOR: Record<string, string> = {
  work: Colors.category.work,
  fitness: Colors.category.fitness,
  health: Colors.category.health,
  learning: Colors.category.learning,
  personal: Colors.category.personal,
  other: Colors.category.other,
  errands: Colors.category.errands,
  social: Colors.category.social,
  creative: Colors.category.creative,
  finance: Colors.category.finance,
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

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuthStore();
  const { context, fetchContext } = useContextStore();
  const { tasks, fetchTasks, parseAndCreate, updateStatus } = useTaskStore();
  const { missions, ensureMissions, hydrate, hydrated, getMission } = useMissionStore();
  const live = useLiveLocation();

  const [blocks, setBlocks] = useState<any[]>([]);
  const [nextAction, setNextAction] = useState<any>(null);
  const [freeMinutes, setFreeMinutes] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [parsing, setParsing] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const today = format(new Date(), 'yyyy-MM-dd');
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const initials =
    user?.full_name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'G';

  const loadAll = useCallback(async () => {
    await Promise.all([fetchContext(), fetchTasks(today)]);
    try {
      const res = await scheduleApi.get(today);
      setBlocks(res.data.blocks || []);
      setNextAction(res.data.next_action || null);
      setFreeMinutes(res.data.free_minutes_today || 0);
    } catch {}
  }, [today, fetchContext, fetchTasks]);

  useEffect(() => {
    hydrate();
    loadAll();
  }, [hydrate, loadAll]);

  useEffect(() => {
    if (hydrated && live.coords) ensureMissions(tasks, live.coords);
  }, [hydrated, live.coords, tasks, ensureMissions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadAll(), live.refresh()]);
    setRefreshing(false);
  }, [loadAll, live]);

  const handleParse = async () => {
    if (!inputText.trim()) return;
    setParsing(true);
    try {
      const created = await parseAndCreate(inputText.trim(), today);
      setInputText('');
      setInputFocused(false);
      Toast.show({
        type: 'success',
        text1: `${created.length} task${created.length > 1 ? 's' : ''} added`,
      });
      await loadAll();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message });
    } finally {
      setParsing(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await updateStatus(id, 'in_progress');
      Toast.show({ type: 'success', text1: 'Started' });
    } catch {}
  };

  const pending = tasks.filter(
    (t) => !['completed', 'cancelled', 'abandoned'].includes(t.status)
  );
  const done = tasks.filter((t) => t.status === 'completed');
  const completionPct = tasks.length > 0 ? done.length / tasks.length : 0;

  const activeMissionTask = useMemo(() => {
    const withMission = tasks.filter((t) => missions[t.id]);
    const pendingWithMission = withMission.filter(
      (t) => !['completed', 'cancelled', 'abandoned'].includes(t.status)
    );
    return (
      pendingWithMission.find((t) => t.status === 'in_progress') ||
      pendingWithMission[0] ||
      withMission.find((t) => missions[t.id].completed) ||
      null
    );
  }, [tasks, missions]);

  const activeMission = activeMissionTask ? missions[activeMissionTask.id] : null;
  const distanceToMission =
    activeMission && live.coords
      ? haversineMeters(live.coords, activeMission.destination)
      : null;
  const inRange =
    !!activeMission &&
    distanceToMission !== null &&
    distanceToMission <= activeMission.radiusMeters;

  const getStart = (b: any) => b?.start || b?.scheduled_start;
  const getEnd = (b: any) => b?.end || b?.scheduled_end;
  const getTaskId = (b: any) => b?.task_id || b?.id;

  const openMission = (taskId: string) => router.push(`/mission/${taskId}` as any);
  const openCapture = (taskId: string) => router.push(`/capture/${taskId}` as any);

  const handleCaptureWidget = () => {
    if (!activeMission) {
      inputRef.current?.focus();
      return;
    }
    if (activeMission.completed) {
      router.push('/(tabs)/wrapped');
      return;
    }
    if (inRange) openCapture(activeMission.taskId);
    else openMission(activeMission.taskId);
  };

  const mapUser = live.coords || (live.isDemo ? live.demoLocation : null);
  const dayTitle =
    tasks.length === 0
      ? 'A clear day'
      : completionPct === 1
      ? 'Everything done'
      : completionPct >= 0.5
      ? 'Good pace'
      : 'Day is open';
  const daySub =
    tasks.length === 0
      ? 'Tell Gocha what you need to get done.'
      : `${done.length} of ${tasks.length} complete · ${freeMinutes}m free`;

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={s.header}>
            <Press
              onPress={() => router.push('/(tabs)/wrapped')}
              style={s.wrappedButton}
              accessibilityLabel="Open Day Wrapped"
            >
              <Ionicons name="sparkles" size={19} color={Colors.brand.secondary} />
            </Press>

            <View style={s.headerCopy}>
              <Text style={s.headerDate}>{format(new Date(), 'EEEE, MMMM d')}</Text>
              <Text style={s.headerName} numberOfLines={1}>
                {firstName}
              </Text>
            </View>

            <Press
              onPress={() => router.push('/(tabs)/profile')}
              style={s.avatar}
              accessibilityLabel="Open profile"
            >
              <Text style={s.avatarText}>{initials}</Text>
            </Press>
          </View>

          <Text style={s.greeting}>{greeting()}.</Text>

          {/* Day summary */}
          <Surface style={s.hero}>
            <View style={s.heroTop}>
              <ProgressRing
                size={58}
                strokeWidth={6}
                progress={completionPct}
                color={completionPct === 1 ? Colors.accent.teal : Colors.brand.primary}
                trackColor={Colors.fill}
              >
                <Text style={s.heroPct}>{Math.round(completionPct * 100)}</Text>
              </ProgressRing>
              <View style={s.heroCopy}>
                <Text style={s.heroTitle}>{dayTitle}</Text>
                <Text style={s.heroSub}>{daySub}</Text>
              </View>
            </View>

            {nextAction && getStart(nextAction) ? (
              <View style={s.nextRow}>
                <View style={s.nextTimeWrap}>
                  <Text style={s.nextTime}>{safeFormat(getStart(nextAction), 'h:mm')}</Text>
                  <Text style={s.nextAmpm}>{safeFormat(getStart(nextAction), 'a')}</Text>
                </View>
                <View style={s.nextCopy}>
                  <Text style={s.nextLabel}>Up next</Text>
                  <Text style={s.nextTitle} numberOfLines={1}>
                    {nextAction.title}
                  </Text>
                </View>
                <Press
                  onPress={() => {
                    const id = getTaskId(nextAction);
                    const mission = getMission(id);
                    if (mission && !mission.completed) openMission(mission.taskId);
                    else if (id) handleStart(id);
                  }}
                  style={s.nextButton}
                  accessibilityLabel="Start next task"
                >
                  <Ionicons name="play" size={16} color={Colors.white} />
                </Press>
              </View>
            ) : (
              <View style={s.nextRow}>
                <View style={s.nextCopy}>
                  <Text style={s.nextLabel}>Open time</Text>
                  <Text style={s.nextTitle}>Nothing scheduled next</Text>
                </View>
                <Press
                  onPress={() => inputRef.current?.focus()}
                  style={s.quietButton}
                  accessibilityLabel="Add a task"
                >
                  <Text style={s.quietButtonText}>Add</Text>
                </Press>
              </View>
            )}
          </Surface>

          {/* Composer */}
          <View style={[s.composer, inputFocused && s.composerFocused]}>
            <Ionicons
              name="add"
              size={20}
              color={inputFocused ? Colors.brand.secondary : Colors.text.tertiary}
            />
            <TextInput
              ref={inputRef}
              style={s.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="What needs doing?"
              placeholderTextColor={Colors.text.muted}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              multiline
              maxLength={400}
              accessibilityLabel="Add a task"
            />
            <Press
              onPress={handleParse}
              disabled={!inputText.trim() || parsing}
              style={[
                s.sendBtn,
                { opacity: inputText.trim() ? 1 : 0.35 },
              ]}
              accessibilityLabel="Add task"
            >
              {parsing ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Ionicons name="arrow-up" size={18} color={Colors.white} />
              )}
            </Press>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.suggestions}
          >
            {[
              { label: 'Run 5k', text: 'Run 5k in the park' },
              { label: 'Walk 20 min', text: 'Walk for 20 minutes in the park' },
              { label: 'Groceries', text: 'Buy groceries at the market' },
              { label: 'Gym 45 min', text: 'Gym for 45 minutes' },
            ].map((item) => (
              <Press
                key={item.label}
                style={s.suggestion}
                onPress={() => {
                  setInputText(item.text);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
              >
                <Text style={s.suggestionText}>{item.label}</Text>
              </Press>
            ))}
          </ScrollView>

          {/* Stats */}
          <View style={s.statsBar}>
            <Stat value={`${done.length}`} label="Done" />
            <View style={s.statDivider} />
            <Stat value={`${pending.length}`} label="Left" />
            <View style={s.statDivider} />
            <Stat value={`${freeMinutes}m`} label="Free" />
            <View style={s.statDivider} />
            <Stat
              value={context?.steps_today ? `${Math.round(context.steps_today / 1000)}k` : '0'}
              label="Steps"
            />
          </View>

          {live.error ? (
            <View style={s.notice}>
              <Ionicons name="location-outline" size={15} color={Colors.text.tertiary} />
              <Text style={s.noticeText}>{live.error}</Text>
            </View>
          ) : null}

          {/* Mission */}
          <View style={s.section}>
            <SectionLabel action={activeMission ? 'Open' : undefined} onAction={() => activeMission && openMission(activeMission.taskId)}>
              Mission
            </SectionLabel>
            <View style={s.mapCard}>
              <LocationMap
                user={mapUser}
                destination={activeMission?.destination || null}
                radiusMeters={activeMission?.radiusMeters || 130}
                city={live.city || context?.city || null}
                locked={!!activeMission && !activeMission.completed}
                height={208}
              />
              <View style={s.mapOverlay} pointerEvents="box-none">
                {activeMission ? (
                  <Press onPress={() => openMission(activeMission.taskId)} style={s.missionPanel}>
                    <View style={s.missionRow}>
                      <View style={s.missionIcon}>
                        <Ionicons name="flag" size={16} color={Colors.brand.secondary} />
                      </View>
                      <View style={s.missionCopy}>
                        <Text style={s.missionTitle} numberOfLines={1}>
                          {activeMission.title}
                        </Text>
                        <Text style={s.missionMeta} numberOfLines={1}>
                          {activeMission.placeName}
                          {activeMission.completed
                            ? ' · captured'
                            : distanceToMission !== null
                            ? ` · ${formatDistance(distanceToMission)} away`
                            : ''}
                        </Text>
                      </View>
                      <View
                        style={[
                          s.statePill,
                          inRange && { backgroundColor: Colors.accent.teal + '26' },
                        ]}
                      >
                        <Text
                          style={[
                            s.stateText,
                            inRange && { color: Colors.accent.teal },
                          ]}
                        >
                          {activeMission.completed ? 'Done' : inRange ? 'Ready' : 'Locked'}
                        </Text>
                      </View>
                    </View>
                    <View style={s.missionFooter}>
                      <Text style={s.missionHint}>
                        {activeMission.completed
                          ? 'Moment saved to your Wrapped'
                          : inRange
                          ? 'You are at the finish line'
                          : 'Camera unlocks at the pin'}
                      </Text>
                      <Ionicons name="chevron-forward" size={15} color={Colors.text.tertiary} />
                    </View>
                  </Press>
                ) : (
                  <View style={s.missionPanel}>
                    <View style={s.missionRow}>
                      <View style={s.missionIcon}>
                        <Ionicons name="navigate" size={16} color={Colors.brand.secondary} />
                      </View>
                      <View style={s.missionCopy}>
                        <Text style={s.missionTitle}>No mission yet</Text>
                        <Text style={s.missionMeta} numberOfLines={1}>
                          Add a run or walk and Gocha pins the finish line.
                        </Text>
                      </View>
                      <Press
                        onPress={() => inputRef.current?.focus()}
                        style={s.quietButton}
                        accessibilityLabel="Add an outdoor task"
                      >
                        <Text style={s.quietButtonText}>Add</Text>
                      </Press>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Schedule */}
          {blocks.length > 0 && (
            <View style={s.section}>
              <SectionLabel action="See all" onAction={() => router.push('/(tabs)/today')}>
                Today's schedule
              </SectionLabel>
              <View style={s.group}>
                {blocks.slice(0, 5).map((block, idx) => {
                  const start = getStart(block);
                  const end = getEnd(block);
                  const color =
                    block.color ||
                    (block.category ? CAT_COLOR[block.category] : Colors.brand.primary) ||
                    Colors.brand.primary;
                  return (
                    <View
                      key={block.id || idx}
                      style={[
                        s.scheduleRow,
                        idx < Math.min(blocks.length, 5) - 1 && s.rowDivider,
                      ]}
                    >
                      <View style={s.scheduleTime}>
                        <Text style={s.scheduleHour}>{safeFormat(start, 'h:mm')}</Text>
                        <Text style={s.scheduleAmpm}>{safeFormat(start, 'a')}</Text>
                      </View>
                      <View style={[s.scheduleDot, { backgroundColor: color }]} />
                      <View style={s.scheduleCopy}>
                        <Text style={s.scheduleTitle} numberOfLines={1}>
                          {block.title}
                        </Text>
                        <Text style={s.scheduleMeta}>
                          {blockDurationMins(start, end)} min
                          {block.is_fixed ? ' · Fixed' : ''}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={15} color={Colors.text.dim} />
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {blocks.length === 0 && pending.length > 0 && (
            <View style={s.section}>
              <SectionLabel>To do today</SectionLabel>
              <View style={s.group}>
                {pending.slice(0, 4).map((task, idx) => (
                  <View
                    key={task.id}
                    style={[
                      s.scheduleRow,
                      idx < Math.min(pending.length, 4) - 1 && s.rowDivider,
                    ]}
                  >
                    <View
                      style={[
                        s.taskIcon,
                        { backgroundColor: (CAT_COLOR[task.category] || Colors.brand.primary) + '24' },
                      ]}
                    >
                      <Ionicons
                        name={CAT_ICON[task.category] || 'ellipse-outline'}
                        size={16}
                        color={CAT_COLOR[task.category] || Colors.brand.primary}
                      />
                    </View>
                    <View style={s.scheduleCopy}>
                      <Text style={s.taskTitle} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text style={s.scheduleMeta}>
                        {task.estimated_duration} min · {task.priority}
                      </Text>
                    </View>
                    <Press
                      style={s.quietButton}
                      onPress={() => handleStart(task.id)}
                      accessibilityLabel={`Start ${task.title}`}
                    >
                      <Text style={s.quietButtonText}>Start</Text>
                    </Press>
                  </View>
                ))}
              </View>
            </View>
          )}

          {(context?.nearby_events?.length || 0) > 0 && (
            <Press onPress={() => router.push('/(tabs)/discover')} style={s.eventCard}>
              <View style={s.eventIcon}>
                <Ionicons name="calendar" size={17} color={Colors.accent.amber} />
              </View>
              <View style={s.scheduleCopy}>
                <Text style={s.eventTitle}>Nearby tonight</Text>
                <Text style={s.eventSub} numberOfLines={1}>
                  {context!.nearby_events[0]?.title ||
                    `${context!.nearby_events.length} events near you`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={Colors.text.dim} />
            </Press>
          )}

          {/* Wrapped */}
          <Press onPress={() => router.push('/(tabs)/wrapped')} style={s.wrappedCard}>
            <View style={s.wrappedCopy}>
              <Text style={s.wrappedEyebrow}>Day Wrapped</Text>
              <Text style={s.wrappedTitle}>
                {tasks.length ? 'See what actually happened.' : 'Your day, in one look.'}
              </Text>
              <Text style={s.wrappedSub}>
                {done.length} done · {freeMinutes}m free
              </Text>
            </View>
            <ProgressRing
              size={54}
              strokeWidth={5}
              progress={completionPct}
              color={Colors.brand.secondary}
              trackColor={Colors.fill}
            >
              <Text style={s.wrappedPct}>{Math.round(completionPct * 100)}%</Text>
            </ProgressRing>
          </Press>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  wrappedButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
  headerDate: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: FontWeight.medium,
    color: Colors.text.tertiary,
  },
  headerName: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  greeting: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    letterSpacing: -0.1,
  },

  hero: {
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  heroPct: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  heroCopy: { flex: 1, gap: 3 },
  heroTitle: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    letterSpacing: -0.35,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 19,
    color: Colors.text.tertiary,
  },

  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  nextTimeWrap: { alignItems: 'flex-start', minWidth: 48 },
  nextTime: {
    fontSize: 17,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  nextAmpm: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    color: Colors.text.dim,
  },
  nextCopy: { flex: 1 },
  nextLabel: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  nextTitle: {
    fontSize: 16,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  nextButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quietButton: {
    minHeight: 32,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quietButtonText: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    paddingLeft: Spacing.base,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 54,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  composerFocused: { borderColor: Colors.brand.primary },
  input: {
    flex: 1,
    fontSize: 17,
    lineHeight: 22,
    color: Colors.text.primary,
    minHeight: 40,
    maxHeight: 110,
    paddingVertical: 9,
    letterSpacing: -0.2,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  suggestions: { gap: Spacing.sm, paddingBottom: Spacing.lg },
  suggestion: {
    backgroundColor: Colors.fill,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: 9,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
    color: Colors.text.secondary,
  },

  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: {
    fontSize: 18,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    color: Colors.text.tertiary,
  },
  statDivider: { width: StyleSheet.hairlineWidth, height: 24, backgroundColor: Colors.separator },

  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.base,
  },
  noticeText: { fontSize: 13, color: Colors.text.tertiary, flex: 1 },

  section: { marginBottom: Spacing.lg },
  group: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },

  mapCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.bg.card,
    height: 208,
  },
  mapOverlay: {
    position: 'absolute',
    left: Spacing.sm,
    right: Spacing.sm,
    bottom: Spacing.sm,
  },
  missionPanel: {
    backgroundColor: 'rgba(28,28,30,0.94)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.bg.glassBorder,
  },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  missionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.brand.glow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionCopy: { flex: 1, gap: 2 },
  missionTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  missionMeta: { fontSize: 12, color: Colors.text.tertiary },
  missionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  missionHint: { fontSize: 12, color: Colors.text.tertiary },
  statePill: {
    backgroundColor: Colors.fill,
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  stateText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },

  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    minHeight: 58,
    paddingVertical: Spacing.sm,
  },
  scheduleTime: { width: 46, alignItems: 'flex-start' },
  scheduleHour: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  scheduleAmpm: { fontSize: 11, color: Colors.text.dim },
  scheduleDot: { width: 7, height: 7, borderRadius: 4 },
  scheduleCopy: { flex: 1, gap: 2 },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: FontWeight.medium,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  scheduleMeta: { fontSize: 12, color: Colors.text.tertiary },

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

  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  eventIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.accent.amber + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  eventSub: { fontSize: 13, color: Colors.text.tertiary, marginTop: 1 },

  wrappedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  wrappedCopy: { flex: 1, gap: 3 },
  wrappedEyebrow: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: Colors.brand.secondary,
  },
  wrappedTitle: {
    fontSize: 17,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    letterSpacing: -0.25,
  },
  wrappedSub: { fontSize: 13, color: Colors.text.tertiary },
  wrappedPct: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
});
