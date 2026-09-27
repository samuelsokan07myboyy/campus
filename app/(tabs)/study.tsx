import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';

// ─── Types ─────────────────────────────────────────────────────────────────────
type StudyRoom = {
  id: string;
  subject: string;
  courseCode?: string;
  hostName: string;
  hostSchool: string;
  participants: number;
  maxParticipants: number;
  mode: 'focus' | 'casual' | 'tutor';
  isLive: boolean;
  duration: string;
};

// Empty — will be populated from Firestore
const ROOMS: StudyRoom[] = [];

const MODE_COLORS = {
  focus:  '#6366F1',
  casual: '#10B981',
  tutor:  '#F59E0B',
};

const MODE_LABELS = {
  focus:  'Focus',
  casual: 'Casual',
  tutor:  'Tutor',
};

// ─── Focus Timer ────────────────────────────────────────────────────────────────
function FocusTimer({ colors }: { colors: any }) {
  const DURATION = 25 * 60; // 25 min pomodoro
  const [seconds, setSeconds] = useState(DURATION);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) { clearInterval(intervalRef.current!); setRunning(false); return 0; }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const progress = (DURATION - seconds) / DURATION;
  const circumference = 2 * Math.PI * 54;

  const reset = () => { setRunning(false); setSeconds(DURATION); };

  return (
    <LinearGradient
      colors={['#4F46E5', '#7C3AED']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.timerCard}
    >
      <View style={styles.timerTop}>
        <Text style={styles.timerLabel}>Focus Timer</Text>
        <View style={styles.timerBadge}>
          <Ionicons name="flame" size={12} color="#F59E0B" />
          <Text style={styles.timerBadgeText}>5 day streak</Text>
        </View>
      </View>

      <View style={styles.timerBody}>
        <View style={styles.timerCircleWrap}>
          {/* Background circle */}
          <View style={styles.timerCircleBg} />
          {/* Time display */}
          <View style={styles.timerTimeWrap}>
            <Text style={styles.timerTime}>{mm}:{ss}</Text>
            <Text style={styles.timerSessionLabel}>POMODORO</Text>
          </View>
        </View>

        <View style={styles.timerControls}>
          <TouchableOpacity style={styles.timerControlBtn} onPress={reset}>
            <Ionicons name="refresh" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timerPlayBtn, { backgroundColor: running ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.25)' }]}
            onPress={() => setRunning((v) => !v)}
            activeOpacity={0.8}
          >
            <Ionicons name={running ? 'pause' : 'play'} size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.timerControlBtn} onPress={() => router.push('/study-room')}>
            <Ionicons name="people-outline" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

// ─── Study Room Card ────────────────────────────────────────────────────────────
function RoomCard({ room, colors }: { room: StudyRoom; colors: any }) {
  const modeColor = MODE_COLORS[room.mode];
  return (
    <TouchableOpacity
      style={[styles.roomCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.8}
      onPress={() => router.push('/study-room')}
    >
      <View style={styles.roomTop}>
        <View style={[styles.modePill, { backgroundColor: modeColor + '20' }]}>
          <View style={[styles.liveDot, { backgroundColor: modeColor }]} />
          <Text style={[styles.modeText, { color: modeColor }]}>{MODE_LABELS[room.mode]}</Text>
        </View>
        <View style={styles.roomMeta}>
          <Ionicons name="people-outline" size={13} color={colors.textMuted} />
          <Text style={[styles.roomMetaText, { color: colors.textMuted }]}>
            {room.participants}/{room.maxParticipants}
          </Text>
        </View>
      </View>
      <Text style={[styles.roomSubject, { color: colors.text }]} numberOfLines={1}>
        {room.subject}
      </Text>
      {room.courseCode && (
        <Text style={[styles.roomCode, { color: colors.textMuted }]}>{room.courseCode}</Text>
      )}
      <View style={styles.roomBottom}>
        <Text style={[styles.roomHost, { color: colors.textMuted }]}>
          {room.hostName} · {room.hostSchool}
        </Text>
        <View style={styles.roomDuration}>
          <Ionicons name="time-outline" size={11} color={colors.textDim} />
          <Text style={[styles.roomDurationText, { color: colors.textDim }]}>{room.duration}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────────
export default function StudyScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'focus' | 'casual' | 'tutor'>('all');

  const filtered = ROOMS.filter((r) => {
    const matchFilter = filter === 'all' || r.mode === filter;
    const matchSearch = r.subject.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'focus', label: '🎯 Focus' },
    { key: 'casual', label: '😌 Casual' },
    { key: 'tutor', label: '🎓 Tutor' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>Study</Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: c.primary }]}
          onPress={() => router.push('/create-study-room')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>New Room</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Focus Timer */}
        <View style={styles.section}>
          <FocusTimer colors={c} />
        </View>

        {/* Quick Stats Row */}
        <View style={[styles.statsRow, { paddingHorizontal: 20, gap: 12 }]}>
          {[
            { icon: 'time-outline', label: 'This Week', value: '0h' },
            { icon: 'trophy-outline', label: 'Streak', value: '5 days' },
            { icon: 'people-outline', label: 'Sessions', value: '0' },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: c.card, borderColor: c.border, flex: 1 }]}>
              <Ionicons name={s.icon as any} size={18} color={c.primary} />
              <Text style={[styles.statValue, { color: c.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Live Rooms Section */}
        <View style={[styles.section, { paddingHorizontal: 20 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Live Rooms</Text>
            {ROOMS.length > 0 && (
              <View style={[styles.liveBadge, { backgroundColor: c.danger + '20' }]}>
                <View style={[styles.liveDotSmall, { backgroundColor: c.danger }]} />
                <Text style={[styles.liveBadgeText, { color: c.danger }]}>{ROOMS.length} live</Text>
              </View>
            )}
          </View>

          {/* Search */}
          <View style={[styles.searchBar, { backgroundColor: c.card, borderColor: c.border }]}>
            <Ionicons name="search" size={16} color={c.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              placeholder="Search subject or course..."
              placeholderTextColor={c.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: filter === f.key ? c.primary : c.card,
                    borderColor: filter === f.key ? c.primary : c.border,
                  },
                ]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterText, { color: filter === f.key ? '#fff' : c.textMuted }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Room List */}
          {filtered.length === 0 ? (
            <View style={styles.emptyRooms}>
              <Ionicons name="book-outline" size={36} color={c.textDim} />
              <Text style={[styles.emptyRoomsTitle, { color: c.text }]}>No rooms yet</Text>
              <Text style={[styles.emptyRoomsSub, { color: c.textMuted }]}>
                Create a study room and invite your classmates
              </Text>
              <TouchableOpacity
                style={[styles.emptyRoomsBtn, { borderColor: c.primary }]}
                onPress={() => router.push('/create-study-room')}
              >
                <Text style={[styles.emptyRoomsBtnText, { color: c.primary }]}>Create a Room</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.roomGrid}>
              {filtered.map((r) => <RoomCard key={r.id} room={r} colors={c} />)}
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 28, fontWeight: '900' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  section: { marginTop: 20 },
  // Timer
  timerCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    minHeight: 180,
  },
  timerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  timerLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '700' },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  timerBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timerCircleWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  timerCircleBg: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  timerTimeWrap: { alignItems: 'center' },
  timerTime: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  timerSessionLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
  timerControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  timerControlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Stats
  statsRow: { flexDirection: 'row', marginTop: 16 },
  statCard: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500' },
  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  liveDotSmall: { width: 6, height: 6, borderRadius: 3 },
  liveBadgeText: { fontSize: 12, fontWeight: '700' },
  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },
  // Filters
  filterRow: { marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 8,
  },
  filterText: { fontSize: 13, fontWeight: '600' },
  // Room cards
  roomGrid: { gap: 12 },
  roomCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  roomTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  modeText: { fontSize: 12, fontWeight: '700' },
  roomMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roomMetaText: { fontSize: 12 },
  roomSubject: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  roomCode: { fontSize: 12, marginBottom: 10 },
  roomBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomHost: { fontSize: 12 },
  roomDuration: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  roomDurationText: { fontSize: 11 },
  // Empty
  emptyRooms: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyRoomsTitle: { fontSize: 18, fontWeight: '800', marginTop: 8 },
  emptyRoomsSub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  emptyRoomsBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  emptyRoomsBtnText: { fontSize: 14, fontWeight: '700' },
});