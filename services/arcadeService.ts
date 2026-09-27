import AsyncStorage from '@react-native-async-storage/async-storage';

export const ARCADE_CATEGORIES = ['All', 'Puzzles', 'Arcade', 'Action', 'Sports', 'Racing', 'Multiplayer', 'Shooting'] as const;
export type ArcadeCategory = (typeof ARCADE_CATEGORIES)[number];

export type ArcadeGame = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  url: string;
  category: string;
  thumb: string;
  width: number;
  height: number;
  tags: string[];
};

export type RecentArcadeGame = {
  id: string;
  title: string;
  thumb: string;
  category: string;
  url?: string;
  playedAt: number;
};

const FAVORITES_KEY = '@arcade_favorites';
const RECENTS_KEY = '@arcade_recents';
const cache = new Map<string, ArcadeGame[]>();

const normalizeString = (value: unknown, fallback = '') => {
  const text = typeof value === 'string' ? value : fallback;
  return text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
};

const normalizeCategory = (value: string | undefined): string => {
  if (!value) return 'Arcade';
  const cleaned = value.trim();
  if (!cleaned) return 'Arcade';
  return cleaned;
};

const buildGameUrl = (category: ArcadeCategory, amount: number) => {
  let selectedCategory: string = category;
  if (category === 'Puzzles') selectedCategory = 'Puzzle';
  return `https://gamemonetize.com/rssfeed.php?format=json&category=${encodeURIComponent(selectedCategory)}&type=html5&popularity=branding&company=All&amount=${amount}`;
};

const mapGame = (item: any): ArcadeGame | null => {
  if (!item || typeof item !== 'object') return null;

  const url = normalizeString(item.url, '');
  if (!url) return null;

  const thumb = normalizeString(item.thumb, '');
  const title = normalizeString(item.title, 'Untitled Game');

  return {
    id: String(item.id ?? `${title}-${url}`),
    title,
    description: normalizeString(item.description, 'No description available.'),
    instructions: normalizeString(item.instructions, 'Tap to play.'),
    url,
    category: normalizeCategory(item.category),
    thumb,
    width: Number(item.width) || 800,
    height: Number(item.height) || 600,
    tags: Array.isArray(item.tags)
      ? item.tags.map((tag: unknown) => String(tag)).filter(Boolean)
      : String(item.tags ?? '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
  };
};

export const fetchGames = async (category: ArcadeCategory = 'All', amount = 150): Promise<ArcadeGame[]> => {
  const cacheKey = `${category}:${amount}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(buildGameUrl(category, amount), { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Game feed error: ${response.status}`);
    }

    const data = await response.json();
    const list = Array.isArray(data) ? data : [];
    const games = list.map(mapGame).filter(Boolean) as ArcadeGame[];
    if (games.length > 0) {
      cache.set(cacheKey, games);
    }
    return games;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('arcadeService.fetchGames failed:', error);
    return [];
  }
};

export const clearArcadeCache = () => cache.clear();

export const getFavoriteGameIds = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (error) {
    console.warn('getFavoriteGameIds failed:', error);
    return [];
  }
};

export const toggleFavoriteGame = async (gameId: string): Promise<string[]> => {
  try {
    const existing = await getFavoriteGameIds();
    const next = existing.includes(gameId)
      ? existing.filter((id) => id !== gameId)
      : [...existing, gameId];
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    return next;
  } catch (error) {
    console.warn('toggleFavoriteGame failed:', error);
    return await getFavoriteGameIds();
  }
};

export const getRecentlyPlayedGames = async (): Promise<RecentArcadeGame[]> => {
  try {
    const raw = await AsyncStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('getRecentlyPlayedGames failed:', error);
    return [];
  }
};

export const recordRecentlyPlayedGame = async (game: Pick<ArcadeGame, 'id' | 'title' | 'thumb' | 'category' | 'url'>): Promise<RecentArcadeGame[]> => {
  try {
    const existing = await getRecentlyPlayedGames();
    const next = [
      {
        id: game.id,
        title: game.title,
        thumb: game.thumb,
        category: game.category,
        url: game.url,
        playedAt: Date.now(),
      },
      ...existing.filter((item) => item.id !== game.id),
    ].slice(0, 8);

    await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    return next;
  } catch (error) {
    console.warn('recordRecentlyPlayedGame failed:', error);
    return await getRecentlyPlayedGames();
  }
};
