import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ArcadeGame } from '@/services/arcadeService';

type Props = {
  game: ArcadeGame;
  isFavorite: boolean;
  onPress: () => void;
  onFavoritePress: () => void;
  colors: any;
};

function ArcadeGameCard({ game, isFavorite, onPress, onFavoritePress, colors }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      android_ripple={{ color: colors.primary + '22' }}
    >
      <View style={styles.imageWrap}>
        {game.thumb ? (
          <Image source={{ uri: game.thumb }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.imageFallback, { backgroundColor: colors.primary + '22' }]}>
            <Ionicons name="game-controller-outline" size={36} color={colors.primary} />
          </View>
        )}

        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onFavoritePress();
          }}
          style={[styles.favoriteButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
        >
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={16} color={isFavorite ? '#ff5d73' : '#fff'} />
        </Pressable>
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{game.title}</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>{game.category}</Text>
      </View>

      <View style={[styles.playRow, { backgroundColor: colors.primary }]}>
        <Ionicons name="play" size={12} color="#fff" />
        <Text style={styles.playLabel}>Play</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  meta: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  playRow: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  playLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default memo(ArcadeGameCard);

