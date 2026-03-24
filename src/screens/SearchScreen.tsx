import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts, spacing, borderRadius, shadows } from '../constants/theme';
import { searchBooks as searchCatalog, books, categoryIcons } from '../data/catalog';
import { getBookText } from '../services/bookDownloader';
import BookListItem from '../components/BookListItem';
import { RootStackParamList, Book } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface SearchResult {
  book: Book;
  matchType: 'title' | 'author' | 'description' | 'content';
  snippet?: string;
}

export default function SearchScreen() {
  const navigation = useNavigation<NavProp>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const performSearch = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setSearching(true);
      setHasSearched(true);

      const searchResults: SearchResult[] = [];
      const lq = q.toLowerCase();

      // Search catalog metadata first (fast)
      for (const book of books) {
        if (book.title.toLowerCase().includes(lq)) {
          searchResults.push({ book, matchType: 'title' });
        } else if (book.author.toLowerCase().includes(lq)) {
          searchResults.push({ book, matchType: 'author' });
        } else if (book.description.toLowerCase().includes(lq)) {
          searchResults.push({ book, matchType: 'description' });
        }
      }

      // Search downloaded book content
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

  const openReader = (bookId: string) => {
    navigation.navigate('Reader', { bookId });
  };

  const matchTypeBadge = (type: SearchResult['matchType']) => {
    const labels = {
      title: 'Title Match',
      author: 'Author Match',
      description: 'Description',
      content: 'In Text',
    };
    return labels[type];
  };

  return (
    <View style={styles.screen}>
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
            onChangeText={setQuery}
            onSubmitEditing={() => performSearch(query)}
            returnKeyType="search"
            autoCorrect={false}
            selectionColor={colors.accent}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setResults([]);
                setHasSearched(false);
              }}
              style={styles.clearBtn}
            >
              <Text style={styles.clearText}>{'\u2715'}</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => {
            Keyboard.dismiss();
            performSearch(query);
          }}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {searching ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Searching the archives...</Text>
        </View>
      ) : hasSearched && results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{'\u2315'}</Text>
          <Text style={styles.emptyTitle}>No Results</Text>
          <Text style={styles.emptyText}>
            Try different keywords or browse the collection instead.
          </Text>
        </View>
      ) : !hasSearched ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{'\u2315'}</Text>
          <Text style={styles.emptyTitle}>Search the Library</Text>
          <Text style={styles.emptyText}>
            Search across 156 texts by title, author, or content within downloaded books.
          </Text>

          {/* Quick suggestions */}
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>Try searching:</Text>
            {['Hermes', 'Stoicism', 'Alchemy', 'Plato', 'Soul', 'Wisdom'].map(
              term => (
                <TouchableOpacity
                  key={term}
                  style={styles.suggestionChip}
                  onPress={() => {
                    setQuery(term);
                    performSearch(term);
                  }}
                >
                  <Text style={styles.suggestionText}>{term}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
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
                <Text style={styles.resultIcon}>
                  {categoryIcons[item.book.category] || '\u2726'}
                </Text>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {item.book.title}
                  </Text>
                  <Text style={styles.resultAuthor} numberOfLines={1}>
                    {item.book.author}
                  </Text>
                </View>
                <View style={styles.matchBadge}>
                  <Text style={styles.matchBadgeText}>{matchTypeBadge(item.matchType)}</Text>
                </View>
              </View>
              {item.snippet && (
                <Text style={styles.snippet} numberOfLines={3}>
                  {item.snippet}
                </Text>
              )}
              <Text style={styles.resultMeta}>
                {item.book.category} {'\u00B7'} {item.book.subcategory} {'\u00B7'}{' '}
                {item.book.year < 0 ? `${Math.abs(item.book.year)} BCE` : item.book.year}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    height: 44,
  },
  searchIcon: {
    fontSize: 18,
    color: colors.textMuted,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...fonts.sansRegular,
    fontSize: 15,
    color: colors.textPrimary,
    height: 44,
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  searchButton: {
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
  },
  searchButtonText: {
    ...fonts.sansBold,
    fontSize: 14,
    color: colors.background,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...fonts.sansRegular,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 24,
  },
  suggestionsTitle: {
    ...fonts.sansRegular,
    fontSize: 13,
    color: colors.textMuted,
    width: '100%',
    textAlign: 'center',
    marginBottom: 10,
  },
  suggestionChip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
  },
  suggestionText: {
    ...fonts.sansRegular,
    fontSize: 13,
    color: colors.accent,
  },
  resultsList: {
    paddingBottom: 100,
  },
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
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIcon: {
    fontSize: 20,
    color: colors.accent,
    marginRight: spacing.md,
    width: 28,
    textAlign: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    ...fonts.serifBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  resultAuthor: {
    ...fonts.sansRegular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  matchBadge: {
    backgroundColor: colors.accentGlow,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  matchBadgeText: {
    ...fonts.sansBold,
    fontSize: 10,
    color: colors.accent,
  },
  snippet: {
    ...fonts.sansRegular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  resultMeta: {
    ...fonts.sansLight,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
  },
});
