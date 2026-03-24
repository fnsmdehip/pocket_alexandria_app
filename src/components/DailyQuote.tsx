import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
      style={[styles.container, shadows.glow]}
      onPress={() => onPress?.(quote.bookId)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.label}>DAILY WISDOM</Text>
        <Text style={styles.sunIcon}>{'\u263C'}</Text>
      </View>
      <View style={styles.ornamentTop}>
        <View style={styles.ornamentDash} />
        <Text style={styles.ornamentSymbol}>{'\u2726'}</Text>
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
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.25)',
    marginHorizontal: spacing.xl,
    marginVertical: spacing.md,
    padding: spacing.xl,
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
  sunIcon: {
    fontSize: 18,
    color: colors.accent,
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
  ornamentSymbol: {
    fontSize: 10,
    color: colors.accent,
    marginHorizontal: 8,
    opacity: 0.5,
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
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
