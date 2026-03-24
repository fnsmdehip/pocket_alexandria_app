import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookProgress, Bookmark, ReaderSettings, ReadingStats, ReaderTheme } from '../types';

const KEYS = {
  PROGRESS_PREFIX: '@pa_progress_',
  BOOKMARKS: '@pa_bookmarks',
  SETTINGS: '@pa_settings',
  STATS: '@pa_stats',
  LIBRARY: '@pa_library',
  RECENT: '@pa_recent',
} as const;

// Reading Progress
export async function getProgress(bookId: string): Promise<BookProgress | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PROGRESS_PREFIX + bookId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveProgress(progress: BookProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(
      KEYS.PROGRESS_PREFIX + progress.bookId,
      JSON.stringify({ ...progress, lastReadAt: new Date().toISOString() })
    );
    await addToRecent(progress.bookId);
    await updateStats(progress);
  } catch {}
}

export async function getAllProgress(): Promise<Record<string, BookProgress>> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const progressKeys = keys.filter(k => k.startsWith(KEYS.PROGRESS_PREFIX));
    if (progressKeys.length === 0) return {};
    const pairs = await AsyncStorage.multiGet(progressKeys);
    const result: Record<string, BookProgress> = {};
    for (const [key, value] of pairs) {
      if (value) {
        const bookId = key.replace(KEYS.PROGRESS_PREFIX, '');
        result[bookId] = JSON.parse(value);
      }
    }
    return result;
  } catch {
    return {};
  }
}

// Bookmarks
export async function getBookmarks(bookId?: string): Promise<Bookmark[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.BOOKMARKS);
    const all: Bookmark[] = raw ? JSON.parse(raw) : [];
    if (bookId) return all.filter(b => b.bookId === bookId);
    return all;
  } catch {
    return [];
  }
}

export async function addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<void> {
  try {
    const all = await getBookmarks();
    const newBm: Bookmark = {
      ...bookmark,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
    };
    all.push(newBm);
    await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(all));
  } catch {}
}

export async function removeBookmark(id: string): Promise<void> {
  try {
    const all = await getBookmarks();
    const filtered = all.filter(b => b.id !== id);
    await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(filtered));
  } catch {}
}

// Reader Settings
const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 17,
  theme: 'night' as ReaderTheme,
  lineHeight: 1.7,
};

export async function getSettings(): Promise<ReaderSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<ReaderSettings>): Promise<void> {
  try {
    const current = await getSettings();
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
  } catch {}
}

// Recent Books
export async function getRecentBookIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.RECENT);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function addToRecent(bookId: string): Promise<void> {
  try {
    let recent = await getRecentBookIds();
    recent = [bookId, ...recent.filter(id => id !== bookId)].slice(0, 20);
    await AsyncStorage.setItem(KEYS.RECENT, JSON.stringify(recent));
  } catch {}
}

// Library (downloaded book IDs)
export async function getLibraryBookIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LIBRARY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addToLibrary(bookId: string): Promise<void> {
  try {
    const ids = await getLibraryBookIds();
    if (!ids.includes(bookId)) {
      ids.push(bookId);
      await AsyncStorage.setItem(KEYS.LIBRARY, JSON.stringify(ids));
    }
  } catch {}
}

export async function removeFromLibrary(bookId: string): Promise<void> {
  try {
    const ids = await getLibraryBookIds();
    await AsyncStorage.setItem(KEYS.LIBRARY, JSON.stringify(ids.filter(id => id !== bookId)));
  } catch {}
}

// Reading Stats
async function updateStats(progress: BookProgress): Promise<void> {
  try {
    const stats = await getStats();
    if (progress.percentComplete > 0 && !stats.booksStarted) {
      stats.booksStarted = 0;
    }
    stats.totalPagesRead = Math.max(stats.totalPagesRead, progress.currentPage);
    if (progress.percentComplete >= 95) {
      stats.booksCompleted = (stats.booksCompleted || 0) + 1;
    }
    await AsyncStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  } catch {}
}

export async function getStats(): Promise<ReadingStats> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.STATS);
    return raw
      ? JSON.parse(raw)
      : {
          booksStarted: 0,
          booksCompleted: 0,
          totalPagesRead: 0,
          totalTimeMinutes: 0,
          favoriteCategory: '',
        };
  } catch {
    return {
      booksStarted: 0,
      booksCompleted: 0,
      totalPagesRead: 0,
      totalTimeMinutes: 0,
      favoriteCategory: '',
    };
  }
}
