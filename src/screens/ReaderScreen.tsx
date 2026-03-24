import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  PanResponder,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { colors, fonts, spacing, borderRadius, shadows } from '../constants/theme';
import { readerThemes } from '../constants/theme';
import { getBookById } from '../data/catalog';
import { downloadBook, getBookText } from '../services/bookDownloader';
import { getProgress, saveProgress, getSettings, saveSettings, addBookmark, getBookmarks, removeBookmark } from '../services/storage';
import { RootStackParamList, ReaderTheme, Bookmark, BookProgress } from '../types';

type ReaderRoute = RouteProp<RootStackParamList, 'Reader'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CHARS_PER_PAGE = 2400;

export default function ReaderScreen() {
  const route = useRoute<ReaderRoute>();
  const navigation = useNavigation();
  const { bookId } = route.params;
  const book = getBookById(bookId);

  const [text, setText] = useState<string | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reader settings
  const [fontSize, setFontSize] = useState(17);
  const [theme, setTheme] = useState<ReaderTheme>('night');
  const [lineHeight, setLineHeight] = useState(1.7);

  // UI state
  const [showControls, setShowControls] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const scrollRef = useRef<ScrollView>(null);

  // Load settings
  useEffect(() => {
    (async () => {
      const settings = await getSettings();
      setFontSize(settings.fontSize);
      setTheme(settings.theme);
      setLineHeight(settings.lineHeight);
    })();
  }, []);

  // Load book text
  useEffect(() => {
    if (!book) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let content = await getBookText(bookId);
        if (!content) {
          setDownloading(true);
          content = await downloadBook(book);
          setDownloading(false);
        }
        setText(content);
      } catch (err: any) {
        setError(err.message || 'Failed to load book');
      } finally {
        setLoading(false);
      }
    })();
  }, [bookId, book]);

  // Paginate text
  useEffect(() => {
    if (!text) return;
    const pgs: string[] = [];
    // Adjust chars per page based on font size
    const adjustedChars = Math.round(CHARS_PER_PAGE * (17 / fontSize));
    for (let i = 0; i < text.length; i += adjustedChars) {
      let end = Math.min(i + adjustedChars, text.length);
      // Try to break at paragraph or sentence
      if (end < text.length) {
        const paragraphBreak = text.lastIndexOf('\n\n', end);
        if (paragraphBreak > i + adjustedChars * 0.7) {
          end = paragraphBreak + 2;
        } else {
          const sentenceBreak = text.lastIndexOf('. ', end);
          if (sentenceBreak > i + adjustedChars * 0.7) {
            end = sentenceBreak + 2;
          }
        }
      }
      pgs.push(text.slice(i, end));
      if (end !== i + adjustedChars) i = end - adjustedChars; // Adjust to new position
    }
    setPages(pgs);
  }, [text, fontSize]);

  // Restore reading position
  useEffect(() => {
    if (pages.length === 0) return;
    (async () => {
      const progress = await getProgress(bookId);
      if (progress && progress.currentPage > 0 && progress.currentPage < pages.length) {
        setCurrentPage(progress.currentPage);
      }
    })();
  }, [pages.length, bookId]);

  // Load bookmarks
  useEffect(() => {
    (async () => {
      const bm = await getBookmarks(bookId);
      setBookmarks(bm);
    })();
  }, [bookId, showBookmarks]);

  // Save progress on page change
  useEffect(() => {
    if (pages.length === 0) return;
    const progress: BookProgress = {
      bookId,
      currentPage,
      totalPages: pages.length,
      percentComplete: ((currentPage + 1) / pages.length) * 100,
      lastReadAt: new Date().toISOString(),
    };
    saveProgress(progress);
  }, [currentPage, pages.length, bookId]);

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(0, Math.min(page, pages.length - 1));
      setCurrentPage(clamped);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    },
    [pages.length]
  );

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  const handleTap = useCallback(
    (x: number) => {
      const third = SCREEN_WIDTH / 3;
      if (x < third) {
        prevPage();
      } else if (x > third * 2) {
        nextPage();
      } else {
        setShowControls(prev => !prev);
      }
    },
    [nextPage, prevPage]
  );

  const handleBookmark = useCallback(async () => {
    await addBookmark({
      bookId,
      page: currentPage,
      label: `Page ${currentPage + 1}`,
    });
    const bm = await getBookmarks(bookId);
    setBookmarks(bm);
    Alert.alert('Bookmarked', `Page ${currentPage + 1} has been bookmarked.`);
  }, [bookId, currentPage]);

  const handleFontSize = useCallback(
    async (delta: number) => {
      const newSize = Math.max(12, Math.min(28, fontSize + delta));
      setFontSize(newSize);
      await saveSettings({ fontSize: newSize });
    },
    [fontSize]
  );

  const handleThemeChange = useCallback(
    async (newTheme: ReaderTheme) => {
      setTheme(newTheme);
      await saveSettings({ theme: newTheme });
    },
    []
  );

  const themeColors = readerThemes[theme];

  if (!book) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>Book not found</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>
          {downloading ? 'Downloading from the archives...' : 'Loading...'}
        </Text>
        <Text style={styles.loadingSubtext}>{book.title}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.errorIcon}>{'\u26A0'}</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = pages.length > 0 ? ((currentPage + 1) / pages.length) * 100 : 0;

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background }]}>
      {/* Page content */}
      <TouchableOpacity
        activeOpacity={1}
        style={styles.pageArea}
        onPress={(e) => handleTap(e.nativeEvent.locationX)}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={[
              styles.pageText,
              {
                color: themeColors.text,
                fontSize,
                lineHeight: fontSize * lineHeight,
              },
            ]}
          >
            {pages[currentPage] || ''}
          </Text>
        </ScrollView>
      </TouchableOpacity>

      {/* Page indicator */}
      <View style={[styles.pageIndicator, { backgroundColor: themeColors.surface }]}>
        <Text style={[styles.pageNumber, { color: themeColors.text }]}>
          {currentPage + 1} / {pages.length}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${progress}%`, backgroundColor: themeColors.accent }]}
          />
        </View>
      </View>

      {/* Controls overlay */}
      {showControls && (
        <View style={styles.controlsOverlay}>
          {/* Top bar */}
          <View style={[styles.topBar, { backgroundColor: colors.overlay }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>{'\u2190'} Back</Text>
            </TouchableOpacity>
            <View style={styles.topTitle}>
              <Text style={styles.topTitleText} numberOfLines={1}>
                {book.title}
              </Text>
            </View>
            <TouchableOpacity onPress={handleBookmark} style={styles.bookmarkButton}>
              <Text style={styles.bookmarkIcon}>{'\u2606'}</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom controls */}
          <View style={[styles.bottomBar, { backgroundColor: colors.overlay }]}>
            {/* Font size */}
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Font Size</Text>
              <View style={styles.controlButtons}>
                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={() => handleFontSize(-1)}
                >
                  <Text style={styles.controlBtnText}>A-</Text>
                </TouchableOpacity>
                <Text style={styles.controlValue}>{fontSize}</Text>
                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={() => handleFontSize(1)}
                >
                  <Text style={styles.controlBtnText}>A+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Theme */}
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Theme</Text>
              <View style={styles.controlButtons}>
                {(['night', 'sepia', 'day'] as ReaderTheme[]).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.themeBtn,
                      { backgroundColor: readerThemes[t].background },
                      theme === t && styles.themeBtnActive,
                    ]}
                    onPress={() => handleThemeChange(t)}
                  >
                    <Text
                      style={[styles.themeBtnText, { color: readerThemes[t].text }]}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bookmarks button */}
            <TouchableOpacity
              style={styles.bookmarksRow}
              onPress={() => {
                setShowControls(false);
                setShowBookmarks(true);
              }}
            >
              <Text style={styles.controlLabel}>
                {'\u2606'} Bookmarks ({bookmarks.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bookmarks modal */}
      <Modal visible={showBookmarks} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bookmarks</Text>
              <TouchableOpacity onPress={() => setShowBookmarks(false)}>
                <Text style={styles.modalClose}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>
            {bookmarks.length === 0 ? (
              <View style={styles.emptyBookmarks}>
                <Text style={styles.emptyBookmarksText}>No bookmarks yet</Text>
                <Text style={styles.emptyBookmarksHint}>
                  Tap the star icon while reading to add one
                </Text>
              </View>
            ) : (
              <FlatList
                data={bookmarks}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.bookmarkItem}
                    onPress={() => {
                      goToPage(item.page);
                      setShowBookmarks(false);
                    }}
                  >
                    <View style={styles.bookmarkInfo}>
                      <Text style={styles.bookmarkLabel}>{item.label}</Text>
                      <Text style={styles.bookmarkDate}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeBookmark(item.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.bookmarkDelete}>{'\u2715'}</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    ...fonts.serifRegular,
    fontSize: 16,
    color: colors.parchment,
    marginTop: 16,
  },
  loadingSubtext: {
    ...fonts.sansLight,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  errorIcon: {
    fontSize: 36,
    color: colors.error,
    marginBottom: 12,
  },
  errorText: {
    ...fonts.sansRegular,
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  retryText: {
    ...fonts.sansBold,
    fontSize: 14,
    color: colors.accent,
  },
  pageArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl + 20,
    paddingBottom: 60,
  },
  pageText: {
    fontFamily: 'Georgia',
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 34,
    paddingTop: 8,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  pageNumber: {
    ...fonts.sansLight,
    fontSize: 12,
    marginBottom: 4,
  },
  progressTrack: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 1,
  },
  progressFill: {
    height: 2,
    borderRadius: 1,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingBottom: 12,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    ...fonts.sansBold,
    fontSize: 15,
    color: colors.accent,
  },
  topTitle: {
    flex: 1,
    marginHorizontal: 12,
  },
  topTitleText: {
    ...fonts.serifBold,
    fontSize: 15,
    color: colors.parchment,
    textAlign: 'center',
  },
  bookmarkButton: {
    padding: 8,
  },
  bookmarkIcon: {
    fontSize: 24,
    color: colors.accent,
  },
  bottomBar: {
    paddingBottom: 40,
    paddingTop: 16,
    paddingHorizontal: spacing.xl,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  controlLabel: {
    ...fonts.sansRegular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtn: {
    width: 40,
    height: 36,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnText: {
    ...fonts.sansBold,
    fontSize: 14,
    color: colors.accent,
  },
  controlValue: {
    ...fonts.sansBold,
    fontSize: 16,
    color: colors.textPrimary,
    width: 40,
    textAlign: 'center',
  },
  themeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginLeft: 8,
  },
  themeBtnActive: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  themeBtnText: {
    ...fonts.sansBold,
    fontSize: 12,
  },
  bookmarksRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.6,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    ...fonts.serifBold,
    fontSize: 20,
    color: colors.parchment,
  },
  modalClose: {
    fontSize: 18,
    color: colors.textSecondary,
    padding: 4,
  },
  emptyBookmarks: {
    padding: 40,
    alignItems: 'center',
  },
  emptyBookmarksText: {
    ...fonts.sansRegular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  emptyBookmarksHint: {
    ...fonts.sansLight,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkLabel: {
    ...fonts.sansRegular,
    fontSize: 15,
    color: colors.textPrimary,
  },
  bookmarkDate: {
    ...fonts.sansLight,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  bookmarkDelete: {
    fontSize: 14,
    color: colors.textMuted,
    padding: 8,
  },
});
