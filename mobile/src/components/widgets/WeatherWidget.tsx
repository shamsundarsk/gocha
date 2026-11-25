import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, FontWeight, Radius, Spacing } from '@/constants/theme';
import { Press } from '../ui/kit';

export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  high: number;
  low: number;
  humidity: number;
  windKph: number;
  precipitation: number;
  city?: string;
}

export interface WeatherWidgetProps {
  weather?: WeatherData;
  loading?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

const CONDITION_ICONS: Record<string, string> = {
  clear: 'sunny',
  sunny: 'sunny',
  'partly cloudy': 'partly-sunny',
  cloudy: 'cloud',
  overcast: 'cloud',
  rain: 'rainy',
  drizzle: 'rainy',
  thunderstorm: 'thunderstorm',
  snow: 'snow',
  mist: 'cloud',
  fog: 'cloud',
};

export function WeatherWidget({ weather, loading, onPress, style }: WeatherWidgetProps) {
  if (loading || !weather) {
    return (
      <View style={[styles.card, style]}>
        <View style={styles.loading}>
          <View style={styles.skeleton} />
          <View style={styles.skeletonSmall} />
        </View>
      </View>
    );
  }

  const iconName = CONDITION_ICONS[weather.condition.toLowerCase()] || 'partly-sunny';
  const tempColor = weather.temperature > 25 ? Colors.error : weather.temperature < 10 ? Colors.emotion.snap : Colors.text.primary;

  return (
    <Press onPress={onPress} style={style} accessibilityLabel={`Weather: ${weather.temperature}°C, ${weather.condition}`}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.main}>
            <Text style={[styles.temp, { color: tempColor }]}>{Math.round(weather.temperature)}°</Text>
            <Text style={styles.condition}>{weather.condition}</Text>
            {weather.city && <Text style={styles.city}>{weather.city}</Text>}
          </View>
          <View style={styles.iconWrap}>
            <Ionicons name={iconName as any} size={48} color={weather.temperature > 25 ? Colors.error : Colors.brand.primary} />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <DetailItem label="High" value={`${Math.round(weather.high)}°`} icon="arrow-up" />
          <DetailDivider />
          <DetailItem label="Low" value={`${Math.round(weather.low)}°`} icon="arrow-down" color={Colors.text.tertiary} />
          <DetailDivider />
          <DetailItem label="Humidity" value={`${weather.humidity}%`} icon="water" color={Colors.emotion.snap} />
          <DetailDivider />
          <DetailItem label="Wind" value={`${weather.windKph} km/h`} icon="swap" color={Colors.brand.primary} />
          <DetailDivider />
          <DetailItem
            label="Rain"
            value={`${Math.round(weather.precipitation * 100)}%`}
            icon="umbrella"
            color={weather.precipitation > 0.3 ? Colors.error : Colors.text.tertiary}
          />
        </View>
      </View>
    </Press>
  );
}

function DetailItem({ label, value, icon, color }: { label: string; value: string; icon: string; color?: string }) {
  const c = color || Colors.text.primary;
  return (
    <View style={styles.detailItem}>
      <Ionicons name={`${icon}-outline` as any} size={14} color={c} />
      <Text style={[styles.detailValue, { color: c }]}>{value}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
  );
}

function DetailDivider() {
  return <View style={styles.detailDivider} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  loading: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  skeleton: {
    width: 80,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.fill,
  },
  skeletonSmall: {
    width: 60,
    height: 16,
    borderRadius: 4,
    backgroundColor: Colors.fill,
    marginTop: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  main: { flex: 1 },
  temp: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    lineHeight: 40,
    letterSpacing: -1,
  },
  condition: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  city: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.brand.glow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
    marginVertical: Spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  detailItem: {
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  detailLabel: {
    fontSize: 10,
    color: Colors.text.tertiary,
  },
  detailDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: Colors.separator,
  },
});