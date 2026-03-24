export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  category: string;
  subcategory: string;
  url: string;
  description: string;
}

export interface BookProgress {
  bookId: string;
  currentPage: number;
  totalPages: number;
  percentComplete: number;
  lastReadAt: string;
}

export interface Bookmark {
  id: string;
  bookId: string;
  page: number;
  label: string;
  createdAt: string;
}

export interface Highlight {
  id: string;
  bookId: string;
  page: number;
  text: string;
  note?: string;
  color: string;
  createdAt: string;
}

export interface DailyQuote {
  text: string;
  source: string;
  author: string;
  bookId: string;
}

export interface ReadingStats {
  booksStarted: number;
  booksCompleted: number;
  totalPagesRead: number;
  totalTimeMinutes: number;
  favoriteCategory: string;
}

export type ReaderTheme = 'night' | 'sepia' | 'day';

export interface ReaderSettings {
  fontSize: number;
  theme: ReaderTheme;
  lineHeight: number;
}

export interface OnboardingState {
  completed: boolean;
  selectedCategories: string[];
  isPremium: boolean;
}

export type RootStackParamList = {
  Main: undefined;
  Reader: { bookId: string };
  Onboarding: undefined;
};

export type TabParamList = {
  Library: undefined;
  Browse: undefined;
  Reading: undefined;
  Search: undefined;
  Settings: undefined;
};
