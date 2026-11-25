import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'glass';
  padding?: number;
}

export function Card({ children, style, variant = 'default', padding = Spacing.base }: CardProps) {
  return (
    <View style={[
      styles.base,
      variant === 'elevated' && styles.elevated,
      variant === 'glass' && styles.glass,
      { padding },
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bg.cardBorder,
  },
  elevated: {
    backgroundColor: Colors.bg.elevated,
    borderColor: Colors.bg.glassBorder,
  },
  glass: {
    backgroundColor: Colors.bg.glass,
    borderColor: Colors.bg.glassBorder,
  },
});
