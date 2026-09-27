import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  ScrollView,
  Share,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { fetchLocalPosts } from '@/services/postsService';
import type { Post } from '@/types';

const { width } = Dimensions.get('window');

const normalizePostAspectRatio = (mediaWidth: number, mediaHeight: number) =>
  Math.max(4 / 5, Math.min(2.4, mediaWidth / mediaHeight));

const STORIES: { id: string; name: string; avatar?: string; hasNew: boolean }[] = [
  { id: 'user-samuel-01', name: 'Samuel', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', hasNew: true },
  { id: 'user-maya-01', name: 'Maya', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80', hasNew: true },
  { id: 'user-niko-01', name: 'Niko', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', hasNew: true },
  { id: 'user-ari-01', name: 'Ari', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80', hasNew: false },
];

function StoryAvatar({ item, colors }: { item: typeof STORIES[0]; colors: any }) {
  return (
    <TouchableOpacity
      style={styles.storyItem}
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: '/user-profile', params: { userId: item.id } })}
    >
      <View style={[styles.storyRing, { borderColor: item.hasNew ? colors.primary : colors.border }]}>
        <View style={[styles.storyAvatar, { backgroundColor: colors.card }]}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.storyAvatarImage} />
          ) : (
            <Text style={[styles.storyInitial, { color: colors.primary }]}>
              {item.name[0].toUpperCase()}
            </Text>
          )}
        </View>
      </View>
      <Text style={[styles.storyName, { color: colors.textMuted }]} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
}

function EmptyFeed({ colors }: { colors: any }) {
  return (
    <View style={[styles.emptyState, { paddingTop: 80 }]}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name="images-outline" size={40} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing here yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Be the first to post something to your campus feed
      </Text>
      <TouchableOpacity
        style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/post')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.emptyBtnText}>Create Post</Text>
      </TouchableOpacity>
    </View>
  );
}

function FeedVideo({ uri, isVisible }: { uri: string; isVisible: boolean }) {
  const [muted, setMuted] = useState(true);
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    if (isVisible) player.play();
    else player.pause();
  }, [isVisible, player]);

  return (
    <View style={styles.postMedia}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      <TouchableOpacity
        style={styles.videoSoundButton}
        onPress={() => setMuted((value) => !value)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={muted ? 'Unmute video' : 'Mute video'}
      >
        <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={16} color="#fff" style={styles.videoSoundIcon} />
      </TouchableOpacity>
    </View>
  );
}

function PostCard({
  post,
  isVisible,
  colors,
  onOpenOptions,
  onShare,
  onToggleRepost,
  isReposted,
  isSaved,
  onToggleSave,
}: {
  post: Post;
  isVisible: boolean;
  colors: any;
  onOpenOptions: (post: Post) => void;
  onShare: (post: Post) => void;
  onToggleRepost: (postId: string) => void;
  isReposted: boolean;
  isSaved: boolean;
  onToggleSave: (postId: string) => void;
}) {
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [postAspectRatio, setPostAspectRatio] = useState(() => {
    const dimensions = post.mediaDimensions?.[0];
    if (dimensions?.width && dimensions.height) return normalizePostAspectRatio(dimensions.width, dimensions.height);
    return post.type === 'video' ? 16 / 9 : 1;
  });
  const mediaCarouselRef = useRef<ScrollView>(null);
  const mediaIndex = Math.min(activeMediaIndex, Math.max(0, post.mediaUrls.length - 1));
  const mediaUri = post.mediaUrls[mediaIndex];
  const isActiveVideo = post.mediaTypes?.[mediaIndex] === 'video' || (post.type === 'video' && !post.mediaTypes);

  useEffect(() => {
    mediaCarouselRef.current?.scrollTo({ x: mediaIndex * width, y: 0, animated: false });
  }, [mediaIndex]);

  useEffect(() => {
    const dimensions = post.mediaDimensions?.[0];
    if (dimensions?.width && dimensions.height) {
      setPostAspectRatio(normalizePostAspectRatio(dimensions.width, dimensions.height));
      return;
    }
    if (!post.mediaUrls[0] || post.type === 'video') return;

    let isActive = true;
    Image.getSize(
      post.mediaUrls[0],
      (mediaWidth, mediaHeight) => {
        if (isActive && mediaHeight > 0) setPostAspectRatio(normalizePostAspectRatio(mediaWidth, mediaHeight));
      },
      () => undefined,
    );
    return () => { isActive = false; };
  }, [post.id, post.mediaDimensions, post.mediaUrls, post.type]);

  const handleLike = () => {
    setIsLiked((v) => {
      setLikeCount((c) => v ? c - 1 : c + 1);
      return !v;
    });
  };

  const formatCount = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  };

  const timeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    if (m < 1) return 'just now';
    if (h < 1) return `${m}m`;
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  return (
    <View style={[styles.postCard, { backgroundColor: colors.background }]}>
      {/* Repost Indicator */}
      {isReposted && (
        <View style={styles.repostedHeader}>
          <Ionicons name="repeat" size={13} color="#10b981" />
          <Text style={[styles.repostedText, { color: colors.textMuted }]}>
            You reposted
          </Text>
        </View>
      )}

      {/* Author Row */}
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.postAuthorRow}
          onPress={() => router.push({ pathname: '/user-profile', params: { userId: post.author.id } })}
          activeOpacity={0.8}
        >
          <View style={[styles.postAvatar, { backgroundColor: colors.primary + '30' }]}>
            {post.author.avatar ? (
              <Image source={{ uri: post.author.avatar }} style={styles.postAvatarImage} />
            ) : (
              <Text style={[styles.postAvatarInitial, { color: colors.primary }]}>
                {post.author.displayName[0]}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.postAuthorMeta}>
              <Text style={[styles.postAuthorName, { color: colors.text }]}>
                {post.author.displayName}
              </Text>
              {post.author.isVerified && (
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              )}
            </View>
            <Text style={[styles.postMeta, { color: colors.textMuted }]}>
              {post.author.schoolName} · {timeAgo(post.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Category Pill and Three Dots Menu */}
        <View style={styles.postHeaderRight}>
          <View style={[styles.categoryPill, { backgroundColor: colors.primary + '18' }]}>
            <Text style={[styles.categoryPillText, { color: colors.primary }]}>{post.category}</Text>
          </View>
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => onOpenOptions(post)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="More post options"
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Media */}
      <View style={[styles.postMediaWrap, { height: width / postAspectRatio }]}>
        <ScrollView
          ref={mediaCarouselRef}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(event) => {
            setActiveMediaIndex(Math.max(0, Math.min(
              Math.round(event.nativeEvent.contentOffset.x / width),
              post.mediaUrls.length - 1,
            )));
          }}
        >
          {post.mediaUrls.map((uri, index) => {
            const isVideo = post.mediaTypes?.[index] === 'video' || (post.type === 'video' && !post.mediaTypes);
            return (
              <View key={`${post.id}-${index}`} style={[styles.postMediaPage, { width, height: width / postAspectRatio }]}>
                {isVideo ? (
                  <FeedVideo uri={uri} isVisible={isVisible && index === mediaIndex} />
                ) : (
                  <Image source={{ uri }} style={styles.postMedia} resizeMode="cover" />
                )}
              </View>
            );
          })}
        </ScrollView>
        {post.mediaUrls.length > 1 && (
          <View style={styles.mediaCounter}>
            <Text style={styles.mediaCounterText}>{mediaIndex + 1}/{post.mediaUrls.length}</Text>
          </View>
        )}
      </View>

      {post.mediaUrls.length > 1 && (
        <View style={styles.carouselDotsRow}>
          {post.mediaUrls.map((_, index) => (
            <TouchableOpacity
              key={`${post.id}-dot-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`Show carousel item ${index + 1}`}
              onPress={() => setActiveMediaIndex(index)}
              style={[
                styles.carouselDot,
                { backgroundColor: index === mediaIndex ? colors.primary : colors.textDim },
                index === mediaIndex && styles.carouselDotActive,
              ]}
            />
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={[styles.postActions, { borderTopColor: colors.border }, post.mediaUrls.length > 1 && styles.postActionsWithoutDivider]}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? colors.danger : colors.textMuted}
            />
            <Text style={[styles.actionCount, { color: colors.textMuted }]}>
              {formatCount(likeCount)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Open ${post.comments} comments`}
            onPress={() => router.push({
              pathname: '/post-comments',
              params: { postId: post.id, authorId: post.author.id, caption: post.caption },
            })}
          >
            <Ionicons name="chatbubble-outline" size={22} color={colors.textMuted} />
            <Text style={[styles.actionCount, { color: colors.textMuted }]}>
              {formatCount(post.comments)}
            </Text>
          </TouchableOpacity>

          {/* Repost Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => onToggleRepost(post.id)}
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
            activeOpacity={0.7}
            onPress={() => onShare(post)}
            accessibilityRole="button"
            accessibilityLabel="Share post"
          >
            <Ionicons name="paper-plane-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Bookmark / Save */}
        <TouchableOpacity
          onPress={() => onToggleSave(post.id)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Save post"
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isSaved ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Caption */}
      <View style={styles.postCaption}>
        <Text style={[styles.captionText, { color: colors.text }]} numberOfLines={2}>
          <Text style={styles.captionAuthor}>{post.author.username} </Text>
          {post.caption}
        </Text>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const { theme } = useTheme();
  const { currentUser, notificationCount, isSaved, toggleSave, followingByUserId, toggleFollow } = useApp();
  const c = theme.colors;

  const [posts, setPosts] = useState<Post[]>([]);
  const [stories] = useState(STORIES);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [optionsModalPost, setOptionsModalPost] = useState<Post | null>(null);
  const [repostedPostIds, setRepostedPostIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems[0]?.item) setActivePostId(viewableItems[0].item.id);
  }, []);

  const viewabilityConfig = { itemVisiblePercentThreshold: 50, minimumViewTime: 200 };

  useFocusEffect(useCallback(() => {
    let active = true;
    void fetchLocalPosts().then((localPosts) => {
      const postsWithCurrentUser = localPosts.map((post) => (
        post.author.id === currentUser.id ? { ...post, author: currentUser } : post
      ));
      if (active) setPosts(postsWithCurrentUser);
    });
    return () => { active = false; };
  }, [currentUser]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const localPosts = await fetchLocalPosts();
      const postsWithCurrentUser = localPosts.map((post) => (
        post.author.id === currentUser.id ? { ...post, author: currentUser } : post
      ));
      setPosts(postsWithCurrentUser);
    } finally {
      setRefreshing(false);
    }
  }, [currentUser]);

  const handleSharePost = async (targetPost: Post) => {
    try {
      const authorName = targetPost.author.displayName || targetPost.author.username;
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

  const handleCopyLink = async (targetPost: Post) => {
    const shareUrl = `https://campus.app/p/${targetPost.id}`;
    try {
      await Share.share({
        message: shareUrl,
        url: shareUrl,
        title: `CAMPUS Link`,
      });
      setToastMessage('Link ready to share! 📋');
    } catch {
      setToastMessage('Link copied! 📋');
    }
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleRepost = (postId: string) => {
    setRepostedPostIds((prev) => {
      const isAlready = prev.includes(postId);
      const next = isAlready ? prev.filter((id) => id !== postId) : [...prev, postId];
      setToastMessage(isAlready ? 'Repost removed' : 'Reposted to your feed! 🔄');
      setTimeout(() => setToastMessage(null), 2500);
      return next;
    });
  };

  const ListHeader = (
    <>
      {/* Stories row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.storiesRow, { borderBottomColor: c.border }]}
        contentContainerStyle={styles.storiesContent}
      >
        {/* My story */}
        <TouchableOpacity style={styles.storyItem} activeOpacity={0.8}>
          <View style={[styles.storyRing, { borderColor: c.primary }]}>
            <View style={[styles.storyAvatar, { backgroundColor: c.primary + '25' }]}>
              <Ionicons name="add" size={22} color={c.primary} />
            </View>
          </View>
          <Text style={[styles.storyName, { color: c.textMuted }]}>Your Story</Text>
        </TouchableOpacity>
        {stories.map((s) => <StoryAvatar key={s.id} item={s} colors={c} />)}
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {/* Toast Notification */}
      {toastMessage && (
        <View style={[styles.toastContainer, { backgroundColor: c.card, borderColor: c.border }]}>
          <Ionicons name="checkmark-circle" size={18} color="#10b981" />
          <Text style={[styles.toastText, { color: c.text }]}>{toastMessage}</Text>
        </View>
      )}

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.logo, { color: c.text }]}>CAMPUS</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: c.card }]}
            onPress={() => router.push('/notifications')}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={c.text} />
            {notificationCount > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: c.primary }]}>
                <Text style={styles.notifBadgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: c.primary }]}
            onPress={() => router.push('/post')}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            isVisible={item.id === activePostId}
            colors={c}
            onOpenOptions={setOptionsModalPost}
            onShare={handleSharePost}
            onToggleRepost={handleToggleRepost}
            isReposted={repostedPostIds.includes(item.id)}
            isSaved={isSaved(item.id)}
            onToggleSave={toggleSave}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={<EmptyFeed colors={c} />}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
        maxToRenderPerBatch={4}
        windowSize={6}
        removeClippedSubviews
        initialNumToRender={3}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: c.border }]} />}
      />

      {/* Options Sheet Modal */}
      <Modal
        visible={optionsModalPost !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsModalPost(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setOptionsModalPost(null)}>
          <View
            style={[styles.sheetContent, { backgroundColor: c.card, borderColor: c.border }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.sheetHandle, { backgroundColor: c.textDim + '50' }]} />

            {optionsModalPost && (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetAuthorName, { color: c.text }]}>
                    {optionsModalPost.author.displayName}
                  </Text>
                  <Text style={[styles.sheetCaptionSnippet, { color: c.textMuted }]} numberOfLines={1}>
                    {optionsModalPost.caption}
                  </Text>
                </View>

                {/* Repost option */}
                <TouchableOpacity
                  style={[styles.sheetOption, { borderBottomColor: c.borderSubtle || c.border }]}
                  onPress={() => {
                    const p = optionsModalPost;
                    setOptionsModalPost(null);
                    handleToggleRepost(p.id);
                  }}
                >
                  <Ionicons
                    name={repostedPostIds.includes(optionsModalPost.id) ? 'repeat' : 'repeat-outline'}
                    size={22}
                    color={repostedPostIds.includes(optionsModalPost.id) ? '#10b981' : c.text}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.sheetOptionText,
                        { color: repostedPostIds.includes(optionsModalPost.id) ? '#10b981' : c.text },
                      ]}
                    >
                      {repostedPostIds.includes(optionsModalPost.id) ? 'Undo Repost' : 'Repost'}
                    </Text>
                    <Text style={[styles.sheetOptionSubtext, { color: c.textDim }]}>
                      {repostedPostIds.includes(optionsModalPost.id)
                        ? 'Remove this post from your profile'
                        : 'Instantly share this post with your followers'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Share via */}
                <TouchableOpacity
                  style={[styles.sheetOption, { borderBottomColor: c.borderSubtle || c.border }]}
                  onPress={() => {
                    const p = optionsModalPost;
                    setOptionsModalPost(null);
                    handleSharePost(p);
                  }}
                >
                  <Ionicons name="share-outline" size={22} color={c.text} />
                  <Text style={[styles.sheetOptionText, { color: c.text }]}>Share via...</Text>
                </TouchableOpacity>

                {/* Copy link */}
                <TouchableOpacity
                  style={[styles.sheetOption, { borderBottomColor: c.borderSubtle || c.border }]}
                  onPress={() => {
                    const p = optionsModalPost;
                    setOptionsModalPost(null);
                    handleCopyLink(p);
                  }}
                >
                  <Ionicons name="link-outline" size={22} color={c.text} />
                  <Text style={[styles.sheetOptionText, { color: c.text }]}>Copy Link</Text>
                </TouchableOpacity>

                {/* Save / Bookmark */}
                <TouchableOpacity
                  style={[styles.sheetOption, { borderBottomColor: c.borderSubtle || c.border }]}
                  onPress={() => {
                    const p = optionsModalPost;
                    setOptionsModalPost(null);
                    toggleSave(p.id);
                    setToastMessage(isSaved(p.id) ? 'Post removed from bookmarks' : 'Post saved to bookmarks! 🔖');
                    setTimeout(() => setToastMessage(null), 2500);
                  }}
                >
                  <Ionicons
                    name={isSaved(optionsModalPost.id) ? 'bookmark' : 'bookmark-outline'}
                    size={22}
                    color={isSaved(optionsModalPost.id) ? c.primary : c.text}
                  />
                  <Text
                    style={[
                      styles.sheetOptionText,
                      { color: isSaved(optionsModalPost.id) ? c.primary : c.text },
                    ]}
                  >
                    {isSaved(optionsModalPost.id) ? 'Remove from Saved' : 'Save Post'}
                  </Text>
                </TouchableOpacity>

                {/* View author profile */}
                <TouchableOpacity
                  style={[styles.sheetOption, { borderBottomColor: c.borderSubtle || c.border }]}
                  onPress={() => {
                    const authorId = optionsModalPost.author.id;
                    setOptionsModalPost(null);
                    if (authorId === currentUser.id) {
                      router.push('/(tabs)/profile');
                    } else {
                      router.push({ pathname: '/user-profile', params: { userId: authorId } });
                    }
                  }}
                >
                  <Ionicons name="person-outline" size={22} color={c.text} />
                  <Text style={[styles.sheetOptionText, { color: c.text }]}>
                    About @{optionsModalPost.author.username}
                  </Text>
                </TouchableOpacity>

                {/* Unfollow / Follow author */}
                {optionsModalPost.author.id !== currentUser.id && (
                  <TouchableOpacity
                    style={[styles.sheetOption, { borderBottomColor: c.borderSubtle || c.border }]}
                    onPress={() => {
                      const author = optionsModalPost.author;
                      setOptionsModalPost(null);
                      toggleFollow(author.id);
                      const isNowFollowing = !(followingByUserId[currentUser.id] || []).includes(author.id);
                      setToastMessage(isNowFollowing ? `Following @${author.username}` : `Unfollowed @${author.username}`);
                      setTimeout(() => setToastMessage(null), 2500);
                    }}
                  >
                    <Ionicons
                      name={(followingByUserId[currentUser.id] || []).includes(optionsModalPost.author.id) ? 'person-remove-outline' : 'person-add-outline'}
                      size={22}
                      color={c.text}
                    />
                    <Text style={[styles.sheetOptionText, { color: c.text }]}>
                      {(followingByUserId[currentUser.id] || []).includes(optionsModalPost.author.id)
                        ? `Unfollow @${optionsModalPost.author.username}`
                        : `Follow @${optionsModalPost.author.username}`}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Report */}
                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={() => {
                    setOptionsModalPost(null);
                    Alert.alert(
                      'Report Post',
                      'Thank you for reporting. Our campus moderation team will review this post within 24 hours to keep the community safe.',
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  <Ionicons name="flag-outline" size={22} color="#ef4444" />
                  <Text style={[styles.sheetOptionText, { color: '#ef4444' }]}>Report Post</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={[styles.sheetCancelBtn, { backgroundColor: c.background }]}
              onPress={() => setOptionsModalPost(null)}
            >
              <Text style={[styles.sheetCancelText, { color: c.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logo: { fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  headerRight: { flexDirection: 'row', gap: 10 },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: '#0a0a0a',
  },
  notifBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  storiesRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  storiesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  storyItem: { alignItems: 'center', width: 64 },
  storyRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  storyAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarImage: { width: 52, height: 52, borderRadius: 26 },
  storyInitial: { fontSize: 20, fontWeight: '700' },
  storyName: { fontSize: 11, fontWeight: '500', textAlign: 'center', width: 60 },
  // Post
  postCard: { paddingVertical: 4 },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  postAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  postAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarImage: { width: 38, height: 38, borderRadius: 19 },
  postAvatarInitial: { fontSize: 16, fontWeight: '700' },
  postAuthorMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postAuthorName: { fontSize: 14, fontWeight: '700' },
  postMeta: { fontSize: 12, marginTop: 1 },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  postHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repostedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
  },
  repostedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toastContainer: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    marginBottom: 16,
  },
  sheetAuthorName: {
    fontSize: 16,
    fontWeight: '800',
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
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
  postMediaWrap: { width, height: width, position: 'relative', overflow: 'hidden', backgroundColor: '#111' },
  postMediaPage: {},
  postMedia: { width: '100%', height: '100%' },
  videoSoundButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  videoSoundIcon: { marginLeft: 1 },
  mediaCounter: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.62)' },
  mediaCounterText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  carouselDotsRow: { height: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  carouselDot: { width: 6, height: 6, borderRadius: 3, opacity: 0.58 },
  carouselDotActive: { width: 16, opacity: 1 },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  postActionsWithoutDivider: { borderTopWidth: 0 },
  postActionsLeft: { flexDirection: 'row', gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount: { fontSize: 13, fontWeight: '600' },
  postCaption: { paddingHorizontal: 16, paddingBottom: 12 },
  captionText: { fontSize: 14, lineHeight: 20 },
  captionAuthor: { fontWeight: '700' },
  separator: { height: StyleSheet.hairlineWidth },
  // Empty state
  emptyState: { alignItems: 'center', paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});