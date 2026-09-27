import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useRef } from 'react';

const INITIAL_MESSAGES = [
  { id: '1', text: 'Hey! Did you finish the calc homework?', sender: 'them', time: '2:30 PM' },
  { id: '2', text: 'Yeah just finished it! Problem 3 was brutal lol', sender: 'me', time: '2:31 PM' },
  { id: '3', text: 'Same 😭 want to study for the midterm together?', sender: 'them', time: '2:32 PM' },
  { id: '4', text: 'Definitely! Library tonight around 7?', sender: 'me', time: '2:33 PM' },
  { id: '5', text: 'Perfect! I\'ll start a study room 🔥', sender: 'them', time: '2:34 PM' },
];

export default function ChatScreen() {
  const { userId, userName } = useLocalSearchParams<{ userId: string; userName: string }>();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'me',
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }: { item: typeof INITIAL_MESSAGES[0] }) => {
    const isMe = item.sender === 'me';
    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(userName || 'A')[0]}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
        </View>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerUser}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{(userName || 'A')[0]}</Text>
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerName}>{userName || 'Alex Chen'}</Text>
            <Text style={styles.headerStatus}>🟢 Active now</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/study-room')}>
            <Ionicons name="videocam" size={22} color="#38bdf8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="call" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Quick Replies */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickReplies} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {['👍 Sounds good!', '📚 Study room?', '🔥 Let\'s go!', '😂 lmao'].map(qr => (
          <TouchableOpacity
            key={qr}
            style={styles.quickReply}
            onPress={() => setInput(qr)}
          >
            <Text style={styles.quickReplyText}>{qr}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="add-circle" size={28} color="#38bdf8" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor="#6b7280"
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={18} color={input.trim() ? '#000' : '#6b7280'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  backBtn: { padding: 8 },
  headerUser: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 4 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  headerAvatarText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#0a0a0a' },
  headerName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  headerStatus: { color: '#10b981', fontSize: 12 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1f2937', justifyContent: 'center', alignItems: 'center' },
  messageList: { padding: 16, gap: 12 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  messageRowMe: { flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#38bdf8', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  bubble: { maxWidth: '72%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleThem: { backgroundColor: '#1f2937', borderBottomLeftRadius: 4 },
  bubbleMe: { backgroundColor: '#38bdf8', borderBottomRightRadius: 4 },
  bubbleText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  bubbleTextMe: { color: '#000' },
  time: { color: '#374151', fontSize: 11 },
  quickReplies: { maxHeight: 44, marginBottom: 8 },
  quickReply: { backgroundColor: '#1f2937', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#374151' },
  quickReplyText: { color: '#9ca3af', fontSize: 13, fontWeight: '500' },
  inputArea: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1f2937', gap: 10 },
  attachBtn: { padding: 4 },
  input: { flex: 1, backgroundColor: '#1f2937', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#374151', maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#38bdf8', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#1f2937' },
});
