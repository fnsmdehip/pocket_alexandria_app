import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius, shadows } from '../../src/constants/theme';
import { categories, categoryIcons, categoryDescriptions, getBooksByCategory } from '../../src/data/catalog';
import BookCover from '../../src/components/BookCover';
import BookListItem from '../../src/components/BookListItem';

export default function BrowseTab() {
  const router = useRouter();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const openReader = (bookId: string) => {
    router.push(`/reader/${bookId}`);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategory(prev => (prev === cat ? null : cat));
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={categories as unknown as string[]}
        keyExtractor={item => item}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Browse Collection</Text>
            <Text style={styles.headerSubtitle}>
              156 texts across 10 traditions of wisdom
            </Text>
          </View>
        }
        renderItem={({ item: category }) => {
          const catBooks = getBooksByCategory(category);
          const icon = categoryIcons[category] || '\u2726';
          const description = categoryDescriptions[category] || '';
          const isExpanded = expandedCategory === category;

          return (
            <View style={styles.categorySection}>
              <TouchableOpacity
                style={[styles.categoryCard, shadows.card]}
                onPress={() => toggleCategory(category)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryIcon}>{icon}</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category}</Text>
                    <Text style={styles.categoryDesc} numberOfLines={2}>
                      {description}
                    </Text>
                  </View>
                  <View style={styles.categoryCount}>
                    <Text style={styles.countNumber}>{catBooks.length}</Text>
                    <Text style={styles.countLabel}>texts</Text>
                  </View>
                </View>

                {!isExpanded && (
                  <FlatList
                    horizontal
                    data={catBooks.slice(0, 5)}
                    keyExtractor={b => b.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.previewRow}
                    renderItem={({ item }) => (
                      <BookCover
                        book={item}
                        size="small"
                        onPress={() => openReader(item.id)}
                      />
                    )}
                  />
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.expandedList}>
                  {catBooks.map(book => (
                    <BookListItem
                      key={book.id}
                      book={book}
                      onPress={() => openReader(book.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        }}
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
  categorySection: {
    marginBottom: spacing.sm,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  categoryIcon: {
    fontSize: 28,
    color: colors.accent,
    marginRight: spacing.lg,
    width: 36,
    textAlign: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...fonts.serifBold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  categoryDesc: {
    ...fonts.sansRegular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  categoryCount: {
    alignItems: 'center',
    marginLeft: spacing.md,
    backgroundColor: colors.accentGlow,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countNumber: {
    ...fonts.serifBold,
    fontSize: 18,
    color: colors.accent,
  },
  countLabel: {
    ...fonts.sansLight,
    fontSize: 10,
    color: colors.textSecondary,
  },
  previewRow: {
    paddingLeft: spacing.lg,
    paddingBottom: spacing.lg,
    paddingRight: spacing.sm,
  },
  expandedList: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
});
