import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, fonts, spacing, borderRadius, shadows, readerThemes } from '../constants/theme';
import { getSettings, saveSettings, getStats, getAllProgress, resetOnboarding } from '../services/storage';
import { getCacheSize, clearCache, downloadBook } from '../services/bookDownloader';
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
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

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
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            await clearCache();
            setCacheSize(0);
          },
        },
      ]
    );
  };

  const handleDownloadAll = () => {
    Alert.alert(
      'Download All Books',
      'This will download all 156 texts for offline reading. This may take several minutes and use data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download All',
          onPress: async () => {
            setDownloadingAll(true);
            setDownloadProgress(0);
            let done = 0;
            for (const book of books) {
              try {
                await downloadBook(book);
              } catch {}
              done++;
              setDownloadProgress(done / books.length);
            }
            setDownloadingAll(false);
            const cs = await getCacheSize();
            setCacheSize(cs);
            Alert.alert('Downloads Complete', `${done} books are now available offline.`);
          },
        },
      ]
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will show the welcome screens again next time you open the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            await resetOnboarding();
            Alert.alert('Done', 'Onboarding will show again on next launch.');
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
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateFontSize(-1)}
              >
                <Text style={styles.stepperBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{settings.fontSize}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateFontSize(1)}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Line Height */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Line Spacing</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateLineHeight(-0.1)}
              >
                <Text style={styles.stepperBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{settings.lineHeight.toFixed(1)}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateLineHeight(0.1)}
              >
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

      {/* Download Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DOWNLOAD MANAGEMENT</Text>
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

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Download All Books</Text>
              <Text style={styles.settingHint}>Save all 156 texts for offline</Text>
            </View>
            {downloadingAll ? (
              <View style={styles.downloadProgress}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.downloadProgressText}>
                  {Math.round(downloadProgress * 100)}%
                </Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.actionBtn} onPress={handleDownloadAll}>
                <Text style={styles.actionBtnText}>Download</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* App */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>APP</Text>
        <View style={[styles.card, shadows.card]}>
          <TouchableOpacity style={styles.settingRow} onPress={handleResetOnboarding}>
            <Text style={styles.settingLabel}>Show Onboarding Again</Text>
            <Text style={styles.settingArrow}>{'\u203A'}</Text>
          </TouchableOpacity>
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
    paddingTop: 12,
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
    minHeight: 48,
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
  settingArrow: {
    fontSize: 22,
    color: colors.textMuted,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    width: 44,
    height: 44,
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
    minHeight: 52,
    justifyContent: 'center',
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
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'right',
  },
  dangerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.error,
    minHeight: 44,
    justifyContent: 'center',
  },
  dangerBtnText: {
    ...fonts.sansBold,
    fontSize: 13,
    color: colors.error,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.accent,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionBtnText: {
    ...fonts.sansBold,
    fontSize: 13,
    color: colors.accent,
  },
  downloadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadProgressText: {
    ...fonts.sansBold,
    fontSize: 13,
    color: colors.accent,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 44,
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
