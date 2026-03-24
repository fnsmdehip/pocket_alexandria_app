import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onSeeAll?: () => void;
}

export default function SectionHeader({ title, subtitle, icon, onSeeAll }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 22,
    color: colors.accent,
    marginRight: spacing.md,
  },
  title: {
    ...fonts.serifBold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  subtitle: {
    ...fonts.sansRegular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  seeAll: {
    ...fonts.sansBold,
    fontSize: 13,
    color: colors.accent,
  },
});
