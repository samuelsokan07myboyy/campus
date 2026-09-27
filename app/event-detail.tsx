import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  addEventComment,
  deleteEvent,
  EVENT_CATEGORIES,
  fetchEventById,
  fetchEventDiscussion,
  getEventAttendees,
  setEventRSVP,
  type CampusEvent,
  type EventComment,
  type EventPerson,
  type EventRsvpStatus,
} from '@/services/eventsService';

function Avatar({ person, size = 44, borderColor }: { person: EventPerson; size?: number; borderColor?: string }) {
  const initials = person.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, borderColor: borderColor ?? 'transparent' }]}>
      {person.avatarUrl ? (
        <Image source={{ uri: person.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Text style={styles.avatarInitials}>{initials}</Text>
      )}
    </View>
  );
}

function relativeTime(value: string) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function EventDetailScreen() {
  const { eventId: rawEventId, tab: rawTab } = useLocalSearchParams<{ eventId?: string | string[]; tab?: string | string[] }>();
  const eventId = Array.isArray(rawEventId) ? rawEventId[0] : rawEventId;
  const tab = Array.isArray(rawTab) ? rawTab[0] : rawTab;
  const { currentUser } = useApp();
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const [event, setEvent] = useState<CampusEvent | null>(null);
  const [comments, setComments] = useState<EventComment[]>([]);
  const [attendees, setAttendees] = useState<EventPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'discussion'>(tab === 'discussion' ? 'discussion' : 'info');
  const [attendeesVisible, setAttendeesVisible] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const isHost = Boolean(event && event.host.id === currentUser.id);
  const categoryInfo = EVENT_CATEGORIES.find((item) => item.id === event?.category);
  const dateTitle = useMemo(() => event ? new Date(event.startTime).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }) : '', [event]);
  const timeTitle = useMemo(() => {
    if (!event) return '';
    const start = new Date(event.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (!event.endTime) return start;
    const end = new Date(event.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${start} – ${end}`;
  }, [event]);

  useFocusEffect(
    useCallback(() => {
      if (!eventId) {
        setLoading(false);
        return;
      }
      let isActive = true;
      setLoading(true);
      void Promise.all([
        fetchEventById(eventId, currentUser.id),
        fetchEventDiscussion(eventId),
        getEventAttendees(eventId),
      ]).then(([nextEvent, nextComments, nextAttendees]) => {
        if (!isActive) return;
        setEvent(nextEvent);
        setComments(nextComments);
        setAttendees(nextAttendees);
      }).finally(() => {
        if (isActive) setLoading(false);
      });
      return () => {
        isActive = false;
      };
    }, [currentUser.id, eventId]),
  );

  const openHostProfile = () => {
    if (!event) return;
    router.push({ pathname: '/user-profile', params: { userId: event.host.id } });
  };

  const handleShare = async () => {
    if (!event) return;
    const shareUrl = `campus://event-detail?eventId=${encodeURIComponent(event.id)}`;
    const message = `${event.title}\n${dateTitle} · ${timeTitle}\n${event.locationName}\n${shareUrl}`;
    await Share.share({ title: event.title, message });
  };

  const handleCalendarExport = async () => {
    if (!event) return;
    await Share.share({
      title: `Add ${event.title} to your calendar`,
      message: `${event.title}\n${dateTitle}\n${timeTitle}\n${event.locationName}${event.locationAddress ? `, ${event.locationAddress}` : ''}`,
    });
  };

  const handleDirections = async () => {
    if (!event) return;
    const destination = encodeURIComponent([event.locationName, event.locationAddress].filter(Boolean).join(', '));
    const url = `https://www.google.com/maps/search/?api=1&query=${destination}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open maps', 'Try copying the location from this event.');
    }
  };

  const updateRSVP = async (nextStatus: EventRsvpStatus | null) => {
    if (!event) return;
    const previous = event;
    const goingDelta = (nextStatus === 'going' ? 1 : 0) - (event.userRsvp === 'going' ? 1 : 0);
    const interestedDelta = (nextStatus === 'interested' ? 1 : 0) - (event.userRsvp === 'interested' ? 1 : 0);
    const optimistic: CampusEvent = {
      ...event,
      userRsvp: nextStatus,
      goingCount: Math.max(0, event.goingCount + goingDelta),
      interestedCount: Math.max(0, event.interestedCount + interestedDelta),
    };
    setEvent(optimistic);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const stored = await setEventRSVP(event.id, currentUser.id, nextStatus ?? 'none');
      if (stored) setEvent(stored);
      setAttendees(await getEventAttendees(event.id));
    } catch {
      setEvent(previous);
    }
  };

  const cycleRSVP = () => {
    if (event?.userRsvp === 'going') return updateRSVP('interested');
    if (event?.userRsvp === 'interested') return updateRSVP(null);
    return updateRSVP('going');
  };

  const handlePrimaryAction = () => {
    if (!event) return;
    if (event.ticketUrl) {
      void WebBrowser.openBrowserAsync(event.ticketUrl);
    } else if (event.userRsvp !== 'going') {
      void updateRSVP('going');
    }
  };

  const handleSendComment = async () => {
    if (!event || !commentText.trim() || sendingComment) return;
    setSendingComment(true);
    const body = commentText.trim();
    setCommentText('');
    const author: EventPerson = {
      id: currentUser.id,
      username: currentUser.username,
      name: currentUser.displayName,
      avatarUrl: currentUser.avatar,
      isVerified: currentUser.isVerified,
    };
    try {
      setComments(await addEventComment(event.id, author, body));
      void Haptics.selectionAsync();
    } catch {
      setCommentText(body);
    } finally {
      setSendingComment(false);
    }
  };

  const confirmDelete = () => {
    if (!event || !isHost) return;
    setOptionsVisible(false);
    Alert.alert('Delete event?', 'This removes the event from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        void deleteEvent(event.id).then(() => router.back());
      } },
    ]);
  };

  const openEditor = () => {
    if (!event || !isHost) return;
    setOptionsVisible(false);
    router.push({ pathname: '/create-event', params: { eventId: event.id } });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingState, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={[styles.loadingState, { backgroundColor: c.background }]}>
        <Ionicons name="calendar-outline" size={38} color={c.textMuted} />
        <Text style={[styles.notFoundText, { color: c.text }]}>This event is no longer available.</Text>
        <Pressable onPress={() => router.back()} style={[styles.backToFeed, { backgroundColor: c.primary }]}>
          <Text style={styles.backToFeedLabel}>Back to events</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const eventStatusLabel = event.userRsvp === 'going' ? 'Going' : event.userRsvp === 'interested' ? 'Interested' : 'Not going';
  const goingProgress = event.maxCapacity ? Math.min(1, event.goingCount / event.maxCapacity) : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { height: Math.min(340, window.height * 0.39) }]}>
            {event.coverUrl ? (
              <Image source={{ uri: event.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: c.primaryMuted }]} />
            )}
            <LinearGradient colors={['rgba(5,7,12,0.25)', 'transparent', 'rgba(5,7,12,0.68)']} locations={[0, 0.48, 1]} style={StyleSheet.absoluteFill} />
            <View style={[styles.heroControls, { top: insets.top + 10 }]}>
              <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.heroButton}>
                <BlurView intensity={theme.dark ? 62 : 78} tint={theme.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                <Ionicons name="chevron-back" size={21} color="#fff" />
              </Pressable>
              <View style={styles.heroRightControls}>
                <Pressable accessibilityRole="button" accessibilityLabel="Share event" onPress={() => void handleShare()} style={styles.heroButton}>
                  <BlurView intensity={theme.dark ? 62 : 78} tint={theme.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                  <Ionicons name="share-outline" size={19} color="#fff" />
                </Pressable>
                {isHost && (
                  <Pressable accessibilityRole="button" accessibilityLabel="More event options" onPress={() => setOptionsVisible(true)} style={styles.heroButton}>
                    <BlurView intensity={theme.dark ? 62 : 78} tint={theme.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                    <Ionicons name="ellipsis-horizontal" size={21} color="#fff" />
                  </Pressable>
                )}
              </View>
            </View>
            <View style={styles.heroBottom}>
              <View style={styles.heroDatePill}>
                <Text style={styles.heroDateMonth}>{new Date(event.startTime).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</Text>
                <Text style={styles.heroDateDay}>{new Date(event.startTime).getDate()}</Text>
              </View>
              <View style={styles.heroTitleWrap}>
                <View style={styles.heroCategory}>
                  <Text style={styles.heroCategoryEmoji}>{categoryInfo?.emoji ?? '✨'}</Text>
                  <Text style={styles.heroCategoryLabel}>{event.category}</Text>
                </View>
                <Text style={styles.heroTitle} numberOfLines={2}>{event.title}</Text>
              </View>
            </View>
          </View>

          <View style={styles.tabsRow}>
            {(['info', 'discussion'] as const).map((tab) => {
              const active = activeTab === tab;
              return (
                <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabButton, { borderBottomColor: active ? c.primary : 'transparent' }]}>
                  <Text style={[styles.tabLabel, { color: active ? c.text : c.textMuted }]}>{tab === 'info' ? 'Info' : 'Discussion'}</Text>
                  {tab === 'discussion' && <Text style={[styles.commentCount, { color: c.textMuted }]}>{comments.length}</Text>}
                </Pressable>
              );
            })}
          </View>

          {activeTab === 'info' ? (
            <View style={styles.infoContent}>
              <Text style={[styles.pageTitle, { color: c.text }]}>{event.title}</Text>
              <View style={styles.categoryAndCost}>
                <View style={[styles.detailChip, { backgroundColor: c.primaryMuted }]}>
                  <Text style={styles.detailChipEmoji}>{categoryInfo?.emoji ?? '✨'}</Text>
                  <Text style={[styles.detailChipText, { color: c.primary }]}>{event.category}</Text>
                </View>
                <View style={[styles.detailChip, { backgroundColor: event.isFree ? c.success + '20' : c.warning + '22' }]}>
                  <Text style={[styles.detailChipText, { color: event.isFree ? c.success : c.warning }]}>{event.isFree ? 'Free' : event.price || 'Ticketed'}</Text>
                </View>
              </View>

              <Pressable onPress={openHostProfile} style={[styles.hostCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <Avatar person={event.host} size={48} />
                <View style={styles.hostDetails}>
                  <Text style={[styles.hostName, { color: c.text }]}>{event.host.name}</Text>
                  <Text style={[styles.hostUsername, { color: c.textMuted }]}>@{event.host.username}</Text>
                </View>
                {event.host.isVerified && <Ionicons name="checkmark-circle" size={18} color={c.primary} />}
                <Ionicons name="chevron-forward" size={17} color={c.textMuted} />
              </Pressable>

              <View style={[styles.section, { borderBottomColor: c.border }]}>
                <Text style={[styles.sectionTitle, { color: c.text }]}>When</Text>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: c.primaryMuted }]}><Ionicons name="calendar-outline" size={19} color={c.primary} /></View>
                  <View style={styles.detailCopy}>
                    <Text style={[styles.detailMain, { color: c.text }]}>{dateTitle}</Text>
                    <Text style={[styles.detailSub, { color: c.textMuted }]}>{timeTitle}</Text>
                  </View>
                </View>
                <Pressable onPress={() => void handleCalendarExport()} style={[styles.outlineButton, { borderColor: c.border }]}>
                  <Ionicons name="calendar-number-outline" size={16} color={c.primary} />
                  <Text style={[styles.outlineButtonText, { color: c.text }]}>Add to Calendar</Text>
                </Pressable>
              </View>

              <View style={[styles.section, { borderBottomColor: c.border }]}>
                <Text style={[styles.sectionTitle, { color: c.text }]}>Where</Text>
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: c.secondary + '20' }]}><Ionicons name="location-outline" size={19} color={c.secondary} /></View>
                  <View style={styles.detailCopy}>
                    <Text style={[styles.detailMain, { color: c.text }]}>{event.locationName}</Text>
                    {!!event.locationAddress && <Text style={[styles.detailSub, { color: c.textMuted }]}>{event.locationAddress}</Text>}
                  </View>
                </View>
                <Pressable onPress={() => void handleDirections()} style={[styles.outlineButton, { borderColor: c.border }]}>
                  <Ionicons name="navigate-outline" size={16} color={c.secondary} />
                  <Text style={[styles.outlineButtonText, { color: c.text }]}>Get Directions</Text>
                </Pressable>
              </View>

              <View style={[styles.metadataGrid, { borderBottomColor: c.border }]}>
                <View style={[styles.metadataTile, { backgroundColor: c.card, borderColor: c.border }]}>
                  <Ionicons name="people-outline" size={17} color={c.primary} />
                  <Text style={[styles.metadataLabel, { color: c.textMuted }]}>Age</Text>
                  <Text style={[styles.metadataValue, { color: c.text }]}>{event.ageLimit}</Text>
                </View>
                <View style={[styles.metadataTile, { backgroundColor: c.card, borderColor: c.border }]}>
                  <Ionicons name="shirt-outline" size={17} color={c.secondary} />
                  <Text style={[styles.metadataLabel, { color: c.textMuted }]}>Dress</Text>
                  <Text style={[styles.metadataValue, { color: c.text }]} numberOfLines={1}>{event.dressCode || 'No dress code'}</Text>
                </View>
                <View style={[styles.metadataTile, { backgroundColor: c.card, borderColor: c.border }]}>
                  <Ionicons name="ticket-outline" size={17} color={c.warning} />
                  <Text style={[styles.metadataLabel, { color: c.textMuted }]}>Cost</Text>
                  <Text style={[styles.metadataValue, { color: c.text }]}>{event.isFree ? 'Free' : event.price || 'Paid'}</Text>
                </View>
              </View>

              {event.maxCapacity ? (
                <View style={styles.capacitySection}>
                  <View style={styles.capacityHeading}>
                    <Text style={[styles.sectionTitle, { color: c.text }]}>Spots</Text>
                    <Text style={[styles.capacityCount, { color: c.textMuted }]}>{Math.max(0, event.maxCapacity - event.goingCount)} left of {event.maxCapacity}</Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: c.border }]}>
                    <View style={[styles.progressFill, { width: `${Math.round(goingProgress * 100)}%`, backgroundColor: c.primary }]} />
                  </View>
                </View>
              ) : null}

              <View style={[styles.section, { borderBottomColor: c.border }]}>
                <Text style={[styles.sectionTitle, { color: c.text }]}>About</Text>
                <Text style={[styles.description, { color: c.textMuted }]}>{event.description || 'The host has not added a description yet.'}</Text>
              </View>

              <Pressable onPress={() => setAttendeesVisible(true)} style={styles.attendeesHeading}>
                <View>
                  <Text style={[styles.sectionTitle, { color: c.text }]}>Who's going</Text>
                  <Text style={[styles.detailSub, { color: c.textMuted }]}>{event.goingCount} going · {event.interestedCount} interested</Text>
                </View>
                <View style={styles.attendeeStack}>
                  {attendees.slice(0, 4).map((person, index) => (
                    <View key={person.id} style={{ marginLeft: index === 0 ? 0 : -10, zIndex: 5 - index }}>
                      <Avatar person={person} size={34} borderColor={c.background} />
                    </View>
                  ))}
                  <Ionicons name="chevron-forward" size={17} color={c.textMuted} style={{ marginLeft: 8 }} />
                </View>
              </Pressable>
            </View>
          ) : (
            <View style={styles.discussionContent}>
              <View style={styles.discussionIntro}>
                <Text style={[styles.sectionTitle, { color: c.text }]}>Event discussion</Text>
                <Text style={[styles.detailSub, { color: c.textMuted }]}>Coordinate with the host and other attendees.</Text>
              </View>
              {comments.length === 0 ? (
                <View style={styles.noComments}>
                  <Ionicons name="chatbubble-ellipses-outline" size={28} color={c.textMuted} />
                  <Text style={[styles.noCommentsText, { color: c.textMuted }]}>Start the conversation.</Text>
                </View>
              ) : comments.map((comment) => (
                <View key={comment.id} style={[styles.commentRow, comment.isPinned && { backgroundColor: c.primaryMuted, borderColor: c.primary + '55' }, { borderColor: c.border }]}>
                  <Avatar person={comment.author} size={35} />
                  <View style={styles.commentBody}>
                    <View style={styles.commentAuthorRow}>
                      <Text style={[styles.commentAuthor, { color: c.text }]}>{comment.author.name}</Text>
                      <Text style={[styles.commentTime, { color: c.textMuted }]}>{relativeTime(comment.createdAt)}</Text>
                    </View>
                    {comment.isPinned && (
                      <View style={styles.pinnedBadge}>
                        <Ionicons name="pin" size={11} color={c.primary} />
                        <Text style={[styles.pinnedLabel, { color: c.primary }]}>Host announcement</Text>
                      </View>
                    )}
                    <Text style={[styles.commentMessage, { color: c.textMuted }]}>{comment.message}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {activeTab === 'discussion' && (
          <View style={[styles.composer, { backgroundColor: c.background, borderTopColor: c.border }]}>
            <Avatar person={{ id: currentUser.id, name: currentUser.displayName, username: currentUser.username, avatarUrl: currentUser.avatar }} size={34} />
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a message..."
              placeholderTextColor={c.textMuted}
              multiline
              style={[styles.commentInput, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={!commentText.trim() || sendingComment} onPress={() => void handleSendComment()} style={[styles.sendButton, { backgroundColor: commentText.trim() ? c.primary : c.border }]}>
              {sendingComment ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={17} color="#fff" />}
            </Pressable>
          </View>
        )}

        <View style={[styles.bottomBar, { backgroundColor: c.surface, borderTopColor: c.border }]}>
          <Pressable onPress={() => void cycleRSVP()} style={[styles.quickRsvp, { backgroundColor: c.card, borderColor: c.border }]}>
            <Ionicons name={event.userRsvp === 'going' ? 'checkmark-circle' : event.userRsvp === 'interested' ? 'star' : 'chevron-down'} size={17} color={event.userRsvp ? c.primary : c.textMuted} />
            <Text style={[styles.quickRsvpText, { color: event.userRsvp ? c.primary : c.text }]}>{eventStatusLabel}</Text>
          </Pressable>
          <Pressable onPress={handlePrimaryAction} style={[styles.primaryAction, { backgroundColor: c.primary }]}>
            <Ionicons name={event.ticketUrl ? 'ticket-outline' : event.userRsvp === 'going' ? 'checkmark' : 'arrow-forward'} size={17} color="#fff" />
            <Text style={styles.primaryActionText}>{event.ticketUrl ? 'Get Tickets' : event.userRsvp === 'going' ? "You're going" : 'RSVP Now'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={attendeesVisible} animationType="slide" transparent onRequestClose={() => setAttendeesVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setAttendeesVisible(false)}>
          <Pressable style={[styles.attendeeSheet, { backgroundColor: c.surface, paddingBottom: Math.max(insets.bottom, 18) }]} onPress={() => undefined}>
            <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />
            <View style={styles.sheetTitleRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: c.text }]}>Attending</Text>
                <Text style={[styles.detailSub, { color: c.textMuted }]}>{event.goingCount} going</Text>
              </View>
              <Pressable accessibilityLabel="Close attendees" onPress={() => setAttendeesVisible(false)} style={[styles.closeSheetButton, { backgroundColor: c.card }]}>
                <Ionicons name="close" size={19} color={c.text} />
              </Pressable>
            </View>
            <FlatList
              data={attendees}
              keyExtractor={(person) => person.id}
              ListEmptyComponent={<Text style={[styles.noCommentsText, { color: c.textMuted }]}>No attendee details yet.</Text>}
              renderItem={({ item }) => (
                <Pressable onPress={() => { setAttendeesVisible(false); router.push({ pathname: '/user-profile', params: { userId: item.id } }); }} style={styles.attendeeListRow}>
                  <Avatar person={item} size={42} />
                  <View style={styles.hostDetails}>
                    <Text style={[styles.hostName, { color: c.text }]}>{item.name}</Text>
                    <Text style={[styles.hostUsername, { color: c.textMuted }]}>@{item.username}</Text>
                  </View>
                  {item.isVerified && <Ionicons name="checkmark-circle" size={16} color={c.primary} />}
                  <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={optionsVisible && isHost} animationType="fade" transparent onRequestClose={() => setOptionsVisible(false)}>
        <Pressable style={styles.optionsBackdrop} onPress={() => setOptionsVisible(false)}>
          <View style={[styles.optionsMenu, { backgroundColor: c.surface, borderColor: c.border, top: insets.top + 62, right: 16 }]}>
            <Pressable onPress={openEditor} style={styles.optionRow}>
              <Ionicons name="create-outline" size={19} color={c.text} />
              <Text style={[styles.optionLabel, { color: c.text }]}>Edit event</Text>
            </Pressable>
            <View style={[styles.optionDivider, { backgroundColor: c.border }]} />
            <Pressable onPress={confirmDelete} style={styles.optionRow}>
              <Ionicons name="trash-outline" size={19} color={c.danger} />
              <Text style={[styles.optionLabel, { color: c.danger }]}>Delete event</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 12 },
  hero: { width: '100%', overflow: 'hidden', backgroundColor: '#18202B' },
  heroControls: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroRightControls: { flexDirection: 'row', gap: 9 },
  heroButton: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,12,16,0.25)' },
  heroBottom: { position: 'absolute', left: 18, right: 18, bottom: 17, flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  heroDatePill: { width: 52, height: 60, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  heroDateMonth: { color: '#D04F43', fontSize: 10, fontWeight: '900' },
  heroDateDay: { color: '#151515', fontSize: 23, lineHeight: 26, fontWeight: '900' },
  heroTitleWrap: { flex: 1, gap: 5 },
  heroCategory: { alignSelf: 'flex-start', height: 24, paddingHorizontal: 9, borderRadius: 12, backgroundColor: 'rgba(10,12,16,0.66)', flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroCategoryEmoji: { fontSize: 11 },
  heroCategoryLabel: { color: '#fff', fontSize: 10, fontWeight: '800' },
  heroTitle: { color: '#fff', fontSize: 23, lineHeight: 27, fontWeight: '900' },
  tabsRow: { minHeight: 48, flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#7772', paddingHorizontal: 20 },
  tabButton: { minWidth: 92, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, marginRight: 18 },
  tabLabel: { fontSize: 13, fontWeight: '800' },
  commentCount: { fontSize: 11, fontWeight: '700' },
  infoContent: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 20 },
  pageTitle: { fontSize: 24, lineHeight: 29, fontWeight: '900' },
  categoryAndCost: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 16 },
  detailChip: { height: 30, borderRadius: 15, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailChipEmoji: { fontSize: 12 },
  detailChipText: { fontSize: 11, fontWeight: '800' },
  hostCard: { minHeight: 66, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, gap: 10, marginBottom: 8 },
  avatar: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#54606D', borderWidth: 2 },
  avatarInitials: { color: '#fff', fontSize: 12, fontWeight: '900' },
  hostDetails: { flex: 1 },
  hostName: { fontSize: 13, fontWeight: '800' },
  hostUsername: { fontSize: 11, marginTop: 3 },
  section: { paddingVertical: 17, borderBottomWidth: StyleSheet.hairlineWidth },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 13 },
  detailIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailCopy: { flex: 1 },
  detailMain: { fontSize: 13, fontWeight: '700', lineHeight: 19 },
  detailSub: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  outlineButton: { alignSelf: 'flex-start', minHeight: 35, paddingHorizontal: 11, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 11, marginLeft: 49 },
  outlineButtonText: { fontSize: 11, fontWeight: '700' },
  metadataGrid: { flexDirection: 'row', gap: 8, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth },
  metadataTile: { flex: 1, minWidth: 0, minHeight: 76, borderWidth: 1, borderRadius: 11, padding: 9, gap: 4 },
  metadataLabel: { fontSize: 9, fontWeight: '600' },
  metadataValue: { fontSize: 11, lineHeight: 14, fontWeight: '800' },
  capacitySection: { paddingTop: 16, paddingBottom: 5 },
  capacityHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  capacityCount: { fontSize: 11, fontWeight: '600' },
  progressTrack: { width: '100%', height: 7, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  description: { marginTop: 9, fontSize: 13, lineHeight: 20 },
  attendeesHeading: { minHeight: 64, paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  attendeeStack: { flexDirection: 'row', alignItems: 'center' },
  discussionContent: { paddingHorizontal: 18, paddingVertical: 17, gap: 12, minHeight: 220 },
  discussionIntro: { marginBottom: 3 },
  noComments: { alignItems: 'center', paddingVertical: 45, gap: 9 },
  noCommentsText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  commentRow: { flexDirection: 'row', gap: 9, padding: 11, borderWidth: 1, borderRadius: 12 },
  commentBody: { flex: 1 },
  commentAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentAuthor: { fontSize: 12, fontWeight: '800' },
  commentTime: { fontSize: 10 },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  pinnedLabel: { fontSize: 9, fontWeight: '800' },
  commentMessage: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  composer: { minHeight: 56, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentInput: { flex: 1, minHeight: 38, maxHeight: 80, borderWidth: 1, borderRadius: 19, paddingHorizontal: 13, paddingVertical: 9, fontSize: 12 },
  sendButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  bottomBar: { minHeight: 63, paddingHorizontal: 14, paddingTop: 8, flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: StyleSheet.hairlineWidth },
  quickRsvp: { minWidth: 126, height: 43, borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  quickRsvpText: { fontSize: 11, fontWeight: '800' },
  primaryAction: { flex: 1, height: 43, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryActionText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 14, fontWeight: '700', marginVertical: 12 },
  backToFeed: { height: 40, paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center' },
  backToFeedLabel: { color: '#fff', fontSize: 12, fontWeight: '800' },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  attendeeSheet: { minHeight: '50%', maxHeight: '82%', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 17, paddingTop: 9 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  sheetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  closeSheetButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  attendeeListRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionsBackdrop: { flex: 1, backgroundColor: 'transparent' },
  optionsMenu: { position: 'absolute', width: 188, borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 5, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 12, elevation: 8 },
  optionRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9 },
  optionLabel: { fontSize: 12, fontWeight: '700' },
  optionDivider: { height: StyleSheet.hairlineWidth },
});
