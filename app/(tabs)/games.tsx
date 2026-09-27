import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ArcadeGameCard from '@/components/ArcadeGameCard';
import GamePlayerModal from '@/components/GamePlayerModal';
import { useTheme } from '@/context/ThemeContext';
import {
  ARCADE_CATEGORIES,
  clearArcadeCache,
  fetchGames,
  getFavoriteGameIds,
  getRecentlyPlayedGames,
  recordRecentlyPlayedGame,
  toggleFavoriteGame,
  type ArcadeCategory,
  type ArcadeGame,
  type RecentArcadeGame,
} from '@/services/arcadeService';

const CATALOG_SIZE = 250;
const GAME_FILTERS: Array<ArcadeCategory | 'Recent'> = ['All', 'Recent', ...ARCADE_CATEGORIES.slice(1)];

const getPuzzlePriority = (game: ArcadeGame) => {
  const text = `${game.title} ${game.description} ${game.tags.join(' ')}`.toLowerCase();
  if (/block\w*|blast\w*|brick\w*|tile\w*|tetris/.test(text)) return 0;
  if (/word|cross[\s-]?word|spelling|anagram|letter\w*/.test(text)) return 1;
  if (/zuma|marbl\w*|bubble shooter|match\s*3|match three/.test(text)) return 2;
  return 3;
};

export default function GamesScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [category, setCategory] = useState<ArcadeCategory | 'Recent'>('All');
  const [allGames, setAllGames] = useState<ArcadeGame[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<RecentArcadeGame[]>([]);
  const [selectedGame, setSelectedGame] = useState<ArcadeGame | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const gameListRef = useRef<FlatList<ArcadeGame>>(null);
  const fetchedCategories = useRef<Set<string>>(new Set(['All']));

  const loadFavoritesAndRecents = useCallback(async () => {
    const [favoriteIds, recentGames] = await Promise.all([getFavoriteGameIds(), getRecentlyPlayedGames()]);
    setFavorites(favoriteIds);
    setRecent(recentGames);
  }, []);

  const fetchCatalog = useCallback(async (shouldRefresh = false) => {
    if (shouldRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await fetchGames('All', CATALOG_SIZE);
      setAllGames(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadFavoritesAndRecents();
    void fetchCatalog(false);
  }, [fetchCatalog, loadFavoritesAndRecents]);

  // Non-blocking background fetch if a category has very few games from the general feed
  useEffect(() => {
    if (category === 'All' || category === 'Recent') return;
    if (fetchedCategories.current.has(category)) return;
    fetchedCategories.current.add(category);

    void fetchGames(category, 100).then((categoryGames) => {
      if (categoryGames && categoryGames.length > 0) {
        setAllGames((prev) => {
          const existingIds = new Set(prev.map((g) => g.id));
          const newGames = categoryGames.filter((g) => !existingIds.has(g.id));
          return newGames.length > 0 ? [...prev, ...newGames] : prev;
        });
      }
    });
  }, [category]);

  const handleSelectCategory = useCallback((item: ArcadeCategory | 'Recent') => {
    if (item === category) return;
    setCategory(item);
    gameListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [category]);

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase().replace(/[\s_-]+/g, ' ');
    let baseList: ArcadeGame[] = [];

    if (category === 'Recent') {
      baseList = recent
        .map((item) => allGames.find((game) => game.id === item.id) ?? (item.url ? {
            id: item.id,
            title: item.title,
            thumb: item.thumb,
            category: item.category,
            url: item.url,
            description: '',
            instructions: 'Tap to play.',
            width: 800,
            height: 600,
            tags: [],
          } : null))
        .filter((game): game is ArcadeGame => game !== null);
    } else if (category === 'All') {
      baseList = allGames;
    } else {
      const catLower = category.toLowerCase();
      baseList = allGames.filter((g) => {
        const gCat = g.category.toLowerCase();
        const tagStr = g.tags.join(' ').toLowerCase();

        if (category === 'Puzzles') {
          return gCat.includes('puzzle') || /puzzle|block|match|tile|word|blast|tetris|jigsaw|sudoku/i.test(tagStr);
        }
        if (category === 'Arcade') {
          return gCat.includes('arcade') || /arcade|retro|pixel|classic|pinball|pac/i.test(tagStr);
        }
        if (category === 'Action') {
          return gCat.includes('action') || /action|fight|combat|ninja|hero|battle|jump|surviv/i.test(tagStr);
        }
        if (category === 'Sports') {
          return gCat.includes('sport') || /sport|football|soccer|basket|pool|golf|tennis|baseball/i.test(tagStr);
        }
        if (category === 'Racing') {
          return gCat.includes('rac') || /rac|car|drive|moto|drift|speed|truck|bike/i.test(tagStr);
        }
        if (category === 'Shooting') {
          return gCat.includes('shoot') || /shoot|gun|sniper|bullet|fps|target|tank|war/i.test(tagStr);
        }
        if (category === 'Multiplayer') {
          return gCat.includes('multi') || /multi|2 player|two player|online|io|arena/i.test(tagStr);
        }
        return gCat.includes(catLower) || tagStr.includes(catLower);
      });
    }

    if (query.length > 0) {
      baseList = baseList.filter((game) => {
        const searchableText = [
          game.title,
          game.category,
          game.description,
          game.instructions,
          ...game.tags,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .replace(/[\s_-]+/g, ' ');

        return searchableText.includes(query);
      });
    }

    if (category === 'Puzzles') {
      baseList = [...baseList].sort((first, second) => getPuzzlePriority(first) - getPuzzlePriority(second));
    }

    return baseList;
  }, [category, allGames, recent, search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    clearArcadeCache();
    fetchedCategories.current = new Set(['All']);
    await fetchCatalog(true);
    await loadFavoritesAndRecents();
  };

  const openGame = useCallback(async (game: ArcadeGame) => {
    setSelectedGame(game);
    setModalOpen(true);
    await recordRecentlyPlayedGame(game);
    setRecent(await getRecentlyPlayedGames());
  }, []);

  const handleToggleFavorite = async () => {
    if (!selectedGame) return;
    const next = await toggleFavoriteGame(selectedGame.id);
    setFavorites(next);
  };

  const handleCardToggleFavorite = useCallback(async (gameId: string) => {
    const next = await toggleFavoriteGame(gameId);
    setFavorites(next);
  }, []);

  const isGameFavorite = useCallback((gameId: string) => favorites.includes(gameId), [favorites]);

  const renderGameCard = useCallback(
    ({ item }: { item: ArcadeGame }) => (
      <ArcadeGameCard
        game={item}
        isFavorite={isGameFavorite(item.id)}
        colors={c}
        onPress={() => openGame(item)}
        onFavoritePress={() => handleCardToggleFavorite(item.id)}
      />
    ),
    [c, isGameFavorite, openGame, handleCardToggleFavorite],
  );

  const keyExtractor = useCallback((item: ArcadeGame) => item.id, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerWrap}>
          <View style={styles.headerTitleGroup}>
            <Text style={[styles.title, { color: c.text }]}>Games</Text>
            <Text style={[styles.gameCount, { color: c.textMuted }]}>
              {loading ? 'Loading...' : `${filteredGames.length.toLocaleString()} games`}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh games"
            onPress={handleRefresh}
            style={[styles.refreshButton, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <Ionicons name="refresh" size={18} color={c.text} />
          </Pressable>
        </View>

        {/* Search Box */}
        <View style={[styles.searchBox, { backgroundColor: c.card, borderColor: c.border }]}>
          <Ionicons name="search" size={18} color={c.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search games..."
            placeholderTextColor={c.textMuted}
            returnKeyType="search"
            style={[styles.searchInput, { color: c.text }]}
          />
        </View>

        {/* Instant Category Chips */}
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroller}
          contentContainerStyle={styles.chipsRow}
        >
          {GAME_FILTERS.map((item) => {
            const selected = item === category;
            return (
              <Pressable
                key={item}
                onPress={() => handleSelectCategory(item)}
                style={[
                  styles.chip,
                  selected && { backgroundColor: c.primary, borderColor: c.primary },
                  !selected && { backgroundColor: c.card, borderColor: c.border },
                ]}
              >
                <Text style={[styles.chipText, { color: selected ? '#fff' : c.textMuted }]}>{item}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Games Grid or Initial Loader */}
        {loading ? (
          <View style={styles.loaderState}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={[styles.loaderText, { color: c.text }]}>Loading games...</Text>
          </View>
        ) : (
          <FlatList
            ref={gameListRef}
            style={styles.gameList}
            data={filteredGames}
            keyExtractor={keyExtractor}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.primary} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={5}
            removeClippedSubviews={true}
            ListEmptyComponent={
              <View style={[styles.emptyState, { backgroundColor: c.card, borderColor: c.border }]}>
                <Ionicons name="game-controller-outline" size={32} color={c.primary} />
                <Text style={[styles.emptyText, { color: c.text }]}>No games found</Text>
              </View>
            }
            renderItem={renderGameCard}
          />
        )}
      </View>

      <GamePlayerModal
        visible={modalOpen}
        game={selectedGame}
        isFavorite={selectedGame ? isGameFavorite(selectedGame.id) : false}
        onClose={() => {
          setModalOpen(false);
          setSelectedGame(null);
        }}
        onToggleFavorite={handleToggleFavorite}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  headerWrap: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  gameCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingLeft: 10,
  },
  chipsRow: {
    height: 42,
    alignItems: 'center',
    gap: 8,
  },
  categoryScroller: {
    height: 42,
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 8,
  },
  chip: {
    height: 34,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 13,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loaderState: {
    flex: 1,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  gameList: {
    flex: 1,
  },
  loaderText: {
    fontSize: 15,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 32,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  emptyState: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
