import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  LayoutAnimation,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EventCard from '@/components/EventCard';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  EVENT_CATEGORIES,
  fetchEvents,
  setEventRSVP,
  type CampusEvent,
  type EventCategory,
  type EventRsvpSelection,
} from '@/services/eventsService';

export default function CampusScreen() {
  const { theme } = useTheme();
  const { currentUser } = useApp();
  const c = theme.colors;
  const [category, setCategory] = useState<EventCategory>('All');
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      setEvents(await fetchEvents(category, currentUser.id));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, currentUser.id]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      void fetchEvents(category, currentUser.id).then((nextEvents) => {
        if (isActive) setEvents(nextEvents);
      }).finally(() => {
        if (isActive) setLoading(false);
      });
      return () => {
        isActive = false;
      };
    }, [category, currentUser.id]),
  );

  const visibleEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return events;
    return events.filter((event) =>
      `${event.title} ${event.category} ${event.locationName} ${event.locationAddress ?? ''} ${event.host.username}`
        .toLowerCase()
        .includes(query),
    );
  }, [events, search]);

  const handleRSVP = async (eventId: string, status: EventRsvpSelection) => {
    const previousEvents = events;
    const current = events.find((event) => event.id === eventId);
    if (!current) return;

    const nextStatus = current.userRsvp === status ? null : status === 'none' ? null : status;
    const goingDelta = (nextStatus === 'going' ? 1 : 0) - (current.userRsvp === 'going' ? 1 : 0);
    const interestedDelta = (nextStatus === 'interested' ? 1 : 0) - (current.userRsvp === 'interested' ? 1 : 0);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEvents((items) => items.map((event) => event.id === eventId ? {
      ...event,
      userRsvp: nextStatus,
      goingCount: Math.max(0, event.goingCount + goingDelta),
      interestedCount: Math.max(0, event.interestedCount + interestedDelta),
    } : event));
    void Haptics.selectionAsync();

    try {
      await setEventRSVP(eventId, currentUser.id, nextStatus ?? 'none');
    } catch {
      setEvents(previousEvents);
    }
  };

  const handleCreateEvent = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/create-event');
  };

  const handleRefresh = async () => loadEvents(true);

  const listHeader = (
    <View>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.eyebrow, { color: c.secondary }]}>TEMPLE CAMPUS</Text>
          <Text style={[styles.title, { color: c.text }]}>Events</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create event"
          onPress={handleCreateEvent}
          style={[styles.createButton, { backgroundColor: c.primary }]}
        >
          <Ionicons name="add" size={21} color="#fff" />
          <Text style={styles.createButtonLabel}>Create</Text>
        </Pressable>
      </View>

      <View style={[styles.searchBox, { backgroundColor: c.card, borderColor: c.border }]}>
        <Ionicons name="search" size={18} color={c.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search events, places..."
          placeholderTextColor={c.textMuted}
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
          style={[styles.searchInput, { color: c.text }]}
        />
        {search.length > 0 && (
          <Pressable accessibilityLabel="Clear search" onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={c.textMuted} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {EVENT_CATEGORIES.map((item) => {
          const selected = category === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                if (category === item.id) return;
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setCategory(item.id);
              }}
              style={[styles.categoryChip, { backgroundColor: selected ? c.primary : c.card, borderColor: selected ? c.primary : c.border }]}
            >
              <Text style={styles.categoryEmoji}>{item.emoji}</Text>
              <Text style={[styles.categoryText, { color: selected ? '#fff' : c.textMuted }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeading}>
        <View>
          <Text style={[styles.sectionTitle, { color: c.text }]}>{category === 'All' ? 'Coming up' : category}</Text>
          <Text style={[styles.sectionSubtitle, { color: c.textMuted }]}>Good plans, close to campus.</Text>
        </View>
        <Text style={[styles.eventCount, { color: c.textMuted }]}>{visibleEvents.length} events</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {loading && events.length === 0 ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.loadingLabel, { color: c.textMuted }]}>Finding campus plans...</Text>
        </View>
      ) : (
        <FlatList
          data={visibleEvents}
          keyExtractor={(event) => event.id}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onRSVP={handleRSVP}
              onOpen={() => router.push({ pathname: '/event-detail', params: { eventId: item.id } })}
            />
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: c.primaryMuted }]}>
                <Ionicons name="calendar-outline" size={30} color={c.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: c.text }]}>No events found</Text>
              <Text style={[styles.emptyCopy, { color: c.textMuted }]}>Try another search or start a plan of your own.</Text>
              <Pressable onPress={handleCreateEvent} style={[styles.emptyAction, { backgroundColor: c.primary }]}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.emptyActionLabel}>Create an event</Text>
              </Pressable>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.primary} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 30 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  eyebrow: { fontSize: 10, fontWeight: '800', marginBottom: 3 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '900' },
  createButton: { height: 42, paddingHorizontal: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 3 },
  createButtonLabel: { color: '#fff', fontSize: 13, fontWeight: '800' },
  searchBox: { height: 47, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 14 },
  searchInput: { flex: 1, height: '100%', fontSize: 14, padding: 0 },
  categoryRow: { gap: 8, paddingBottom: 4 },
  categoryChip: { height: 36, paddingHorizontal: 11, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  categoryEmoji: { fontSize: 13 },
  categoryText: { fontSize: 12, fontWeight: '700' },
  sectionHeading: { marginTop: 22, marginBottom: 13, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  sectionSubtitle: { fontSize: 12, marginTop: 3 },
  eventCount: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 11 },
  loadingLabel: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingHorizontal: 26, paddingTop: 44, paddingBottom: 52 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 19, fontWeight: '800' },
  emptyCopy: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6, maxWidth: 270 },
  emptyAction: { marginTop: 17, height: 42, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', gap: 6, alignItems: 'center' },
  emptyActionLabel: { color: '#fff', fontSize: 13, fontWeight: '800' },
});