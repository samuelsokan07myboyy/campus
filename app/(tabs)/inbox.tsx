import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';

// Empty — will be populated from Firestore
const CONVERSATIONS: {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar?: string;
  isGroup?: boolean;
}[] = [];

type FilterTab = 'All' | 'Unread';

export default function InboxScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [filter, setFilter] = useState<FilterTab>('All');

  const filtered = filter === 'Unread'
    ? CONVERSATIONS.filter((m) => m.unread > 0)
    : CONVERSATIONS;

  const renderItem = ({ item }: { item: typeof CONVERSATIONS[0] }) => (
    <TouchableOpacity
      style={[styles.convoCard, { backgroundColor: c.background, borderBottomColor: c.border }]}
      onPress={() => router.push('/chat')}
      activeOpacity={0.75}
    >
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: c.primary + '25' }]}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarInitial, { color: c.primary }]}>
              {item.name[0].toUpperCase()}
            </Text>
          )}
        </View>
        {item.isGroup && (
          <View style={[styles.groupBadge, { backgroundColor: c.secondary }]}>
            <Ionicons name="people" size={8} color="#fff" />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.convoContent}>
        <View style={styles.convoTop}>
          <Text style={[styles.convoName, { color: c.text }, item.unread > 0 && styles.convoNameBold]}>
            {item.name}
          </Text>
          <Text style={[styles.convoTime, { color: c.textMuted }]}>{item.timestamp}</Text>
        </View>
        <View style={styles.convoBottom}>
          <Text style={[styles.convoLastMsg, { color: item.unread > 0 ? c.textMuted : c.textDim }]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: c.primary }]}>
              <Text style={styles.unreadText}>{item.unread > 9 ? '9+' : item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>Messages</Text>
        <TouchableOpacity
          style={[styles.newChatBtn, { backgroundColor: c.primary }]}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={[styles.filterRow, { borderBottomColor: c.border }]}>
        {(['All', 'Unread'] as FilterTab[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f ? c.primary : c.card,
                borderColor: filter === f ? c.primary : c.border,
              },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? '#fff' : c.textMuted }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: c.primary + '15' }]}>
              <Ionicons name="chatbubbles-outline" size={36} color={c.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: c.text }]}>No messages yet</Text>
            <Text style={[styles.emptySubtitle, { color: c.textMuted }]}>
              Connect with classmates and start conversations
            </Text>
          </View>
        }
      />
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
  newChatBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  filterText: { fontSize: 13, fontWeight: '600' },
  convoCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 14 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 52, height: 52, borderRadius: 26 },
  avatarInitial: { fontSize: 20, fontWeight: '800' },
  groupBadge: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  convoContent: { flex: 1 },
  convoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convoName: { fontSize: 15, fontWeight: '600' },
  convoNameBold: { fontWeight: '800' },
  convoTime: { fontSize: 12 },
  convoBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convoLastMsg: { fontSize: 13, flex: 1, marginRight: 8 },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 10 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});