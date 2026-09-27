import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import type { User } from '@/types';

const FOLLOW_GRAPH_STORAGE_KEY = 'campus.followingByUserId';
const SAVED_POSTS_STORAGE_KEY = 'campus.savedPostIds';
const NOTIFICATIONS_STORAGE_KEY = 'campus.notifications';
const CURRENT_USER_STORAGE_KEY = 'campus.currentUser';

const DEFAULT_USER: User = {
  id: 'user-samuel-01',
  username: 'samuel.n',
  displayName: 'Samuel Nguyen',
  avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
  schoolId: 'temple',
  schoolName: 'Temple University',
  pronouns: 'he/him',
  joinedAt: new Date('2026-05-17'),
  isVerified: true,
  major: 'Computer Science',
  year: 'Junior',
  badges: [
    { id: 'badge-study', icon: '🔥', name: 'Streak', color: '#f97316' },
    { id: 'badge-mentor', icon: '🎓', name: 'Mentor', color: '#22c55e' },
  ],
  streakCount: 18,
  bio: 'CS major building better study habits and campus connections. Always up for a coffee-fueled sprint session.',
  link: 'github.com/samuelnguyen',
  postsCount: 28,
  studyHours: 26,
  lastStudySession: new Date(Date.now() - 1000 * 60 * 90),
};

export const SAMPLE_USERS: User[] = [
  DEFAULT_USER,
  {
    id: 'user-maya-01',
    username: 'maya.codes',
    displayName: 'Maya Chen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    schoolId: 'ucla',
    schoolName: 'UCLA',
    isVerified: true,
    major: 'Design',
    year: 'Senior',
    badges: [{ id: 'badge-design', icon: '🎨', name: 'Creative', color: '#a855f7' }],
    streakCount: 11,
    bio: 'I turn complex ideas into clean experiences and good study playlists.',
    postsCount: 43,
    studyHours: 18,
    lastStudySession: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 'user-niko-01',
    username: 'niko.m',
    displayName: 'Niko Martinez',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    schoolId: 'usc',
    schoolName: 'USC',
    isVerified: false,
    major: 'Business',
    year: 'Junior',
    badges: [{ id: 'badge-event', icon: '📍', name: 'Event Lead', color: '#3b82f6' }],
    streakCount: 9,
    bio: 'Always planning the next campus hang or study sprint.',
    postsCount: 21,
    studyHours: 12,
    lastStudySession: new Date(Date.now() - 1000 * 60 * 45),
  },
  {
    id: 'user-ari-01',
    username: 'ari.h',
    displayName: 'Ari Holt',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    schoolId: 'berkeley',
    schoolName: 'UC Berkeley',
    isVerified: true,
    major: 'Physics',
    year: 'Sophomore',
    badges: [{ id: 'badge-lab', icon: '🧪', name: 'Lab Crew', color: '#06b6d4' }],
    streakCount: 14,
    bio: 'Physics nerd with a soft spot for coffee and collaborative study nights.',
    postsCount: 33,
    studyHours: 21,
    lastStudySession: new Date(Date.now() - 1000 * 60 * 120),
  },
];

export const getUserById = (id: string) => SAMPLE_USERS.find((user) => user.id === id) ?? DEFAULT_USER;

export type NotificationType =
  | 'event'
  | 'job'
  | 'like'
  | 'comment'
  | 'follow'
  | 'system'
  | 'study_invite'
  | 'vibe'
  | 'badge';

export interface AppNotification {
  id: string;
  type: NotificationType;
  actorId?: string;
  actorName: string;
  actorUsername?: string;
  actorAvatar?: string;
  actorSchool?: string;
  isVerified?: boolean;
  text: string;
  subtext?: string;
  createdAt: string;
  isRead: boolean;
  targetId?: string;
  targetImage?: string;
  badgeIcon?: string;
  badgeName?: string;
  badgeColor?: string;
}

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

type AppContextType = {
  isLoggedIn: boolean;
  currentUser: User;
  followingByUserId: Record<string, string[]>;
  savedPostIds: string[];
  unreadMessages: number;
  notificationCount: number;
  notifications: AppNotification[];
  setIsLoggedIn: (val: boolean) => void;
  setCurrentUser: (user: User) => void;
  setUnreadMessages: (val: number) => void;
  setNotificationCount: (val: number) => void;
  updateUser: (updates: Partial<User>) => void;
  toggleFollow: (targetUserId: string) => void;
  toggleSave: (postId: string) => void;
  isSaved: (postId: string) => boolean;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt'>) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [currentUserLoaded, setCurrentUserLoaded] = useState(false);
  const [followingByUserId, setFollowingByUserId] = useState<Record<string, string[]>>({});
  const [followGraphLoaded, setFollowGraphLoaded] = useState(false);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(4);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [, setManualNotificationCount] = useState<number | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void AsyncStorage.getItem(CURRENT_USER_STORAGE_KEY)
      .then((storedUser) => {
        if (!storedUser || !isCurrent) return;
        const parsedUser = JSON.parse(storedUser) as User;
        setCurrentUser({
          ...parsedUser,
          joinedAt: parsedUser.joinedAt ? new Date(parsedUser.joinedAt) : undefined,
          lastStudySession: parsedUser.lastStudySession ? new Date(parsedUser.lastStudySession) : undefined,
        });
      })
      .catch(() => undefined)
      .finally(() => {
        if (isCurrent) setCurrentUserLoaded(true);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUserLoaded) return;
    void AsyncStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser)).catch(() => undefined);
  }, [currentUserLoaded, currentUser]);

  useEffect(() => {
    let isCurrent = true;
    void AsyncStorage.getItem(FOLLOW_GRAPH_STORAGE_KEY)
      .then((storedGraph) => {
        if (!storedGraph || !isCurrent) return;
        const parsedGraph = JSON.parse(storedGraph) as Record<string, unknown>;
        const restoredGraph: Record<string, string[]> = {};
        Object.entries(parsedGraph).forEach(([userId, followingIds]) => {
          if (Array.isArray(followingIds)) {
            restoredGraph[userId] = followingIds.filter((followingId): followingId is string => typeof followingId === 'string');
          }
        });
        setFollowingByUserId(restoredGraph);
      })
      .catch(() => undefined)
      .finally(() => {
        if (isCurrent) setFollowGraphLoaded(true);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!followGraphLoaded) return;
    void AsyncStorage.setItem(FOLLOW_GRAPH_STORAGE_KEY, JSON.stringify(followingByUserId)).catch(() => undefined);
  }, [followGraphLoaded, followingByUserId]);

  // Load saved posts
  useEffect(() => {
    let isCurrent = true;
    void AsyncStorage.getItem(SAVED_POSTS_STORAGE_KEY)
      .then((stored) => {
        if (!stored || !isCurrent) return;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedPostIds(parsed.filter((id): id is string => typeof id === 'string'));
        }
      })
      .catch(() => undefined)
      .finally(() => { if (isCurrent) setSavedLoaded(true); });
    return () => { isCurrent = false; };
  }, []);

  useEffect(() => {
    if (!savedLoaded) return;
    void AsyncStorage.setItem(SAVED_POSTS_STORAGE_KEY, JSON.stringify(savedPostIds)).catch(() => undefined);
  }, [savedLoaded, savedPostIds]);

  // Load saved notifications
  useEffect(() => {
    let isCurrent = true;
    void AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
      .then((stored) => {
        if (!stored || !isCurrent) return;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const realNotifications = parsed.filter(
            (n: any) => n && typeof n.id === 'string' && !/^notif-(?:[1-9]|10)$/.test(n.id)
          );
          setNotifications(realNotifications);
        }
      })
      .catch(() => undefined)
      .finally(() => { if (isCurrent) setNotificationsLoaded(true); });
    return () => { isCurrent = false; };
  }, []);

  useEffect(() => {
    if (!notificationsLoaded) return;
    void AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications)).catch(() => undefined);
  }, [notificationsLoaded, notifications]);

  const notificationCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'createdAt'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const toggleSave = (postId: string) => {
    setSavedPostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const isSaved = (postId: string) => savedPostIds.includes(postId);

  const updateUser = (updates: Partial<User>) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }));
  };

  const toggleFollow = (targetUserId: string) => {
    if (targetUserId === currentUser.id) return;
    setFollowingByUserId((currentGraph) => {
      const currentFollowing = currentGraph[currentUser.id] ?? [];
      const nextFollowing = currentFollowing.includes(targetUserId)
        ? currentFollowing.filter((userId) => userId !== targetUserId)
        : [...currentFollowing, targetUserId];
      return { ...currentGraph, [currentUser.id]: nextFollowing };
    });
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        currentUser,
        followingByUserId,
        savedPostIds,
        unreadMessages,
        notificationCount,
        notifications,
        setIsLoggedIn,
        setCurrentUser,
        setUnreadMessages,
        setNotificationCount: setManualNotificationCount,
        updateUser,
        toggleFollow,
        toggleSave,
        isSaved,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        addNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
