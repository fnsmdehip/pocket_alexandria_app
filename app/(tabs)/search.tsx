import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius, shadows } from '../../src/constants/theme';
import { books, categoryIcons } from '../../src/data/catalog';
import { getBookText } from '../../src/services/bookDownloader';
import { getRecentSearches, addRecentSearch, clearRecentSearches } from '../../src/services/storage';
import { Book } from '../../src/types';

interface SearchResult {
  book: Book;
  matchType: 'title' | 'author' | 'description' | 'content';
  snippet?: string;
}

const SUGGESTION_TERMS = [
  'Hermes', 'Stoicism', 'Alchemy', 'Plato', 'Soul', 'Wisdom',
  'Buddha', 'Tao', 'Kabbalah', 'Nietzsche', 'Jung', 'Yoga',
];

export default function SearchTab() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    const recent = await getRecentSearches();
    setRecentSearches(recent);
  };

  const performSearch = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setSearching(true);
      setHasSearched(true);

      await addRecentSearch(q.trim());
      loadRecentSearches();

      const searchResults: SearchResult[] = [];
      const lq = q.toLowerCase();

      for (const book of books) {
        if (book.title.toLowerCase().includes(lq)) {
          searchResults.push({ book, matchType: 'title' });
        } else if (book.author.toLowerCase().includes(lq)) {
          searchResults.push({ book, matchType: 'author' });
        } else if (book.description.toLowerCase().includes(lq)) {
          searchResults.push({ book, matchType: 'description' });
        }
      }

      // Full-text search in downloaded books
      const contentResults: SearchResult[] = [];
      const alreadyFound = new Set(searchResults.map(r => r.book.id));

      for (const book of books) {
        if (alreadyFound.has(book.id)) continue;
        try {
          const text = await getBookText(book.id);
          if (text) {
            const idx = text.toLowerCase().indexOf(lq);
            if (idx !== -1) {
              const start = Math.max(0, idx - 80);
              const end = Math.min(text.length, idx + q.length + 80);
              let snippet = text.slice(start, end).replace(/\n/g, ' ');
              if (start > 0) snippet = '...' + snippet;
              if (end < text.length) snippet = snippet + '...';
              contentResults.push({ book, matchType: 'content', snippet });
            }
          }
        } catch {}
      }

      setResults([...searchResults, ...contentResults]);
      setSearching(false);
    },
    []
  );

  const handleQueryChange = (text: string) => {
    setQuery(text);
    // Debounce for metadata search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        // Quick metadata-only search while typing
        const lq = text.toLowerCase();
        const quick: SearchResult[] = [];
        for (const book of books) {
          if (book.title.toLowerCase().includes(lq)) {
            quick.push({ book, matchType: 'title' });
          } else if (book.author.toLowerCase().includes(lq)) {
            quick.push({ book, matchType: 'author' });
          }
          if (quick.length >= 10) break;
        }
        if (quick.length > 0) {
          setResults(quick);
          setHasSearched(true);
        }
      }, 300);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  };

  const openReader = (bookId: string) => {
    router.push(`/reader/${bookId}`);
  };

  const handleClearRecent = async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  };

  const matchTypeBadge = (type: SearchResult['matchType']) => {
    const labels = { title: 'Title', author: 'Author', description: 'Desc', content: 'In Text' };
    return labels[type];
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Text style={styles.emptyIcon}>{'\u2315'}</Text>
      </View>
      <Text style={styles.emptyTitle}>Search the Library</Text>
      <Text style={styles.emptyText}>
        Search across 156 texts by title, author, or content within downloaded books.
      </Text>

      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={handleClearRecent} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map(term => (
            <TouchableOpacity
              key={term}
              style={styles.recentItem}
              onPress={() => { setQuery(term); performSearch(term); }}
            >
              <Text style={styles.recentItemIcon}>{'\u231A'}</Text>
              <Text style={styles.recentItemText}>{term}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Suggestion chips */}
      <View style={styles.suggestions}>
        <Text style={styles.suggestionsTitle}>Try searching:</Text>
        <View style={styles.chipGrid}>
          {SUGGESTION_TERMS.map(term => (
            <TouchableOpacity
              key={term}
              style={styles.suggestionChip}
              onPress={() => { setQuery(term); performSearch(term); }}
            >
              <Text style={styles.suggestionText}>{term}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>{'\u2315'}</Text>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder=""
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={handleQueryChange}
            onSubmitEditing={() => performSearch(query)}
            returnKeyType="search"
            autoCorrect={false}
            selectionColor={colors.accent}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}
              style={styles.clearSearchBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.clearText}>{'\u2715'}</Text>
            </TouchableOpacity>
          )}
        </View>
        {query.length > 0 && (
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => { Keyboard.dismiss(); performSearch(query); }}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        )}
      </View>

      {searching ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Searching the archives...</Text>
        </View>
      ) : hasSearched && results.length === 0 ? (
        <View style={styles.noResults}>
          <Text style={styles.noResultsIcon}>{'\u2315'}</Text>
          <Text style={styles.noResultsTitle}>No Results</Text>
          <Text style={styles.noResultsText}>
            Try different keywords or browse the collection.
          </Text>
        </View>
      ) : !hasSearched ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.book.id}-${index}`}
          contentContainerStyle={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.resultCard, shadows.card]}
              onPress={() => openReader(item.book.id)}
              activeOpacity={0.7}
            >
              <View style={styles.resultHeader}>
                <View style={styles.resultIconWrap}>
                  <Text style={styles.resultIcon}>
                    {categoryIcons[item.book.category] || '\u2726'}
                  </Text>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle} numberOfLines={1}>{item.book.title}</Text>
                  <Text style={styles.resultAuthor} numberOfLines={1}>{item.book.author}</Text>
                </View>
                <View style={styles.matchBadge}>
                  <Text style={styles.matchBadgeText}>{matchTypeBadge(item.matchType)}</Text>
                </View>
              </View>
              {item.snippet && (
                <Text style={styles.snippet} numberOfLines={3}>{item.snippet}</Text>
              )}
              <Text style={styles.resultMeta}>
                {item.book.category} {'\u00B7'} {item.book.year < 0 ? `${Math.abs(item.book.year)} BCE` : item.book.year}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: { fontSize: 18, color: colors.textMuted, marginRight: 8 },
  searchInput: {
    flex: 1,
    ...fonts.sansRegular,
    fontSize: 15,
    color: colors.textPrimary,
    height: 48,
  },
  clearSearchBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: { fontSize: 14, color: colors.textMuted },
  searchButton: {
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  searchButtonText: { ...fonts.sansBold, fontSize: 14, color: colors.background },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...fonts.sansRegular, fontSize: 14, color: colors.textSecondary, marginTop: 12 },
  noResults: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  noResultsIcon: { fontSize: 48, color: colors.accentDim, marginBottom: 16 },
  noResultsTitle: { ...fonts.serifBold, fontSize: 22, color: colors.parchment, marginBottom: 8 },
  noResultsText: { ...fonts.sansRegular, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  emptyState: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 40,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  emptyIcon: { fontSize: 28, color: colors.accent },
  emptyTitle: { ...fonts.serifBold, fontSize: 22, color: colors.parchment, textAlign: 'center', marginBottom: 8 },
  emptyText: { ...fonts.sansRegular, fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  recentSection: {
    marginTop: 28,
    width: '100%',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentTitle: {
    ...fonts.sansBold,
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  clearBtn: {
    padding: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  clearBtnText: {
    ...fonts.sansRegular,
    fontSize: 13,
    color: colors.accent,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    minHeight: 44,
  },
  recentItemIcon: {
    fontSize: 14,
    color: colors.textMuted,
    marginRight: 12,
  },
  recentItemText: {
    ...fonts.sansRegular,
    fontSize: 15,
    color: colors.textPrimary,
  },
  suggestions: {
    marginTop: 28,
    width: '100%',
  },
  suggestionsTitle: {
    ...fonts.sansBold,
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  suggestionText: { ...fonts.sansRegular, fontSize: 14, color: colors.accent },
  resultsList: { paddingBottom: 100 },
  resultsCount: {
    ...fonts.sansRegular,
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center' },
  resultIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  resultIcon: { fontSize: 18, color: colors.accent },
  resultInfo: { flex: 1 },
  resultTitle: { ...fonts.serifBold, fontSize: 15, color: colors.textPrimary },
  resultAuthor: { ...fonts.sansRegular, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  matchBadge: {
    backgroundColor: colors.accentGlow,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  matchBadgeText: { ...fonts.sansBold, fontSize: 10, color: colors.accent },
  snippet: {
    ...fonts.sansRegular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  resultMeta: { ...fonts.sansLight, fontSize: 11, color: colors.textMuted, marginTop: 8 },
});
