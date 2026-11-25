import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

interface PillProps {
  label: string;
  color?: string;
  bg?: string;
  style?: ViewStyle;
}

export function Pill({ label, color = Colors.brand.primary, bg, style }: PillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: bg || color + '20', borderColor: color + '40' }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.3,
  },
});
