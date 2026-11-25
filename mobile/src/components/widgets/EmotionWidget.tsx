import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { clamp } from '@/utils/geo';

export type EmotionTone = 'spark' | 'move' | 'nudge' | 'snap';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface EmotionWidgetProps {
  tone: EmotionTone;
  label: string;
  icon: IconName;
  title: string;
  subtitle?: string;
  footer?: string;
  progress?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

const TONE_COLOR: Record<EmotionTone, string> = {
  spark: Colors.emotion.spark,
  move: Colors.emotion.move,
  nudge: Colors.emotion.nudge,
  snap: Colors.emotion.snap,
};

export function EmotionWidget({
  tone,
  label,
  icon,
  title,
  subtitle,
  footer,
  progress,
  onPress,
  style,
}: EmotionWidgetProps) {
  const color = TONE_COLOR[tone];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.wrap, style, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: color + '14' }]}>
            <Ionicons name={icon} size={17} color={color} />
          </View>
          <Text style={[styles.label, { color }]}>{label}</Text>
        </View>

        <Text style={styles.title} numberOfLines={3}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}

        <View style={styles.footerSpacer} />

        {typeof progress === 'number' ? (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(clamp(progress, 0, 1) * 100)}%`, backgroundColor: color },
              ]}
            />
          </View>
        ) : null}

        {footer ? (
          <View style={styles.footerRow}>
            <Text style={[styles.footer, { color }]} numberOfLines={1}>
              {footer}
            </Text>
            <Ionicons name="arrow-forward" size={15} color={color} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: Radius.xl },
  card: {
    minHeight: 172,
    padding: Spacing.base,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.bg.cardBorder,
    backgroundColor: Colors.bg.card,
    overflow: 'hidden',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1.25 },
  title: {
    fontSize: FontSize.base,
    lineHeight: 21,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: FontSize.xs,
    lineHeight: 17,
    color: Colors.text.secondary,
    marginTop: 5,
  },
  footerSpacer: { flex: 1, minHeight: Spacing.sm },
  progressTrack: {
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.bg.elevated,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: { height: '100%', borderRadius: Radius.full },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  footer: { flex: 1, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  pressed: { opacity: 0.72 },
});
