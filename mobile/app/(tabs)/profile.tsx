import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Colors,
  FontWeight,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useMissionStore } from '@/store/missionStore';
import { Press } from '@/components/ui/kit';
import { userApi } from '@/services/api';
import { UserPreferences } from '@/types';
import Toast from 'react-native-toast-message';

const INTERESTS = [
  { id: 'technology', label: 'Tech', icon: 'code-slash' },
  { id: 'music', label: 'Music', icon: 'musical-notes' },
  { id: 'arts', label: 'Arts', icon: 'color-palette' },
  { id: 'fitness', label: 'Fitness', icon: 'barbell' },
  { id: 'business', label: 'Business', icon: 'briefcase' },
  { id: 'food', label: 'Food', icon: 'restaurant' },
  { id: 'education', label: 'Learning', icon: 'book' },
  { id: 'community', label: 'Community', icon: 'people' },
] as const;

const CONN_ITEMS = [
  {
    key: 'calendar_connected',
    label: 'Calendar',
    icon: 'calendar' as const,
    color: Colors.brand.primary,
    desc: 'Fixed commitments and events',
  },
  {
    key: 'fitness_connected',
    label: 'Fitness',
    icon: 'barbell' as const,
    color: Colors.accent.teal,
    desc: 'Activity and workout data',
  },
  {
    key: 'location_enabled',
    label: 'Location',
    icon: 'location' as const,
    color: Colors.accent.rose,
    desc: 'Missions, geofences and nearby events',
  },
  {
    key: 'photos_enabled',
    label: 'Photos',
    icon: 'images' as const,
    color: Colors.accent.violet,
    desc: 'Day Wrapped memories',
  },
  {
    key: 'screen_time_enabled',
    label: 'Screen Time',
    icon: 'phone-portrait' as const,
    color: Colors.accent.amber,
    desc: 'Contextual nudges',
  },
];

const NOTIFICATION_STYLES = [
  { id: 'minimal', label: 'Minimal', desc: 'Only the essentials' },
  { id: 'balanced', label: 'Balanced', desc: 'A gentle nudge when it matters' },
  { id: 'proactive', label: 'Proactive', desc: 'Push me when I drift' },
] as const;

function streakFromMissions(dates: string[]): number {
  const unique = Array.from(new Set(dates)).sort().reverse();
  if (unique.length === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i += 1) {
    const key = cursor.toISOString().slice(0, 10);
    if (unique.includes(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { missions } = useMissionStore();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const r = await userApi.getPreferences();
      setPrefs(r.data);
    } catch {}
  };

  const update = async (key: string, value: any) => {
    if (!prefs) return;
    setPrefs((prev) => (prev ? { ...prev, [key]: value } : prev));
    try {
      await userApi.updatePreferences({ [key]: value });
    } catch {}
  };

  const toggleInterest = (id: string) => {
    const curr = prefs?.interests || [];
    const next = curr.includes(id) ? curr.filter((i) => i !== id) : [...curr, id];
    update('interests', next);
  };

  const handleLogout = () =>
    Alert.alert('Sign out', 'Sign out of Gocha?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);

  const initials =
    user?.full_name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  const photos = useMemo(
    () => Object.values(missions).filter((m) => m.photoUri),
    [missions]
  );
  const streak = useMemo(
    () =>
      streakFromMissions(
        photos.map((m) => (m.capturedAt ? m.capturedAt.slice(0, 10) : '')).filter(Boolean)
      ),
    [photos]
  );

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.eyebrow}>Your account</Text>
          <Text style={s.title}>You</Text>

          {/* Identity */}
          <View style={s.identity}>
            <View style={s.identityTop}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              <View style={s.identityCopy}>
                <Text style={s.name} numberOfLines={1}>
                  {user?.full_name || 'Gocha user'}
                </Text>
                <Text style={s.email} numberOfLines={1}>
                  {user?.email}
                </Text>
              </View>
            </View>

            <View style={s.statsRow}>
              <ProfileStat value={`${Object.keys(missions).length}`} label="Missions" />
              <View style={s.statDivider} />
              <ProfileStat value={`${photos.length}`} label="Moments" />
              <View style={s.statDivider} />
              <ProfileStat value={`${streak}`} label="Day streak" />
            </View>
          </View>

          {/* Moments teaser */}
          {photos.length > 0 && (
            <Press onPress={() => router.push('/(tabs)/wrapped')} style={s.momentsCard}>
              <View style={s.momentsThumbs}>
                {photos.slice(-3).map((m, i) => (
                  <Image
                    key={m.taskId}
                    source={{ uri: m.photoUri! }}
                    style={[s.momentThumb, { marginLeft: i === 0 ? 0 : -12 }]}
                  />
                ))}
              </View>
              <View style={s.momentsCopy}>
                <Text style={s.momentsTitle}>Your captured moments</Text>
                <Text style={s.momentsSub}>
                  {photos.length} proof{photos.length > 1 ? 's' : ''} of showing up
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.text.dim} />
            </Press>
          )}

          {/* Experience */}
          <SectionLabel>Experience</SectionLabel>
          <Group>
            <SettingRow
              icon="flask"
              color={Colors.accent.violet}
              label="Demo mode"
              desc="Simulates integrations with realistic local data"
              value={prefs?.demo_mode ?? true}
              onValueChange={(v) => update('demo_mode', v)}
              last
            />
          </Group>

          {/* Connected sources */}
          <SectionLabel>Connected sources</SectionLabel>
          <Group>
            {CONN_ITEMS.map((item, i) => (
              <SettingRow
                key={item.key}
                icon={item.icon}
                color={item.color}
                label={item.label}
                desc={item.desc}
                value={(prefs as any)?.[item.key] ?? false}
                onValueChange={(v) => update(item.key, v)}
                last={i === CONN_ITEMS.length - 1}
              />
            ))}
          </Group>

          {/* Notifications */}
          <SectionLabel>Notifications</SectionLabel>
          <Group>
            {NOTIFICATION_STYLES.map((style, i) => {
              const active = prefs?.notification_style === style.id;
              return (
                <Press
                  key={style.id}
                  onPress={() => update('notification_style', style.id)}
                  accessibilityLabel={style.label}
                >
                  <View
                    style={[s.optionRow, i < NOTIFICATION_STYLES.length - 1 && s.divider]}
                  >
                    <View style={s.optionCopy}>
                      <Text style={s.optionLabel}>{style.label}</Text>
                      <Text style={s.optionDesc}>{style.desc}</Text>
                    </View>
                    {active ? (
                      <Ionicons name="checkmark" size={19} color={Colors.brand.primary} />
                    ) : null}
                  </View>
                </Press>
              );
            })}
          </Group>

          {/* Interests */}
          <SectionLabel>Interests</SectionLabel>
          <View style={s.interestCard}>
            <Text style={s.interestHint}>
              Used to rank nearby events and missions
            </Text>
            <View style={s.interestGrid}>
              {INTERESTS.map((i) => {
                const active = prefs?.interests?.includes(i.id);
                return (
                  <Press
                    key={i.id}
                    onPress={() => toggleInterest(i.id)}
                    style={[s.interestPill, active && s.interestPillActive]}
                    accessibilityLabel={i.label}
                  >
                    <Ionicons
                      name={i.icon as any}
                      size={14}
                      color={active ? Colors.black : Colors.text.secondary}
                    />
                    <Text
                      style={[s.interestLabel, active && s.interestLabelActive]}
                    >
                      {i.label}
                    </Text>
                  </Press>
                );
              })}
            </View>
          </View>

          {/* Private by design */}
          <View style={s.privacyCard}>
            <View style={s.privacyIcon}>
              <Ionicons name="lock-closed" size={16} color={Colors.text.secondary} />
            </View>
            <View style={s.privacyCopy}>
              <Text style={s.privacyTitle}>Private by design</Text>
              <Text style={s.privacyText}>
                Location is stored at ~1km precision for context. Missions use precise
                coordinates only on your device. All permissions are optional and can be
                revoked at any time. We do not sell or share your data.
              </Text>
            </View>
          </View>

          <Group style={s.linksGroup}>
            <Press onPress={() => router.push('/insights' as any)} accessibilityLabel="Behavioural insights">
              <View style={[s.linkRow, s.divider]}>
                <View style={s.linkLeft}>
                  <Ionicons name="analytics-outline" size={18} color={Colors.text.secondary} />
                  <Text style={s.linkText}>Behavioural insights</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.text.dim} />
              </View>
            </Press>
            <Press onPress={handleLogout} accessibilityLabel="Sign out">
              <View style={s.linkRow}>
                <View style={s.linkLeft}>
                  <Ionicons name="log-out-outline" size={18} color={Colors.error} />
                  <Text style={[s.linkText, { color: Colors.error }]}>Sign out</Text>
                </View>
              </View>
            </Press>
          </Group>

          <Text style={s.version}>Gocha 1.0 · made for showing up</Text>

          <View style={{ height: 118 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ProfileStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.profileStat}>
      <Text style={s.profileStatValue}>{value}</Text>
      <Text style={s.profileStatLabel}>{label}</Text>
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={s.sectionLabel}>{children}</Text>;
}

function Group({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return <View style={[s.group, style]}>{children}</View>;
}

function SettingRow({
  icon,
  color,
  label,
  desc,
  value,
  onValueChange,
  last,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  label: string;
  desc?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[s.settingRow, !last && s.divider]}>
      <View style={[s.settingIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={s.settingCopy}>
        <Text style={s.settingLabel}>{label}</Text>
        {desc && <Text style={s.settingDesc}>{desc}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.fillStrong, true: Colors.accent.teal }}
        thumbColor={Colors.white}
        ios_backgroundColor={Colors.fillStrong}
        accessibilityLabel={label}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

  eyebrow: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  title: { ...Type.largeTitle, color: Colors.text.primary, marginBottom: Spacing.lg },

  identity: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  identityTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  identityCopy: { flex: 1, gap: 3 },
  name: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    letterSpacing: -0.35,
  },
  email: { fontSize: 14, color: Colors.text.tertiary },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  profileStat: { flex: 1, alignItems: 'center', gap: 2 },
  profileStatValue: {
    fontSize: 18,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  profileStatLabel: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    color: Colors.text.tertiary,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 26,
    backgroundColor: Colors.separator,
  },

  momentsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  momentsThumbs: { flexDirection: 'row', alignItems: 'center' },
  momentThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.bg.card,
    backgroundColor: Colors.bg.elevated,
  },
  momentsCopy: { flex: 1, gap: 2 },
  momentsTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  momentsSub: { fontSize: 12, color: Colors.text.tertiary },

  sectionLabel: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.text.tertiary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  group: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    minHeight: 60,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingCopy: { flex: 1, gap: 2 },
  settingLabel: {
    fontSize: 16,
    fontWeight: FontWeight.regular,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  settingDesc: { fontSize: 12, color: Colors.text.tertiary, lineHeight: 16 },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    minHeight: 58,
  },
  optionCopy: { flex: 1, gap: 2 },
  optionLabel: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: FontWeight.regular,
    letterSpacing: -0.2,
  },
  optionDesc: { fontSize: 12, color: Colors.text.tertiary },

  interestCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  interestHint: { fontSize: 12, color: Colors.text.tertiary, marginBottom: Spacing.md },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  interestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.fill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  interestPillActive: { backgroundColor: Colors.white },
  interestLabel: { fontSize: 14, color: Colors.text.secondary },
  interestLabelActive: { color: Colors.black, fontWeight: FontWeight.semibold },

  privacyCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  privacyIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: Colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyCopy: { flex: 1, gap: 4 },
  privacyTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  privacyText: { fontSize: 12, color: Colors.text.tertiary, lineHeight: 18 },

  linksGroup: { marginBottom: Spacing.base },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    minHeight: 54,
  },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  linkText: { fontSize: 16, color: Colors.text.primary, letterSpacing: -0.2 },

  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.text.dim,
    marginBottom: Spacing.base,
  },
});
