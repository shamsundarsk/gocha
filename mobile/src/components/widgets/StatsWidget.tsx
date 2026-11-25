import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, FontWeight, Radius, Spacing, Type } from '@/constants/theme';
import { Press } from '../ui/kit';

export interface StatItem {
  key: string;
  icon: string;
  value: string | number;
  label: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export interface StatsWidgetProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  onPress?: (key: string) => void;
  style?: ViewStyle;
}

export function StatsWidget({ stats, columns = 4, onPress, style }: StatsWidgetProps) {
  const flex = 1 / columns;

  return (
    <View style={[styles.container, style]}>
      {stats.map((stat, i) => (
        <Press
          key={stat.key}
          onPress={() => onPress?.(stat.key)}
          style={{
            flex,
            paddingHorizontal: i === 0 ? Spacing.lg : i === stats.length - 1 ? Spacing.lg : Spacing.sm,
          }}
          accessibilityLabel={`${stat.label}: ${stat.value}`}
        >
          <View style={styles.statCard}>
            <View style={[styles.iconWrap, { backgroundColor: stat.color + '18' }]}>
              <Ionicons name={`${stat.icon}-outline` as any} size={18} color={stat.color} />
            </View>
            <Text style={[styles.value, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
            {stat.trend && stat.trendValue && (
              <View style={[styles.trend, { backgroundColor: stat.trend === 'up' ? Colors.accent.teal + '18' : stat.trend === 'down' ? Colors.error + '18' : Colors.fill }]}>
                <Ionicons
                  name={stat.trend === 'up' ? 'trending-up' : stat.trend === 'down' ? 'trending-down' : 'remove'}
                  size={10}
                  color={stat.trend === 'up' ? Colors.accent.teal : stat.trend === 'down' ? Colors.error : Colors.text.tertiary}
                />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: FontWeight.semibold,
                    color: stat.trend === 'up' ? Colors.accent.teal : stat.trend === 'down' ? Colors.error : Colors.text.tertiary,
                  }}
                >
                  {stat.trendValue}
                </Text>
              </View>
            )}
          </View>
        </Press>
      ))}
    </View>
  );
}

export function CompactStatsWidget({
  stats,
  onPress,
  style,
}: {
  stats: Omit<StatItem, 'key'>[];
  onPress?: () => void;
  style?: ViewStyle;
}) {
  return (
    <Press onPress={onPress} style={style}>
      <View style={styles.compactCard}>
        {stats.map((stat, i) => (
          <View key={stat.label} style={[styles.compactItem, i < stats.length - 1 && styles.compactDivider]}>
            <Ionicons name={`${stat.icon}-outline` as any} size={16} color={stat.color} />
            <View style={styles.compactText}>
              <Text style={[styles.compactValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.compactLabel}>{stat.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </Press>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    minHeight: 90,
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    marginTop: Spacing.xs,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  compactDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Colors.separator,
    paddingRight: Spacing.base,
  },
  compactText: { gap: 1 },
  compactValue: {
    fontSize: 17,
    fontWeight: FontWeight.semibold,
  },
  compactLabel: {
    fontSize: 11,
    color: Colors.text.tertiary,
  },
});