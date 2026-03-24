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
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius, readerThemes } from '../../src/constants/theme';
import { getBookById } from '../../src/data/catalog';
import { downloadBook, getBookText } from '../../src/services/bookDownloader';
import {
  getProgress,
  saveProgress,
  getSettings,
  saveSettings,
  addBookmark,
  getBookmarks,
  removeBookmark,
  getHighlights,
  addHighlight,
  removeHighlight,
} from '../../src/services/storage';
import { ReaderTheme, Bookmark, Highlight, BookProgress } from '../../src/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CHARS_PER_PAGE = 2400;

export default function ReaderPage() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const router = useRouter();
  const book = getBookById(bookId || '');

  const [text, setText] = useState<string | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fontSize, setFontSize] = useState(17);
  const [theme, setTheme] = useState<ReaderTheme>('night');
  const [lineHeight, setLineHeight] = useState(1.7);

  const [showControls, setShowControls] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const controlsOpacity = useRef(new Animated.Value(0)).current;
  const pageTransition = useRef(new Animated.Value(1)).current;

  // Swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          nextPage();
        } else if (gestureState.dx > 50) {
          prevPage();
        }
      },
    })
  ).current;

  useEffect(() => {
    (async () => {
      const settings = await getSettings();
      setFontSize(settings.fontSize);
      setTheme(settings.theme);
      setLineHeight(settings.lineHeight);
    })();
  }, []);

  useEffect(() => {
    if (!book) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let content = await getBookText(bookId || '');
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

  useEffect(() => {
    if (!text) return;
    const pgs: string[] = [];
    const adjustedChars = Math.round(CHARS_PER_PAGE * (17 / fontSize));
    let i = 0;
    while (i < text.length) {
      let end = Math.min(i + adjustedChars, text.length);
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
      i = end;
    }
    setPages(pgs);
  }, [text, fontSize]);

  useEffect(() => {
    if (pages.length === 0 || !bookId) return;
    (async () => {
      const progress = await getProgress(bookId);
      if (progress && progress.currentPage > 0 && progress.currentPage < pages.length) {
        setCurrentPage(progress.currentPage);
      }
    })();
  }, [pages.length, bookId]);

  useEffect(() => {
    if (!bookId) return;
    (async () => {
      const bm = await getBookmarks(bookId);
      setBookmarks(bm);
      setIsBookmarked(bm.some(b => b.page === currentPage));
    })();
  }, [bookId, showBookmarks, currentPage]);

  useEffect(() => {
    if (!bookId) return;
    (async () => {
      const hl = await getHighlights(bookId);
      setHighlights(hl);
    })();
  }, [bookId, showHighlights]);

  useEffect(() => {
    if (pages.length === 0 || !bookId) return;
    const progress: BookProgress = {
      bookId,
      currentPage,
      totalPages: pages.length,
      percentComplete: ((currentPage + 1) / pages.length) * 100,
      lastReadAt: new Date().toISOString(),
    };
    saveProgress(progress);
  }, [currentPage, pages.length, bookId]);

  const animatePageTransition = useCallback(() => {
    pageTransition.setValue(0.7);
    Animated.timing(pageTransition, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [pageTransition]);

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(0, Math.min(page, pages.length - 1));
      if (clamped !== currentPage) {
        animatePageTransition();
        setCurrentPage(clamped);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    },
    [pages.length, currentPage, animatePageTransition]
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
        toggleControls();
      }
    },
    [nextPage, prevPage]
  );

  const toggleControls = useCallback(() => {
    const newValue = !showControls;
    setShowControls(newValue);
    Animated.timing(controlsOpacity, {
      toValue: newValue ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showControls, controlsOpacity]);

  const handleBookmark = useCallback(async () => {
    if (!bookId) return;
    if (isBookmarked) {
      const existing = bookmarks.find(b => b.page === currentPage);
      if (existing) {
        await removeBookmark(existing.id);
      }
    } else {
      await addBookmark({ bookId, page: currentPage, label: `Page ${currentPage + 1}` });
    }
    const bm = await getBookmarks(bookId);
    setBookmarks(bm);
    setIsBookmarked(!isBookmarked);
  }, [bookId, currentPage, isBookmarked, bookmarks]);

  const handleHighlightPage = useCallback(async () => {
    if (!bookId || !pages[currentPage]) return;
    const previewText = pages[currentPage].slice(0, 150).replace(/\n/g, ' ').trim();
    await addHighlight({
      bookId,
      page: currentPage,
      text: previewText + '...',
      color: '#C9A96E',
    });
    const hl = await getHighlights(bookId);
    setHighlights(hl);
    Alert.alert('Highlighted', `Page ${currentPage + 1} has been highlighted.`);
  }, [bookId, currentPage, pages]);

  const handleFontSize = useCallback(
    async (delta: number) => {
      const newSize = Math.max(12, Math.min(28, fontSize + delta));
      setFontSize(newSize);
      await saveSettings({ fontSize: newSize });
    },
    [fontSize]
  );

  const handleThemeChange = useCallback(async (newTheme: ReaderTheme) => {
    setTheme(newTheme);
    await saveSettings({ theme: newTheme });
  }, []);

  const handleLineHeight = useCallback(
    async (delta: number) => {
      const newLH = Math.max(1.2, Math.min(2.2, lineHeight + delta));
      const rounded = Math.round(newLH * 10) / 10;
      setLineHeight(rounded);
      await saveSettings({ lineHeight: rounded });
    },
    [lineHeight]
  );

  const themeColors = readerThemes[theme];

  if (!book) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>Book not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
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
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
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
        {...panResponder.panHandlers}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.pageContent,
            { paddingTop: Platform.OS === 'ios' ? 70 : 50 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: pageTransition }}>
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
          </Animated.View>
        </ScrollView>
      </TouchableOpacity>

      {/* Progress bar at bottom */}
      <View style={[styles.bottomBar, { backgroundColor: themeColors.surface }]}>
        {/* Full width progress track */}
        <View style={styles.progressTrackFull}>
          <View
            style={[
              styles.progressFillFull,
              { width: `${progress}%`, backgroundColor: themeColors.accent },
            ]}
          />
        </View>
        <View style={styles.bottomInfo}>
          <Text style={[styles.pageNumber, { color: themeColors.text }]}>
            {currentPage + 1} of {pages.length}
          </Text>
          <Text style={[styles.percentText, { color: themeColors.accent }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      </View>

      {/* Tap zone indicators (subtle) */}
      {showControls && (
        <View style={styles.tapZones} pointerEvents="none">
          <View style={styles.tapZoneLeft}>
            <Text style={styles.tapZoneText}>{'\u25C0'}</Text>
          </View>
          <View style={styles.tapZoneCenter} />
          <View style={styles.tapZoneRight}>
            <Text style={styles.tapZoneText}>{'\u25B6'}</Text>
          </View>
        </View>
      )}

      {/* Controls overlay */}
      {showControls && (
        <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
          {/* Top bar */}
          <View style={[styles.topBar, { backgroundColor: colors.overlay }]}>
            <SafeAreaView edges={['top']} style={styles.topBarInner}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Text style={styles.backText}>{'\u2190'} Back</Text>
              </TouchableOpacity>
              <View style={styles.topTitle}>
                <Text style={styles.topTitleText} numberOfLines={1}>
                  {book.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleBookmark}
                style={styles.bookmarkButton}
              >
                <Text style={[styles.bookmarkIconText, isBookmarked && styles.bookmarkActive]}>
                  {isBookmarked ? '\u2605' : '\u2606'}
                </Text>
              </TouchableOpacity>
            </SafeAreaView>
          </View>

          {/* Bottom controls */}
          <View style={[styles.bottomControls, { backgroundColor: colors.overlay }]}>
            <SafeAreaView edges={['bottom']}>
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

              {/* Line height */}
              <View style={styles.controlRow}>
                <Text style={styles.controlLabel}>Spacing</Text>
                <View style={styles.controlButtons}>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => handleLineHeight(-0.1)}
                  >
                    <Text style={styles.controlBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.controlValue}>{lineHeight.toFixed(1)}</Text>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => handleLineHeight(0.1)}
                  >
                    <Text style={styles.controlBtnText}>+</Text>
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
                      <Text style={[styles.themeBtnText, { color: readerThemes[t].text }]}>
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
                  toggleControls();
                  setShowBookmarks(true);
                }}
              >
                <Text style={styles.controlLabel}>
                  {'\u2606'} Bookmarks ({bookmarks.length})
                </Text>
                <Text style={styles.bookmarkArrow}>{'\u203A'}</Text>
              </TouchableOpacity>

              {/* Highlights button */}
              <TouchableOpacity
                style={styles.bookmarksRow}
                onPress={handleHighlightPage}
              >
                <Text style={styles.controlLabel}>
                  {'\u270F'} Highlight This Page
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bookmarksRow}
                onPress={() => {
                  toggleControls();
                  setShowHighlights(true);
                }}
              >
                <Text style={styles.controlLabel}>
                  {'\u2726'} Highlights ({highlights.length})
                </Text>
                <Text style={styles.bookmarkArrow}>{'\u203A'}</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </Animated.View>
      )}

      {/* Bookmarks modal */}
      <Modal visible={showBookmarks} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bookmarks</Text>
              <TouchableOpacity
                onPress={() => setShowBookmarks(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalClose}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>
            {bookmarks.length === 0 ? (
              <View style={styles.emptyBookmarks}>
                <Text style={styles.emptyBookmarksIcon}>{'\u2606'}</Text>
                <Text style={styles.emptyBookmarksTitle}>No Bookmarks Yet</Text>
                <Text style={styles.emptyBookmarksText}>
                  Tap the star icon to bookmark the current page.
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
                    <View style={styles.bookmarkItemLeft}>
                      <Text style={styles.bookmarkItemPage}>{item.page + 1}</Text>
                    </View>
                    <View style={styles.bookmarkInfo}>
                      <Text style={styles.bookmarkLabel}>{item.label}</Text>
                      <Text style={styles.bookmarkDate}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeBookmark(item.id).then(() => {
                        getBookmarks(bookId).then(setBookmarks);
                      })}
                      style={styles.bookmarkDeleteBtn}
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
      {/* Highlights modal */}
      <Modal visible={showHighlights} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Highlights</Text>
              <TouchableOpacity
                onPress={() => setShowHighlights(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalClose}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>
            {highlights.length === 0 ? (
              <View style={styles.emptyBookmarks}>
                <Text style={styles.emptyBookmarksIcon}>{'\u2726'}</Text>
                <Text style={styles.emptyBookmarksTitle}>No Highlights Yet</Text>
                <Text style={styles.emptyBookmarksText}>
                  Use the highlight button in controls to save passages.
                </Text>
              </View>
            ) : (
              <FlatList
                data={highlights}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.bookmarkItem}
                    onPress={() => {
                      goToPage(item.page);
                      setShowHighlights(false);
                    }}
                  >
                    <View style={[styles.bookmarkItemLeft, { backgroundColor: 'rgba(201, 169, 110, 0.15)' }]}>
                      <Text style={styles.bookmarkItemPage}>{item.page + 1}</Text>
                    </View>
                    <View style={styles.bookmarkInfo}>
                      <Text style={styles.bookmarkLabel} numberOfLines={2}>{item.text}</Text>
                      <Text style={styles.bookmarkDate}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeHighlight(item.id).then(() => {
                        getHighlights(bookId).then(setHighlights);
                      })}
                      style={styles.bookmarkDeleteBtn}
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
  screen: { flex: 1 },
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
  errorIcon: { fontSize: 36, color: colors.error, marginBottom: 12 },
  errorText: {
    ...fonts.sansRegular,
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    minHeight: 48,
    justifyContent: 'center',
  },
  retryText: {
    ...fonts.sansBold,
    fontSize: 14,
    color: colors.accent,
  },
  pageArea: { flex: 1 },
  scrollView: { flex: 1 },
  pageContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: 80,
  },
  pageText: { fontFamily: 'Georgia' },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    paddingTop: 4,
    paddingHorizontal: spacing.xl,
  },
  progressTrackFull: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(128,128,128,0.15)',
    borderRadius: 1.5,
  },
  progressFillFull: {
    height: 3,
    borderRadius: 1.5,
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  pageNumber: {
    ...fonts.sansLight,
    fontSize: 12,
  },
  percentText: {
    ...fonts.sansBold,
    fontSize: 12,
  },

  // Tap zones (visual hints)
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  tapZoneLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.1,
  },
  tapZoneCenter: { flex: 1 },
  tapZoneRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.1,
  },
  tapZoneText: {
    fontSize: 24,
    color: colors.textMuted,
  },

  // Controls overlay
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    paddingBottom: 12,
    paddingHorizontal: spacing.lg,
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    ...fonts.sansBold,
    fontSize: 15,
    color: colors.accent,
  },
  topTitle: { flex: 1, marginHorizontal: 12 },
  topTitleText: {
    ...fonts.serifBold,
    fontSize: 15,
    color: colors.parchment,
    textAlign: 'center',
  },
  bookmarkButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkIconText: {
    fontSize: 24,
    color: colors.accent,
  },
  bookmarkActive: {
    color: colors.accent,
  },

  // Bottom controls
  bottomControls: {
    paddingTop: 16,
    paddingHorizontal: spacing.xl,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 48,
  },
  controlLabel: {
    ...fonts.sansRegular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  controlButtons: { flexDirection: 'row', alignItems: 'center' },
  controlBtn: {
    width: 44,
    height: 40,
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
    width: 44,
    textAlign: 'center',
  },
  themeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginLeft: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  themeBtnActive: { borderColor: colors.accent, borderWidth: 2 },
  themeBtnText: { ...fonts.sansBold, fontSize: 12 },
  bookmarksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: 4,
    minHeight: 48,
  },
  bookmarkArrow: {
    fontSize: 22,
    color: colors.textMuted,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.6,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceBorder,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
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
  modalCloseBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClose: { fontSize: 18, color: colors.textSecondary },
  emptyBookmarks: {
    padding: 40,
    alignItems: 'center',
  },
  emptyBookmarksIcon: {
    fontSize: 36,
    color: colors.accentDim,
    marginBottom: 12,
  },
  emptyBookmarksTitle: {
    ...fonts.serifBold,
    fontSize: 18,
    color: colors.parchment,
    marginBottom: 8,
  },
  emptyBookmarksText: {
    ...fonts.sansRegular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    minHeight: 56,
  },
  bookmarkItemLeft: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bookmarkItemPage: {
    ...fonts.sansBold,
    fontSize: 13,
    color: colors.accent,
  },
  bookmarkInfo: { flex: 1 },
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
  bookmarkDeleteBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkDelete: { fontSize: 14, color: colors.textMuted },
});
