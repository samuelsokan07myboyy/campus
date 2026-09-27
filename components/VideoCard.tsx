import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  Image,
  ScrollView,
  Pressable 
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { Post } from '@/types';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  isVisible: boolean; // Is this post currently visible in viewport
}

export function PostCard({ post, isVisible }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showFullCaption, setShowFullCaption] = useState(false);
  
  // Only auto-play videos when post is visible
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

  const handleLike = () => setIsLiked(!isLiked);
  const handleSave = () => setIsSaved(!isSaved);

  // Media carousel dots
  const hasMultipleMedia = post.mediaUrls.length > 1;
  const currentMedia = post.mediaUrls[currentMediaIndex];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
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
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
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
          <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={28} 
              color={isLiked ? "#ef4444" : "#fff"} 
            />
            <Text style={styles.actionText}>{formatNumber(post.likes + (isLiked ? 1 : 0))}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel={`Open ${post.comments} comments`}
            onPress={() => router.push({ pathname: '/post-comments', params: { postId: post.id } })}
          >
            <Ionicons name="chatbubble-outline" size={26} color="#fff" />
            <Text style={styles.actionText}>{formatNumber(post.comments)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="paper-plane-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSave}>
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={26} 
            color={isSaved ? "#38bdf8" : "#fff"} 
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
            <Ionicons name="location-outline" size={14} color="#38bdf8" />
            <Text style={styles.locationText}>{post.location.name}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.timeAgo}>2 hours ago</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a0a',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
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
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  username: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  schoolName: {
    color: '#6b7280',
    fontSize: 12,
  },
  mediaContainer: {
    width: width,
    height: width * 1.1, // Instagram 4:5 aspect ratio roughly
    backgroundColor: '#000',
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
    backgroundColor: '#38bdf8',
  },
  categoryTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  categoryText: {
    color: '#38bdf8',
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
    color: '#fff',
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
    color: '#fff',
    fontSize: 14,
  },
  boldText: {
    fontWeight: '700',
  },
  captionContainer: {
    marginBottom: 6,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  moreText: {
    color: '#6b7280',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    color: '#38bdf8',
    fontSize: 13,
  },
  timeAgo: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 4,
    textTransform: 'uppercase',
  },
});