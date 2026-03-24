import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet, View, Platform } from 'react-native';
import { colors, fonts } from '../../src/constants/theme';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
      {focused && <View style={styles.tabIndicator} />}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerShadowVisible: false,
        headerTintColor: colors.parchment,
        headerTitleStyle: {
          ...fonts.serifBold,
          fontSize: 18,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Library',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={'\u03A6'} label="Library" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={'\u2261'} label="Browse" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="reading"
        options={{
          title: 'Reading',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={'\u2637'} label="Reading" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={'\u2315'} label="Search" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={'\u2699'} label="Settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    minHeight: 44,
  },
  tabIcon: {
    fontSize: 22,
    color: colors.tabInactive,
    marginBottom: 2,
  },
  tabIconActive: {
    color: colors.accent,
  },
  tabLabel: {
    ...fonts.sansRegular,
    fontSize: 10,
    color: colors.tabInactive,
  },
  tabLabelActive: {
    color: colors.accent,
    ...fonts.sansBold,
  },
  tabIndicator: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.accent,
  },
});
