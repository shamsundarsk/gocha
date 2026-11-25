import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';
import {
  Colors,
  FontWeight,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';
import { Press, SectionLabel, Surface } from '@/components/ui/kit';
import {
  TaskSummaryWidget,
  NextUpWidget,
  MissionWidget,
  StatsWidget,
  CompactStatsWidget,
  FocusWidget,
  StreakWidget,
  DaySummaryWidget,
  WeatherWidget,
  ComposerWidget,
  InlineComposerWidget,
  MomentWidget,
  MomentGridWidget,
  EmotionWidget,
} from '@/components/widgets';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useLiveLocation } from '@/hooks/useLiveLocation';

const MOCK_MOMENTS = [
  {
    id: 'm1',
    photoUri: 'https://picsum.photos/seed/moment1/400/500',
    caption: 'Morning run complete',
    placeName: 'Central Park',
    capturedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    taskTitle: 'Run 5k',
  },
  {
    id: 'm2',
    photoUri: 'https://picsum.photos/seed/moment2/400/500',
    caption: 'Focused work session',
    placeName: 'Home Office',
    capturedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    taskTitle: 'Deep work',
  },
  {
    id: 'm3',
    photoUri: 'https://picsum.photos/seed/moment3/400/500',
    caption: 'Evening walk',
    placeName: 'Neighborhood',
    capturedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    taskTitle: 'Walk 30m',
  },
];

const MOCK_NEXT_BLOCK = {
  id: 'block-1',
  title: 'Finish project brief',
  start: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  isFixed: false,
  category: 'Work',
  mission: { completed: false, inRange: true },
};

const MOCK_MISSION = {
  taskId: 'task-mission-1',
  title: 'Evening run at Riverside Trail',
  placeName: 'Riverside Trail',
  destination: { latitude: 37.788, longitude: -122.407 },
  radiusMeters: 150,
  completed: false,
  inRange: true,
  photoUri: undefined,
};

export default function WidgetsTestScreen() {
  const { width } = useWindowDimensions();
  const live = useLiveLocation();
  const [composerText, setComposerText] = useState('');

  const mockDaySummary = useMemo(() => ({
    date: new Date(),
    tasks: { planned: 6, completed: 4, inProgress: 1, pending: 1 },
    focusMinutes: 115,
    distanceKm: 5.2,
    steps: 7200,
    momentsCaptured: 3,
    screenTimeMinutes: 195,
    moodScore: 72,
    nextBlock: MOCK_NEXT_BLOCK,
  }), []);

  const mockStats = useMemo(() => [
    { key: 'tasks', icon: 'checkmark-circle', value: '4/6', label: 'Tasks', color: Colors.accent.teal, trend: 'up' as const, trendValue: '+1' },
    { key: 'focus', icon: 'timer', value: '115m', label: 'Focus', color: Colors.brand.primary, trend: 'up' as const, trendValue: '+23%' },
    { key: 'move', icon: 'walk', value: '5.2km', label: 'Distance', color: Colors.accent.amber, trend: 'neutral' as const, trendValue: '' },
    { key: 'moments', icon: 'camera', value: '3', label: 'Moments', color: Colors.emotion.snap, trend: 'up' as const, trendValue: '+2' },
  ], []);

  const mockWeather = useMemo(() => ({
    temperature: 22,
    condition: 'Partly cloudy',
    icon: 'partly-sunny',
    high: 25,
    low: 16,
    humidity: 58,
    windKph: 12,
    precipitation: 0.1,
    city: 'San Francisco',
  }), []);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Widget Playground</Text>
            <Text style={styles.subtitle}>All widgets rendered with mock data</Text>
          </View>

          {/* Task Summary */}
          <SectionLabel>Task Summary</SectionLabel>
          <Surface>
            <TaskSummaryWidget
              done={4}
              total={6}
              pending={1}
              inProgress={1}
              freeMinutes={120}
              onPress={() => console.log('TaskSummary pressed')}
            />
          </Surface>

          {/* Next Up */}
          <SectionLabel>Next Up</SectionLabel>
          <Surface>
            <NextUpWidget block={MOCK_NEXT_BLOCK} onPress={() => console.log('NextUp pressed')} />
          </Surface>

          {/* Mission */}
          <SectionLabel>Mission</SectionLabel>
          <Surface>
            <MissionWidget
              mission={MOCK_MISSION}
              userLocation={live.coords || { latitude: 37.788, longitude: -122.407 }}
              onPress={() => console.log('Mission pressed')}
            />
          </Surface>

          {/* Stats Grid */}
          <SectionLabel>Stats Grid (4 columns)</SectionLabel>
          <Surface>
            <StatsWidget stats={mockStats} columns={4} onPress={(k) => console.log('Stat:', k)} />
          </Surface>

          {/* Compact Stats */}
          <SectionLabel>Compact Stats Row</SectionLabel>
          <Surface>
            <CompactStatsWidget
              stats={[
                { icon: 'checkmark-circle', value: '4/6', label: 'Tasks', color: Colors.accent.teal },
                { icon: 'timer', value: '115m', label: 'Focus', color: Colors.brand.primary },
                { icon: 'walk', value: '5.2km', label: 'Distance', color: Colors.accent.amber },
              ]}
              onPress={() => console.log('CompactStats pressed')}
            />
          </Surface>

          {/* Focus */}
          <SectionLabel>Focus Time</SectionLabel>
          <Surface>
            <FocusWidget
              focusMinutes={115}
              targetMinutes={120}
              sessions={3}
              longestSession={52}
              onPress={() => console.log('Focus pressed')}
            />
          </Surface>

          {/* Streak */}
          <SectionLabel>Day Streak</SectionLabel>
          <Surface>
            <StreakWidget
              currentStreak={7}
              longestStreak={14}
              totalDays={42}
              thisWeek={5}
              onPress={() => console.log('Streak pressed')}
            />
          </Surface>

          {/* Day Summary */}
          <SectionLabel>Day Summary</SectionLabel>
          <Surface>
            <DaySummaryWidget {...mockDaySummary} onPress={() => console.log('DaySummary pressed')} />
          </Surface>

          {/* Weather */}
          <SectionLabel>Weather</SectionLabel>
          <Surface>
            <WeatherWidget weather={mockWeather} onPress={() => console.log('Weather pressed')} />
          </Surface>

          {/* Emotion Widgets */}
          <SectionLabel>Emotion Widgets</SectionLabel>
          <Surface>
            <View style={styles.emotionGrid}>
              <EmotionWidget
                tone="spark"
                label="Idea"
                icon="bulb-outline"
                title="New project idea"
                subtitle="Sketch the mobile app concept"
                footer="Start now →"
                progress={0.3}
              />
              <EmotionWidget
                tone="move"
                label="Action"
                icon="walk-outline"
                title="Go for a run"
                subtitle="5k in the park, 28 min"
                footer="Start →"
                progress={0.6}
              />
              <EmotionWidget
                tone="nudge"
                label="Nudge"
                icon="alert-circle-outline"
                title="Break time"
                subtitle="You've been focused for 90 min"
                footer="Dismiss"
                progress={1}
              />
              <EmotionWidget
                tone="snap"
                label="Capture"
                icon="camera-outline"
                title="Photo moment"
                subtitle="Riverside Trail, golden hour"
                footer="View"
                progress={0}
              />
            </View>
          </Surface>

          {/* Composer */}
          <SectionLabel>Composer (with quick actions)</SectionLabel>
          <Surface>
            <ComposerWidget
              value={composerText}
              onChange={setComposerText}
              onSubmit={(t) => { console.log('Submit:', t); setComposerText(''); }}
              placeholder="What needs doing?"
              quickActions={[
                { label: 'Run 5k', text: 'Run 5k in the park', icon: 'walk' },
                { label: 'Walk 20m', text: 'Walk for 20 minutes', icon: 'walk' },
                { label: 'Gym 45m', text: 'Gym for 45 minutes', icon: 'barbell' },
                { label: 'Groceries', text: 'Buy groceries', icon: 'cart' },
              ]}
            />
          </Surface>

          {/* Inline Composer */}
          <SectionLabel>Inline Composer</SectionLabel>
          <Surface>
            <InlineComposerWidget
              onSubmit={(t) => console.log('Inline submit:', t)}
              placeholder="Add a quick task…"
            />
          </Surface>

          {/* Moment Grid */}
          <SectionLabel>Moment Grid</SectionLabel>
          <Surface>
            <MomentGridWidget
              moments={MOCK_MOMENTS}
              size="medium"
              maxVisible={3}
              onPress={(m) => console.log('Moment:', m.id)}
              onViewAll={() => console.log('View all moments')}
            />
          </Surface>

          {/* Single Moment (Large) */}
          <SectionLabel>Single Moment (Large)</SectionLabel>
          <Surface>
            <MomentWidget
              moment={MOCK_MOMENTS[0]}
              size="large"
              onPress={() => console.log('Large moment pressed')}
            />
          </Surface>

          {/* Progress Ring Demo */}
          <SectionLabel>ProgressRing Variants</SectionLabel>
          <Surface>
            <View style={styles.ringGrid}>
              <View style={styles.ringItem}>
                <ProgressRing size={64} strokeWidth={6} progress={0.25} color={Colors.brand.primary} trackColor={Colors.fill}>
                  <Text style={styles.ringLabel}>25%</Text>
                </ProgressRing>
                <Text style={styles.ringTitle}>Low</Text>
              </View>
              <View style={styles.ringItem}>
                <ProgressRing size={64} strokeWidth={6} progress={0.5} color={Colors.brand.primary} trackColor={Colors.fill}>
                  <Text style={styles.ringLabel}>50%</Text>
                </ProgressRing>
                <Text style={styles.ringTitle}>Medium</Text>
              </View>
              <View style={styles.ringItem}>
                <ProgressRing size={64} strokeWidth={6} progress={0.75} color={Colors.accent.amber} trackColor={Colors.fill}>
                  <Text style={styles.ringLabel}>75%</Text>
                </ProgressRing>
                <Text style={styles.ringTitle}>High</Text>
              </View>
              <View style={styles.ringItem}>
                <ProgressRing size={64} strokeWidth={6} progress={1} color={Colors.accent.teal} trackColor={Colors.fill}>
                  <Text style={styles.ringLabel}>100%</Text>
                </ProgressRing>
                <Text style={styles.ringTitle}>Complete</Text>
              </View>
            </View>
          </Surface>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xl },
  header: { marginBottom: Spacing.xl },
  title: { ...Type.largeTitle, color: Colors.text.primary },
  subtitle: { fontSize: 15, color: Colors.text.tertiary, marginTop: 2 },
  emotionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  ringGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'space-between' },
  ringItem: { alignItems: 'center', gap: Spacing.sm, width: '48%' },
  ringLabel: { fontSize: 16, fontWeight: FontWeight.bold, color: Colors.text.primary },
  ringTitle: { fontSize: 12, color: Colors.text.tertiary },
});