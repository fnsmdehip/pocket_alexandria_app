import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';
import { books, getBookById } from '../data/catalog';
import { getAllProgress, getRecentBookIds, getLibraryBookIds } from '../services/storage';
import { isBookDownloaded } from '../services/bookDownloader';
import BookCover from '../components/BookCover';
import SectionHeader from '../components/SectionHeader';
import { RootStackParamList, BookProgress } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function LibraryScreen() {
  const navigation = useNavigation<NavProp>();
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, BookProgress>>({});
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [recent, progress, library] = await Promise.all([
      getRecentBookIds(),
      getAllProgress(),
      getLibraryBookIds(),
    ]);
    setRecentIds(recent);
    setProgressMap(progress);
    setDownloadedIds(new Set(library));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const recentBooks = recentIds
    .map(id => getBookById(id))
    .filter((b): b is NonNullable<typeof b> => b !== undefined);

  const continueReading = Object.entries(progressMap)
    .filter(([_, p]) => p.percentComplete > 0 && p.percentComplete < 95)
    .sort((a, b) => new Date(b[1].lastReadAt).getTime() - new Date(a[1].lastReadAt).getTime())
    .map(([id]) => getBookById(id))
    .filter((b): b is NonNullable<typeof b> => b !== undefined);

  const downloadedBooks = books.filter(b => downloadedIds.has(b.id));

  const openReader = (bookId: string) => {
    navigation.navigate('Reader', { bookId });
  };

  const renderHeader = () => (
    <View>
      {/* Hero */}
      <View style={styles.hero}>
        <Ionicons name="library" size={36} color={colors.accent} style={{ marginBottom: 8 }} />
        <Text style={styles.heroTitle}>Pocket Alexandria</Text>
        <Text style={styles.heroSubtitle}>Your personal ancient library</Text>
        <View style={styles.heroStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{downloadedIds.size}</Text>
            <Text style={styles.statLabel}>Downloaded</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{Object.keys(progressMap).length}</Text>
            <Text style={styles.statLabel}>Reading</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {Object.values(progressMap).filter(p => p.percentComplete >= 95).length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Continue Reading */}
      {continueReading.length > 0 && (
        <>
          <SectionHeader title="Continue Reading" icon="play-circle-outline" />
          <FlatList
            horizontal
            data={continueReading}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <BookCover
                book={item}
                progress={progressMap[item.id]?.percentComplete}
                size="medium"
                onPress={() => openReader(item.id)}
              />
            )}
          />
        </>
      )}

      {/* Recently Viewed */}
      {recentBooks.length > 0 && (
        <>
          <SectionHeader title="Recently Viewed" icon="time-outline" />
          <FlatList
            horizontal
            data={recentBooks.slice(0, 10)}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <BookCover
                book={item}
                progress={progressMap[item.id]?.percentComplete}
                size="small"
                onPress={() => openReader(item.id)}
              />
            )}
          />
        </>
      )}

      {/* Downloaded Library */}
      {downloadedBooks.length > 0 && (
        <SectionHeader
          title="Your Library"
          subtitle={`${downloadedBooks.length} books`}
          icon="star-outline"
        />
      )}

      {downloadedBooks.length === 0 && recentBooks.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="library" size={48} color={colors.accentDim} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>Welcome, Seeker</Text>
          <Text style={styles.emptyText}>
            Your library is empty. Browse the collection and begin your journey through the wisdom of the ages.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={downloadedBooks}
        keyExtractor={item => item.id}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        renderItem={({ item }) => (
          <BookCover
            book={item}
            progress={progressMap[item.id]?.percentComplete}
            size="small"
            onPress={() => openReader(item.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  heroIcon: {
    fontSize: 36,
    color: colors.accent,
    marginBottom: 8,
  },
  heroTitle: {
    ...fonts.serifBold,
    fontSize: 26,
    color: colors.parchment,
    letterSpacing: 1,
  },
  heroSubtitle: {
    ...fonts.sansLight,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statNumber: {
    fontSize: 48,
    fontWeight: '200',
    letterSpacing: -2,
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...fonts.sansLight,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.divider,
  },
  horizontalList: {
    paddingLeft: spacing.xl,
    paddingRight: spacing.sm,
  },
  grid: {
    paddingBottom: 100,
  },
  gridRow: {
    paddingHorizontal: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    color: colors.accentDim,
    marginBottom: 16,
  },
  emptyTitle: {
    ...fonts.serifBold,
    fontSize: 22,
    color: colors.parchment,
    marginBottom: 8,
  },
  emptyText: {
    ...fonts.sansRegular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
