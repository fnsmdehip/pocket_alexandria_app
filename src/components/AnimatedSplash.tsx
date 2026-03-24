import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedSplashProps {
  onFinish: () => void;
}

export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const iconScale = useRef(new Animated.Value(0.3)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Icon appears with scale
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Decorative line
      Animated.timing(lineWidth, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      // Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      // Subtitle
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Hold
      Animated.delay(600),
      // Fade out
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      {/* Background ornament circles */}
      <View style={styles.bgOrnament1} />
      <View style={styles.bgOrnament2} />

      <Animated.Text
        style={[
          styles.icon,
          {
            opacity: iconOpacity,
            transform: [{ scale: iconScale }],
          },
        ]}
      >
        <Ionicons name="library" size={72} color={colors.accent} />
      </Animated.Text>

      <Animated.View
        style={[
          styles.ornamentLine,
          {
            width: lineWidth.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 60],
            }),
          },
        ]}
      />

      <Animated.Text
        style={[
          styles.title,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          },
        ]}
      >
        Pocket Alexandria
      </Animated.Text>

      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        Your Personal Ancient Library
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  bgOrnament1: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_WIDTH * 1.5,
    borderRadius: SCREEN_WIDTH * 0.75,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.05)',
    top: -SCREEN_WIDTH * 0.4,
    left: -SCREEN_WIDTH * 0.25,
  },
  bgOrnament2: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    borderRadius: SCREEN_WIDTH * 0.5,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.04)',
    bottom: -SCREEN_WIDTH * 0.3,
    right: -SCREEN_WIDTH * 0.25,
  },
  icon: {
    fontSize: 72,
    color: colors.accent,
    marginBottom: 12,
  },
  ornamentLine: {
    height: 1,
    backgroundColor: colors.accent,
    marginBottom: 16,
    opacity: 0.5,
  },
  title: {
    ...fonts.serifBold,
    fontSize: 32,
    color: colors.parchment,
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    ...fonts.sansLight,
    fontSize: 15,
    color: colors.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
