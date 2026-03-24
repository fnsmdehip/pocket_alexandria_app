import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../src/constants/theme';
import { categories, categoryIcons, categoryDescriptions, getBooksByCategory } from '../../src/data/catalog';
import BookCover from '../../src/components/BookCover';
import BookListItem from '../../src/components/BookListItem';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const categoryColors: Record<string, string> = {
  'Sacred Texts': '#3D2A5C',
  'Philosophy': '#2A3D5C',
  'Hermetic / Occult': '#5C4A2A',
  'Psychology': '#2A5C5C',
  'Apocrypha': '#5C2A2A',
  'Astrology / Divination': '#2A2A5C',
  'Eastern Wisdom': '#5C5A2A',
  'Secret Societies': '#3D3D5C',
  'Alchemy / Mysticism': '#5C2A4A',
  'Forbidden / Controversial': '#5C2A2A',
};

export default function BrowseTab() {
  const router = useRouter();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const openReader = (bookId: string) => {
    router.push(`/reader/${bookId}`);
  };

  const toggleCategory = (cat: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategory(prev => (prev === cat ? null : cat));
  };

  const totalBooks = 156;

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
              {totalBooks} texts across {(categories as unknown as string[]).length} traditions of wisdom
            </Text>

            {/* Quick category pills */}
            <FlatList
              horizontal
              data={categories as unknown as string[]}
              keyExtractor={item => 'pill_' + item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsContainer}
              renderItem={({ item }) => {
                const isActive = expandedCategory === item;
                return (
                  <TouchableOpacity
                    style={[styles.pill, styles.cardDepth, isActive && styles.pillActive]}
                    onPress={() => toggleCategory(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isActive ? 'sparkles' : 'sparkles-outline'}
                      size={14}
                      color={isActive ? colors.accent : colors.textMuted}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                      {item.split(' /')[0].split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        }
        renderItem={({ item: category }) => {
          const catBooks = getBooksByCategory(category);
          const description = categoryDescriptions[category] || '';
          const isExpanded = expandedCategory === category;
          const accentColor = categoryColors[category] || '#2A2A5C';

          return (
            <View style={styles.categorySection}>
              <TouchableOpacity
                style={[styles.categoryCard, styles.cardDepth, shadows.card]}
                onPress={() => toggleCategory(category)}
                activeOpacity={0.7}
              >
                {/* Category header with color accent */}
                <View style={[styles.categoryAccent, { backgroundColor: accentColor }]} />
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIconWrap, { backgroundColor: accentColor + '30' }]}>
                    <Ionicons name="flame-outline" size={24} color={colors.accent} />
                  </View>
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

                {/* Preview row when collapsed */}
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

                {/* Expand indicator */}
                <View style={styles.expandIndicator}>
                  <Text style={styles.expandText}>
                    {isExpanded ? (
                      <><Ionicons name="chevron-up" size={12} color={colors.accent} /> Collapse</>
                    ) : (
                      <><Ionicons name="chevron-down" size={12} color={colors.accent} /> View all {catBooks.length} texts</>
                    )}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Expanded book list */}
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
    marginBottom: 16,
  },
  pillsContainer: {
    paddingBottom: 12,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
  },
  pillActive: {
    backgroundColor: colors.accentGlow,
    borderColor: colors.accent,
  },
  pillText: {
    ...fonts.sansRegular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  pillTextActive: {
    ...fonts.sansBold,
    color: colors.accent,
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
  categorySection: {
    marginBottom: spacing.md,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  categoryAccent: {
    height: 3,
    width: '100%',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
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
    fontWeight: '300',
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
    minWidth: 48,
  },
  countNumber: {
    ...fonts.serifBold,
    fontSize: 18,
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  countLabel: {
    ...fonts.sansLight,
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '300',
  },
  previewRow: {
    paddingLeft: spacing.lg,
    paddingBottom: spacing.md,
    paddingRight: spacing.sm,
  },
  expandIndicator: {
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  expandText: {
    ...fonts.sansRegular,
    fontSize: 12,
    color: colors.accent,
  },
  expandedList: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
});
