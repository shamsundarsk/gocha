import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, FontWeight, Radius, Spacing } from '@/constants/theme';
import { Press } from '../ui/kit';
import { formatDistance, haversineMeters } from '@/utils/geo';

export interface MissionData {
  taskId: string;
  title: string;
  placeName: string;
  destination: { latitude: number; longitude: number };
  radiusMeters: number;
  completed: boolean;
  inRange: boolean;
  photoUri?: string;
}

export interface MissionWidgetProps {
  mission?: MissionData;
  userLocation?: { latitude: number; longitude: number } | null;
  onPress?: () => void;
  style?: ViewStyle;
}

export function MissionWidget({ mission, userLocation, onPress, style }: MissionWidgetProps) {
  if (!mission) {
    return null;
  }

  const distance = userLocation ? haversineMeters(userLocation, mission.destination) : null;
  const isReady = mission.inRange && !mission.completed;
  const isCaptured = mission.completed;
  const isLocked = !mission.inRange && !mission.completed;

  const stateConfig = isCaptured
    ? { label: 'Captured', color: Colors.accent.teal, icon: 'checkmark-circle' }
    : isReady
    ? { label: 'Ready', color: Colors.accent.teal, icon: 'flag' }
    : { label: 'Locked', color: Colors.text.tertiary, icon: 'lock-closed' };

  return (
    <Press onPress={onPress} style={style} accessibilityLabel={`Mission: ${mission.title}, ${stateConfig.label}`}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="flag-outline" size={18} color={Colors.brand.secondary} />
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.title} numberOfLines={2}>{mission.title}</Text>
            <Text style={styles.place}>{mission.placeName}</Text>
          </View>
          <View style={[styles.stateBadge, { backgroundColor: stateConfig.color + '18' }]}>
            <Ionicons name={stateConfig.icon as any} size={14} color={stateConfig.color} />
            <Text style={[styles.stateText, { color: stateConfig.color }]}>{stateConfig.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          <View style={styles.distanceItem}>
            <Ionicons name="location-outline" size={14} color={isReady ? Colors.accent.teal : Colors.text.tertiary} />
            <Text style={[styles.distanceValue, { color: isReady ? Colors.accent.teal : Colors.text.secondary }]}>
              {distance !== null ? formatDistance(distance) : '—'}
            </Text>
            <Text style={styles.distanceLabel}>away</Text>
          </View>

          <View style={styles.dividerVertical} />

          <View style={styles.distanceItem}>
            <Ionicons name="radio" size={14} color={Colors.text.tertiary} />
            <Text style={styles.distanceValue}>{Math.round(mission.radiusMeters)}m</Text>
            <Text style={styles.distanceLabel}>radius</Text>
          </View>

          {mission.photoUri && (
            <>
              <View style={styles.dividerVertical} />
              <View style={styles.distanceItem}>
                <Ionicons name="image-outline" size={14} color={Colors.accent.teal} />
                <Text style={[styles.distanceValue, { color: Colors.accent.teal }]}>Captured</Text>
                <Text style={styles.distanceLabel}>photo</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </Press>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.brand.glow,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  titleSection: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  place: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 0,
  },
  stateText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
    marginVertical: Spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  distanceValue: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  distanceLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  dividerVertical: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: Colors.separator,
    marginHorizontal: Spacing.sm,
  },
});