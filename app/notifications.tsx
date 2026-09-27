import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp, AppNotification, NotificationType } from '@/context/AppContext';

export type FilterTab = 'all' | 'events' | 'jobs' | 'like' | 'comment' | 'followers' | 'system';

interface CategoryConfig {
  id: FilterTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'all', label: 'All', icon: 'layers-outline' },
  { id: 'events', label: 'Events', icon: 'calendar-outline' },
  { id: 'jobs', label: 'Jobs', icon: 'briefcase-outline' },
  { id: 'like', label: 'Like', icon: 'heart-outline' },
  { id: 'comment', label: 'Comment', icon: 'chatbubble-outline' },
  { id: 'followers', label: 'New Followers', icon: 'person-add-outline' },
  { id: 'system', label: 'System', icon: 'shield-checkmark-outline' },
];

function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w`;
  } catch {
    return 'now';
  }
}

const TYPE_CONFIG: Record<NotificationType, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  event: { icon: 'calendar', color: '#8b5cf6', bg: '#8b5cf622' },
  job: { icon: 'briefcase', color: '#06b6d4', bg: '#06b6d422' },
  like: { icon: 'heart', color: '#f43f5e', bg: '#f43f5e22' },
  comment: { icon: 'chatbubble', color: '#3b82f6', bg: '#3b82f622' },
  follow: { icon: 'person-add', color: '#0ea5e9', bg: '#0ea5e922' },
  system: { icon: 'shield-checkmark', color: '#6366f1', bg: '#6366f122' },
  study_invite: { icon: 'book', color: '#10b981', bg: '#10b98122' },
  badge: { icon: 'trophy', color: '#f59e0b', bg: '#f59e0b22' },
  vibe: { icon: 'sparkles', color: '#ec4899', bg: '#ec489922' },
};

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const {
    notifications,
    notificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    followingByUserId,
    toggleFollow,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  const myFollowingList = currentUser ? followingByUserId[currentUser.id] ?? [] : [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((res) => setTimeout(res, 600));
    setRefreshing(false);
  }, []);

  const getTabCount = useCallback((tabId: FilterTab) => {
    switch (tabId) {
      case 'all':
        return notifications.length;
      case 'events':
        return notifications.filter((n) => n.type === 'event' || n.type === 'vibe' || n.type === 'study_invite').length;
      case 'jobs':
        return notifications.filter((n) => n.type === 'job').length;
      case 'like':
        return notifications.filter((n) => n.type === 'like').length;
      case 'comment':
        return notifications.filter((n) => n.type === 'comment').length;
      case 'followers':
        return notifications.filter((n) => n.type === 'follow').length;
      case 'system':
        return notifications.filter((n) => n.type === 'system' || n.type === 'badge').length;
      default:
        return 0;
    }
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'events':
        return notifications.filter((n) => n.type === 'event' || n.type === 'vibe' || n.type === 'study_invite');
      case 'jobs':
        return notifications.filter((n) => n.type === 'job');
      case 'like':
        return notifications.filter((n) => n.type === 'like');
      case 'comment':
        return notifications.filter((n) => n.type === 'comment');
      case 'followers':
        return notifications.filter((n) => n.type === 'follow');
      case 'system':
        return notifications.filter((n) => n.type === 'system' || n.type === 'badge');
      case 'all':
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  const handleOpenItem = (item: AppNotification) => {
    if (!item.isRead) {
      markNotificationAsRead(item.id);
    }

    if (item.type === 'like' || item.type === 'comment') {
      router.push({
        pathname: '/post-detail',
        params: { postId: item.targetId || 'post-1' },
      });
    } else if (item.type === 'follow') {
      if (item.actorId) {
        if (item.actorId === currentUser.id) {
          router.push('/(tabs)/profile');
        } else {
          router.push({
            pathname: '/user-profile',
            params: { userId: item.actorId },
          });
        }
      } else {
        router.push('/(tabs)/profile');
      }
    } else if (item.type === 'event' || item.type === 'vibe') {
      if (item.targetId) {
        router.push({ pathname: '/event-detail', params: { id: item.targetId } });
      } else {
        router.push('/(tabs)/campus');
      }
    } else if (item.type === 'study_invite') {
      router.push('/study-room');
    } else if (item.type === 'job') {
      router.push('/(tabs)/careers');
    } else if (item.type === 'badge' || item.type === 'system') {
      router.push('/(tabs)/profile');
    }
  };

  const handleActorPress = (item: AppNotification) => {
    if (item.actorId) {
      if (item.actorId === currentUser.id) {
        router.push('/(tabs)/profile');
      } else {
        router.push({
          pathname: '/user-profile',
          params: { userId: item.actorId },
        });
      }
    }
  };

  const handleLongPress = (item: AppNotification) => {
    setSelectedNotification(item);
    setActionSheetVisible(true);
  };

  const emptyStateConfig = useMemo(() => {
    switch (activeTab) {
      case 'events':
        return {
          icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
          title: 'No event notifications',
          subtitle: 'Event invites, campus meetups, and study sessions will appear here.',
        };
      case 'jobs':
        return {
          icon: 'briefcase-outline' as keyof typeof Ionicons.glyphMap,
          title: 'No job notifications',
          subtitle: 'Internship alerts, career opportunities, and job matches will appear here.',
        };
      case 'like':
        return {
          icon: 'heart-outline' as keyof typeof Ionicons.glyphMap,
          title: 'No likes yet',
          subtitle: "When other students like your posts and photos, you'll see them here.",
        };
      case 'comment':
        return {
          icon: 'chatbubble-outline' as keyof typeof Ionicons.glyphMap,
          title: 'No comments yet',
          subtitle: "When someone comments on your posts or replies to you, they'll show up here.",
        };
      case 'followers':
        return {
          icon: 'person-add-outline' as keyof typeof Ionicons.glyphMap,
          title: 'No new followers yet',
          subtitle: 'When campus classmates follow you, you can follow them back here.',
        };
      case 'system':
        return {
          icon: 'shield-checkmark-outline' as keyof typeof Ionicons.glyphMap,
          title: 'No system notifications',
          subtitle: 'Campus announcements, streak milestones, and platform updates will appear here.',
        };
      case 'all':
      default:
        return {
          icon: 'notifications-outline' as keyof typeof Ionicons.glyphMap,
          title: 'No notifications yet',
          subtitle: 'When you get likes, comments, invites, or updates, they will appear here.',
        };
    }
  }, [activeTab]);

  const renderItem = ({ item }: { item: AppNotification }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.system;
    const isFollowingActor = item.actorId ? myFollowingList.includes(item.actorId) : false;

    return (
      <TouchableOpacity
        style={[
          styles.notifItem,
          {
            backgroundColor: !item.isRead ? (theme.dark ? '#11182740' : '#f0f9ff') : 'transparent',
            borderBottomColor: c.borderSubtle || c.border,
          },
        ]}
        onPress={() => handleOpenItem(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        {/* Avatar + Badge Icon */}
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={() => handleActorPress(item)}
          activeOpacity={0.8}
        >
          {item.actorAvatar ? (
            <Image source={{ uri: item.actorAvatar }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: c.primary + '25' }]}>
              <Text style={[styles.avatarInitial, { color: c.primary }]}>
                {item.actorName.charAt(0)}
              </Text>
            </View>
          )}
          <View style={[styles.typeBadge, { backgroundColor: config.color, borderColor: c.background }]}>
            <Ionicons name={config.icon} size={11} color="#ffffff" />
          </View>
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.notifBody}>
          <Text style={[styles.notifMessage, { color: c.textMuted }]}>
            <Text
              style={[styles.actorName, { color: c.text }]}
              onPress={() => handleActorPress(item)}
            >
              {item.actorName}{' '}
            </Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={13} color={c.primary} style={styles.verifiedIcon} />
            )}
            {' '}{item.text}
          </Text>

          {Boolean(item.subtext) && (
            <View style={[styles.subtextContainer, { backgroundColor: c.card, borderColor: c.borderSubtle || c.border }]}>
              <Text style={[styles.subtext, { color: c.text }]} numberOfLines={2}>
                {item.subtext}
              </Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Text style={[styles.timeText, { color: c.textDim }]}>
              {formatRelativeTime(item.createdAt)}
            </Text>
            {Boolean(item.actorSchool) && (
              <>
                <Text style={[styles.dotSep, { color: c.textDim }]}>•</Text>
                <Text style={[styles.schoolText, { color: c.textDim }]}>{item.actorSchool}</Text>
              </>
            )}
          </View>
        </View>

        {/* Trailing Action Element */}
        <View style={styles.trailingWrap}>
          {item.type === 'follow' && item.actorId && item.actorId !== currentUser.id ? (
            <TouchableOpacity
              style={[
                styles.followBtn,
                isFollowingActor
                  ? [styles.followingBtn, { borderColor: c.border, backgroundColor: c.card }]
                  : [styles.followBackBtn, { backgroundColor: c.primary }],
              ]}
              onPress={(e) => {
                e.stopPropagation();
                if (item.actorId) {
                  toggleFollow(item.actorId);
                }
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.followBtnText,
                  { color: isFollowingActor ? c.textMuted : '#ffffff' },
                ]}
              >
                {isFollowingActor ? 'Following' : 'Follow Back'}
              </Text>
            </TouchableOpacity>
          ) : item.targetImage ? (
            <Image source={{ uri: item.targetImage }} style={styles.postThumbnail} />
          ) : item.type === 'event' || item.type === 'vibe' ? (
            <TouchableOpacity
              style={[styles.actionPillBtn, { backgroundColor: '#8b5cf6' }]}
              onPress={(e) => {
                e.stopPropagation();
                handleOpenItem(item);
              }}
            >
              <Text style={styles.actionPillText}>View</Text>
            </TouchableOpacity>
          ) : item.type === 'job' ? (
            <TouchableOpacity
              style={[styles.actionPillBtn, { backgroundColor: '#06b6d4' }]}
              onPress={(e) => {
                e.stopPropagation();
                handleOpenItem(item);
              }}
            >
              <Text style={styles.actionPillText}>View Role</Text>
            </TouchableOpacity>
          ) : item.type === 'study_invite' ? (
            <TouchableOpacity
              style={[styles.actionPillBtn, { backgroundColor: '#10b981' }]}
              onPress={(e) => {
                e.stopPropagation();
                handleOpenItem(item);
              }}
            >
              <Text style={styles.actionPillText}>Join</Text>
            </TouchableOpacity>
          ) : item.type === 'badge' ? (
            <View style={[styles.badgePill, { backgroundColor: '#f59e0b20', borderColor: '#f59e0b40' }]}>
              <Text style={styles.badgePillIcon}>{item.badgeIcon ?? '🏆'}</Text>
            </View>
          ) : null}

          {!item.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: c.primary }]} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: c.card }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={c.text} />
          </TouchableOpacity>
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: c.text }]}>Notifications</Text>
            {notificationCount > 0 ? (
              <View style={[styles.countPill, { backgroundColor: c.primary + '20' }]}>
                <Text style={[styles.countPillText, { color: c.primary }]}>
                  {notificationCount} new
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.headerRight}>
          {notificationCount > 0 ? (
            <TouchableOpacity
              style={[styles.markAllBtn, { backgroundColor: c.card, borderColor: c.border }]}
              onPress={markAllNotificationsAsRead}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-done" size={16} color={c.primary} />
              <Text style={[styles.markAllText, { color: c.primary }]}>Mark read</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: c.card }]}
              onPress={() => {
                setSelectedNotification(null);
                setActionSheetVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories Bar: All, Events, Jobs, Like, Comment, New Followers, System */}
      <View style={[styles.filterBar, { borderBottomColor: c.borderSubtle || c.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContent}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.id;
            const count = getTabCount(cat.id);

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterTab,
                  isActive
                    ? [styles.filterTabActive, { backgroundColor: c.text }]
                    : [styles.filterTabInactive, { backgroundColor: c.card, borderColor: c.borderSubtle || c.border }],
                ]}
                onPress={() => setActiveTab(cat.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={isActive ? (theme.dark ? '#000000' : '#ffffff') : c.textMuted}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    { color: isActive ? (theme.dark ? '#000000' : '#ffffff') : c.textMuted },
                  ]}
                >
                  {cat.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.filterBadge,
                      {
                        backgroundColor: isActive
                          ? (theme.dark ? '#000000' : '#ffffff')
                          : c.primary + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterBadgeText,
                        {
                          color: isActive
                            ? (theme.dark ? '#ffffff' : '#000000')
                            : c.primary,
                        },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Unread banner when unread exists */}
      {notificationCount > 0 && (
        <View style={[styles.unreadBanner, { backgroundColor: c.primary + '15', borderColor: c.primary + '30' }]}>
          <View style={styles.unreadBannerLeft}>
            <Ionicons name="sparkles" size={16} color={c.primary} />
            <Text style={[styles.unreadBannerText, { color: c.text }]}>
              You have <Text style={{ fontWeight: '700', color: c.primary }}>{notificationCount}</Text> unread notifications
            </Text>
          </View>
          <TouchableOpacity onPress={markAllNotificationsAsRead} activeOpacity={0.7}>
            <Text style={[styles.unreadBannerAction, { color: c.primary }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredNotifications.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIconBg, { backgroundColor: c.card }]}>
              <Ionicons
                name={emptyStateConfig.icon}
                size={38}
                color={c.primary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: c.text }]}>
              {emptyStateConfig.title}
            </Text>
            <Text style={[styles.emptySubtitle, { color: c.textDim }]}>
              {emptyStateConfig.subtitle}
            </Text>
            {activeTab !== 'all' && (
              <TouchableOpacity
                style={[styles.emptyActionBtn, { backgroundColor: c.primary }]}
                onPress={() => setActiveTab('all')}
              >
                <Text style={styles.emptyActionText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Action Sheet Modal */}
      <Modal
        visible={actionSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionSheetVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setActionSheetVisible(false)}
        >
          <View
            style={[styles.sheetContent, { backgroundColor: c.card, borderColor: c.border }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.sheetHandle, { backgroundColor: c.textDim + '50' }]} />

            {selectedNotification ? (
              <>
                <Text style={[styles.sheetTitle, { color: c.text }]} numberOfLines={1}>
                  {selectedNotification.actorName}
                </Text>
                <Text style={[styles.sheetSubtitle, { color: c.textDim }]} numberOfLines={1}>
                  {selectedNotification.text}
                </Text>

                <TouchableOpacity
                  style={[styles.sheetOption, { borderBottomColor: c.borderSubtle || c.border }]}
                  onPress={() => {
                    if (!selectedNotification.isRead) {
                      markNotificationAsRead(selectedNotification.id);
                    }
                    setActionSheetVisible(false);
                  }}
                >
                  <Ionicons
                    name={selectedNotification.isRead ? 'mail-unread-outline' : 'checkmark-circle-outline'}
                    size={20}
                    color={c.text}
                  />
                  <Text style={[styles.sheetOptionText, { color: c.text }]}>
                    {selectedNotification.isRead ? 'Mark as Unread' : 'Mark as Read'}
                  </Text>
                </TouchableOpacity>

                {selectedNotification.actorId && (
                  <TouchableOpacity
                    style={[styles.sheetOption, { borderBottomColor: c.borderSubtle || c.border }]}
                    onPress={() => {
                      setActionSheetVisible(false);
                      handleActorPress(selectedNotification);
                    }}
                  >
                    <Ionicons name="person-outline" size={20} color={c.text} />
                    <Text style={[styles.sheetOptionText, { color: c.text }]}>View Profile</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={() => {
                    deleteNotification(selectedNotification.id);
                    setActionSheetVisible(false);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text style={[styles.sheetOptionText, { color: '#ef4444' }]}>Delete Notification</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.sheetTitle, { color: c.text }]}>Notification Options</Text>

                <TouchableOpacity
                  style={[styles.sheetOption, { borderBottomColor: c.borderSubtle || c.border }]}
                  onPress={() => {
                    markAllNotificationsAsRead();
                    setActionSheetVisible(false);
                  }}
                >
                  <Ionicons name="checkmark-done-outline" size={20} color={c.text} />
                  <Text style={[styles.sheetOptionText, { color: c.text }]}>Mark All as Read</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={() => {
                    clearAllNotifications();
                    setActionSheetVisible(false);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text style={[styles.sheetOptionText, { color: '#ef4444' }]}>Clear All Notifications</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={[styles.sheetCancelBtn, { backgroundColor: c.background }]}
              onPress={() => setActionSheetVisible(false)}
            >
              <Text style={[styles.sheetCancelText, { color: c.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Filters
  filterBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  filterTabInactive: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  // Unread banner
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  unreadBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadBannerText: {
    fontSize: 13,
  },
  unreadBannerAction: {
    fontSize: 13,
    fontWeight: '700',
  },
  // List
  listContent: {
    paddingVertical: 4,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
    marginTop: 2,
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#333',
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  notifBody: {
    flex: 1,
    justifyContent: 'center',
  },
  notifMessage: {
    fontSize: 14,
    lineHeight: 19,
  },
  actorName: {
    fontWeight: '700',
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  subtextContainer: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  subtext: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  timeText: {
    fontSize: 12,
  },
  dotSep: {
    fontSize: 12,
  },
  schoolText: {
    fontSize: 12,
  },
  trailingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
  },
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  followBackBtn: {},
  followingBtn: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionPillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  badgePill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badgePillIcon: {
    fontSize: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Empty state
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconBg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyActionBtn: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  // Modal Sheet
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
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  sheetSubtitle: {
    fontSize: 13,
    marginBottom: 16,
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
});
