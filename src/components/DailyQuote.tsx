import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../constants/theme';
import { dailyQuotes } from '../data/quotes';
import { getDailyQuoteIndex } from '../services/storage';
import { DailyQuote as DailyQuoteType } from '../types';

interface DailyQuoteProps {
  onPress?: (bookId: string) => void;
}

export default function DailyQuoteCard({ onPress }: DailyQuoteProps) {
  const [quote, setQuote] = useState<DailyQuoteType | null>(null);

  useEffect(() => {
    (async () => {
      const idx = await getDailyQuoteIndex();
      setQuote(dailyQuotes[idx % dailyQuotes.length]);
    })();
  }, []);

  if (!quote) return null;

  return (
    <TouchableOpacity
      style={[styles.container, styles.cardDepth, shadows.glow]}
      onPress={() => onPress?.(quote.bookId)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.label}>DAILY WISDOM</Text>
        <Ionicons name="sunny-outline" size={18} color={colors.accent} />
      </View>
      <View style={styles.ornamentTop}>
        <View style={styles.ornamentDash} />
        <Ionicons name="sparkles" size={10} color={colors.accent} style={{ marginHorizontal: 8, opacity: 0.5 }} />
        <View style={styles.ornamentDash} />
      </View>
      <Text style={styles.quoteText}>
        {'\u201C'}{quote.text}{'\u201D'}
      </Text>
      <View style={styles.ornamentBottom}>
        <View style={styles.ornamentDash} />
      </View>
      <Text style={styles.attribution}>
        {'\u2014'} {quote.author}, {quote.source}
      </Text>
      <Text style={styles.tapHint}>Tap to read in context</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.md,
    padding: spacing.xl,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...fonts.sansBold,
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 2,
  },
  ornamentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  ornamentDash: {
    width: 24,
    height: 1,
    backgroundColor: colors.accent,
    opacity: 0.3,
  },
  ornamentBottom: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  quoteText: {
    fontFamily: 'Georgia',
    fontSize: 17,
    lineHeight: 28,
    color: colors.parchment,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  attribution: {
    fontFamily: 'Georgia',
    fontSize: 13,
    color: colors.accent,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  tapHint: {
    ...fonts.sansLight,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '300',
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
