import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

type Participant = {
  id: string;
  name: string;
  isCameraOn: boolean;
  isMuted: boolean;
  isHost?: boolean;
  studyStreak?: number;
};

const PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Alex', isCameraOn: true, isMuted: true, isHost: true, studyStreak: 5 },
  { id: '2', name: 'You', isCameraOn: false, isMuted: true },
  { id: '3', name: 'Sarah', isCameraOn: true, isMuted: true, studyStreak: 12 },
  { id: '4', name: 'Mike', isCameraOn: false, isMuted: true },
];

const INITIAL_CHAT = [
  { id: '1', user: 'Alex', text: 'Starting 25 min focus sprint! 💪', time: '2:30 PM', isSystem: false },
  { id: '2', user: 'Sarah', text: 'Ready! Muted and camera on', time: '2:31 PM', isSystem: false },
  { id: '3', user: 'System', text: 'Timer started: 25:00', time: '2:32 PM', isSystem: true },
];

export default function StudyRoomScreen() {
  const [timer, setTimer] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [participants, setParticipants] = useState(PARTICIPANTS);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState(INITIAL_CHAT);
  const [focusMode, setFocusMode] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [handRaised, setHandRaised] = useState(false);

  // FIX: Use setInterval (not window.setInterval) for React Native
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isTimerRunning && timer > 0) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => prev - 1);
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    if (timer === 0) {
      setIsTimerRunning(false);
      Alert.alert('🎉 Session Complete!', 'Great work! Take a 5 minute break.');
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTimerRunning, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleCamera = () => {
    setParticipants(prev => prev.map(p =>
      p.name === 'You' ? { ...p, isCameraOn: !p.isCameraOn } : p
    ));
  };

  const toggleMute = () => {
    setParticipants(prev => prev.map(p =>
      p.name === 'You' ? { ...p, isMuted: !p.isMuted } : p
    ));
  };

  const resetTimer = () => {
    setTimer(25 * 60);
    setElapsedTime(0);
    setIsTimerRunning(false);
  };

  const sendMessage = () => {
    if (!chatMessage.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      user: 'You',
      text: chatMessage.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      isSystem: false,
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatMessage('');
  };

  const handleShare = () => {
    Alert.alert('Share Room', 'Share link copied! Send to your friends to join.');
  };

  const handleHandRaise = () => {
    setHandRaised(!handRaised);
    if (!handRaised) {
      setChatMessages(prev => [...prev, { id: Date.now().toString(), user: 'System', text: 'You raised your hand ✋', time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), isSystem: true }]);
    }
  };

  const handleLeave = () => {
    Alert.alert('Leave Room?', `You've been studying for ${formatTime(elapsedTime)}. Great work!`, [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const renderParticipant = ({ item }: { item: Participant }) => (
    <View style={styles.videoTile}>
      {item.isCameraOn ? (
        <View style={[styles.videoFeed, { backgroundColor: '#1f2937' }]}>
          <Text style={styles.initials}>{item.name[0]}</Text>
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.videoOverlay}>
            <Text style={styles.participantName}>{item.name} {item.isHost && '👑'}</Text>
            {item.studyStreak && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={12} color="#f59e0b" />
                <Text style={styles.streakText}>{item.studyStreak}</Text>
              </View>
            )}
          </LinearGradient>
        </View>
      ) : (
        <View style={[styles.videoFeed, { backgroundColor: '#111' }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{item.name[0]}</Text>
          </View>
          <Text style={styles.participantNameOffline}>{item.name}</Text>
          <View style={styles.cameraOffIndicator}>
            <Ionicons name="videocam-off" size={16} color="#fff" />
          </View>
        </View>
      )}
      {item.isMuted && (
        <View style={styles.muteIndicator}>
          <Ionicons name="mic-off" size={14} color="#fff" />
        </View>
      )}
    </View>
  );

  if (focusMode) {
    return (
      <View style={styles.focusContainer}>
        <TouchableOpacity style={styles.exitFocusBtn} onPress={() => setFocusMode(false)}>
          <Ionicons name="expand" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.focusTimer}>
          <Text style={styles.focusTimerText}>{formatTime(timer)}</Text>
          <Text style={styles.focusSubtitle}>Stay focused 🎯</Text>
        </View>

        <TouchableOpacity
          style={styles.focusControl}
          onPress={() => setIsTimerRunning(!isTimerRunning)}
        >
          <Ionicons name={isTimerRunning ? 'pause' : 'play'} size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  const youParticipant = participants.find(p => p.name === 'You');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>Calc II Final Prep</Text>
          <View style={styles.sessionMeta}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.elapsedTime}>{formatTime(elapsedTime)} elapsed</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setFocusMode(true)}>
            <Ionicons name="scan-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowChat(!showChat)}>
            <Ionicons name="chatbubble" size={22} color={showChat ? '#38bdf8' : '#fff'} />
            {chatMessages.filter(m => !m.isSystem).length > 0 && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>{chatMessages.filter(m => !m.isSystem).length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={handleLeave}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Video Grid */}
        <View style={[styles.videoGrid, showChat && styles.videoGridCompact]}>
          <FlatList
            data={participants}
            renderItem={renderParticipant}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.videoGridContent}
            scrollEnabled={false}
          />
        </View>

        {/* Shared Timer */}
        <View style={styles.timerSection}>
          <View style={styles.timerCard}>
            <TouchableOpacity onPress={() => setIsTimerRunning(!isTimerRunning)} style={styles.timerBtn}>
              <Ionicons name={isTimerRunning ? 'pause-circle' : 'play-circle'} size={32} color="#38bdf8" />
            </TouchableOpacity>

            <View style={styles.timerDisplay}>
              <Text style={[styles.timerText, timer < 60 && styles.timerUrgent]}>
                {formatTime(timer)}
              </Text>
              <Text style={styles.timerLabel}>Pomodoro Focus</Text>
            </View>

            <TouchableOpacity style={styles.timerBtn} onPress={resetTimer}>
              <Ionicons name="refresh" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${((25 * 60 - timer) / (25 * 60)) * 100}%` as any }]} />
          </View>
        </View>

        {/* Chat Sidebar */}
        {showChat && (
          <View style={styles.chatPanel}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Session Chat</Text>
              <TouchableOpacity onPress={() => setShowChat(false)}>
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={chatMessages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }: { item: any }) => (
                <View style={[styles.chatItem, item.isSystem && styles.chatSystem]}>
                  {!item.isSystem && <Text style={styles.chatUser}>{item.user}</Text>}
                  <Text style={[styles.chatText, item.isSystem && styles.chatSystemText]}>{item.text}</Text>
                </View>
              )}
              style={styles.chatList}
            />

            <View style={styles.chatInputBox}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type a message..."
                placeholderTextColor="#6b7280"
                value={chatMessage}
                onChangeText={setChatMessage}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity onPress={sendMessage}>
                <Ionicons name="send" size={20} color={chatMessage.trim() ? '#38bdf8' : '#374151'} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, youParticipant?.isMuted && styles.controlBtnOff]}
          onPress={toggleMute}
        >
          <Ionicons name={youParticipant?.isMuted ? 'mic-off' : 'mic'} size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, youParticipant?.isCameraOn && styles.controlBtnOn]}
          onPress={toggleCamera}
        >
          <Ionicons name={youParticipant?.isCameraOn ? 'videocam' : 'videocam-off'} size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, handRaised && styles.controlBtnOn]}
          onPress={handleHandRaise}
        >
          <Ionicons name="hand-left" size={24} color={handRaised ? '#000' : '#fff'} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
          <Ionicons name="call" size={24} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  focusContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  exitFocusBtn: { position: 'absolute', top: 50, right: 20, padding: 10 },
  focusTimer: { alignItems: 'center' },
  focusTimerText: { color: '#fff', fontSize: 80, fontWeight: '200' },
  focusSubtitle: { color: '#6b7280', fontSize: 18, marginTop: 10 },
  focusControl: { marginTop: 40, width: 80, height: 80, borderRadius: 40, backgroundColor: '#38bdf8', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  sessionInfo: { flex: 1 },
  sessionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  sessionMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  liveText: { color: '#ef4444', fontSize: 12, fontWeight: 'bold' },
  elapsedTime: { color: '#6b7280', fontSize: 12 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1f2937', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  chatBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  chatBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  mainContent: { flex: 1, flexDirection: 'row' },
  videoGrid: { flex: 1, padding: 8 },
  videoGridCompact: { flex: 0.55 },
  videoGridContent: { gap: 8 },
  videoTile: { flex: 1, aspectRatio: 1, margin: 4, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  videoFeed: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  initials: { color: '#fff', fontSize: 40, fontWeight: 'bold', opacity: 0.3 },
  videoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  participantName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  participantNameOffline: { color: '#6b7280', marginTop: 8, fontWeight: '600' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  streakText: { color: '#f59e0b', fontSize: 12 },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#38bdf8', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#000', fontSize: 24, fontWeight: 'bold' },
  cameraOffIndicator: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 4 },
  muteIndicator: { position: 'absolute', bottom: 8, left: 8, backgroundColor: '#ef4444', padding: 4, borderRadius: 4 },
  timerSection: { position: 'absolute', bottom: 100, left: 16, right: 16, backgroundColor: '#1f2937', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#374151' },
  timerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timerBtn: { padding: 8 },
  timerDisplay: { alignItems: 'center' },
  timerText: { color: '#fff', fontSize: 48, fontWeight: '200' },
  timerUrgent: { color: '#ef4444' },
  timerLabel: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  progressContainer: { height: 4, backgroundColor: '#374151', borderRadius: 2, marginTop: 12, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#38bdf8', borderRadius: 2 },
  chatPanel: { width: 280, backgroundColor: '#111', borderLeftWidth: 1, borderLeftColor: '#1f2937' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  chatTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  chatList: { flex: 1, padding: 12 },
  chatItem: { marginBottom: 12 },
  chatSystem: { alignItems: 'center', backgroundColor: '#1f2937', padding: 8, borderRadius: 8 },
  chatUser: { color: '#38bdf8', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  chatText: { color: '#fff', fontSize: 14 },
  chatSystemText: { color: '#6b7280', fontSize: 12 },
  chatInputBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#1f2937', gap: 8 },
  chatInput: { flex: 1, color: '#fff', backgroundColor: '#1f2937', padding: 10, borderRadius: 20, fontSize: 14 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: 20, paddingHorizontal: 16, backgroundColor: '#0a0a0a', borderTopWidth: 1, borderTopColor: '#1f2937' },
  controlBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' },
  controlBtnOn: { backgroundColor: '#38bdf8' },
  controlBtnOff: { backgroundColor: '#ef4444' },
  leaveBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#dc2626', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});