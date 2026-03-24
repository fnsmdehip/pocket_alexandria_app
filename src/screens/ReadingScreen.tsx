import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../constants/theme';
import { getBookById } from '../data/catalog';
import { getAllProgress, getBookmarks } from '../services/storage';
import BookListItem from '../components/BookListItem';
import SectionHeader from '../components/SectionHeader';
import { RootStackParamList, BookProgress, Bookmark, Book } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface BookWithProgress {
  book: Book;
  progress: BookProgress;
}

export default function ReadingScreen() {
  const navigation = useNavigation<NavProp>();
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
    navigation.navigate('Reader', { bookId });
  };

  const hasContent = inProgress.length > 0 || completed.length > 0 || bookmarks.length > 0;

  return (
    <View style={styles.screen}>
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

            {!hasContent && (
              <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={48} color={colors.accentDim} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>Begin Your Studies</Text>
                <Text style={styles.emptyText}>
                  Your reading progress, bookmarks, and completed works will appear here.
                </Text>
              </View>
            )}

            {/* Currently Reading */}
            {inProgress.length > 0 && (
              <>
                <SectionHeader
                  title="Currently Reading"
                  subtitle={`${inProgress.length} texts`}
                  icon="play-circle-outline"
                />
                {inProgress.map(({ book, progress }) => (
                  <BookListItem
                    key={book.id}
                    book={book}
                    progress={progress.percentComplete}
                    onPress={() => openReader(book.id)}
                  />
                ))}
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
                  <View key={bm.id} style={[styles.bookmarkCard, shadows.card]}>
                    <Text style={styles.bookmarkTitle}>{bm.bookTitle}</Text>
                    <Text style={styles.bookmarkLabel}>{bm.label}</Text>
                    <Text style={styles.bookmarkDate}>
                      {new Date(bm.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
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
                {completed.map(({ book, progress }) => (
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
    </View>
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
    paddingTop: 16,
    paddingBottom: 8,
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
    marginTop: 4,
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
  bookmarkCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.15)',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    shadowColor: 'rgba(0,0,0,0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookmarkTitle: {
    ...fonts.serifBold,
    fontSize: 14,
    color: colors.accent,
  },
  bookmarkLabel: {
    ...fonts.sansRegular,
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 4,
  },
  bookmarkDate: {
    ...fonts.sansLight,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});
