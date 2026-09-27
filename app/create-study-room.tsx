import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';

const MODES = [
  { id: 'focus', label: 'Focus', icon: 'flame', color: '#f59e0b', desc: 'Silent, camera optional' },
  { id: 'casual', label: 'Casual', icon: 'people', color: '#38bdf8', desc: 'Talk, collaborate' },
  { id: 'tutor', label: 'Tutor', icon: 'school', color: '#8b5cf6', desc: 'One leads, others learn' },
];

const SUBJECTS = ['Calculus', 'Physics', 'Chemistry', 'CS Algorithms', 'Economics', 'Biology', 'Literature', 'History', 'Statistics', 'Linear Algebra'];

export default function CreateStudyRoomScreen() {
  const [subject, setSubject] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [selectedMode, setSelectedMode] = useState('focus');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [showSubjects, setShowSubjects] = useState(false);

  const isValid = subject.trim() && selectedMode;
  const mode = MODES.find(m => m.id === selectedMode)!;

  const handleStart = () => {
    Alert.alert('Study Room Created! 🎓', `"${subject}" is now live!`, [
      {
        text: 'Enter Room', onPress: () => {
          router.back();
          router.push('/study-room');
        }
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>New Study Room</Text>
        <TouchableOpacity
          style={[styles.startBtn, !isValid && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={!isValid}
        >
          <Text style={[styles.startText, !isValid && styles.startTextDisabled]}>Start</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Mode */}
        <View style={styles.section}>
          <Text style={styles.label}>Study Mode *</Text>
          <View style={styles.modeGrid}>
            {MODES.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.modeCard, selectedMode === m.id && { borderColor: m.color, backgroundColor: `${m.color}15` }]}
                onPress={() => setSelectedMode(m.id)}
              >
                <View style={[styles.modeIcon, { backgroundColor: `${m.color}20` }]}>
                  <Ionicons name={m.icon as any} size={24} color={m.color} />
                </View>
                <Text style={[styles.modeLabel, selectedMode === m.id && { color: m.color }]}>{m.label}</Text>
                <Text style={styles.modeDesc}>{m.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subject */}
        <View style={styles.section}>
          <Text style={styles.label}>Subject *</Text>
          <TouchableOpacity
            style={styles.inputRow}
            onPress={() => setShowSubjects(!showSubjects)}
          >
            <Ionicons name="book" size={18} color="#6b7280" />
            <Text style={[styles.inputText, !subject && styles.placeholder]}>
              {subject || 'Pick a subject...'}
            </Text>
            <Ionicons name={showSubjects ? 'chevron-up' : 'chevron-down'} size={16} color="#6b7280" />
          </TouchableOpacity>
          {showSubjects && (
            <View style={styles.subjectList}>
              {SUBJECTS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={styles.subjectItem}
                  onPress={() => { setSubject(s); setShowSubjects(false); }}
                >
                  <Text style={[styles.subjectText, subject === s && { color: '#38bdf8', fontWeight: '600' }]}>{s}</Text>
                  {subject === s && <Ionicons name="checkmark" size={16} color="#38bdf8" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Course Code */}
        <View style={styles.section}>
          <Text style={styles.label}>Course Code (optional)</Text>
          <View style={styles.inputBox}>
            <Ionicons name="code" size={18} color="#6b7280" />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. MAT-201, CS-310"
              placeholderTextColor="#6b7280"
              value={courseCode}
              onChangeText={setCourseCode}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Max Participants */}
        <View style={styles.section}>
          <Text style={styles.label}>Max Participants</Text>
          <View style={styles.counterCard}>
            <View style={styles.counterInfo}>
              <Ionicons name="people" size={20} color="#38bdf8" />
              <Text style={styles.counterLabel}>People in session</Text>
            </View>
            <View style={styles.counter}>
              <TouchableOpacity onPress={() => setMaxParticipants(p => Math.max(2, p - 2))}>
                <Ionicons name="remove-circle" size={32} color="#38bdf8" />
              </TouchableOpacity>
              <Text style={styles.counterNum}>{maxParticipants}</Text>
              <TouchableOpacity onPress={() => setMaxParticipants(p => Math.min(50, p + 2))}>
                <Ionicons name="add-circle" size={32} color="#38bdf8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Preview Card */}
        {isValid && (
          <View style={styles.previewCard}>
            <View style={[styles.previewIndicator, { backgroundColor: mode.color }]} />
            <View style={styles.previewContent}>
              <Text style={styles.previewTitle}>{subject} {courseCode ? `(${courseCode})` : ''}</Text>
              <Text style={styles.previewMeta}>
                {mode.label} mode • Up to {maxParticipants} students
              </Text>
              <View style={styles.previewTags}>
                <View style={[styles.previewTag, { backgroundColor: `${mode.color}20` }]}>
                  <Text style={[styles.previewTagText, { color: mode.color }]}>🔴 LIVE soon</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  startBtn: { backgroundColor: '#38bdf8', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  startBtnDisabled: { backgroundColor: '#1f2937' },
  startText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  startTextDisabled: { color: '#6b7280' },
  section: { paddingHorizontal: 20, marginTop: 20 },
  label: { color: '#9ca3af', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  modeGrid: { flexDirection: 'row', gap: 10 },
  modeCard: { flex: 1, alignItems: 'center', padding: 14, backgroundColor: '#1f2937', borderRadius: 14, borderWidth: 2, borderColor: 'transparent', gap: 8 },
  modeIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  modeLabel: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modeDesc: { color: '#6b7280', fontSize: 11, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f2937', borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: '#374151' },
  inputText: { flex: 1, color: '#fff', fontSize: 15 },
  placeholder: { color: '#6b7280' },
  subjectList: { backgroundColor: '#1f2937', borderRadius: 12, marginTop: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#374151' },
  subjectItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#374151' },
  subjectText: { color: '#fff', fontSize: 15 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f2937', borderRadius: 12, paddingHorizontal: 14, gap: 10, borderWidth: 1, borderColor: '#374151' },
  textInput: { flex: 1, color: '#fff', paddingVertical: 14, fontSize: 15 },
  counterCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1f2937', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#374151' },
  counterInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterLabel: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterNum: { color: '#fff', fontSize: 22, fontWeight: 'bold', minWidth: 32, textAlign: 'center' },
  previewCard: { flexDirection: 'row', backgroundColor: '#111827', marginHorizontal: 20, marginTop: 20, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#374151' },
  previewIndicator: { width: 4 },
  previewContent: { flex: 1, padding: 16, gap: 4 },
  previewTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  previewMeta: { color: '#9ca3af', fontSize: 13 },
  previewTags: { flexDirection: 'row', marginTop: 4 },
  previewTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  previewTagText: { fontSize: 12, fontWeight: '600' },
});
