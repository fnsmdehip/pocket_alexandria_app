import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../src/constants/theme';
import { books, getBookById, categories, categoryIcons, getBooksByCategory } from '../../src/data/catalog';
import { getAllProgress, getRecentBookIds, getLibraryBookIds } from '../../src/services/storage';
import BookCover from '../../src/components/BookCover';
import SectionHeader from '../../src/components/SectionHeader';
import DailyQuoteCard from '../../src/components/DailyQuote';
import { BookProgress, Book } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LibraryTab() {
  const router = useRouter();
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
    .filter((b): b is Book => b !== undefined);

  const continueReading = Object.entries(progressMap)
    .filter(([_, p]) => p.percentComplete > 0 && p.percentComplete < 95)
    .sort((a, b) => new Date(b[1].lastReadAt).getTime() - new Date(a[1].lastReadAt).getTime())
    .map(([id]) => getBookById(id))
    .filter((b): b is Book => b !== undefined);

  const downloadedBooks = books.filter(b => downloadedIds.has(b.id));

  const completedCount = Object.values(progressMap).filter(p => p.percentComplete >= 95).length;
  const readingCount = Object.values(progressMap).filter(p => p.percentComplete > 0 && p.percentComplete < 95).length;
  const totalPagesRead = Object.values(progressMap).reduce((sum, p) => sum + p.currentPage, 0);

  // Pick featured collections from 3 random categories
  const featuredCategories = (categories as unknown as string[]).slice(0, 3);

  const openReader = (bookId: string) => {
    router.push(`/reader/${bookId}`);
  };

  const renderHeader = () => (
    <View>
      {/* Hero section */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreeting}>
              {getGreeting()}
            </Text>
            <Text style={styles.heroTitle}>Your Library</Text>
          </View>
          <View style={styles.heroIconWrap}>
            <Ionicons name="library" size={24} color={colors.accent} />
          </View>
        </View>

        {/* Stats cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.cardDepth]}>
            <Ionicons name="book-outline" size={16} color={colors.accent} style={{ marginBottom: 4 }} />
            <Text style={styles.statNumber}>{downloadedIds.size}</Text>
            <Text style={styles.statLabel}>Books</Text>
          </View>
          <View style={[styles.statCard, styles.cardDepth]}>
            <Ionicons name="play-outline" size={16} color={colors.accent} style={{ marginBottom: 4 }} />
            <Text style={styles.statNumber}>{readingCount}</Text>
            <Text style={styles.statLabel}>Reading</Text>
          </View>
          <View style={[styles.statCard, styles.cardDepth]}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.accent} style={{ marginBottom: 4 }} />
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>Finished</Text>
          </View>
          <View style={[styles.statCard, styles.cardDepth]}>
            <Ionicons name="document-text-outline" size={16} color={colors.accent} style={{ marginBottom: 4 }} />
            <Text style={styles.statNumber}>{totalPagesRead}</Text>
            <Text style={styles.statLabel}>Pages</Text>
          </View>
        </View>
      </View>

      {/* Daily Wisdom Quote */}
      <DailyQuoteCard onPress={(bookId) => openReader(bookId)} />

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
              <TouchableOpacity
                style={[styles.continueCard, styles.cardDepth, shadows.card]}
                onPress={() => openReader(item.id)}
                activeOpacity={0.7}
              >
                <BookCover
                  book={item}
                  progress={progressMap[item.id]?.percentComplete}
                  size="small"
                />
                <View style={styles.continueInfo}>
                  <Text style={styles.continueTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.continueAuthor} numberOfLines={1}>{item.author}</Text>
                  <View style={styles.continueProgress}>
                    <View style={styles.continueProgressTrack}>
                      <View
                        style={[
                          styles.continueProgressFill,
                          { width: `${progressMap[item.id]?.percentComplete || 0}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.continuePercent}>
                      {Math.round(progressMap[item.id]?.percentComplete || 0)}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
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

      {/* Featured collections for discovery */}
      {continueReading.length === 0 && recentBooks.length === 0 && downloadedBooks.length === 0 && (
        <>
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="library" size={48} color={colors.accentDim} />
              <View style={styles.emptyIconRing} />
            </View>
            <Text style={styles.emptyTitle}>Welcome, Seeker</Text>
            <Text style={styles.emptyText}>
              Your personal library awaits. Browse the collection and begin your journey through the wisdom of the ages.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(tabs)/browse')}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyBtnText}>Browse Collection</Text>
            </TouchableOpacity>
          </View>

          {/* Show a preview from each category */}
          {featuredCategories.map(cat => {
            const catBooks = getBooksByCategory(cat).slice(0, 5);
            return (
              <View key={cat}>
                <SectionHeader title={cat} icon="sparkles-outline" />
                <FlatList
                  horizontal
                  data={catBooks}
                  keyExtractor={item => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({ item }) => (
                    <BookCover
                      book={item}
                      size="small"
                      onPress={() => openReader(item.id)}
                    />
                  )}
                />
              </View>
            );
          })}
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
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={downloadedBooks}
        keyExtractor={item => item.id}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={downloadedBooks.length > 0 ? styles.gridRow : undefined}
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
    </SafeAreaView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroGreeting: {
    ...fonts.sansRegular,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '300',
    marginBottom: 2,
  },
  heroTitle: {
    ...fonts.serifBold,
    fontSize: 28,
    color: colors.parchment,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.25)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
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
  statNumber: {
    fontSize: 48,
    fontWeight: '200',
    letterSpacing: -2,
    color: colors.parchment,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...fonts.sansLight,
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '300',
    marginTop: 2,
  },
  horizontalList: {
    paddingLeft: spacing.xl,
    paddingRight: spacing.sm,
  },
  continueCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 10,
    marginRight: spacing.md,
    width: SCREEN_WIDTH * 0.75,
  },
  continueInfo: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  continueTitle: {
    ...fonts.serifBold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  continueAuthor: {
    ...fonts.sansRegular,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '300',
    marginBottom: 8,
  },
  continueProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueProgressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: colors.surfaceBorder,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  continueProgressFill: {
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 1.5,
  },
  continuePercent: {
    ...fonts.sansBold,
    fontSize: 11,
    color: colors.accent,
    marginLeft: 8,
    fontVariant: ['tabular-nums'],
  },
  grid: {
    paddingBottom: 100,
  },
  gridRow: {
    paddingHorizontal: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.15)',
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
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingHorizontal: 28,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  emptyBtnText: {
    ...fonts.sansBold,
    fontSize: 15,
    color: colors.background,
  },
});
