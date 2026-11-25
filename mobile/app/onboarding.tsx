import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { userApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type ScheduleKey = 'wake' | 'workStart' | 'workEnd' | 'sleep';

type Schedule = {
  wake: string;
  workStart: string;
  workEnd: string;
  sleep: string;
};

type ContextFlags = {
  calendar: boolean;
  fitness: boolean;
  location: boolean;
  screenTime: boolean;
  demo: boolean;
};

const TOTAL_STEPS = 4;

const RHYTHM_PRESETS: { label: string; detail: string; schedule: Schedule }[] = [
  {
    label: 'Early',
    detail: '5:30–9:30',
    schedule: { wake: '05:30', workStart: '08:00', workEnd: '16:00', sleep: '21:30' },
  },
  {
    label: 'Balanced',
    detail: '7:00–11:00',
    schedule: { wake: '07:00', workStart: '09:30', workEnd: '18:00', sleep: '23:00' },
  },
  {
    label: 'Later',
    detail: '9:00–1:00',
    schedule: { wake: '09:00', workStart: '11:00', workEnd: '19:00', sleep: '00:30' },
  },
];

const INTERESTS: { id: string; label: string; icon: IconName }[] = [
  { id: 'technology', label: 'Technology', icon: 'code-slash-outline' },
  { id: 'music', label: 'Music', icon: 'musical-notes-outline' },
  { id: 'arts', label: 'Arts & design', icon: 'color-palette-outline' },
  { id: 'fitness', label: 'Fitness', icon: 'barbell-outline' },
  { id: 'business', label: 'Business', icon: 'briefcase-outline' },
  { id: 'food', label: 'Food', icon: 'restaurant-outline' },
  { id: 'education', label: 'Learning', icon: 'book-outline' },
  { id: 'community', label: 'Community', icon: 'people-outline' },
];

const SOURCES: {
  key: keyof Omit<ContextFlags, 'demo'>;
  title: string;
  detail: string;
  icon: IconName;
}[] = [
  {
    key: 'calendar',
    title: 'Calendar',
    detail: 'Protect fixed meetings and appointments',
    icon: 'calendar-outline',
  },
  {
    key: 'fitness',
    title: 'Movement',
    detail: 'Use activity and workouts as planning context',
    icon: 'pulse-outline',
  },
  {
    key: 'location',
    title: 'Location',
    detail: 'Find useful things nearby using approximate area',
    icon: 'location-outline',
  },
  {
    key: 'screenTime',
    title: 'Screen time',
    detail: 'Notice distraction patterns without judging them',
    icon: 'phone-portrait-outline',
  },
];

function formatTime(value: string) {
  const [rawHour, rawMinute] = value.split(':').map(Number);
  const hour = rawHour % 12 || 12;
  const minute = String(rawMinute).padStart(2, '0');
  return `${hour}:${minute} ${rawHour >= 12 ? 'PM' : 'AM'}`;
}

function shiftTime(value: string, minutes: number) {
  const [rawHour, rawMinute] = value.split(':').map(Number);
  const total = (rawHour * 60 + rawMinute + minutes + 24 * 60) % (24 * 60);
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function selectionFeedback() {
  Haptics.selectionAsync().catch(() => {});
}

export default function OnboardingScreen() {
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<Schedule>(RHYTHM_PRESETS[1].schedule);
  const [interests, setInterests] = useState<string[]>([]);
  const [context, setContext] = useState<ContextFlags>({
    calendar: true,
    fitness: true,
    location: false,
    screenTime: false,
    demo: true,
  });

  useEffect(() => {
    let active = true;

    userApi
      .getPreferences()
      .then(({ data }) => {
        if (!active) return;
        setSchedule({
          wake: data.wake_time,
          workStart: data.work_start,
          workEnd: data.work_end,
          sleep: data.sleep_time,
        });
        setInterests(data.interests || []);
        setContext({
          calendar: data.calendar_connected,
          fitness: data.fitness_connected,
          location: data.location_enabled,
          screenTime: data.screen_time_enabled,
          demo: data.demo_mode,
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const selectedPreset = useMemo(
    () =>
      RHYTHM_PRESETS.find(
        (preset) =>
          preset.schedule.wake === schedule.wake &&
          preset.schedule.workStart === schedule.workStart &&
          preset.schedule.workEnd === schedule.workEnd &&
          preset.schedule.sleep === schedule.sleep
      )?.label,
    [schedule]
  );

  const selectedSources = SOURCES.filter((source) => context[source.key]).length;
  const canContinue = step !== 1 || interests.length >= 2;

  const updateSchedule = (key: ScheduleKey, delta: number) => {
    selectionFeedback();
    setSchedule((current) => ({ ...current, [key]: shiftTime(current[key], delta) }));
  };

  const toggleInterest = (id: string) => {
    selectionFeedback();
    setInterests((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleContext = (key: keyof ContextFlags) => {
    selectionFeedback();
    setContext((current) => ({ ...current, [key]: !current[key] }));
  };

  const saveAndFinish = async () => {
    setSaving(true);
    let synced = true;

    try {
      await userApi.updatePreferences({
        wake_time: schedule.wake,
        sleep_time: schedule.sleep,
        work_start: schedule.workStart,
        work_end: schedule.workEnd,
        interests,
        calendar_connected: context.calendar,
        fitness_connected: context.fitness,
        location_enabled: context.location,
        screen_time_enabled: context.screenTime,
        demo_mode: context.demo,
      });
    } catch {
      synced = false;
    }

    await completeOnboarding();
    setSaving(false);

    if (!synced) {
      Toast.show({
        type: 'error',
        text1: 'Setup complete',
        text2: 'Your preferences could not be synced. You can try again in Profile.',
      });
    }

    router.replace('/(tabs)');
  };

  const skipSetup = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const goNext = () => {
    if (!canContinue) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (step < TOTAL_STEPS - 1) {
      setStep((current) => current + 1);
      return;
    }
    saveAndFinish();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>g</Text>
            </View>
            <Text style={styles.brandName}>gocha</Text>
          </View>

          <View style={styles.topActions}>
            <Text style={styles.stepCount}>
              {step + 1} of {TOTAL_STEPS}
            </Text>
            {step < TOTAL_STEPS - 1 ? (
              <Pressable
                onPress={skipSetup}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Skip setup"
              >
                <Text style={styles.skipText}>Later</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.progressTrack}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressSegment,
                index <= step && styles.progressSegmentActive,
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 ? (
            <View style={styles.stepContent}>
              <StepHeading
                eyebrow="Your rhythm"
                title="When does your day usually happen?"
                body="Gocha uses these hours as the boundaries for every plan it builds. Nothing is scheduled after bedtime."
              />

              <View style={styles.presetRow}>
                {RHYTHM_PRESETS.map((preset) => {
                  const active = selectedPreset === preset.label;
                  return (
                    <Pressable
                      key={preset.label}
                      onPress={() => {
                        selectionFeedback();
                        setSchedule(preset.schedule);
                      }}
                      style={({ pressed }) => [
                        styles.preset,
                        active && styles.presetActive,
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.presetLabel, active && styles.presetLabelActive]}>
                        {preset.label}
                      </Text>
                      <Text style={[styles.presetDetail, active && styles.presetDetailActive]}>
                        {preset.detail}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.scheduleGrid}>
                <TimeCard
                  label="Day starts"
                  value={schedule.wake}
                  icon="sunny-outline"
                  onDecrease={() => updateSchedule('wake', -30)}
                  onIncrease={() => updateSchedule('wake', 30)}
                />
                <TimeCard
                  label="Work starts"
                  value={schedule.workStart}
                  icon="briefcase-outline"
                  onDecrease={() => updateSchedule('workStart', -30)}
                  onIncrease={() => updateSchedule('workStart', 30)}
                />
                <TimeCard
                  label="Work ends"
                  value={schedule.workEnd}
                  icon="cafe-outline"
                  onDecrease={() => updateSchedule('workEnd', -30)}
                  onIncrease={() => updateSchedule('workEnd', 30)}
                />
                <TimeCard
                  label="Day ends"
                  value={schedule.sleep}
                  icon="moon-outline"
                  onDecrease={() => updateSchedule('sleep', -30)}
                  onIncrease={() => updateSchedule('sleep', 30)}
                />
              </View>

              <View style={styles.noteCard}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.text.tertiary} />
                <Text style={styles.noteText}>
                  You can fine-tune these times later. Gocha only uses them to protect your day.
                </Text>
              </View>
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.stepContent}>
              <StepHeading
                eyebrow="Your interests"
                title="What should we make time for?"
                body="Choose at least two. These help Gocha surface nearby events and ideas that feel relevant to you."
              />

              <View style={styles.interestGrid}>
                {INTERESTS.map((interest) => {
                  const selected = interests.includes(interest.id);
                  return (
                    <Pressable
                      key={interest.id}
                      onPress={() => toggleInterest(interest.id)}
                      style={({ pressed }) => [
                        styles.interestCard,
                        selected && styles.interestCardSelected,
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                    >
                      <View style={[styles.interestIcon, selected && styles.interestIconSelected]}>
                        <Ionicons
                          name={interest.icon}
                          size={20}
                          color={selected ? Colors.white : Colors.text.secondary}
                        />
                      </View>
                      <Text style={[styles.interestLabel, selected && styles.interestLabelSelected]}>
                        {interest.label}
                      </Text>
                      {selected ? (
                        <Ionicons name="checkmark-circle" size={18} color={Colors.brand.secondary} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.selectionHint, interests.length < 2 && styles.selectionHintMuted]}>
                {interests.length < 2
                  ? `Pick ${2 - interests.length} more ${2 - interests.length === 1 ? 'interest' : 'interests'}`
                  : `${interests.length} interests selected`}
              </Text>
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.stepContent}>
              <StepHeading
                eyebrow="Your context"
                title="What can Gocha use?"
                body="Start with what is useful. Every source is optional, and you can change your mind at any time."
              />

              <View style={styles.sourceList}>
                {SOURCES.map((source) => (
                  <View key={source.key} style={styles.sourceRow}>
                    <View style={styles.sourceIcon}>
                      <Ionicons name={source.icon} size={20} color={Colors.text.secondary} />
                    </View>
                    <View style={styles.sourceCopy}>
                      <Text style={styles.sourceTitle}>{source.title}</Text>
                      <Text style={styles.sourceDetail}>{source.detail}</Text>
                    </View>
                    <Switch
                      value={context[source.key]}
                      onValueChange={() => toggleContext(source.key)}
                      trackColor={{ false: Colors.bg.elevated, true: Colors.brand.soft }}
                      thumbColor={Colors.white}
                      ios_backgroundColor={Colors.bg.elevated}
                    />
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => toggleContext('demo')}
                style={({ pressed }) => [styles.demoCard, pressed && styles.pressed]}
                accessibilityRole="switch"
                accessibilityState={{ checked: context.demo }}
              >
                <View style={styles.demoIcon}>
                  <Ionicons name="flask-outline" size={20} color={Colors.accent.amber} />
                </View>
                <View style={styles.sourceCopy}>
                  <Text style={styles.sourceTitle}>Explore with sample data</Text>
                  <Text style={styles.sourceDetail}>
                    See how Gocha works with realistic local context. Turn this off when you connect your own sources.
                  </Text>
                </View>
                <Switch
                  value={context.demo}
                  onValueChange={() => toggleContext('demo')}
                  trackColor={{ false: Colors.bg.elevated, true: Colors.accent.amber }}
                  thumbColor={Colors.white}
                  ios_backgroundColor={Colors.bg.elevated}
                />
              </Pressable>

              <View style={styles.privacyRow}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.text.tertiary} />
                <Text style={styles.privacyText}>
                  Location is rounded to roughly 1 km and expires after 24 hours.
                </Text>
              </View>
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.stepContent}>
              <View style={styles.readyIcon}>
                <Ionicons name="checkmark" size={28} color={Colors.brand.secondary} />
              </View>

              <StepHeading
                eyebrow="READY"
                title="Your day has a shape now."
                body="Gocha will keep the plan realistic, protect your fixed commitments, and show you what matters next."
              />

              <View style={styles.summaryCard}>
                <SummaryRow
                  icon="sunny-outline"
                  label="Your day"
                  value={`${formatTime(schedule.wake)} – ${formatTime(schedule.sleep)}`}
                />
                <View style={styles.summaryDivider} />
                <SummaryRow
                  icon="briefcase-outline"
                  label="Work hours"
                  value={`${formatTime(schedule.workStart)} – ${formatTime(schedule.workEnd)}`}
                />
                <View style={styles.summaryDivider} />
                <SummaryRow
                  icon="heart-outline"
                  label="Interests"
                  value={
                    interests.length
                      ? interests
                          .map((id) => INTERESTS.find((interest) => interest.id === id)?.label)
                          .filter(Boolean)
                          .slice(0, 3)
                          .join(', ')
                      : 'None selected'
                  }
                />
                <View style={styles.summaryDivider} />
                <SummaryRow
                  icon="options-outline"
                  label="Context"
                  value={`${selectedSources} sources${context.demo ? ' · sample data on' : ''}`}
                />
              </View>

              <View style={styles.noteCard}>
                <Ionicons name="create-outline" size={18} color={Colors.text.tertiary} />
                <Text style={styles.noteText}>
                  You can revisit these choices anytime from Profile.
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={goNext}
            disabled={!canContinue || saving}
            style={({ pressed }) => [
              styles.primaryButton,
              (!canContinue || saving) && styles.primaryButtonDisabled,
              pressed && canContinue && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>
                  {step === TOTAL_STEPS - 1 ? 'Open my day' : 'Continue'}
                </Text>
                <Ionicons name="arrow-forward" size={19} color={Colors.white} />
              </>
            )}
          </Pressable>
          {step === 1 && interests.length < 2 ? (
            <Text style={styles.footerHint}>Choose at least two interests to continue.</Text>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

function StepHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

function TimeCard({
  label,
  value,
  icon,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: string;
  icon: IconName;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.timeCard}>
      <View style={styles.timeLabelRow}>
        <Ionicons name={icon} size={17} color={Colors.text.tertiary} />
        <Text style={styles.timeLabel}>{label}</Text>
      </View>
      <Text style={styles.timeValue}>{formatTime(value)}</Text>
      <View style={styles.stepperRow}>
        <Pressable
          onPress={onDecrease}
          style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Move ${label} earlier`}
        >
          <Ionicons name="remove" size={16} color={Colors.text.secondary} />
        </Pressable>
        <Pressable
          onPress={onIncrease}
          style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Move ${label} later`}
        >
          <Ionicons name="add" size={16} color={Colors.text.secondary} />
        </Pressable>
      </View>
    </View>
  );
}

function SummaryRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryIcon}>
        <Ionicons name={icon} size={18} color={Colors.brand.secondary} />
      </View>
      <View style={styles.summaryCopy}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  safe: { flex: 1 },
  topBar: {
    minHeight: 64,
    paddingHorizontal: Spacing['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: { fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white },
  brandName: { fontSize: 17, fontWeight: FontWeight.bold, color: Colors.text.primary },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  stepCount: { fontSize: 13, color: Colors.text.tertiary, fontWeight: FontWeight.medium },
  skipText: { fontSize: 15, color: Colors.text.secondary, fontWeight: FontWeight.semibold },
  progressTrack: {
    height: 3,
    marginHorizontal: Spacing['2xl'],
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.fill,
  },
  progressSegmentActive: { backgroundColor: Colors.brand.secondary },

  scroll: { flexGrow: 1, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing['3xl'] },
  stepContent: { flex: 1, paddingBottom: Spacing.xl },
  heading: { marginBottom: Spacing['2xl'] },
  eyebrow: {
    fontSize: 15,
    color: Colors.brand.secondary,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 32,
    lineHeight: 37,
    color: Colors.text.primary,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.6,
    marginBottom: Spacing.md,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text.secondary,
  },

  presetRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  preset: {
    flex: 1,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  presetActive: {
    backgroundColor: Colors.brand.glow,
    borderWidth: 1,
    borderColor: 'rgba(10,132,255,0.55)',
  },
  presetLabel: { fontSize: 15, color: Colors.text.secondary, fontWeight: FontWeight.semibold },
  presetLabelActive: { color: Colors.text.primary },
  presetDetail: { fontSize: 13, color: Colors.text.tertiary, marginTop: 2 },
  presetDetailActive: { color: Colors.brand.secondary },

  scheduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  timeCard: {
    width: '48%',
    minHeight: 148,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    padding: Spacing.base,
  },
  timeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  timeLabel: { fontSize: 15, color: Colors.text.secondary, fontWeight: FontWeight.medium },
  timeValue: {
    fontSize: 22,
    color: Colors.text.primary,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  stepperRow: { flexDirection: 'row', gap: Spacing.sm },
  stepperButton: {
    width: 36,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  interestCard: {
    width: '48%',
    minHeight: 92,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    justifyContent: 'space-between',
  },
  interestCardSelected: {
    backgroundColor: Colors.bg.elevated,
  },
  interestIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interestIconSelected: { backgroundColor: Colors.brand.primary },
  interestLabel: {
    fontSize: 15,
    lineHeight: 20,
    color: Colors.text.secondary,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.md,
  },
  interestLabelSelected: { color: Colors.text.primary },
  selectionHint: {
    marginTop: Spacing.base,
    fontSize: 15,
    color: Colors.brand.secondary,
    textAlign: 'center',
  },
  selectionHintMuted: { color: Colors.text.tertiary },

  sourceList: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  sourceRow: {
    minHeight: 78,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  sourceIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceCopy: { flex: 1 },
  sourceTitle: { fontSize: 17, color: Colors.text.primary, fontWeight: FontWeight.semibold },
  sourceDetail: { fontSize: 13, color: Colors.text.tertiary, lineHeight: 18, marginTop: 3 },
  demoCard: {
    marginTop: Spacing.md,
    minHeight: 96,
    padding: Spacing.base,
    borderRadius: Radius.xl,
    backgroundColor: Colors.bg.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  demoIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent.amber + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyRow: {
    marginTop: Spacing.base,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  privacyText: { flex: 1, fontSize: 13, color: Colors.text.tertiary, lineHeight: 18 },

  readyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: Colors.brand.secondary + '55',
    backgroundColor: Colors.brand.glow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
  },
  summaryRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.glow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: { flex: 1 },
  summaryLabel: { fontSize: 13, color: Colors.text.tertiary, marginBottom: 2 },
  summaryValue: { fontSize: 17, color: Colors.text.primary, fontWeight: FontWeight.semibold },
  summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.separator },

  noteCard: {
    marginTop: Spacing.base,
    padding: Spacing.base,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg.card,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  noteText: { flex: 1, fontSize: 13, color: Colors.text.tertiary, lineHeight: 18 },

  footer: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.bg.primary,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: Radius.md,
    backgroundColor: Colors.brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primaryButtonDisabled: { opacity: 0.42 },
  primaryButtonText: { fontSize: 17, color: Colors.white, fontWeight: FontWeight.bold },
  footerHint: {
    textAlign: 'center',
    color: Colors.text.tertiary,
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  pressed: { opacity: 0.72 },
});
