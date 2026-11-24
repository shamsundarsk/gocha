import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, FontSize, Spacing, Radius, FontWeight } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { userApi } from '@/services/api';
import { UserPreferences } from '@/types';
import Toast from 'react-native-toast-message';

const INTERESTS = [
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'arts', label: 'Arts', emoji: '🎨' },
  { id: 'fitness', label: 'Fitness', emoji: '🏃' },
  { id: 'business', label: 'Business', emoji: '💼' },
  { id: 'food', label: 'Food', emoji: '🍽️' },
  { id: 'education', label: 'Education', emoji: '📚' },
  { id: 'community', label: 'Community', emoji: '🤝' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const res = await userApi.getPreferences();
      setPrefs(res.data);
    } catch {}
  };

  const updatePref = async (key: keyof UserPreferences, value: any) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    try {
      await userApi.updatePreferences({ [key]: value });
    } catch {}
  };

  const toggleInterest = async (id: string) => {
    if (!prefs) return;
    const current = prefs.interests || [];
    const next = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
    await updatePref('interests', next);
  };

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure?', [
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
  };

  const firstName = user?.full_name?.split(' ')[0] || 'You';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.profileName}>{user?.full_name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        {/* Demo mode toggle */}
        <SettingSection title="Mode">
          <SettingRow
            label="Demo Mode"
            description="Simulate all integrations with realistic data"
            value={prefs?.demo_mode ?? false}
            onToggle={(v) => updatePref('demo_mode', v)}
          />
        </SettingSection>

        {/* Connections */}
        <SettingSection title="Connected Sources">
          <SettingRow
            label="Calendar"
            description="Fixed commitments and events"
            emoji="📅"
            value={prefs?.calendar_connected ?? false}
            onToggle={(v) => updatePref('calendar_connected', v)}
          />
          <SettingRow
            label="Fitness"
            description="Activity and workout verification"
            emoji="🏃"
            value={prefs?.fitness_connected ?? false}
            onToggle={(v) => updatePref('fitness_connected', v)}
          />
          <SettingRow
            label="Location"
            description="Nearby events and task relevance"
            emoji="📍"
            value={prefs?.location_enabled ?? false}
            onToggle={(v) => updatePref('location_enabled', v)}
          />
          <SettingRow
            label="Photos"
            description="Day Wrapped memories"
            emoji="📸"
            value={prefs?.photos_enabled ?? false}
            onToggle={(v) => updatePref('photos_enabled', v)}
          />
          <SettingRow
            label="Screen Time"
            description="Contextual execution nudges"
            emoji="📱"
            value={prefs?.screen_time_enabled ?? false}
            onToggle={(v) => updatePref('screen_time_enabled', v)}
          />
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="Notifications">
          {(['minimal', 'balanced', 'proactive'] as const).map((style) => (
            <TouchableOpacity
              key={style}
              style={[styles.optionRow, prefs?.notification_style === style && styles.optionRowActive]}
              onPress={() => updatePref('notification_style', style)}
            >
              <Text style={styles.optionLabel}>{style.charAt(0).toUpperCase() + style.slice(1)}</Text>
              {prefs?.notification_style === style && <Text style={styles.optionCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </SettingSection>

        {/* Interests */}
        <SettingSection title="Interests">
          <Text style={styles.interestHint}>Used for event discovery relevance</Text>
          <View style={styles.interestsGrid}>
            {INTERESTS.map((interest) => (
              <TouchableOpacity
                key={interest.id}
                style={[
                  styles.interestPill,
                  prefs?.interests?.includes(interest.id) && styles.interestPillActive,
                ]}
                onPress={() => toggleInterest(interest.id)}
              >
                <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                <Text style={[
                  styles.interestLabel,
                  prefs?.interests?.includes(interest.id) && styles.interestLabelActive,
                ]}>
                  {interest.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingSection>

        {/* Privacy note */}
        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>Privacy</Text>
          <Text style={styles.privacyText}>
            Location is stored at ~1km precision only. All permissions are optional. You can disconnect any source at any time.
          </Text>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingRow({
  label, description, emoji, value, onToggle,
}: {
  label: string;
  description?: string;
  emoji?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <View style={styles.settingLabel}>
          {emoji && <Text style={styles.settingEmoji}>{emoji}</Text>}
          <Text style={styles.settingLabelText}>{label}</Text>
        </View>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.bg.secondary, true: Colors.brand.primary }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.lg },

  profileHeader: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.white },
  profileName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text.primary, marginBottom: 4 },
  profileEmail: { fontSize: FontSize.base, color: Colors.text.secondary },

  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.text.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  sectionCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
  settingEmoji: { fontSize: 16 },
  settingLabelText: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.text.primary },
  settingDesc: { fontSize: FontSize.sm, color: Colors.text.muted },

  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  optionRowActive: { backgroundColor: 'rgba(99,102,241,0.08)' },
  optionLabel: { fontSize: FontSize.base, color: Colors.text.primary },
  optionCheck: { fontSize: FontSize.base, color: Colors.brand.primary, fontWeight: FontWeight.bold },

  interestHint: { fontSize: FontSize.sm, color: Colors.text.muted, marginBottom: Spacing.md },
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  interestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  interestPillActive: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    borderColor: Colors.brand.primary,
  },
  interestEmoji: { fontSize: 14 },
  interestLabel: { fontSize: FontSize.sm, color: Colors.text.secondary },
  interestLabelActive: { color: Colors.brand.primary },

  privacyCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  privacyTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text.primary, marginBottom: Spacing.sm },
  privacyText: { fontSize: FontSize.sm, color: Colors.text.secondary, lineHeight: 20 },

  signOutButton: {
    padding: Spacing.base,
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    marginBottom: Spacing.lg,
  },
  signOutText: { fontSize: FontSize.base, color: Colors.error, fontWeight: FontWeight.medium },
});
