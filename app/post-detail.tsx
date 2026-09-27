import {
  StyleSheet,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ListRenderItem,
  Share,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { getUserById, useApp } from '@/context/AppContext';
import { fetchLocalPosts } from '@/services/postsService';
import type { Post, User } from '@/types';

const { width } = Dimensions.get('window');

const POST_MAP: Record<string, {
  id: string;
  authorId: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  category: string;
}> = {
  'post-1': {
    id: 'post-1',
    authorId: 'user-samuel-01',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    caption: 'Sunset study session with the whole library crew ☀️ #finalsweek',
    likes: 184,
    comments: 26,
    category: 'Study',
  },
  'post-2': {
    id: 'post-2',
    authorId: 'user-maya-01',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80',
    caption: 'Campus market run before the big exam. Always a good idea to grab coffee and focus. ☕',
    likes: 256,
    comments: 31,
    category: 'Campus',
  },
  'post-3': {
    id: 'post-3',
    authorId: 'user-ari-01',
    image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80',
    caption: 'This is the calmest place on campus before lab. Anyone else trying to beat the Monday blues?',
    likes: 132,
    comments: 19,
    category: 'Tips',
  },
  'u1-p1': {
    id: 'u1-p1',
    authorId: 'user-samuel-01',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    caption: 'Another productive day in the library. Getting closer to graduation.',
    likes: 214,
    comments: 18,
    category: 'Study',
  },
  'u1-p2': {
    id: 'u1-p2',
    authorId: 'user-samuel-01',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80',
    caption: 'Quick coffee break before the lab report deadline.',
    likes: 193,
    comments: 15,
    category: 'Campus',
  },
  'u1-p3': {
    id: 'u1-p3',
    authorId: 'user-samuel-01',
    image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80',
    caption: 'The best part of campus is when it finally quiets down at dusk.',
    likes: 161,
    comments: 11,
    category: 'Tips',
  },
  'u1-p4': {
    id: 'u1-p4',
    authorId: 'user-samuel-01',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
    caption: 'Study vlog: one hour of deep work, one hour of reset. That balance is everything.',
    likes: 245,
    comments: 22,
    category: 'Study',
  },
  'm1-p1': {
    id: 'm1-p1',
    authorId: 'user-maya-01',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
    caption: 'Design class field notes from campus architecture walk.',
    likes: 302,
    comments: 29,
    category: 'Campus',
  },
  'm1-p2': {
    id: 'm1-p2',
    authorId: 'user-maya-01',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
    caption: 'Mood: creative energy and a little extra caffeine.',
    likes: 290,
    comments: 27,
    category: 'Tips',
  },
  'm1-p3': {
    id: 'm1-p3',
    authorId: 'user-maya-01',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80',
    caption: 'Proof that good design can turn a simple study desk into a whole vibe.',
    likes: 341,
    comments: 33,
    category: 'Study',
  },
  'n1-p1': {
    id: 'n1-p1',
    authorId: 'user-niko-01',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    caption: 'Campus event prep: all systems go for the weekend mixer.',
    likes: 182,
    comments: 20,
    category: 'Event',
  },
  'n1-p2': {
    id: 'n1-p2',
    authorId: 'user-niko-01',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    caption: 'Turning a study hall into a launch pad.',
    likes: 210,
    comments: 18,
    category: 'Study',
  },
  'a1-p1': {
    id: 'a1-p1',
    authorId: 'user-ari-01',
    image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80',
    caption: 'Best quiet corner on campus before the lab rush starts.',
    likes: 170,
    comments: 13,
    category: 'Study',
  },
  'a1-p2': {
    id: 'a1-p2',
    authorId: 'user-ari-01',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
    caption: 'A little science and a lot of focus.',
    likes: 201,
    comments: 17,
    category: 'Campus',
  },
  'a1-p3': {
    id: 'a1-p3',
    authorId: 'user-ari-01',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80',
    caption: 'The campus courtyard is underrated at golden hour.',
    likes: 175,
    comments: 12,
    category: 'Campus',
  },
  'a1-p4': {
    id: 'a1-p4',
    authorId: 'user-ari-01',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
    caption: 'The kind of study setup that makes it easier to lock in.',
    likes: 222,
    comments: 19,
    category: 'Study',
  },
};

type PostEntry = typeof POST_MAP[string] & { mediaType?: 'image' | 'video' };

function toPostEntry(post: Post): PostEntry {
  return {
    id: post.id,
    authorId: post.author.id,
    image: post.mediaUrls[0],
    mediaType: post.mediaTypes?.[0] ?? (post.type === 'video' ? 'video' : 'image'),
    caption: post.caption,
    likes: post.likes,
    comments: post.comments,
    category: post.category,
  };
}

function DetailVideo({ uri }: { uri: string }) {
  const [muted, setMuted] = useState(true);
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  return (
    <View style={styles.postImage}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      <TouchableOpacity
        style={styles.videoSoundButton}
        onPress={() => setMuted((value) => !value)}
        accessibilityRole="button"
        accessibilityLabel={muted ? 'Unmute video' : 'Mute video'}
      >
        <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function PostItem({
  item,
  currentUser,
  colors,
  saved,
  onToggleSave,
  isReposted,
  onToggleRepost,
  onOpenOptions,
  onShare,
  isLiked,
  onToggleLike,
}: {
  item: PostEntry;
  currentUser: User;
  colors: any;
  saved: boolean;
  onToggleSave: (postId: string) => void;
  isReposted: boolean;
  onToggleRepost: (postId: string) => void;
  onOpenOptions: (item: PostEntry) => void;
  onShare: (item: PostEntry) => void;
  isLiked: boolean;
  onToggleLike: (postId: string) => void;
}) {
  const author = item.authorId === currentUser.id ? currentUser : getUserById(item.authorId);
  return (
    <View style={{ width, backgroundColor: colors.background }}>
      {/* Repost Indicator */}
      {isReposted && (
        <View style={[styles.repostedHeader, { backgroundColor: colors.surface || colors.card }]}>
          <Ionicons name="repeat" size={13} color="#10b981" />
          <Text style={styles.repostedText}>You reposted</Text>
        </View>
      )}

      {/* Author Header */}
      <View style={styles.authorRow}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/user-profile', params: { userId: author.id } })}
          style={styles.authorClickArea}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary + '25' }]}>
            {author.avatar ? (
              <Image source={{ uri: author.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarInitial, { color: colors.primary }]}>{author.displayName[0]}</Text>
            )}
          </View>
          <View style={styles.authorMeta}>
            <Text style={[styles.authorName, { color: colors.text }]}>{author.displayName}</Text>
            <Text style={[styles.authorSchool, { color: colors.textMuted }]}>{author.schoolName}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <View style={[styles.categoryPill, { backgroundColor: colors.primary + '18' }]}>
            <Text style={[styles.categoryText, { color: colors.primary }]}>{item.category}</Text>
          </View>

          {/* Three-dots options button */}
          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.moreBtn}
            onPress={() => onOpenOptions(item)}
            accessibilityRole="button"
            accessibilityLabel="Post options"
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {item.mediaType === 'video' ? (
        <DetailVideo uri={item.image} />
      ) : (
        <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" />
      )}

      {/* Action Row */}
      <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
        <View style={styles.actionGroup}>
          {/* Like Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onToggleLike(item.id)}
            accessibilityRole="button"
            accessibilityLabel="Like post"
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? '#ef4444' : colors.textMuted}
            />
          </TouchableOpacity>
          <Text style={[styles.actionLabel, { color: isLiked ? '#ef4444' : colors.textMuted }]}>
            {item.likes + (isLiked ? 1 : 0)}
          </Text>

          {/* Comment Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.comments} comments`}
            onPress={() => router.push({ pathname: '/post-comments', params: { postId: item.id } })}
          >
            <Ionicons name="chatbubble-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.actionLabel, { color: colors.textMuted }]}>{item.comments}</Text>

          {/* Repost Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onToggleRepost(item.id)}
            accessibilityRole="button"
            accessibilityLabel="Repost"
          >
            <Ionicons
              name={isReposted ? 'repeat' : 'repeat-outline'}
              size={22}
              color={isReposted ? '#10b981' : colors.textMuted}
            />
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onShare(item)}
            accessibilityRole="button"
            accessibilityLabel="Share post"
          >
            <Ionicons name="paper-plane-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Bookmark / Save Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onToggleSave(item.id)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Save post"
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={saved ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.captionWrap}>
        <Text style={[styles.caption, { color: colors.text }]}>
          <Text style={styles.captionAuthor}>{author.username} </Text>
          {item.caption}
        </Text>
      </View>
    </View>
  );
}

export default function PostDetailScreen() {
  const { postId, postIds, initialIndex } = useLocalSearchParams<{
    postId?: string;
    postIds?: string;
    initialIndex?: string;
  }>();
  const { theme } = useTheme();
  const c = theme.colors;
  const { toggleSave, isSaved, currentUser } = useApp();
  const flatListRef = useRef<FlatList<PostEntry>>(null);

  const [optionsPost, setOptionsPost] = useState<PostEntry | null>(null);
  const [repostedMap, setRepostedMap] = useState<Record<string, boolean>>({});
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [localPosts, setLocalPosts] = useState<PostEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void fetchLocalPosts().then((posts) => {
        if (active) setLocalPosts(posts.filter((post) => post.mediaUrls[0]).map(toPostEntry));
      });
      return () => {
        active = false;
      };
    }, []),
  );

  // Build ordered list of posts to display
  const orderedIds: string[] = postIds
    ? postIds.split(',')
    : postId
    ? [postId]
    : [];

  const localPostMap = Object.fromEntries(localPosts.map((post) => [post.id, post]));
  const posts = orderedIds
    .map((id) => localPostMap[id] ?? POST_MAP[id])
    .filter((p): p is PostEntry => Boolean(p));

  const startIndex = Math.max(0, Math.min(parseInt(initialIndex ?? '0', 10), posts.length - 1));

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleShare = async (targetPost: PostEntry) => {
    try {
      const author = targetPost.authorId === currentUser.id ? currentUser : getUserById(targetPost.authorId);
      const authorName = author.displayName || author.username;
      const shareUrl = `https://campus.app/p/${targetPost.id}`;
      await Share.share({
        message: `${authorName} on CAMPUS: "${targetPost.caption}"\n${shareUrl}`,
        url: shareUrl,
        title: `CAMPUS - Post by ${authorName}`,
      });
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        console.warn('Share error:', error);
      }
    }
  };

  const handleToggleRepost = (targetPostId: string) => {
    setRepostedMap((prev) => {
      const nextVal = !prev[targetPostId];
      triggerToast(nextVal ? 'Reposted to your profile 🔄' : 'Repost removed');
      return { ...prev, [targetPostId]: nextVal };
    });
  };

  const handleToggleLike = (targetPostId: string) => {
    setLikedMap((prev) => ({ ...prev, [targetPostId]: !prev[targetPostId] }));
  };

  const renderItem: ListRenderItem<PostEntry> = ({ item }) => (
    <PostItem
      item={item}
      currentUser={currentUser}
      colors={c}
      saved={isSaved(item.id)}
      onToggleSave={toggleSave}
      isReposted={Boolean(repostedMap[item.id])}
      onToggleRepost={handleToggleRepost}
      onOpenOptions={(post) => setOptionsPost(post)}
      onShare={handleShare}
      isLiked={Boolean(likedMap[item.id])}
      onToggleLike={handleToggleLike}
    />
  );

  if (posts.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={c.textDim} />
          <Text style={[styles.emptyTitle, { color: c.text }]}>Post not found</Text>
          <TouchableOpacity style={[styles.backBtnPill, { backgroundColor: c.primary }]} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const modalAuthor = optionsPost
    ? optionsPost.authorId === currentUser.id
      ? currentUser
      : getUserById(optionsPost.authorId)
    : null;
  const isModalPostReposted = optionsPost ? Boolean(repostedMap[optionsPost.id]) : false;
  const isModalPostSaved = optionsPost ? isSaved(optionsPost.id) : false;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Posts</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        initialScrollIndex={startIndex}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
      />

      {/* Options Modal Sheet */}
      <Modal
        visible={Boolean(optionsPost)}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsPost(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setOptionsPost(null)}>
          <View
            style={[styles.sheetContent, { backgroundColor: c.card, borderColor: c.border }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.sheetHandle, { backgroundColor: c.textDim + '50' }]} />

            {modalAuthor && optionsPost && (
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetAuthorName, { color: c.text }]}>
                  {modalAuthor.displayName}
                </Text>
                <Text style={[styles.sheetCaptionSnippet, { color: c.textMuted }]} numberOfLines={1}>
                  {optionsPost.caption}
                </Text>
              </View>
            )}

            {/* Repost option */}
            {optionsPost && (
              <TouchableOpacity
                style={[styles.sheetOption, { borderBottomColor: c.borderSubtle || c.border }]}
                onPress={() => {
                  const targetId = optionsPost.id;
                  setOptionsPost(null);
                  handleToggleRepost(targetId);
                }}
              >
                <Ionicons
                  name={isModalPostReposted ? 'repeat' : 'repeat-outline'}
                  size={22}
                  color={isModalPostReposted ? '#10b981' : c.text}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.sheetOptionText,
                      { color: isModalPostReposted ? '#10b981' : c.text },
                    ]}
                  >
                    {isModalPostReposted ? 'Undo Repost' : 'Repost'}
                  </Text>
                  <Text style={[styles.sheetOptionSubtext, { color: c.textDim }]}>
                    {isModalPostReposted ? 'Remove from your profile' : 'Share this post with your followers'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Share via */}
            {optionsPost && (
              <TouchableOpacity
                style={[styles.sheetOption, { borderBottomColor: c.borderSubtle || c.border }]}
                onPress={() => {
                  const p = optionsPost;
                  setOptionsPost(null);
                  handleShare(p);
                }}
              >
                <Ionicons name="share-outline" size={22} color={c.text} />
                <Text style={[styles.sheetOptionText, { color: c.text }]}>Share via...</Text>
              </TouchableOpacity>
            )}

            {/* Save / Bookmark */}
            {optionsPost && (
              <TouchableOpacity
                style={[styles.sheetOption, { borderBottomColor: c.borderSubtle || c.border }]}
                onPress={() => {
                  toggleSave(optionsPost.id);
                  triggerToast(isModalPostSaved ? 'Removed from Saved' : 'Saved to your collection! 🔖');
                  setOptionsPost(null);
                }}
              >
                <Ionicons
                  name={isModalPostSaved ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={isModalPostSaved ? c.primary : c.text}
                />
                <Text
                  style={[
                    styles.sheetOptionText,
                    { color: isModalPostSaved ? c.primary : c.text },
                  ]}
                >
                  {isModalPostSaved ? 'Remove from Saved' : 'Save Post'}
                </Text>
              </TouchableOpacity>
            )}

            {/* View author profile */}
            {optionsPost && modalAuthor && (
              <TouchableOpacity
                style={[styles.sheetOption, { borderBottomColor: c.borderSubtle || c.border }]}
                onPress={() => {
                  const authorId = modalAuthor.id;
                  setOptionsPost(null);
                  if (authorId === currentUser?.id) {
                    router.push('/(tabs)/profile');
                  } else {
                    router.push({ pathname: '/user-profile', params: { userId: authorId } });
                  }
                }}
              >
                <Ionicons name="person-outline" size={22} color={c.text} />
                <Text style={[styles.sheetOptionText, { color: c.text }]}>
                  About @{modalAuthor.username}
                </Text>
              </TouchableOpacity>
            )}

            {/* Report Post */}
            {optionsPost && (
              <TouchableOpacity
                style={[styles.sheetOption, { borderBottomColor: c.borderSubtle || c.border }]}
                onPress={() => {
                  setOptionsPost(null);
                  Alert.alert('Report Received', 'Thank you for helping keep the CAMPUS community safe.');
                }}
              >
                <Ionicons name="flag-outline" size={22} color={c.danger} />
                <Text style={[styles.sheetOptionText, { color: c.danger }]}>Report Post</Text>
              </TouchableOpacity>
            )}

            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.sheetCancelBtn, { backgroundColor: c.surface || c.card }]}
              onPress={() => setOptionsPost(null)}
            >
              <Text style={[styles.sheetCancelText, { color: c.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Floating Action Toast */}
      {toastMessage && (
        <View style={[styles.toastContainer, { backgroundColor: c.text }]}>
          <Text style={[styles.toastText, { color: c.background }]}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// Estimate height per post item: author row + square image + action row + caption
const ITEM_HEIGHT = 42 + 12 * 2 + width + 12 * 2 + 22 * 2 + 8 + 8 + 32;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  repostedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
  },
  repostedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  authorClickArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 42, height: 42, borderRadius: 21 },
  avatarInitial: { fontSize: 17, fontWeight: '700' },
  authorMeta: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '700' },
  authorSchool: { fontSize: 12, marginTop: 2 },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  categoryText: { fontSize: 11, fontWeight: '700' },
  moreBtn: {
    padding: 6,
    marginLeft: 2,
  },
  postImage: { width, height: width },
  videoSoundButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionBtn: { padding: 4 },
  actionLabel: { fontSize: 13, fontWeight: '600', marginRight: 4 },
  captionWrap: { paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 32 },
  caption: { fontSize: 15, lineHeight: 22 },
  captionAuthor: { fontWeight: '800' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  backBtnPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  backBtnText: { color: '#fff', fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    paddingBottom: 14,
    marginBottom: 6,
  },
  sheetAuthorName: {
    fontSize: 16,
    fontWeight: '700',
  },
  sheetCaptionSnippet: {
    fontSize: 13,
    marginTop: 2,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  sheetOptionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  sheetCancelBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

