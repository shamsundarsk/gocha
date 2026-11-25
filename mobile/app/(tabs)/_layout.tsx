import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontWeight, Radius } from '@/constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name={name}
        size={22}
        color={focused ? Colors.brand.secondary : Colors.text.tertiary}
      />
    </View>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const barBottom = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: Colors.brand.secondary,
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarStyle: [styles.bar, { bottom: barBottom }],
        tabBarItemStyle: styles.item,
        tabBarLabelPosition: 'below-icon',
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={styles.barBackground}>
              <View style={styles.barTint} />
            </BlurView>
          ) : (
            <View style={styles.barBackground}>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(18,18,20,0.98)' }]} />
            </View>
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="Today" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'compass' : 'compass-outline'} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="Discover" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wrapped"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'sparkles' : 'sparkles-outline'} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="Wrapped" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="You" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="widgets-test"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'construct' : 'construct-outline'} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="Widgets" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 12,
    height: 72,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    elevation: 0,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
  },
  barBackground: {
    flex: 1,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  barTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16,16,18,0.52)',
  },
  item: { paddingTop: 10, paddingBottom: 9 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', height: 24, width: 44 },
  label: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
    color: Colors.text.tertiary,
    marginTop: 1,
    letterSpacing: 0.1,
  },
  labelActive: { color: Colors.brand.secondary, fontWeight: FontWeight.semibold },
});
