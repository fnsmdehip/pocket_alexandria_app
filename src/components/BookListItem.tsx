import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, borderRadius, spacing, shadows } from '../constants/theme';
import { Book } from '../types';

interface BookListItemProps {
  book: Book;
  progress?: number;
  downloaded?: boolean;
  onPress?: () => void;
}

export default function BookListItem({ book, progress, downloaded, onPress }: BookListItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, styles.cardDepth, shadows.card]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Mini cover */}
      <View style={styles.miniCover}>
        <Ionicons name="flame-outline" size={20} color={colors.accent} />
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
              <Ionicons name="checkmark-circle" size={11} color={colors.success} />
            </>
          )}
        </View>

        {/* Progress bar */}
        {progress !== undefined && progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 72,
  },
  cardDepth: {
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.15)',
    shadowColor: 'rgba(0,0,0,0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    fontWeight: '300',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '300',
  },
  metaDot: {
    fontSize: 11,
    color: colors.textMuted,
    marginHorizontal: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: colors.surfaceBorder,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 10,
    color: colors.textMuted,
    marginLeft: 6,
    fontVariant: ['tabular-nums'],
  },
});
