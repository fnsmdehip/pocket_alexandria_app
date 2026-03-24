import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../src/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ icon, iconOutline, label, focused }: { icon: IoniconsName; iconOutline: IoniconsName; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Ionicons
        name={focused ? icon : iconOutline}
        size={22}
        color={focused ? colors.accent : colors.tabInactive}
      />
      <View style={{ height: 2 }} />
      <Ionicons
        name={focused ? icon : iconOutline}
        size={0}
        color="transparent"
      />
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
        tabBarActiveTintColor: '#C9A96E',
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          ...fonts.sansRegular,
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Library',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'library' : 'library-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reading"
        options={{
          title: 'Reading',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
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
  tabIndicator: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.accent,
  },
});
