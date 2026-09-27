import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserById, useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { getSchoolBrand, SchoolLogo } from '@/constants/schoolBrand';

export default function FollowListScreen() {
  const { userId, listType } = useLocalSearchParams<{ userId?: string | string[]; listType?: string | string[] }>();
  const { currentUser, followingByUserId, toggleFollow } = useApp();
  const { theme } = useTheme();
  const c = theme.colors;

  const resolvedUserId = Array.isArray(userId) ? userId[0] : userId ?? currentUser.id;
  const initialType = (Array.isArray(listType) ? listType[0] : listType) === 'following' ? 'following' : 'followers';
  const [currentTab, setCurrentTab] = useState<'followers' | 'following'>(initialType);
  const [searchQuery, setSearchQuery] = useState('');

  const profileUser = useMemo(
    () => (resolvedUserId === currentUser.id ? currentUser : getUserById(resolvedUserId)),
    [currentUser, resolvedUserId],
  );

  const myFollowingList = followingByUserId[currentUser.id] ?? [];
  const profileFollowingIds = followingByUserId[profileUser.id] ?? [];
  const profileFollowerIds = useMemo(() => {
    return Object.entries(followingByUserId)
      .filter(([, followedIds]) => followedIds.includes(profileUser.id))
      .map(([followerId]) => followerId);
  }, [followingByUserId, profileUser.id]);

  const activeIds = currentTab === 'following' ? profileFollowingIds : profileFollowerIds;

  const displayedUsers = useMemo(() => {
    const list = activeIds.map((id) => (id === currentUser.id ? currentUser : getUserById(id)));
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.schoolName && u.schoolName.toLowerCase().includes(q)) ||
        (u.major && u.major.toLowerCase().includes(q)),
    );
  }, [activeIds, currentUser, searchQuery]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: c.text }]}>
            {currentTab === 'followers' ? 'Followers' : 'Following'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: c.textMuted }]}>@{profileUser.username}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: c.border }]}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setCurrentTab('followers')}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentTab === 'followers' }}
        >
          <Text
            style={[
              styles.tabText,
              { color: currentTab === 'followers' ? c.text : c.textMuted },
              currentTab === 'followers' && styles.tabTextActive,
            ]}
          >
            {profileFollowerIds.length} Followers
          </Text>
          {currentTab === 'followers' && <View style={[styles.tabIndicator, { backgroundColor: c.primary }]} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setCurrentTab('following')}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentTab === 'following' }}
        >
          <Text
            style={[
              styles.tabText,
              { color: currentTab === 'following' ? c.text : c.textMuted },
              currentTab === 'following' && styles.tabTextActive,
            ]}
          >
            {profileFollowingIds.length} Following
          </Text>
          {currentTab === 'following' && <View style={[styles.tabIndicator, { backgroundColor: c.primary }]} />}
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: c.card, borderColor: c.border }]}>
          <Ionicons name="search" size={17} color={c.textMuted} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${currentTab}...`}
            placeholderTextColor={c.textMuted}
            style={[styles.searchInput, { color: c.text }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={17} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={displayedUsers}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, displayedUsers.length === 0 && styles.listContentEmpty]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name={searchQuery ? 'search-outline' : 'people-outline'}
              size={44}
              color={c.textMuted}
            />
            <Text style={[styles.emptyTitle, { color: c.text }]}>
              {searchQuery ? 'No results found' : `No ${currentTab} yet`}
            </Text>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>
              {searchQuery
                ? `Couldn’t find any student matching "${searchQuery}".`
                : currentTab === 'followers'
                  ? 'People who follow this profile will appear here.'
                  : 'Profiles this student follows will appear here.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMe = item.id === currentUser.id;
          const isFollowingUser = myFollowingList.includes(item.id);
          const brand = item.schoolName ? getSchoolBrand(item.schoolName) : null;

          return (
            <TouchableOpacity
              style={[styles.userRow, { borderBottomColor: c.border }]}
              onPress={() => router.push({ pathname: '/user-profile', params: { userId: item.id } })}
              activeOpacity={0.75}
            >
              <View style={[styles.avatarWrap, { backgroundColor: c.primary + '20' }]}>
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                  <Ionicons name="person" size={22} color={c.primary} />
                )}
              </View>

              <View style={styles.userInfo}>
                <View style={styles.userNameRow}>
                  <Text style={[styles.displayName, { color: c.text }]} numberOfLines={1}>
                    {item.displayName}
                  </Text>
                  {item.isVerified && (
                    <Ionicons name="checkmark-circle" size={14} color={c.primary} style={{ marginLeft: 3 }} />
                  )}
                </View>

                <View style={styles.userMetaRow}>
                  <Text style={[styles.username, { color: c.textMuted }]} numberOfLines={1}>
                    @{item.username}
                  </Text>
                  {item.schoolName && (
                    <>
                      <Text style={[styles.metaDot, { color: c.textMuted }]}>·</Text>
                      {brand && (
                        <View
                          style={[
                            styles.miniSchoolBadge,
                            {
                              backgroundColor: brand.logoBackground ?? brand.color,
                              borderColor: brand.logoBorder ?? brand.accent,
                            },
                          ]}
                        >
                          <SchoolLogo
                            logo={brand.logo}
                            short={brand.short}
                            accent={brand.accent}
                            backgroundColor={brand.color}
                            schoolName={item.schoolName}
                            size={10}
                          />
                        </View>
                      )}
                      <Text style={[styles.schoolName, { color: c.textMuted }]} numberOfLines={1}>
                        {brand?.short ?? item.schoolName}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {!isMe && (
                <TouchableOpacity
                  style={[
                    styles.followBtn,
                    isFollowingUser
                      ? [styles.followingBtn, { borderColor: c.border, backgroundColor: c.card }]
                      : [styles.followPrimaryBtn, { backgroundColor: c.primary }],
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleFollow(item.id);
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.followBtnText,
                      isFollowingUser ? { color: c.text } : { color: '#fff' },
                    ]}
                  >
                    {isFollowingUser ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitleWrap: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  headerSubtitle: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  headerSpacer: { width: 40 },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tabText: { fontSize: 13, fontWeight: '600' },
  tabTextActive: { fontWeight: '800' },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 24,
    right: 24,
    height: 2.5,
    borderRadius: 1.5,
  },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBar: {
    height: 38,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, height: '100%', paddingVertical: 0 },
  listContent: { paddingBottom: 32 },
  listContentEmpty: { flexGrow: 1, justifyContent: 'center' },
  userRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  userInfo: { flex: 1, marginRight: 10, justifyContent: 'center' },
  userNameRow: { flexDirection: 'row', alignItems: 'center' },
  displayName: { fontSize: 14, fontWeight: '700' },
  userMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  username: { fontSize: 12 },
  metaDot: { fontSize: 12, marginHorizontal: 4 },
  miniSchoolBadge: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  schoolName: { fontSize: 11, fontWeight: '500' },
  followBtn: {
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followPrimaryBtn: {},
  followingBtn: { borderWidth: StyleSheet.hairlineWidth },
  followBtnText: { fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
});