import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  Image,
  Share,
  Modal,
  Pressable,
  Alert
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import type { ThemeColors } from '@/constants/theme';
import type { Post } from '@/types';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  isVisible: boolean;
}

export function PostCard({ post, isVisible }: PostCardProps) {
  const { theme } = useTheme();
  const { toggleSave, isSaved: checkIsSaved, toggleFollow, followingByUserId, currentUser } = useApp();
  const styles = getStyles(theme.colors, theme.dark);
  
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isSaved, setIsSaved] = useState(post.isSaved || checkIsSaved(post.id));
  const [isReposted, setIsReposted] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showFullCaption, setShowFullCaption] = useState(false);
  
  const isVideo = post.type === 'video';
  const player = useVideoPlayer(
    isVideo ? post.mediaUrls[0] : '', 
    player => {
      player.loop = true;
    }
  );

  useEffect(() => {
    if (isVideo) {
      if (isVisible) {
        player.play();
      } else {
        player.pause();
        player.currentTime = 0;
      }
    }
  }, [isVisible, isVideo]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://campus.app/p/${post.id}`;
      await Share.share({
        message: `${post.author.displayName} on CAMPUS: "${post.caption}"\n${shareUrl}`,
        url: shareUrl,
        title: `CAMPUS - Post by ${post.author.displayName}`,
      });
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        console.warn('Share error:', err);
      }
    }
  };

  const handleToggleSave = () => {
    toggleSave(post.id);
    setIsSaved(!isSaved);
  };

  const handleToggleRepost = () => {
    setIsReposted(!isReposted);
    Alert.alert(
      isReposted ? 'Repost Removed' : 'Reposted! 🔄',
      isReposted ? 'Post removed from your profile.' : 'This post has been shared with your followers.'
    );
  };

  const hasMultipleMedia = post.mediaUrls.length > 1;
  const currentMedia = post.mediaUrls[currentMediaIndex];

  return (
    <View style={styles.container}>
      {/* Repost Badge */}
      {isReposted && (
        <View style={styles.repostedHeader}>
          <Ionicons name="repeat" size={13} color="#10b981" />
          <Text style={styles.repostedText}>You reposted</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => router.push({ pathname: '/user-profile', params: { userId: post.author.id } })}
        >
          <View style={styles.avatar}>
            {post.author.avatar ? (
              <Image source={{ uri: post.author.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{post.author.displayName[0]}</Text>
            )}
          </View>
          <View>
            <Text style={styles.username}>{post.author.displayName}</Text>
            <Text style={styles.schoolName}>{post.author.schoolName}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => setOptionsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Post options"
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Media Content */}
      <View style={styles.mediaContainer}>
        {post.type === 'image' ? (
          <Image 
            source={{ uri: currentMedia }} 
            style={styles.media} 
            resizeMode="cover"
          />
        ) : (
          <VideoView
            player={player}
            style={styles.media}
            contentFit="cover"
          />
        )}
        
        {/* Carousel Indicators */}
        {hasMultipleMedia && (
          <View style={styles.carouselDots}>
            {post.mediaUrls.map((_, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.dot, 
                  idx === currentMediaIndex && styles.dotActive
                ]} 
              />
            ))}
          </View>
        )}

        {/* Category Tag */}
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{post.category}</Text>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.leftActions}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => setIsLiked(!isLiked)}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={26} 
              color={isLiked ? theme.colors.danger : theme.colors.text} 
            />
            <Text style={styles.actionText}>{formatNumber(post.likes + (isLiked && !post.isLiked ? 1 : 0))}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel={`Open ${post.comments} comments`}
            onPress={() => router.push({ pathname: '/post-comments', params: { postId: post.id } })}
          >
            <Ionicons name="chatbubble-outline" size={24} color={theme.colors.text} />
            <Text style={styles.actionText}>{formatNumber(post.comments)}</Text>
          </TouchableOpacity>

          {/* Repost Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleToggleRepost}
            accessibilityRole="button"
            accessibilityLabel="Repost"
          >
            <Ionicons
              name={isReposted ? "repeat" : "repeat-outline"}
              size={24}
              color={isReposted ? "#10b981" : theme.colors.text}
            />
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share post"
          >
            <Ionicons name="paper-plane-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={handleToggleSave}
        >
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={isSaved ? theme.colors.primary : theme.colors.text} 
          />
        </TouchableOpacity>
      </View>

      {/* Caption & Info */}
      <View style={styles.infoSection}>
        <View style={styles.likesRow}>
          <Text style={styles.likesText}>
            Liked by <Text style={styles.boldText}>campus_crush</Text> and {formatNumber(post.likes)} others
          </Text>
        </View>

        <View style={styles.captionContainer}>
          <Text style={styles.caption} numberOfLines={showFullCaption ? undefined : 2}>
            <Text style={styles.boldText}>{post.author.displayName} </Text>
            {post.caption}
          </Text>
          {post.caption.length > 100 && (
            <TouchableOpacity onPress={() => setShowFullCaption(!showFullCaption)}>
              <Text style={styles.moreText}>
                {showFullCaption ? 'less' : 'more'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {post.location && (
          <TouchableOpacity style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.locationText}>{post.location.name}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.timeAgo}>2 hours ago</Text>
      </View>

      {/* Options Modal Sheet */}
      <Modal
        visible={optionsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setOptionsOpen(false)}>
          <View
            style={[styles.sheetContent, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.sheetHandle, { backgroundColor: theme.colors.textDim + '50' }]} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetAuthorName, { color: theme.colors.text }]}>
                {post.author.displayName}
              </Text>
              <Text style={[styles.sheetCaptionSnippet, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {post.caption}
              </Text>
            </View>

            {/* Repost option */}
            <TouchableOpacity
              style={[styles.sheetOption, { borderBottomColor: theme.colors.borderSubtle || theme.colors.border }]}
              onPress={() => {
                setOptionsOpen(false);
                handleToggleRepost();
              }}
            >
              <Ionicons
                name={isReposted ? "repeat" : "repeat-outline"}
                size={22}
                color={isReposted ? "#10b981" : theme.colors.text}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.sheetOptionText,
                    { color: isReposted ? "#10b981" : theme.colors.text },
                  ]}
                >
                  {isReposted ? "Undo Repost" : "Repost"}
                </Text>
                <Text style={[styles.sheetOptionSubtext, { color: theme.colors.textDim }]}>
                  {isReposted ? "Remove from your profile" : "Share this post with your followers"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Share via */}
            <TouchableOpacity
              style={[styles.sheetOption, { borderBottomColor: theme.colors.borderSubtle || theme.colors.border }]}
              onPress={() => {
                setOptionsOpen(false);
                handleShare();
              }}
            >
              <Ionicons name="share-outline" size={22} color={theme.colors.text} />
              <Text style={[styles.sheetOptionText, { color: theme.colors.text }]}>Share via...</Text>
            </TouchableOpacity>

            {/* Save / Bookmark */}
            <TouchableOpacity
              style={[styles.sheetOption, { borderBottomColor: theme.colors.borderSubtle || theme.colors.border }]}
              onPress={() => {
                setOptionsOpen(false);
                handleToggleSave();
              }}
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={22}
                color={isSaved ? theme.colors.primary : theme.colors.text}
              />
              <Text
                style={[
                  styles.sheetOptionText,
                  { color: isSaved ? theme.colors.primary : theme.colors.text },
                ]}
              >
                {isSaved ? "Remove from Saved" : "Save Post"}
              </Text>
            </TouchableOpacity>

            {/* View author profile */}
            <TouchableOpacity
              style={[styles.sheetOption, { borderBottomColor: theme.colors.borderSubtle || theme.colors.border }]}
              onPress={() => {
                setOptionsOpen(false);
                if (post.author.id === currentUser.id) {
                  router.push('/(tabs)/profile');
                } else {
                  router.push({ pathname: '/user-profile', params: { userId: post.author.id } });
                }
              }}
            >
              <Ionicons name="person-outline" size={22} color={theme.colors.text} />
              <Text style={[styles.sheetOptionText, { color: theme.colors.text }]}>
                About @{post.author.username}
              </Text>
            </TouchableOpacity>

            {/* Report */}
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                setOptionsOpen(false);
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

            <TouchableOpacity
              style={[styles.sheetCancelBtn, { backgroundColor: theme.colors.background }]}
              onPress={() => setOptionsOpen(false)}
            >
              <Text style={[styles.sheetCancelText, { color: theme.colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  repostedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
  },
  repostedText: {
    color: '#10b981',
    fontSize: 12,
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
  container: {
    backgroundColor: colors.background,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarText: {
    color: isDark ? '#000' : '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  username: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  schoolName: {
    color: colors.textMuted,
    fontSize: 12,
  },
  mediaContainer: {
    width: width,
    height: width * 1.1,
    backgroundColor: isDark ? '#000' : '#f3f4f6',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  carouselDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  categoryTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  categoryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  actionText: {
    color: colors.text,
    fontSize: 13,
    marginLeft: 2,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  likesRow: {
    marginBottom: 6,
  },
  likesText: {
    color: colors.text,
    fontSize: 14,
  },
  boldText: {
    fontWeight: '700',
  },
  captionContainer: {
    marginBottom: 6,
  },
  caption: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  moreText: {
    color: colors.textMuted,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    color: colors.primary,
    fontSize: 13,
  },
  timeAgo: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    textTransform: 'uppercase',
  },
});