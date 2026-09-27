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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { getUserById, SAMPLE_USERS, useApp } from '@/context/AppContext';
import { getSchoolBrand, SchoolLogo } from '@/constants/schoolBrand';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 1.5;
const NUM_COLUMNS = 3;
const GRID_SIZE = (width - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

function openProfileLink(profileLink: string) {
  const url = /^https?:\/\//i.test(profileLink) ? profileLink : `https://${profileLink}`;
  void Linking.openURL(url).catch(() => undefined);
}

const USER_POSTS: Record<string, { id: string; thumbnail: string; isVideo?: boolean }[]> = {
  'user-samuel-01': [
    { id: 'u1-p1', thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80' },
    { id: 'u1-p2', thumbnail: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80' },
    { id: 'u1-p3', thumbnail: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80' },
    { id: 'u1-p4', thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80', isVideo: true },
  ],
  'user-maya-01': [
    { id: 'm1-p1', thumbnail: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80' },
    { id: 'm1-p2', thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80' },
    { id: 'm1-p3', thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80' },
  ],
  'user-niko-01': [
    { id: 'n1-p1', thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80' },
    { id: 'n1-p2', thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80' },
  ],
  'user-ari-01': [
    { id: 'a1-p1', thumbnail: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80' },
    { id: 'a1-p2', thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80' },
    { id: 'a1-p3', thumbnail: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80' },
    { id: 'a1-p4', thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80' },
  ],
};

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string | string[] }>();
  const resolvedUserId = Array.isArray(userId) ? userId[0] : userId ?? SAMPLE_USERS[0].id;
  const { theme } = useTheme();
  const c = theme.colors;
  const { currentUser, followingByUserId, toggleFollow } = useApp();
  const [isAvatarPreviewOpen, setAvatarPreviewOpen] = useState(false);

  const user = useMemo(
    () => resolvedUserId === currentUser.id ? currentUser : getUserById(resolvedUserId),
    [currentUser, resolvedUserId],
  );
  const isOwnProfile = user.id === currentUser.id;
  const isFollowing = (followingByUserId[currentUser.id] ?? []).includes(user.id);
  const followingIds = followingByUserId[user.id] ?? [];
  const followerIds = Object.entries(followingByUserId)
    .filter(([, followedIds]) => followedIds.includes(user.id))
    .map(([followerId]) => followerId);
  const resolveProfileUser = (profileUserId: string) => profileUserId === currentUser.id ? currentUser : getUserById(profileUserId);
  const followingUsers = followingIds.map(resolveProfileUser);
  const followerUsers = followerIds.map(resolveProfileUser);
  const posts = USER_POSTS[user.id] ?? [];
  const profileLinks = user.links?.length ? user.links : user.link ? [user.link] : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.username, { color: c.text }]}>{user.displayName}</Text>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: c.card }]}>
          <Ionicons name="ellipsis-horizontal" size={20} color={c.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.profileSection, { borderBottomColor: c.border }]}> 
          <View style={styles.avatarStatsRow}>
            {/* Avatar */}
            <TouchableOpacity
              onPress={() => setAvatarPreviewOpen(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`View ${user.displayName}'s profile photo`}
              style={styles.avatarWrap}
            >
              <View style={[styles.avatar, { backgroundColor: c.primary + '25' }]}>
                {user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={36} color={c.primary} />
                )}
              </View>
            </TouchableOpacity>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: c.text }]}>{user.postsCount ?? posts.length}</Text>
                <Text style={[styles.statLabel, { color: c.textMuted }]}>Posts</Text>
              </View>
              <TouchableOpacity style={styles.statBox} onPress={() => router.push({ pathname: '/follow-list', params: { userId: user.id, listType: 'followers' } })} activeOpacity={0.7} accessibilityRole="button">
                <Text style={[styles.statValue, { color: c.text }]}>{followerUsers.length}</Text>
                <Text style={[styles.statLabel, { color: c.textMuted }]}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statBox} onPress={() => router.push({ pathname: '/follow-list', params: { userId: user.id, listType: 'following' } })} activeOpacity={0.7} accessibilityRole="button">
                <Text style={[styles.statValue, { color: c.text }]}>{followingUsers.length}</Text>
                <Text style={[styles.statLabel, { color: c.textMuted }]}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bioSection}>
            <View style={styles.nameRow}>
              <Text style={[styles.displayName, { color: c.text }]}>{user.displayName}</Text>
              {user.isVerified && <Ionicons name="checkmark-circle" size={16} color={c.primary} />}
            </View>
            {(user.major || user.year) && (
              <Text style={[styles.bioSchool, { color: c.primary }]}>
                {user.year ? `${user.year} · ` : ''}{user.major ?? 'Student'}
              </Text>
            )}
            {user.schoolName ? (() => {
              const brand = getSchoolBrand(user.schoolName);
              return (
                <View style={styles.schoolRow}>
                  <View style={[styles.schoolBadge, { backgroundColor: brand.logoBackground ?? brand.color, borderColor: brand.logoBorder ?? brand.accent }]}> 
                    <SchoolLogo logo={brand.logo} short={brand.short} accent={brand.accent} backgroundColor={brand.color} schoolName={user.schoolName} size={16} />
                  </View>
                  <Text style={[styles.bioSchool, { color: c.textMuted }]}>{user.schoolName}</Text>
                </View>
              );
            })() : null}
            {user.bio ? <Text style={[styles.bio, { color: c.textMuted }]}>{user.bio}</Text> : null}
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

            {user.badges && user.badges.length > 0 && (
              <View style={styles.badgesRow}>
                {user.badges.map((badge) => (
                  <View key={badge.id} style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
                    <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                    <Text style={[styles.badgeName, { color: badge.color }]}>{badge.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: isFollowing || isOwnProfile ? c.card : c.primary, borderColor: c.border }, (isFollowing || isOwnProfile) && { borderWidth: StyleSheet.hairlineWidth }]}
              onPress={() => isOwnProfile ? router.push('/edit-profile') : toggleFollow(user.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryBtnText, (isFollowing || isOwnProfile) && { color: c.text }]}>
                {isOwnProfile ? 'Edit Profile' : isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.secondaryBtnText, { color: c.text }]}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {posts.length > 0 ? (
          <View style={styles.grid}>
            {posts.map((post, index) => (
              <TouchableOpacity
                key={post.id}
                style={styles.gridItem}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/post-detail',
                    params: {
                      postId: post.id,
                      postIds: posts.map((p) => p.id).join(','),
                      initialIndex: String(index),
                    },
                  })
                }
              >
                <Image source={{ uri: post.thumbnail }} style={styles.gridImage} resizeMode="cover" />
                {post.isVideo && (
                  <View style={styles.gridVideoIcon}>
                    <Ionicons name="videocam" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyGrid}>
            <Ionicons name="images-outline" size={48} color={c.textDim} />
            <Text style={[styles.emptyGridTitle, { color: c.text }]}>No posts yet</Text>
            <Text style={[styles.emptyGridSub, { color: c.textMuted }]}>This profile hasn’t shared anything yet.</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={isAvatarPreviewOpen} transparent animationType="fade" onRequestClose={() => setAvatarPreviewOpen(false)}>
        <Pressable style={styles.avatarPreviewBackdrop} onPress={() => setAvatarPreviewOpen(false)} accessibilityLabel="Close profile photo">
          <View pointerEvents="none" style={styles.avatarPreviewClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </View>
          <View style={styles.avatarPreviewCard}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarPreviewImage} resizeMode="cover" />
            ) : (
              <View style={[styles.avatarPreviewFallback, { backgroundColor: c.primary }]}>
                <Ionicons name="person" size={88} color="#fff" />
              </View>
            )}
            <View style={styles.avatarPreviewMeta}>
              <Text style={styles.avatarPreviewName}>{user.displayName}</Text>
              <Text style={styles.avatarPreviewUsername}>@{user.username}</Text>
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  username: { fontSize: 17, fontWeight: '800' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  profileSection: { paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  avatarStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarWrap: { marginRight: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarPreviewBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  avatarPreviewClose: { position: 'absolute', top: 56, right: 22, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  avatarPreviewCard: { alignItems: 'center', justifyContent: 'center' },
  avatarPreviewImage: { width: Math.min(width * 0.76, 290), height: Math.min(width * 0.76, 290), borderRadius: Math.min(width * 0.76, 290) / 2, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarPreviewFallback: { width: Math.min(width * 0.76, 290), height: Math.min(width * 0.76, 290), borderRadius: Math.min(width * 0.76, 290) / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarPreviewMeta: { alignItems: 'center', marginTop: 18 },
  avatarPreviewName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  avatarPreviewUsername: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2, fontWeight: '600' },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statBox: { alignItems: 'center', gap: 3, flex: 1 },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
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
  link: { fontSize: 13, fontWeight: '600' },
  linkItemsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 20 },
  linkItem: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 240 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeEmoji: { fontSize: 12 },
  badgeName: { fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  primaryBtn: { flex: 1, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  secondaryBtn: { flex: 1, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  secondaryBtnText: { fontWeight: '700', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: COLUMN_GAP },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE },
  gridImage: { width: '100%', height: '100%' },
  gridVideoIcon: { position: 'absolute', top: 6, right: 6 },
  emptyGrid: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 40, gap: 8 },
  emptyGridTitle: { fontSize: 18, fontWeight: '800', marginTop: 12 },
  emptyGridSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
