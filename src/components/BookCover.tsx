import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { colors, fonts, borderRadius, shadows, spacing } from '../constants/theme';
import { Book } from '../types';
import { categoryIcons } from '../data/catalog';

interface BookCoverProps {
  book: Book;
  progress?: number;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

const coverColors: Record<string, [string, string]> = {
  'Sacred Texts': ['#2A1F3D', '#1A1230'],
  'Philosophy': ['#1E2D3D', '#142030'],
  'Hermetic / Occult': ['#2D2418', '#1F1810'],
  'Psychology': ['#1A2E2E', '#102020'],
  'Apocrypha': ['#2D1A1A', '#201010'],
  'Astrology / Divination': ['#1A1A3D', '#101030'],
  'Eastern Wisdom': ['#2D2A1A', '#201E10'],
  'Secret Societies': ['#1F1F2D', '#141420'],
  'Alchemy / Mysticism': ['#2D1F2A', '#20101E'],
  'Forbidden / Controversial': ['#2D1A1A', '#201010'],
};

export default function BookCover({ book, progress, size = 'medium', onPress }: BookCoverProps) {
  const dims = getDimensions(size);
  const [bg1, bg2] = coverColors[book.category] || ['#1E1E30', '#141420'];
  const icon = categoryIcons[book.category] || '\u2726';

  const titleSize = size === 'small' ? 11 : size === 'medium' ? 13 : 16;
  const authorSize = size === 'small' ? 9 : size === 'medium' ? 10 : 12;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, { width: dims.width, height: dims.height }]}
    >
      <View style={[styles.cover, { backgroundColor: bg1 }, shadows.card]}>
        {/* Gold border */}
        <View style={styles.borderOuter}>
          <View style={[styles.borderInner, { backgroundColor: bg2 }]}>
            {/* Category icon */}
            <Text style={[styles.icon, { fontSize: size === 'small' ? 18 : size === 'medium' ? 24 : 32 }]}>
              {icon}
            </Text>

            {/* Decorative line */}
            <View style={styles.ornamentLine} />

            {/* Title */}
            <Text
              style={[styles.title, { fontSize: titleSize }]}
              numberOfLines={size === 'small' ? 2 : 3}
            >
              {book.title}
            </Text>

            {/* Author */}
            <Text
              style={[styles.author, { fontSize: authorSize }]}
              numberOfLines={1}
            >
              {book.author}
            </Text>

            {/* Year */}
            {size !== 'small' && (
              <Text style={styles.year}>
                {book.year < 0 ? `${Math.abs(book.year)} BCE` : book.year}
              </Text>
            )}

            {/* Bottom ornament */}
            <View style={styles.ornamentLine} />
          </View>
        </View>

        {/* Spine */}
        <View style={styles.spine} />

        {/* Progress bar */}
        {progress !== undefined && progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function getDimensions(size: 'small' | 'medium' | 'large') {
  const screenWidth = Dimensions.get('window').width;
  switch (size) {
    case 'small':
      return { width: (screenWidth - 60) / 3, height: 160 };
    case 'medium':
      return { width: (screenWidth - 52) / 2.5, height: 200 };
    case 'large':
      return { width: 150, height: 220 };
  }
}

const styles = StyleSheet.create({
  container: {
    marginRight: spacing.md,
    marginBottom: spacing.md,
  },
  cover: {
    flex: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  borderOuter: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.35)',
    borderRadius: borderRadius.sm,
    padding: 3,
  },
  borderInner: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(201, 169, 110, 0.2)',
    borderRadius: borderRadius.sm - 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  icon: {
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  ornamentLine: {
    width: 30,
    height: 1,
    backgroundColor: 'rgba(201, 169, 110, 0.3)',
    marginVertical: spacing.xs,
  },
  title: {
    ...fonts.serifBold,
    color: colors.parchment,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  author: {
    ...fonts.sansLight,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  year: {
    ...fonts.sansLight,
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
  spine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(201, 169, 110, 0.3)',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.accent,
  },
});
