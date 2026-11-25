import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  FontWeight,
  Motion,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Pressable with a short, eased scale + fade. Gives every tappable surface
 * the direct-manipulation feel of a native control without layout shifts.
 */
export function Press({
  children,
  onPress,
  style,
  containerStyle,
  disabled,
  accessibilityLabel,
  accessibilityRole = 'button',
  hitSlop = 8,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Layout style applied to the Pressable itself (flex, alignSelf, margins). */
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'tab';
  hitSlop?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animate = (toScale: number, toOpacity: number) => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: toScale,
        duration: Motion.fast,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: toOpacity,
        duration: Motion.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      style={containerStyle}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      onPressIn={() => !disabled && animate(Motion.pressScale, 0.9)}
      onPressOut={() => animate(1, 1)}
    >
      <Animated.View style={[style, { transform: [{ scale }], opacity }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

/** Elevated grouped surface. The base unit of the app. */
export function Surface({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  return (
    <View style={[styles.surface, padded && styles.surfacePadded, style]}>
      {children}
    </View>
  );
}

/** Grouped inset list, iOS Settings style. */
export function Group({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.group, style]}>{children}</View>;
}

export function SectionLabel({
  children,
  action,
  onAction,
}: {
  children: React.ReactNode;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={styles.sectionLabel}>{children}</Text>
      {action ? (
        <Press onPress={onAction} hitSlop={10}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Press>
      ) : null}
    </View>
  );
}

export function Row({
  icon,
  iconColor = Colors.brand.primary,
  title,
  subtitle,
  trailing,
  onPress,
  last,
  accessory,
}: {
  icon?: IconName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
  accessory?: IconName;
}) {
  const content = (
    <View style={[styles.row, !last && styles.rowDivider]}>
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: iconColor + '22' }]}>
          <Ionicons name={icon} size={17} color={iconColor} />
        </View>
      ) : null}
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {accessory ? (
        <Ionicons name={accessory} size={17} color={Colors.text.dim} />
      ) : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Press onPress={onPress} accessibilityLabel={title}>
      {content}
    </Press>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tinted' | 'plain';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const isPrimary = variant === 'primary';
  const isTinted = variant === 'tinted';
  const textColor = isPrimary
    ? Colors.white
    : isTinted
    ? Colors.brand.secondary
    : Colors.text.primary;

  return (
    <Press onPress={onPress} disabled={disabled || loading} containerStyle={style}>
      <View
        style={[
          styles.button,
          isPrimary
            ? styles.buttonPrimary
            : isTinted
            ? styles.buttonTinted
            : variant === 'plain'
            ? styles.buttonPlain
            : styles.buttonSecondary,
          (disabled || loading) && { opacity: 0.45 },
        ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
        <Text style={[styles.buttonLabel, { color: textColor }]}>
          {loading ? 'Working…' : label}
        </Text>
      </View>
    </Press>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.segmented, style]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Press
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            containerStyle={styles.segmentPress}
          >
            <View style={[styles.segment, active && styles.segmentActive]}>
              {option.icon ? (
                <Ionicons
                  name={option.icon}
                  size={15}
                  color={active ? Colors.text.primary : Colors.text.tertiary}
                />
              ) : null}
              <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                {option.label}
              </Text>
            </View>
          </Press>
        );
      })}
    </View>
  );
}

export function IconTile({
  icon,
  color = Colors.brand.primary,
  size = 34,
}: {
  icon: IconName;
  color?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: color + '24',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={Colors.text.tertiary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action && onAction ? (
        <Button label={action} onPress={onAction} variant="tinted" style={styles.emptyButton} />
      ) : null}
    </View>
  );
}

const hairline = StyleSheet.hairlineWidth;

const styles = StyleSheet.create({
  surface: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.xl,
  },
  surfacePadded: { padding: Spacing.lg },

  group: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },

  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: FontWeight.semibold,
    color: Colors.text.tertiary,
    letterSpacing: 0.1,
  },
  sectionAction: {
    fontSize: 15,
    fontWeight: FontWeight.medium,
    color: Colors.brand.secondary,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 54,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  rowDivider: {
    borderBottomWidth: hairline,
    borderBottomColor: Colors.separator,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, gap: 2 },
  rowTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: FontWeight.regular,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  rowSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text.tertiary,
  },

  button: {
    minHeight: 50,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  buttonPrimary: { backgroundColor: Colors.brand.primary },
  buttonSecondary: {
    backgroundColor: Colors.bg.elevated,
  },
  buttonTinted: { backgroundColor: Colors.brand.glow },
  buttonPlain: { backgroundColor: 'transparent' },
  buttonLabel: {
    fontSize: 17,
    fontWeight: FontWeight.semibold,
    letterSpacing: -0.2,
  },

  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.fill,
    borderRadius: 10,
    padding: 2,
  },
  segmentPress: { flex: 1 },
  segment: {
    minHeight: 30,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
  },
  segmentActive: {
    backgroundColor: Colors.bg.elevated,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      default: {},
    }),
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
    color: Colors.text.tertiary,
  },
  segmentLabelActive: {
    color: Colors.text.primary,
    fontWeight: FontWeight.semibold,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyTitle: { ...Type.title3, color: Colors.text.primary },
  emptyBody: {
    ...Type.subhead,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyButton: { marginTop: Spacing.sm, alignSelf: 'stretch' },
});
