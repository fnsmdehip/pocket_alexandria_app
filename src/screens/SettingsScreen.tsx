import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, spacing, borderRadius, shadows, readerThemes } from '../constants/theme';
import { getSettings, saveSettings, getStats, getAllProgress } from '../services/storage';
import { getCacheSize, clearCache } from '../services/bookDownloader';
import { books } from '../data/catalog';
import { ReaderTheme, ReaderSettings, ReadingStats } from '../types';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<ReaderSettings>({
    fontSize: 17,
    theme: 'night',
    lineHeight: 1.7,
  });
  const [stats, setStats] = useState<ReadingStats>({
    booksStarted: 0,
    booksCompleted: 0,
    totalPagesRead: 0,
    totalTimeMinutes: 0,
    favoriteCategory: '',
  });
  const [cacheSize, setCacheSize] = useState(0);
  const [progressCount, setProgressCount] = useState(0);

  const loadData = useCallback(async () => {
    const [s, st, cs, prog] = await Promise.all([
      getSettings(),
      getStats(),
      getCacheSize(),
      getAllProgress(),
    ]);
    setSettings(s);
    setStats(st);
    setCacheSize(cs);
    setProgressCount(Object.keys(prog).length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const updateFontSize = async (delta: number) => {
    const newSize = Math.max(12, Math.min(28, settings.fontSize + delta));
    setSettings(prev => ({ ...prev, fontSize: newSize }));
    await saveSettings({ fontSize: newSize });
  };

  const updateTheme = async (theme: ReaderTheme) => {
    setSettings(prev => ({ ...prev, theme }));
    await saveSettings({ theme });
  };

  const updateLineHeight = async (delta: number) => {
    const newLH = Math.max(1.2, Math.min(2.2, settings.lineHeight + delta));
    const rounded = Math.round(newLH * 10) / 10;
    setSettings(prev => ({ ...prev, lineHeight: rounded }));
    await saveSettings({ lineHeight: rounded });
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Downloaded Books',
      'This will remove all downloaded book files. You can re-download them at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearCache();
            setCacheSize(0);
          },
        },
      ]
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Reading Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>READING STATISTICS</Text>
        <View style={[styles.card, shadows.card]}>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{progressCount}</Text>
              <Text style={styles.statLabel}>Books Opened</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.booksCompleted}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{books.length}</Text>
              <Text style={styles.statLabel}>In Collection</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statRowLabel}>Total pages read</Text>
            <Text style={styles.statRowValue}>{stats.totalPagesRead.toLocaleString()}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statRowLabel}>Cache size</Text>
            <Text style={styles.statRowValue}>{formatBytes(cacheSize)}</Text>
          </View>
        </View>
      </View>

      {/* Reader Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>READER</Text>
        <View style={[styles.card, shadows.card]}>
          {/* Font Size */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Font Size</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => updateFontSize(-1)}>
                <Text style={styles.stepperBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{settings.fontSize}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => updateFontSize(1)}>
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Line Height */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Line Spacing</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => updateLineHeight(-0.1)}>
                <Text style={styles.stepperBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{settings.lineHeight.toFixed(1)}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => updateLineHeight(0.1)}>
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Theme */}
          <View style={styles.settingColumn}>
            <Text style={styles.settingLabel}>Reading Theme</Text>
            <View style={styles.themeButtons}>
              {(['night', 'sepia', 'day'] as ReaderTheme[]).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.themeOption,
                    { backgroundColor: readerThemes[t].background },
                    settings.theme === t && styles.themeOptionActive,
                  ]}
                  onPress={() => updateTheme(t)}
                >
                  <Text style={[styles.themeText, { color: readerThemes[t].text }]}>
                    Aa
                  </Text>
                  <Text style={[styles.themeName, { color: readerThemes[t].text }]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Preview */}
        <View
          style={[
            styles.previewCard,
            { backgroundColor: readerThemes[settings.theme].background },
          ]}
        >
          <Text
            style={{
              fontFamily: 'Georgia',
              fontSize: settings.fontSize,
              lineHeight: settings.fontSize * settings.lineHeight,
              color: readerThemes[settings.theme].text,
            }}
          >
            The lips of wisdom are closed, except to the ears of Understanding.
          </Text>
          <Text
            style={[
              styles.previewAttribution,
              { color: readerThemes[settings.theme].accent },
            ]}
          >
            -- The Kybalion
          </Text>
        </View>
      </View>

      {/* Storage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>STORAGE</Text>
        <View style={[styles.card, shadows.card]}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Downloaded Books</Text>
              <Text style={styles.settingHint}>{formatBytes(cacheSize)} used</Text>
            </View>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleClearCache}>
              <Text style={styles.dangerBtnText}>Clear Cache</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={[styles.card, shadows.card]}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Pocket Alexandria</Text>
            <Text style={styles.aboutValue}>v1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Books in Collection</Text>
            <Text style={styles.aboutValue}>{books.length}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Source</Text>
            <Text style={styles.aboutValue}>Project Gutenberg & Sacred Texts</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          A curated collection of sacred, esoteric, and philosophical texts from the public domain.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    ...fonts.serifBold,
    fontSize: 28,
    color: colors.parchment,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    ...fonts.sansBold,
    fontSize: 12,
    color: colors.accent,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    ...fonts.serifBold,
    fontSize: 24,
    color: colors.accent,
  },
  statLabel: {
    ...fonts.sansLight,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statRowLabel: {
    ...fonts.sansRegular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  statRowValue: {
    ...fonts.sansBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingColumn: {
    paddingVertical: 4,
  },
  settingLabel: {
    ...fonts.sansRegular,
    fontSize: 15,
    color: colors.textPrimary,
  },
  settingHint: {
    ...fonts.sansLight,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    ...fonts.sansBold,
    fontSize: 18,
    color: colors.accent,
  },
  stepperValue: {
    ...fonts.sansBold,
    fontSize: 16,
    color: colors.textPrimary,
    width: 44,
    textAlign: 'center',
  },
  themeButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  themeOptionActive: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  themeText: {
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '700',
  },
  themeName: {
    ...fonts.sansRegular,
    fontSize: 11,
    marginTop: 4,
  },
  previewCard: {
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  previewAttribution: {
    ...fonts.serifItalic,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'right',
  },
  dangerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.error,
  },
  dangerBtnText: {
    ...fonts.sansBold,
    fontSize: 13,
    color: colors.error,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  aboutLabel: {
    ...fonts.sansRegular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  aboutValue: {
    ...fonts.sansBold,
    fontSize: 14,
    color: colors.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  footer: {
    ...fonts.sansLight,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
    paddingHorizontal: spacing.xl,
  },
});
