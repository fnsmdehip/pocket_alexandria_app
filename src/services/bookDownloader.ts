import * as FileSystem from 'expo-file-system';
import { Book } from '../types';
import { addToLibrary } from './storage';

const BOOKS_DIR = FileSystem.documentDirectory + 'books/';

async function ensureDirectory(): Promise<void> {
  const info = await FileSystem.getInfoAsync(BOOKS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(BOOKS_DIR, { intermediates: true });
  }
}

function getBookPath(bookId: string): string {
  return BOOKS_DIR + bookId + '.txt';
}

export async function isBookDownloaded(bookId: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(getBookPath(bookId));
    return info.exists;
  } catch {
    return false;
  }
}

export async function downloadBook(book: Book): Promise<string> {
  await ensureDirectory();
  const path = getBookPath(book.id);

  const existing = await FileSystem.getInfoAsync(path);
  if (existing.exists) {
    return await FileSystem.readAsStringAsync(path);
  }

  try {
    const response = await fetch(book.url, {
      headers: {
        'User-Agent': 'PocketAlexandria/1.0 (Digital Library; React Native)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    let text = await response.text();

    // Strip HTML if the response looks like HTML
    if (text.trim().startsWith('<') || book.url.endsWith('.htm') || book.url.endsWith('.html')) {
      text = stripHtml(text);
    }

    // Clean up Gutenberg header/footer
    text = cleanGutenbergText(text);

    await FileSystem.writeAsStringAsync(path, text);
    await addToLibrary(book.id);

    return text;
  } catch (error) {
    throw new Error(`Failed to download "${book.title}": ${error}`);
  }
}

export async function getBookText(bookId: string): Promise<string | null> {
  try {
    const path = getBookPath(bookId);
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    return await FileSystem.readAsStringAsync(path);
  } catch {
    return null;
  }
}

export async function deleteBook(bookId: string): Promise<void> {
  try {
    const path = getBookPath(bookId);
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      await FileSystem.deleteAsync(path);
    }
  } catch {}
}

export async function getCacheSize(): Promise<number> {
  try {
    await ensureDirectory();
    const files = await FileSystem.readDirectoryAsync(BOOKS_DIR);
    let total = 0;
    for (const file of files) {
      const info = await FileSystem.getInfoAsync(BOOKS_DIR + file);
      if (info.exists && 'size' in info) {
        total += info.size || 0;
      }
    }
    return total;
  } catch {
    return 0;
  }
}

export async function clearCache(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(BOOKS_DIR);
    if (info.exists) {
      await FileSystem.deleteAsync(BOOKS_DIR, { idempotent: true });
    }
  } catch {}
}

function stripHtml(html: string): string {
  // Remove script/style
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  // Replace br/p with newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, '');
  // Decode entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');
  // Clean up whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

function cleanGutenbergText(text: string): string {
  // Try to strip Project Gutenberg header
  const startMarkers = [
    '*** START OF THIS PROJECT GUTENBERG',
    '*** START OF THE PROJECT GUTENBERG',
    '*END*THE SMALL PRINT',
  ];
  const endMarkers = [
    '*** END OF THIS PROJECT GUTENBERG',
    '*** END OF THE PROJECT GUTENBERG',
    'End of Project Gutenberg',
    'End of the Project Gutenberg',
  ];

  let startIdx = 0;
  for (const marker of startMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      const nextNewline = text.indexOf('\n', idx);
      startIdx = nextNewline !== -1 ? nextNewline + 1 : idx + marker.length;
      break;
    }
  }

  let endIdx = text.length;
  for (const marker of endMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      endIdx = idx;
      break;
    }
  }

  return text.slice(startIdx, endIdx).trim();
}
