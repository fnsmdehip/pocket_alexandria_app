import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/theme';
import SettingsScreen from '../../src/screens/SettingsScreen';

export default function SettingsTab() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <SettingsScreen />
    </SafeAreaView>
  );
}
