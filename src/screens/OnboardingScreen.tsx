import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius, shadows, APP_CONFIG } from '../constants/theme';
import { categories, categoryIcons, categoryDescriptions, getBooksByCategory } from '../data/catalog';
import { completeOnboarding } from '../services/storage';
import BookCover from '../components/BookCover';
import { Book } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOTAL_STEPS = 5;

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [recommendedBook, setRecommendedBook] = useState<Book | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = useCallback((nextStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleNext = () => {
    if (step === 1 && selectedCategories.length > 0) {
      // Pick a recommended book from first selected category
      const catBooks = getBooksByCategory(selectedCategories[0]);
      if (catBooks.length > 0) {
        setRecommendedBook(catBooks[0]);
      }
    }
    if (step < TOTAL_STEPS - 1) {
      animateTransition(step + 1);
    }
  };

  const handleFinish = async () => {
    await completeOnboarding(selectedCategories);
    onComplete();
  };

  const handleSkip = async () => {
    await completeOnboarding([]);
    onComplete();
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === step && styles.dotActive,
            i < step && styles.dotCompleted,
          ]}
        />
      ))}
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return renderWelcome();
      case 1:
        return renderInterests();
      case 2:
        return renderRecommendation();
      case 3:
        return renderReaderDemo();
      case 4:
        return renderPaywall();
      default:
        return null;
    }
  };

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeContent}>
        <View style={styles.welcomeIconContainer}>
          <Text style={styles.welcomeIcon}>{'\u03A6'}</Text>
          <View style={styles.welcomeIconRing} />
        </View>
        <Text style={styles.welcomeTitle}>Welcome to{'\n'}Pocket Alexandria</Text>
        <View style={styles.ornamentRow}>
          <View style={styles.ornamentDash} />
          <Text style={styles.ornamentSymbol}>{'\u2726'}</Text>
          <View style={styles.ornamentDash} />
        </View>
        <Text style={styles.welcomeSubtitle}>
          Your personal library of ancient wisdom.{'\n'}156 sacred, philosophical, and esoteric texts{'\n'}in the palm of your hand.
        </Text>
        <View style={styles.welcomeFeatures}>
          {[
            ['\u2261', '156 public domain texts'],
            ['\u2606', 'Bookmark and track progress'],
            ['\u2315', 'Search across all texts'],
            ['\u263C', 'Beautiful reading experience'],
          ].map(([icon, label]) => (
            <View key={label} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{icon}</Text>
              <Text style={styles.featureLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.bottomActions}>
        {renderDots()}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
          <Text style={styles.primaryBtnText}>Begin Your Journey</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInterests = () => (
    <View style={styles.stepContainer}>
      <ScrollView contentContainerStyle={styles.interestsScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>What calls to you?</Text>
        <Text style={styles.stepSubtitle}>
          Select the traditions that interest you most
        </Text>
        <View style={styles.categoriesGrid}>
          {(categories as unknown as string[]).map(cat => {
            const selected = selectedCategories.includes(cat);
            const icon = categoryIcons[cat] || '\u2726';
            const count = getBooksByCategory(cat).length;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  selected && styles.categoryChipSelected,
                ]}
                onPress={() => toggleCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryChipIcon, selected && styles.categoryChipIconSelected]}>
                  {icon}
                </Text>
                <Text style={[styles.categoryChipName, selected && styles.categoryChipNameSelected]}>
                  {cat}
                </Text>
                <Text style={[styles.categoryChipCount, selected && styles.categoryChipCountSelected]}>
                  {count} texts
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.bottomActions}>
        {renderDots()}
        <TouchableOpacity
          style={[styles.primaryBtn, selectedCategories.length === 0 && styles.primaryBtnDisabled]}
          onPress={handleNext}
          disabled={selectedCategories.length === 0}
        >
          <Text style={styles.primaryBtnText}>
            {selectedCategories.length > 0
              ? `Continue with ${selectedCategories.length} selected`
              : 'Select at least one'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecommendation = () => {
    const catBooks = selectedCategories.length > 0
      ? getBooksByCategory(selectedCategories[0]).slice(0, 6)
      : [];

    return (
      <View style={styles.stepContainer}>
        <ScrollView contentContainerStyle={styles.recScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.stepTitle}>Your first recommendations</Text>
          <Text style={styles.stepSubtitle}>
            Based on your interest in {selectedCategories[0] || 'wisdom'}
          </Text>

          {recommendedBook && (
            <View style={styles.featuredBook}>
              <BookCover book={recommendedBook} size="large" />
              <View style={styles.featuredInfo}>
                <Text style={styles.featuredTitle}>{recommendedBook.title}</Text>
                <Text style={styles.featuredAuthor}>{recommendedBook.author}</Text>
                <Text style={styles.featuredDesc} numberOfLines={4}>
                  {recommendedBook.description}
                </Text>
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>Recommended for you</Text>
                </View>
              </View>
            </View>
          )}

          {catBooks.length > 1 && (
            <View style={styles.moreBooks}>
              <Text style={styles.moreBooksTitle}>More in {selectedCategories[0]}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {catBooks.slice(1).map(book => (
                  <View key={book.id} style={styles.moreBookItem}>
                    <BookCover book={book} size="small" />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
        <View style={styles.bottomActions}>
          {renderDots()}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderReaderDemo = () => (
    <View style={styles.stepContainer}>
      <ScrollView contentContainerStyle={styles.demoScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>A beautiful reading experience</Text>
        <Text style={styles.stepSubtitle}>
          Customized for extended reading sessions
        </Text>

        {/* Mock reader */}
        <View style={styles.mockReader}>
          <View style={styles.mockReaderInner}>
            <Text style={styles.mockReaderText}>
              The lips of wisdom are closed, except to the ears of Understanding.
              {'\n\n'}
              When the ears of the student are ready to hear, then cometh the lips filled with Wisdom.
            </Text>
            <Text style={styles.mockReaderAttr}>-- The Kybalion</Text>
          </View>
        </View>

        {/* Features list */}
        <View style={styles.demoFeatures}>
          {[
            ['\u263C', 'Night, Sepia & Day themes', 'Easy on the eyes for long sessions'],
            ['A', 'Adjustable typography', 'Font size and line spacing controls'],
            ['\u25C0  \u25B6', 'Tap to navigate', 'Tap left/right edges or swipe'],
            ['\u2606', 'Bookmarks', 'Save your place with a tap'],
          ].map(([icon, title, desc]) => (
            <View key={title} style={styles.demoFeatureRow}>
              <View style={styles.demoFeatureIcon}>
                <Text style={styles.demoFeatureIconText}>{icon}</Text>
              </View>
              <View style={styles.demoFeatureInfo}>
                <Text style={styles.demoFeatureTitle}>{title}</Text>
                <Text style={styles.demoFeatureDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.bottomActions}>
        {renderDots()}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');

  const renderPaywall = () => (
    <View style={styles.stepContainer}>
      <ScrollView contentContainerStyle={styles.paywallScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.paywallHeader}>
          <Text style={styles.paywallIcon}>{'\u03A6'}</Text>
          <Text style={styles.paywallTitle}>Unlock the Full Library</Text>
          <Text style={styles.paywallSubtitle}>
            Start your 7-day free trial today
          </Text>
        </View>

        {/* Plan selection */}
        <TouchableOpacity
          style={[
            styles.planOption,
            selectedPlan === 'annual' && styles.planOptionSelected,
          ]}
          onPress={() => setSelectedPlan('annual')}
          activeOpacity={0.7}
        >
          <View style={styles.planRadio}>
            <View style={[styles.planRadioInner, selectedPlan === 'annual' && styles.planRadioActive]} />
          </View>
          <View style={styles.planInfo}>
            <View style={styles.planNameRow}>
              <Text style={[styles.planName, selectedPlan === 'annual' && styles.planNameActive]}>Annual</Text>
              <View style={styles.planSaveBadge}>
                <Text style={styles.planSaveText}>SAVE 58%</Text>
              </View>
            </View>
            <Text style={[styles.planPrice, selectedPlan === 'annual' && styles.planPriceActive]}>
              $9.99/year
            </Text>
            <Text style={styles.planDetail}>$0.83/month after free trial</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.planOption,
            selectedPlan === 'monthly' && styles.planOptionSelected,
          ]}
          onPress={() => setSelectedPlan('monthly')}
          activeOpacity={0.7}
        >
          <View style={styles.planRadio}>
            <View style={[styles.planRadioInner, selectedPlan === 'monthly' && styles.planRadioActive]} />
          </View>
          <View style={styles.planInfo}>
            <Text style={[styles.planName, selectedPlan === 'monthly' && styles.planNameActive]}>Monthly</Text>
            <Text style={[styles.planPrice, selectedPlan === 'monthly' && styles.planPriceActive]}>
              $1.99/month
            </Text>
            <Text style={styles.planDetail}>Cancel anytime</Text>
          </View>
        </TouchableOpacity>

        {/* What you get */}
        <View style={styles.whatYouGet}>
          <Text style={styles.whatYouGetTitle}>Premium includes:</Text>
          {[
            'All 156 texts from 10 traditions',
            'Bookmarks, highlights & personal notes',
            'Offline access to all texts',
            'Daily wisdom quotes',
            'Night, Sepia & Day reader themes',
          ].map((feature, i) => (
            <View key={i} style={styles.tierFeatureRow}>
              <Text style={[styles.tierCheck, styles.tierCheckPremium]}>{'\u2713'}</Text>
              <Text style={[styles.tierFeatureText, styles.tierFeaturePremium]}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Free tier note */}
        <View style={styles.freeNote}>
          <Text style={styles.freeNoteTitle}>Free plan:</Text>
          <Text style={styles.freeNoteText}>10 books, basic reader, bookmarks & progress tracking</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        {renderDots()}
        <TouchableOpacity style={[styles.primaryBtn, styles.premiumBtn]} onPress={handleFinish}>
          <Text style={styles.primaryBtnText}>Start 7-Day Free Trial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={handleFinish}>
          <Text style={styles.skipBtnText}>Continue with Free</Text>
        </TouchableOpacity>
        <Text style={styles.legalText}>
          7-day free trial, then {selectedPlan === 'annual' ? '$9.99/year' : '$1.99/month'}.{'\n'}Cancel anytime. No payment required now.
        </Text>
        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL(APP_CONFIG.PRIVACY_POLICY_URL)}>
            <Text style={styles.legalLinkText}>Privacy</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>{'\u00B7'}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(APP_CONFIG.TERMS_URL)}>
            <Text style={styles.legalLinkText}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>{'\u00B7'}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(APP_CONFIG.SUPPORT_URL)}>
            <Text style={styles.legalLinkText}>Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Animated.View
        style={[
          styles.animatedContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {renderStep()}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  animatedContainer: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceBorder,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 24,
  },
  dotCompleted: {
    backgroundColor: colors.accentDim,
  },

  // Bottom
  bottomActions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 8 : 20,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: colors.surfaceBorder,
  },
  primaryBtnText: {
    ...fonts.sansBold,
    fontSize: 16,
    color: colors.background,
  },
  premiumBtn: {
    backgroundColor: colors.accent,
  },
  skipBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  skipBtnText: {
    ...fonts.sansRegular,
    fontSize: 15,
    color: colors.textSecondary,
  },

  // Welcome
  welcomeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  welcomeIconContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  welcomeIcon: {
    fontSize: 64,
    color: colors.accent,
  },
  welcomeIconRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.2)',
  },
  welcomeTitle: {
    ...fonts.serifBold,
    fontSize: 30,
    color: colors.parchment,
    textAlign: 'center',
    lineHeight: 40,
  },
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  ornamentDash: {
    width: 24,
    height: 1,
    backgroundColor: colors.accent,
    opacity: 0.4,
  },
  ornamentSymbol: {
    fontSize: 12,
    color: colors.accent,
    marginHorizontal: 10,
    opacity: 0.6,
  },
  welcomeSubtitle: {
    ...fonts.sansRegular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  welcomeFeatures: {
    marginTop: 32,
    alignSelf: 'stretch',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  featureIcon: {
    fontSize: 20,
    color: colors.accent,
    width: 32,
    textAlign: 'center',
  },
  featureLabel: {
    ...fonts.sansRegular,
    fontSize: 15,
    color: colors.textPrimary,
    marginLeft: 12,
  },

  // Interests
  interestsScroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: 24,
    paddingBottom: 20,
  },
  stepTitle: {
    ...fonts.serifBold,
    fontSize: 26,
    color: colors.parchment,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    ...fonts.sansRegular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  categoryChip: {
    width: (SCREEN_WIDTH - 60) / 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  categoryChipSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
  },
  categoryChipIcon: {
    fontSize: 28,
    color: colors.textMuted,
    marginBottom: 6,
  },
  categoryChipIconSelected: {
    color: colors.accent,
  },
  categoryChipName: {
    ...fonts.serifBold,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  categoryChipNameSelected: {
    color: colors.parchment,
  },
  categoryChipCount: {
    ...fonts.sansLight,
    fontSize: 11,
    color: colors.textMuted,
  },
  categoryChipCountSelected: {
    color: colors.accentDim,
  },

  // Recommendation
  recScroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: 24,
    paddingBottom: 20,
  },
  featuredBook: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 16,
  },
  featuredInfo: {
    flex: 1,
    paddingTop: 8,
  },
  featuredTitle: {
    ...fonts.serifBold,
    fontSize: 18,
    color: colors.parchment,
    marginBottom: 4,
  },
  featuredAuthor: {
    ...fonts.sansRegular,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  featuredDesc: {
    ...fonts.sansRegular,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  featuredBadge: {
    backgroundColor: colors.accentGlow,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  featuredBadgeText: {
    ...fonts.sansBold,
    fontSize: 11,
    color: colors.accent,
  },
  moreBooks: {
    marginTop: 28,
  },
  moreBooksTitle: {
    ...fonts.serifBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  moreBookItem: {
    marginRight: 0,
  },

  // Reader Demo
  demoScroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: 24,
    paddingBottom: 20,
  },
  mockReader: {
    backgroundColor: '#0D0D1A',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginTop: 20,
    marginBottom: 28,
    overflow: 'hidden',
  },
  mockReaderInner: {
    padding: 24,
  },
  mockReaderText: {
    fontFamily: 'Georgia',
    fontSize: 17,
    lineHeight: 30,
    color: '#C8C0B0',
  },
  mockReaderAttr: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 13,
    color: '#C9A96E',
    textAlign: 'right',
    marginTop: 12,
  },
  demoFeatures: {
    gap: 16,
  },
  demoFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  demoFeatureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  demoFeatureIconText: {
    fontSize: 18,
    color: colors.accent,
  },
  demoFeatureInfo: {
    flex: 1,
  },
  demoFeatureTitle: {
    ...fonts.sansBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  demoFeatureDesc: {
    ...fonts.sansRegular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Paywall
  paywallScroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
    paddingBottom: 20,
  },
  paywallHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  paywallIcon: {
    fontSize: 44,
    color: colors.accent,
    marginBottom: 12,
  },
  paywallTitle: {
    ...fonts.serifBold,
    fontSize: 24,
    color: colors.parchment,
    textAlign: 'center',
  },
  paywallSubtitle: {
    ...fonts.sansRegular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  tierCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    marginBottom: 16,
  },
  tierCardPremium: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  premiumBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.round,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  premiumBadgeText: {
    ...fonts.sansBold,
    fontSize: 11,
    color: colors.background,
    letterSpacing: 1,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tierName: {
    ...fonts.serifBold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  tierNamePremium: {
    color: colors.accent,
  },
  tierPrice: {
    ...fonts.serifBold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  tierPricePremium: {
    color: colors.accent,
  },
  tierPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tierPricePeriod: {
    ...fonts.sansLight,
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  tierFeatures: {
    gap: 10,
  },
  tierFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierCheck: {
    fontSize: 14,
    color: colors.success,
    width: 24,
  },
  tierCheckDisabled: {
    color: colors.textMuted,
  },
  tierCheckPremium: {
    color: colors.accent,
  },
  tierFeatureText: {
    ...fonts.sansRegular,
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  tierFeatureDisabled: {
    color: colors.textMuted,
  },
  tierFeaturePremium: {
    color: colors.parchment,
  },
  legalText: {
    ...fonts.sansLight,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },

  // Plan selection
  planOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  planOptionSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(201, 169, 110, 0.06)',
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  planRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  planRadioActive: {
    backgroundColor: colors.accent,
  },
  planInfo: {
    flex: 1,
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planName: {
    ...fonts.sansBold,
    fontSize: 16,
    color: colors.textSecondary,
  },
  planNameActive: {
    color: colors.parchment,
  },
  planSaveBadge: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.round,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  planSaveText: {
    ...fonts.sansBold,
    fontSize: 10,
    color: colors.background,
    letterSpacing: 0.5,
  },
  planPrice: {
    ...fonts.serifBold,
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 2,
  },
  planPriceActive: {
    color: colors.accent,
  },
  planDetail: {
    ...fonts.sansLight,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  whatYouGet: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  whatYouGetTitle: {
    ...fonts.sansBold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  freeNote: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  freeNoteTitle: {
    ...fonts.sansBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  freeNoteText: {
    ...fonts.sansRegular,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  legalLinkText: {
    ...fonts.sansRegular,
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 12,
    color: colors.textMuted,
    marginHorizontal: 8,
  },
});
