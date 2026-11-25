import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, FontWeight, Radius, Spacing, Type } from '@/constants/theme';
import { Press } from '../ui/kit';
import { safeFormat } from '@/utils/formatters';

export interface TaskBlock {
  id: string;
  title: string;
  start: string;
  end: string;
  isFixed: boolean;
  category?: string;
  mission?: { completed: boolean; inRange: boolean };
}

export interface NextUpWidgetProps {
  block?: TaskBlock;
  onPress?: () => void;
  style?: ViewStyle;
}

export function NextUpWidget({ block, onPress, style }: NextUpWidgetProps) {
  if (!block) {
    return (
      <Press onPress={onPress} style={style} accessibilityLabel="Add a task">
        <View style={[styles.card, styles.empty]}>
          <Ionicons name="add-circle-outline" size={28} color={Colors.brand.secondary} />
          <Text style={styles.emptyTitle}>Nothing scheduled next</Text>
          <Text style={styles.emptySub}>Tap to add a task</Text>
        </View>
      </Press>
    );
  }

  const startDate = new Date(block.start);
  const isMission = !!block.mission;
  const missionState = block.mission?.completed ? 'Captured' : block.mission?.inRange ? 'Ready' : 'Locked';

  return (
    <Press onPress={onPress} style={style} accessibilityLabel={`Up next: ${block.title} at ${safeFormat(String(block.start), 'h:mm a')}`}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={[styles.timeBadge, { backgroundColor: block.isFixed ? Colors.accent.amber + '18' : Colors.brand.glow }]}>
            <Text style={[styles.time, { color: block.isFixed ? Colors.accent.amber : Colors.brand.secondary }]}>
              {safeFormat(String(block.start), 'h:mm')}
            </Text>
            <Text style={[styles.ampm, { color: block.isFixed ? Colors.accent.amber : Colors.brand.secondary }]}>
              {safeFormat(startDate.toISOString(), 'a')}
            </Text>
          </View>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>{block.title}</Text>
              {isMission && (
                <View style={[styles.missionBadge, { backgroundColor: missionState === 'Ready' ? Colors.accent.teal + '18' : missionState === 'Captured' ? Colors.accent.teal + '18' : Colors.brand.glow }]}>
                  <Text style={[styles.missionText, { color: missionState === 'Ready' ? Colors.accent.teal : missionState === 'Captured' ? Colors.accent.teal : Colors.brand.secondary }]}>
                    {missionState}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{safeFormat(String(block.start), 'h:mm a')} – {safeFormat(String(block.end), 'h:mm a')}</Text>
              {block.isFixed && <Text style={[styles.meta, { color: Colors.accent.amber }]}>Fixed</Text>}
              {block.category && <Text style={styles.meta}>{block.category}</Text>}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.text.dim} />
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
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  timeBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  time: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    lineHeight: 22,
  },
  ampm: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    lineHeight: 13,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  missionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  missionText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  meta: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
});