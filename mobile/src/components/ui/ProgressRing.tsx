import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { clamp } from '@/utils/geo';

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  size = 120,
  strokeWidth = 10,
  progress,
  color = Colors.brand.primary,
  trackColor = Colors.bg.elevated,
  children,
}: ProgressRingProps) {
  const value = clamp(progress, 0, 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
