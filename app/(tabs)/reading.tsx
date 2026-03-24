import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../src/constants/theme';
import { getBookById, categoryIcons } from '../../src/data/catalog';
import { getAllProgress, getBookmarks } from '../../src/services/storage';
import BookCover from '../../src/components/BookCover';
import BookListItem from '../../src/components/BookListItem';
import SectionHeader from '../../src/components/SectionHeader';
import { BookProgress, Bookmark, Book } from '../../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BookWithProgress {
  book: Book;
  progress: BookProgress;
}

export default function ReadingTab() {
  const router = useRouter();
  const [inProgress, setInProgress] = useState<BookWithProgress[]>([]);
  const [completed, setCompleted] = useState<BookWithProgress[]>([]);
  const [bookmarks, setBookmarks] = useState<(Bookmark & { bookTitle: string })[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [progressMap, allBookmarks] = await Promise.all([
      getAllProgress(),
      getBookmarks(),
    ]);

    const ip: BookWithProgress[] = [];
    const comp: BookWithProgress[] = [];

    for (const [id, progress] of Object.entries(progressMap)) {
      const book = getBookById(id);
      if (!book) continue;
      if (progress.percentComplete >= 95) {
        comp.push({ book, progress });
      } else if (progress.percentComplete > 0) {
        ip.push({ book, progress });
      }
    }

    ip.sort((a, b) =>
      new Date(b.progress.lastReadAt).getTime() - new Date(a.progress.lastReadAt).getTime()
    );
    comp.sort((a, b) =>
      new Date(b.progress.lastReadAt).getTime() - new Date(a.progress.lastReadAt).getTime()
    );

    setInProgress(ip);
    setCompleted(comp);

    const bmWithTitles = allBookmarks
      .map(bm => {
        const book = getBookById(bm.bookId);
        return { ...bm, bookTitle: book?.title || 'Unknown' };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setBookmarks(bmWithTitles);
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

  const openReader = (bookId: string) => {
    router.push(`/reader/${bookId}`);
  };

  const hasContent = inProgress.length > 0 || completed.length > 0 || bookmarks.length > 0;
  const totalRead = inProgress.length + completed.length;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={[]}
        keyExtractor={() => 'dummy'}
        renderItem={null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Reading</Text>
              <Text style={styles.headerSubtitle}>Your journey through the texts</Text>
            </View>

            {/* Reading stats strip */}
            {hasContent && (
              <View style={[styles.statsStrip, styles.cardDepth]}>
                <View style={styles.statsStripItem}>
                  <Text style={styles.statsStripNumber}>{inProgress.length}</Text>
                  <Text style={styles.statsStripLabel}>In Progress</Text>
                </View>
                <View style={styles.statsStripDivider} />
                <View style={styles.statsStripItem}>
                  <Text style={styles.statsStripNumber}>{completed.length}</Text>
                  <Text style={styles.statsStripLabel}>Completed</Text>
                </View>
                <View style={styles.statsStripDivider} />
                <View style={styles.statsStripItem}>
                  <Text style={styles.statsStripNumber}>{bookmarks.length}</Text>
                  <Text style={styles.statsStripLabel}>Bookmarks</Text>
                </View>
              </View>
            )}

            {!hasContent && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="book-outline" size={32} color={colors.accentDim} />
                </View>
                <Text style={styles.emptyTitle}>Begin Your Studies</Text>
                <Text style={styles.emptyText}>
                  Your reading progress, bookmarks, and completed works will appear here.
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => router.push('/(tabs)/browse')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emptyBtnText}>Browse Collection</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Currently reading as horizontal cards */}
            {inProgress.length > 0 && (
              <>
                <SectionHeader
                  title="Currently Reading"
                  subtitle={`${inProgress.length} texts`}
                  icon="play-circle-outline"
                />
                <FlatList
                  horizontal
                  data={inProgress}
                  keyExtractor={item => item.book.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.progressCards}
                  renderItem={({ item: { book, progress } }) => (
                    <TouchableOpacity
                      style={[styles.progressCard, styles.cardDepth, shadows.card]}
                      onPress={() => openReader(book.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.progressCardTop}>
                        <BookCover book={book} size="small" />
                        <View style={styles.progressCardInfo}>
                          <Text style={styles.progressCardTitle} numberOfLines={2}>{book.title}</Text>
                          <Text style={styles.progressCardAuthor} numberOfLines={1}>{book.author}</Text>
                          <Text style={styles.progressCardCategory}>
                            <Ionicons name="flame-outline" size={11} color={colors.textMuted} /> {book.category}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.progressCardBottom}>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width: `${progress.percentComplete}%` }]} />
                        </View>
                        <View style={styles.progressRow}>
                          <Text style={styles.progressPercent}>
                            {Math.round(progress.percentComplete)}% complete
                          </Text>
                          <Text style={styles.progressPage}>
                            Page {progress.currentPage + 1} of {progress.totalPages}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}

            {/* Bookmarks */}
            {bookmarks.length > 0 && (
              <>
                <SectionHeader
                  title="Bookmarks"
                  subtitle={`${bookmarks.length} saved`}
                  icon="bookmark-outline"
                />
                {bookmarks.slice(0, 10).map(bm => (
                  <TouchableOpacity
                    key={bm.id}
                    style={[styles.bookmarkCard, styles.cardDepth, shadows.card]}
                    onPress={() => openReader(bm.bookId)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.bookmarkLeft}>
                      <Text style={styles.bookmarkPageNumber}>{bm.page + 1}</Text>
                    </View>
                    <View style={styles.bookmarkInfo}>
                      <Text style={styles.bookmarkTitle}>{bm.bookTitle}</Text>
                      <Text style={styles.bookmarkLabel}>{bm.label}</Text>
                      <Text style={styles.bookmarkDate}>
                        {new Date(bm.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <>
                <SectionHeader
                  title="Completed"
                  subtitle={`${completed.length} texts mastered`}
                  icon="checkmark-circle-outline"
                />
                {completed.map(({ book }) => (
                  <BookListItem
                    key={book.id}
                    book={book}
                    progress={100}
                    onPress={() => openReader(book.id)}
                  />
                ))}
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitle: {
    ...fonts.serifBold,
    fontSize: 28,
    color: colors.parchment,
  },
  headerSubtitle: {
    ...fonts.sansRegular,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '300',
    marginTop: 4,
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xl,
    marginTop: 16,
    paddingVertical: 14,
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
  statsStripItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsStripNumber: {
    fontSize: 48,
    fontWeight: '200',
    letterSpacing: -2,
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  statsStripLabel: {
    ...fonts.sansLight,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '300',
    marginTop: 2,
  },
  statsStripDivider: {
    width: 1,
    backgroundColor: colors.divider,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
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
  progressCards: {
    paddingLeft: spacing.xl,
    paddingRight: spacing.sm,
  },
  progressCard: {
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginRight: spacing.md,
  },
  progressCardTop: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  progressCardInfo: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  progressCardTitle: {
    ...fonts.serifBold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  progressCardAuthor: {
    ...fonts.sansRegular,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '300',
    marginBottom: 6,
  },
  progressCardCategory: {
    ...fonts.sansLight,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '300',
  },
  progressCardBottom: {},
  progressTrack: {
    height: 4,
    backgroundColor: colors.surfaceBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressPercent: {
    ...fonts.sansBold,
    fontSize: 12,
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  progressPage: {
    ...fonts.sansLight,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  bookmarkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.md,
    minHeight: 56,
  },
  bookmarkLeft: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bookmarkPageNumber: {
    ...fonts.sansBold,
    fontSize: 13,
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkTitle: {
    ...fonts.serifBold,
    fontSize: 13,
    color: colors.accent,
  },
  bookmarkLabel: {
    ...fonts.sansRegular,
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 2,
  },
  bookmarkDate: {
    ...fonts.sansLight,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '300',
    marginTop: 2,
  },
});
