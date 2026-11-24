import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '@/constants/theme';

type TabIconProps = {
  focused: boolean;
  emoji: string;
  label: string;
};

function TabIcon({ focused, emoji, label }: TabIconProps) {
  return (
    <View style={[styles.tab, focused && styles.tabActive]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      {focused && <Text style={styles.tabLabel}>{label}</Text>}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="⚡" label="Home" />,
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="📅" label="Today" />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🗺" label="Discover" />,
        }}
      />
      <Tabs.Screen
        name="wrapped"
        options={{
          title: 'Wrapped',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="✨" label="Wrapped" />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="📊" label="Insights" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="👤" label="Profile" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bg.secondary,
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 2,
    minWidth: 44,
  },
  tabActive: {
    backgroundColor: Colors.brand.glow,
    flexDirection: 'row',
  },
  tabEmoji: { fontSize: 20 },
  tabLabel: {
    fontSize: FontSize.xs,
    color: Colors.brand.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
});
