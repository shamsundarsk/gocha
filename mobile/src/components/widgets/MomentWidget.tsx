import React from 'react';
import { StyleSheet, Text, View, ViewStyle, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontWeight, Radius, Spacing, Gradient } from '@/constants/theme';
import { Press } from '../ui/kit';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

export interface MomentData {
  id: string;
  photoUri: string;
  caption?: string;
  placeName?: string;
  capturedAt: string;
  taskTitle?: string;
}

export interface MomentWidgetProps {
  moment: MomentData;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  style?: ViewStyle;
}

export function MomentWidget({ moment, size = 'medium', onPress, style }: MomentWidgetProps) {
  const sizeConfig = {
    small: { width: 80, height: 80, radius: 10, fontSize: 10, captionSize: 9 },
    medium: { width: 140, height: 168, radius: 14, fontSize: 13, captionSize: 11 },
    large: { width: 180, height: 220, radius: 16, fontSize: 15, captionSize: 12 },
  };

  const cfg = sizeConfig[size];
  const date = new Date(moment.capturedAt);

  return (
    <Press onPress={onPress} style={[style, { width: cfg.width }]} accessibilityLabel={moment.caption || moment.taskTitle || 'Moment'}>
      <View style={[styles.card, { borderRadius: cfg.radius, width: cfg.width, height: cfg.height }]}>
        <Image source={{ uri: moment.photoUri }} style={[styles.image, { borderRadius: cfg.radius }]} resizeMode="cover" />
        <LinearGradient
          colors={Gradient.photo}
          locations={[0, 0.55, 1]}
          style={[styles.overlay, { borderRadius: cfg.radius }]}
        >
          <View style={[styles.content, { padding: size === 'small' ? Spacing.sm : Spacing.md }]}>
            <Text style={[styles.time, { fontSize: cfg.fontSize - 2 }]}>
              {format(date, 'h:mm a')}
            </Text>
            {(moment.caption || moment.taskTitle) && (
              <Text style={[styles.caption, { fontSize: cfg.captionSize }]} numberOfLines={size === 'small' ? 1 : 2}>
                {moment.caption || moment.taskTitle}
              </Text>
            )}
            {moment.placeName && size !== 'small' && (
              <Text style={[styles.place, { fontSize: cfg.captionSize - 1 }]} numberOfLines={1}>
                {moment.placeName}
              </Text>
            )}
          </View>
        </LinearGradient>
        {size !== 'small' && (
          <View style={[styles.cornerBadge, { top: Spacing.sm, right: Spacing.sm }]}>
            <View style={styles.cornerDot} />
          </View>
        )}
      </View>
    </Press>
  );
}

export function MomentGridWidget({
  moments,
  size = 'medium',
  maxVisible = 6,
  onPress,
  onViewAll,
  style,
}: {
  moments: MomentData[];
  size?: 'small' | 'medium';
  maxVisible?: number;
  onPress?: (moment: MomentData) => void;
  onViewAll?: () => void;
  style?: ViewStyle;
}) {
  const visible = moments.slice(0, maxVisible);
  const remaining = moments.length - maxVisible;

  if (visible.length === 0) {
    return (
      <Press onPress={onViewAll} style={style} accessibilityLabel="No moments captured">
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="camera-outline" size={20} color={Colors.text.tertiary} />
          </View>
          <Text style={styles.emptyTitle}>No moments yet</Text>
          <Text style={styles.emptySub}>Complete an outdoor task to capture one</Text>
        </View>
      </Press>
    );
  }

  return (
    <View style={[styles.grid, style]}>
      <View style={styles.gridRow}>
        {visible.map((moment) => (
          <MomentWidget key={moment.id} moment={moment} size={size} onPress={() => onPress?.(moment)} />
        ))}
        {remaining > 0 && (
          <Press onPress={onViewAll} style={styles.moreCard}>
            <View style={styles.moreOverlay}>
              <Text style={styles.moreText}>+{remaining}</Text>
              <Text style={styles.moreLabel}>more</Text>
            </View>
          </Press>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: Colors.bg.card,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.md,
    paddingTop: Spacing['3xl'],
  },
  time: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.8)',
  },
  caption: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
    marginTop: 2,
  },
  place: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  cornerBadge: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emotion.snap,
  },
  cornerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emotion.snap,
  },
  grid: {
    gap: Spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  moreCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  moreLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  emptyCard: {
    aspectRatio: 1,
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 11,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 16,
  },
});