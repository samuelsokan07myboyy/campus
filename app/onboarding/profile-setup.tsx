import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

const MAJORS = [
  'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Biology', 'Chemistry', 'Physics', 'Mathematics', 'Economics',
  'Business', 'Psychology', 'Political Science', 'English', 'Pre-Med',
  'Data Science', 'Finance', 'Marketing', 'Architecture', 'Design',
];

const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad'] as const;

export default function ProfileSetupScreen() {
  const { updateUser, setIsLoggedIn } = useApp();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [selectedYear, setSelectedYear] = useState<typeof YEARS[number] | ''>('');
  const [bio, setBio] = useState('');
  const [majorSearch, setMajorSearch] = useState('');

  const filteredMajors = MAJORS.filter(m =>
    m.toLowerCase().includes(majorSearch.toLowerCase())
  );

  const isValid = displayName.trim() && username.trim() && selectedMajor && selectedYear;

  const handleFinish = () => {
    updateUser({
      displayName: displayName.trim(),
      username: username.trim(),
      major: selectedMajor,
      year: selectedYear as typeof YEARS[number],
      bio: bio.trim(),
    });
    setIsLoggedIn(true);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Set up your profile</Text>
          <Text style={styles.subtitle}>Let your campus community know who you are</Text>
        </View>

        {/* Avatar Picker */}
        <TouchableOpacity style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName ? displayName[0].toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.addPhotoBtn}>
            <Ionicons name="camera" size={16} color="#000" />
          </View>
          <Text style={styles.addPhotoText}>Add photo</Text>
        </TouchableOpacity>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Display Name *</Text>
          <View style={styles.inputBox}>
            <Ionicons name="person" size={18} color="#6b7280" />
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor="#6b7280"
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>
        </View>

        {/* Username */}
        <View style={styles.field}>
          <Text style={styles.label}>Username *</Text>
          <View style={styles.inputBox}>
            <Text style={styles.atSign}>@</Text>
            <TextInput
              style={styles.input}
              placeholder="your_handle"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              value={username}
              onChangeText={t => setUsername(t.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
            />
          </View>
        </View>

        {/* Year */}
        <View style={styles.field}>
          <Text style={styles.label}>Year *</Text>
          <View style={styles.yearRow}>
            {YEARS.map(yr => (
              <TouchableOpacity
                key={yr}
                style={[styles.yearChip, selectedYear === yr && styles.yearChipActive]}
                onPress={() => setSelectedYear(yr)}
              >
                <Text style={[styles.yearText, selectedYear === yr && styles.yearTextActive]}>
                  {yr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Major */}
        <View style={styles.field}>
          <Text style={styles.label}>Major *</Text>
          <View style={styles.inputBox}>
            <Ionicons name="book" size={18} color="#6b7280" />
            <TextInput
              style={styles.input}
              placeholder="Search your major..."
              placeholderTextColor="#6b7280"
              value={majorSearch}
              onChangeText={setMajorSearch}
            />
          </View>
          {majorSearch.length > 0 && (
            <View style={styles.majorList}>
              {filteredMajors.slice(0, 5).map(major => (
                <TouchableOpacity
                  key={major}
                  style={[styles.majorItem, selectedMajor === major && styles.majorItemActive]}
                  onPress={() => {
                    setSelectedMajor(major);
                    setMajorSearch(major);
                  }}
                >
                  <Text style={[styles.majorText, selectedMajor === major && { color: '#38bdf8' }]}>
                    {major}
                  </Text>
                  {selectedMajor === major && <Ionicons name="checkmark" size={16} color="#38bdf8" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bio */}
        <View style={styles.field}>
          <Text style={styles.label}>Bio (optional)</Text>
          <TextInput
            style={styles.bioInput}
            placeholder="Tell your campus who you are..."
            placeholderTextColor="#6b7280"
            multiline
            value={bio}
            onChangeText={setBio}
            maxLength={150}
          />
          <Text style={styles.charCount}>{bio.length}/150</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.btn, !isValid && styles.btnDisabled]}
          onPress={handleFinish}
          disabled={!isValid}
        >
          <Text style={styles.btnText}>Enter Campus 🎓</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 24, paddingBottom: 8 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#6b7280', fontSize: 14, marginTop: 6 },
  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: '#000' },
  addPhotoBtn: {
    position: 'absolute',
    bottom: 28,
    right: '38%',
    backgroundColor: '#38bdf8',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0a0a0a',
  },
  addPhotoText: { color: '#38bdf8', fontWeight: '600', fontSize: 14 },
  field: { paddingHorizontal: 20, marginBottom: 20 },
  label: { color: '#9ca3af', fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#374151',
    gap: 10,
  },
  input: { flex: 1, color: '#fff', paddingVertical: 14, fontSize: 15 },
  atSign: { color: '#6b7280', fontSize: 18, fontWeight: '600' },
  yearRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  yearChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  yearChipActive: { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
  yearText: { color: '#9ca3af', fontWeight: '600', fontSize: 14 },
  yearTextActive: { color: '#000' },
  majorList: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  majorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  majorItemActive: { backgroundColor: '#38bdf810' },
  majorText: { color: '#fff', fontSize: 15 },
  bioInput: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#374151',
  },
  charCount: { color: '#374151', fontSize: 12, textAlign: 'right', marginTop: 6 },
  btn: {
    backgroundColor: '#38bdf8',
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { backgroundColor: '#1f2937' },
  btnText: { color: '#000', fontWeight: '800', fontSize: 18 },
});
