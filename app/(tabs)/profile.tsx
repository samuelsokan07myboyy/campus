import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  Modal,
  Pressable,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useState, useMemo, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { getUserById, useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { getSchoolBrand, SchoolLogo } from '@/constants/schoolBrand';
import { fetchLocalPosts } from '@/services/postsService';
import type { Post } from '@/types';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 1.5;
const NUM_COLUMNS = 3;
const GRID_SIZE = (width - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

function openProfileLink(profileLink: string) {
  const url = /^https?:\/\//i.test(profileLink) ? profileLink : `https://${profileLink}`;
  void Linking.openURL(url).catch(() => undefined);
}

// All known post thumbnails — used to look up saved post thumbs
const POST_THUMBNAIL_MAP: Record<string, { thumbnail: string; isVideo?: boolean }> = {
  'post-1': { thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80' },
  'post-2': { thumbnail: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80' },
  'post-3': { thumbnail: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80' },
  'post-4': { thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80', isVideo: true },
  'post-5': { thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80' },
  'post-6': { thumbnail: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80' },
  'u1-p1': { thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80' },
  'u1-p2': { thumbnail: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80' },
  'u1-p3': { thumbnail: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80' },
  'u1-p4': { thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80', isVideo: true },
  'm1-p1': { thumbnail: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80' },
  'm1-p2': { thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80' },
  'm1-p3': { thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80' },
  'n1-p1': { thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80' },
  'n1-p2': { thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80' },
  'a1-p1': { thumbnail: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80' },
  'a1-p2': { thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80' },
  'a1-p3': { thumbnail: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80' },
  'a1-p4': { thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80' },
};

type ProfileTab = 'posts' | 'saved';

function ProfileVideoThumbnail({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.muted = true;
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
  });

  return <VideoView player={player} style={styles.gridImage} contentFit="cover" nativeControls={false} />;
}

function StatBox({ value, label, colors, onPress }: { value: string | number; label: string; colors: any; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.statBox} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { currentUser, followingByUserId, savedPostIds } = useApp();
  const { theme } = useTheme();
  const c = theme.colors;
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  const [isAvatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const followingIds = followingByUserId[currentUser.id] ?? [];
  const followerIds = Object.entries(followingByUserId)
    .filter(([, followedIds]) => followedIds.includes(currentUser.id))
    .map(([followerId]) => followerId);
  const followingUsers = followingIds.map((userId) => getUserById(userId));
  const followerUsers = followerIds.map((userId) => getUserById(userId));
  const profileLinks = currentUser.links?.length ? currentUser.links : currentUser.link ? [currentUser.link] : [];

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      void fetchLocalPosts().then((posts) => {
        if (isActive) setLocalPosts(posts);
      });
      return () => {
        isActive = false;
      };
    }, []),
  );

  const savedPosts = useMemo(() => {
    return (savedPostIds ?? []).map((id) => {
      const found = POST_THUMBNAIL_MAP[id];
      return {
        id,
        thumbnail: found?.thumbnail ?? 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
        isVideo: found?.isVideo ?? false,
      };
    });
  }, [savedPostIds]);

  const userPosts = useMemo(() => {
    return localPosts
      .filter((post) => post.author.id === currentUser.id && post.mediaUrls[0])
      .map((post) => ({
        id: post.id,
        thumbnail: post.mediaUrls[0],
        isVideo: post.mediaTypes?.[0] === 'video' || post.type === 'video',
      }));
  }, [currentUser.id, localPosts]);

  const displayedPosts = activeTab === 'posts' ? userPosts : savedPosts;

  const handleShareProfile = async () => {
    const profileUrl = `campus://user-profile?userId=${encodeURIComponent(currentUser.id)}`;
    try {
      await Share.share({
        title: `${currentUser.displayName} on CAMPUS`,
        message: `Check out ${currentUser.displayName}'s profile on CAMPUS: ${profileUrl}`,
        url: profileUrl,
      });
    } catch {
      // The system share sheet can be dismissed without completing a share.
    }
  };

  const tabs: { key: ProfileTab; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'posts', icon: 'grid-outline', iconActive: 'grid' },
    { key: 'saved', icon: 'bookmark-outline', iconActive: 'bookmark' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.username, { color: c.text }]}>@{currentUser.username}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: c.card }]}
            onPress={() => router.push('/post')}
          >
            <Ionicons name="add-outline" size={22} color={c.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: c.card }]}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="menu-outline" size={22} color={c.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile section */}
        <View style={[styles.profileSection, { borderBottomColor: c.border }]}>
          {/* Avatar + Stats */}
          <View style={styles.avatarStatsRow}>
            {/* Avatar with gradient ring */}
            <View style={styles.avatarAction}>
              <TouchableOpacity
                onPress={() => setAvatarPreviewOpen(true)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="View profile photo"
              >
                <View style={[styles.avatar, { backgroundColor: c.primary + '25' }]}>
                  {currentUser.avatar ? (
                    <Image source={{ uri: currentUser.avatar }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={40} color={c.primary} />
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBadge, { backgroundColor: c.primary }]}
                onPress={() => router.push('/edit-profile')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <Ionicons name="pencil" size={10} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <StatBox value={userPosts.length} label="Posts" colors={c} />
              <StatBox
                value={followerUsers.length}
                label="Followers"
                colors={c}
                onPress={() => router.push({ pathname: '/follow-list', params: { userId: currentUser.id, listType: 'followers' } })}
              />
              <StatBox
                value={followingUsers.length}
                label="Following"
                colors={c}
                onPress={() => router.push({ pathname: '/follow-list', params: { userId: currentUser.id, listType: 'following' } })}
              />
            </View>
          </View>

          {/* Name & bio */}
          <View style={styles.bioSection}>
            <View style={styles.nameRow}>
              <Text style={[styles.displayName, { color: c.text }]}>{currentUser.displayName}</Text>
              {currentUser.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color={c.primary} />
              )}
            </View>
            {(currentUser.major || currentUser.year) && (
              <Text style={[styles.bioSchool, { color: c.primary }]}>
                {currentUser.year} · {currentUser.major}
              </Text>
            )}
            {currentUser.schoolName ? (() => {
              const brand = getSchoolBrand(currentUser.schoolName);
              return (
                <View style={styles.schoolRow}>
                  <View style={[styles.schoolBadge, { backgroundColor: brand.logoBackground ?? brand.color, borderColor: brand.logoBorder ?? brand.accent }]}> 
                    <SchoolLogo logo={brand.logo} short={brand.short} accent={brand.accent} backgroundColor={brand.color} schoolName={currentUser.schoolName} size={16} />
                  </View>
                  <Text style={[styles.bioSchool, { color: c.textMuted }]}>{currentUser.schoolName}</Text>
                </View>
              );
            })() : null}
            {currentUser.bio ? (
              <Text style={[styles.bio, { color: c.textMuted }]}>{currentUser.bio}</Text>
            ) : null}
            {profileLinks.length > 0 ? (
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.linkItemsRow}
              >
                {profileLinks.map((profileLink, index) => (
                  <TouchableOpacity
                    key={`profile-link-${index}`}
                    style={styles.linkItem}
                    onPress={() => openProfileLink(profileLink)}
                    accessibilityRole="link"
                    accessibilityLabel={profileLink}
                  >
                    <Ionicons name="link-outline" size={14} color={c.secondary} />
                    <Text style={[styles.link, { color: c.secondary }]} numberOfLines={1}>
                      {profileLink.replace(/^https?:\/\//i, '')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}

            {currentUser.badges.length > 0 && (
              <View style={styles.badgesRow}>
                {currentUser.badges.map((badge) => (
                  <View key={badge.id} style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
                    <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                    <Text style={[styles.badgeName, { color: badge.color }]}>{badge.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: c.card, borderColor: c.border }]}
              onPress={() => router.push('/edit-profile')}
              activeOpacity={0.8}
            >
              <Text style={[styles.editBtnText, { color: c.text }]}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareBtn, { backgroundColor: c.card, borderColor: c.border }]}
              onPress={() => void handleShareProfile()}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Share profile"
            >
              <Ionicons name="share-outline" size={18} color={c.text} />
              <Text style={[styles.shareBtnText, { color: c.text }]}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Grid tabs */}
        <View style={[styles.tabs, { borderBottomColor: c.border }]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={activeTab === tab.key ? tab.iconActive : tab.icon}
                size={22}
                color={activeTab === tab.key ? c.primary : c.textDim}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid / Empty state */}
        {displayedPosts.length === 0 ? (
          <View style={styles.emptyGrid}>
            <Ionicons name={activeTab === 'posts' ? 'images-outline' : 'bookmark-outline'} size={48} color={c.textDim} />
            <Text style={[styles.emptyGridTitle, { color: c.text }]}>
              {activeTab === 'posts' ? 'No posts yet' : 'Nothing saved'}
            </Text>
            <Text style={[styles.emptyGridSub, { color: c.textMuted }]}>
              {activeTab === 'posts'
                ? 'Share your first moment with your campus'
                : 'Save posts to find them here later'}
            </Text>
            {activeTab === 'posts' && (
              <TouchableOpacity
                style={[styles.emptyGridBtn, { backgroundColor: c.primary }]}
                onPress={() => router.push('/post')}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.emptyGridBtnText}>Create Post</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.grid}>
            {displayedPosts.map((post, index) => (
              <TouchableOpacity
                key={post.id}
                style={styles.gridItem}
                onPress={() =>
                  router.push({
                    pathname: '/post-detail',
                    params: {
                      postId: post.id,
                      postIds: displayedPosts.map((p) => p.id).join(','),
                      initialIndex: String(index),
                    },
                  })
                }
                activeOpacity={0.85}
              >
                {post.isVideo ? (
                  <ProfileVideoThumbnail uri={post.thumbnail} />
                ) : (
                  <Image source={{ uri: post.thumbnail }} style={styles.gridImage} resizeMode="cover" />
                )}
                {post.isVideo && (
                  <View style={styles.gridVideoIcon}>
                    <Ionicons name="videocam" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal
        visible={isAvatarPreviewOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarPreviewOpen(false)}
      >
        <Pressable
          style={styles.avatarPreviewBackdrop}
          onPress={() => setAvatarPreviewOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close profile photo"
        >
          <View pointerEvents="none" style={styles.avatarPreviewClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </View>
          <View style={styles.avatarPreviewCard}>
            {currentUser.avatar ? (
              <Image source={{ uri: currentUser.avatar }} style={styles.avatarPreviewImage} resizeMode="cover" />
            ) : (
              <View style={[styles.avatarPreviewFallback, { backgroundColor: c.primary }]}>
                <Ionicons name="person" size={88} color="#fff" />
              </View>
            )}
            <View style={styles.avatarPreviewMeta}>
              <Text style={styles.avatarPreviewName}>{currentUser.displayName}</Text>
              <Text style={styles.avatarPreviewUsername}>@{currentUser.username}</Text>
            </View>
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
  username: { fontSize: 17, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  profileSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarStatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 16 },
  avatarAction: { position: 'relative', marginRight: 20 },
  avatar: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 76, height: 76, borderRadius: 38 },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPreviewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  avatarPreviewClose: { position: 'absolute', top: 56, right: 22, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  avatarPreviewCard: { alignItems: 'center', justifyContent: 'center' },
  avatarPreviewImage: { width: Math.min(width * 0.76, 290), height: Math.min(width * 0.76, 290), borderRadius: Math.min(width * 0.76, 290) / 2, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarPreviewFallback: { width: Math.min(width * 0.76, 290), height: Math.min(width * 0.76, 290), borderRadius: Math.min(width * 0.76, 290) / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarPreviewMeta: { alignItems: 'center', marginTop: 18 },
  avatarPreviewName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  avatarPreviewUsername: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2, fontWeight: '600' },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 12, fontWeight: '500' },
  bioSection: { gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  displayName: { fontSize: 16, fontWeight: '800' },
  schoolRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  schoolBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  schoolLogo: {
    width: 18,
    height: 18,
    borderRadius: 6,
  },
  schoolBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  bioSchool: { fontSize: 13, fontWeight: '600' },
  bio: { fontSize: 14, lineHeight: 20 },
  link: { fontSize: 15, fontWeight: '600' },
  linkItemsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 20 },
  linkItem: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 240 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeEmoji: { fontSize: 12 },
  badgeName: { fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  editBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  editBtnText: { fontSize: 14, fontWeight: '700' },
  shareBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  shareBtnText: { fontSize: 14, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: COLUMN_GAP },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE },
  gridImage: { width: '100%', height: '100%' },
  gridVideoIcon: { position: 'absolute', top: 6, right: 6 },
  emptyGrid: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 40, gap: 8 },
  emptyGridTitle: { fontSize: 18, fontWeight: '800', marginTop: 12 },
  emptyGridSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyGridBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyGridBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});