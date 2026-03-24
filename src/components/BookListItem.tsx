import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts, borderRadius, spacing, shadows } from '../constants/theme';
import { Book } from '../types';
import { categoryIcons } from '../data/catalog';

interface BookListItemProps {
  book: Book;
  progress?: number;
  downloaded?: boolean;
  onPress?: () => void;
}

export default function BookListItem({ book, progress, downloaded, onPress }: BookListItemProps) {
  const icon = categoryIcons[book.category] || '\u2726';

  return (
    <TouchableOpacity
      style={[styles.container, shadows.card]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Mini cover */}
      <View style={styles.miniCover}>
        <Text style={styles.coverIcon}>{icon}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {book.author}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{book.subcategory}</Text>
          <Text style={styles.metaDot}>{'\u00B7'}</Text>
          <Text style={styles.meta}>
            {book.year < 0 ? `${Math.abs(book.year)} BCE` : book.year}
          </Text>
          {downloaded && (
            <>
              <Text style={styles.metaDot}>{'\u00B7'}</Text>
              <Text style={styles.downloadedBadge}>{'\u2713'}</Text>
            </>
          )}
        </View>

        {/* Progress bar */}
        {progress !== undefined && progress > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  miniCover: {
    width: 50,
    height: 65,
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  coverIcon: {
    fontSize: 20,
    color: colors.accent,
  },
  info: {
    flex: 1,
  },
  title: {
    ...fonts.serifBold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  author: {
    ...fonts.sansRegular,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 11,
    color: colors.textMuted,
  },
  metaDot: {
    fontSize: 11,
    color: colors.textMuted,
    marginHorizontal: 4,
  },
  downloadedBadge: {
    fontSize: 11,
    color: colors.success,
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  progressFill: {
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 1,
    flex: 0,
    minWidth: 2,
  },
  progressText: {
    fontSize: 10,
    color: colors.textMuted,
    marginLeft: 6,
  },
});
