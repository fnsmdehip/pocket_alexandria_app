import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export function Skeleton({ width = '100%', height = 16, borderRadius = 8 }: { width?: number | string; height?: number; borderRadius?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return <Animated.View style={[{ width: width as any, height, borderRadius, backgroundColor: '#2A2A3E', opacity }]} />;
}

export function LibrarySkeleton() {
  return (
    <View style={{ padding: 20, gap: 16 }}>
      <Skeleton width="60%" height={28} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1,2,3,4].map(i => <Skeleton key={i} width={80} height={40} borderRadius={20} />)}
      </View>
      {[1,2,3].map(i => <Skeleton key={i} height={80} borderRadius={12} />)}
    </View>
  );
}
