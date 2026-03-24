import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '../src/constants/theme';
import { getOnboardingState } from '../src/services/storage';
import AnimatedSplash from '../src/components/AnimatedSplash';
import OnboardingScreen from '../src/screens/OnboardingScreen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const state = await getOnboardingState();
        setShowOnboarding(!state.completed);
      } catch {
        setShowOnboarding(true);
      } finally {
        setHasChecked(true);
        await SplashScreen.hideAsync();
      }
    })();
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
    setIsReady(true);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  if (!hasChecked) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
      </View>
    );
  }

  if (showSplash) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <AnimatedSplash onFinish={handleSplashFinish} />
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="reader/[bookId]"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
