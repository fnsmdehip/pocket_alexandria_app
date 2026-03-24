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

export type RootStackParamList = {
  Main: undefined;
  Reader: { bookId: string };
};

export type TabParamList = {
  Library: undefined;
  Browse: undefined;
  Reading: undefined;
  Search: undefined;
  Settings: undefined;
};
