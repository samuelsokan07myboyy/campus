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

const VIBE_TYPES = [
  { id: 'study', label: 'Study', icon: 'book', color: '#38bdf8', emoji: '📚' },
  { id: 'party', label: 'Party', icon: 'musical-notes', color: '#8b5cf6', emoji: '🎉' },
  { id: 'chill', label: 'Chill', icon: 'cafe', color: '#10b981', emoji: '☕' },
  { id: 'food', label: 'Food', icon: 'pizza', color: '#f59e0b', emoji: '🍕' },
  { id: 'event', label: 'Event', icon: 'calendar', color: '#ec4899', emoji: '📅' },
];

const LOCATIONS = [
  'Barker Library, 5th Floor',
  'Student Center - Main Hall',
  'Stata Center - Lobby',
  'East Campus - Common Room',
  'Kresge Oval',
  'My Dorm Room',
  'Coffee Shop on Mass Ave',
];

export default function CreateVibeScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState('study');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('20');
  const [isPrivate, setIsPrivate] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [duration, setDuration] = useState('2');

  const isValid = title.trim() && selectedLocation && selectedType;
  const typeInfo = VIBE_TYPES.find(t => t.id === selectedType)!;

  const handleCreate = () => {
    Alert.alert('Vibe Created! 🎉', `"${title}" is now live on Campus Vibes`, [
      { text: 'View Vibe', onPress: () => { router.back(); router.push('/(tabs)/campus'); } },
      { text: 'Done', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Vibe</Text>
        <TouchableOpacity
          style={[styles.createBtn, !isValid && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={!isValid}
        >
          <Text style={[styles.createText, !isValid && styles.createTextDisabled]}>Go Live</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Type Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>What's the vibe? *</Text>
          <View style={styles.typeGrid}>
            {VIBE_TYPES.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeCard, selectedType === type.id && { borderColor: type.color, backgroundColor: `${type.color}15` }]}
                onPress={() => setSelectedType(type.id)}
              >
                <Text style={styles.typeEmoji}>{type.emoji}</Text>
                <Text style={[styles.typeLabel, selectedType === type.id && { color: type.color }]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder={`e.g. "${typeInfo.emoji} ${typeInfo.label === 'Study' ? 'Calc Finals Prep' : typeInfo.label === 'Party' ? 'Friday Night Hang' : 'Coffee & Chill'}"`}
            placeholderTextColor="#6b7280"
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell people what to expect..."
            placeholderTextColor="#6b7280"
            multiline
            value={description}
            onChangeText={setDescription}
            maxLength={200}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Location *</Text>
          <TouchableOpacity
            style={styles.locationPicker}
            onPress={() => setShowLocations(!showLocations)}
          >
            <Ionicons name="location" size={18} color={selectedLocation ? '#38bdf8' : '#6b7280'} />
            <Text style={[styles.locationText, !selectedLocation && styles.placeholder]}>
              {selectedLocation || 'Pick a spot on campus...'}
            </Text>
            <Ionicons name={showLocations ? 'chevron-up' : 'chevron-down'} size={16} color="#6b7280" />
          </TouchableOpacity>
          {showLocations && (
            <View style={styles.locationList}>
              {LOCATIONS.map(loc => (
                <TouchableOpacity
                  key={loc}
                  style={styles.locationItem}
                  onPress={() => { setSelectedLocation(loc); setShowLocations(false); }}
                >
                  <Ionicons name="location-outline" size={16} color="#6b7280" />
                  <Text style={[styles.locationItemText, selectedLocation === loc && { color: '#38bdf8' }]}>{loc}</Text>
                  {selectedLocation === loc && <Ionicons name="checkmark" size={16} color="#38bdf8" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Settings Row */}
        <View style={styles.section}>
          <Text style={styles.label}>Settings</Text>
          <View style={styles.settingsRow}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Max People</Text>
              <View style={styles.counter}>
                <TouchableOpacity onPress={() => setMaxAttendees(prev => String(Math.max(2, parseInt(prev) - 5)))}>
                  <Ionicons name="remove-circle" size={28} color="#38bdf8" />
                </TouchableOpacity>
                <Text style={styles.counterNum}>{maxAttendees}</Text>
                <TouchableOpacity onPress={() => setMaxAttendees(prev => String(Math.min(100, parseInt(prev) + 5)))}>
                  <Ionicons name="add-circle" size={28} color="#38bdf8" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Duration (hrs)</Text>
              <View style={styles.counter}>
                <TouchableOpacity onPress={() => setDuration(prev => String(Math.max(1, parseInt(prev) - 1)))}>
                  <Ionicons name="remove-circle" size={28} color="#38bdf8" />
                </TouchableOpacity>
                <Text style={styles.counterNum}>{duration}h</Text>
                <TouchableOpacity onPress={() => setDuration(prev => String(Math.min(8, parseInt(prev) + 1)))}>
                  <Ionicons name="add-circle" size={28} color="#38bdf8" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.privateToggle, isPrivate && styles.privateToggleOn]}
            onPress={() => setIsPrivate(!isPrivate)}
          >
            <Ionicons name={isPrivate ? 'lock-closed' : 'globe'} size={18} color={isPrivate ? '#8b5cf6' : '#6b7280'} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.privateLabel, isPrivate && { color: '#8b5cf6' }]}>
                {isPrivate ? 'Private Vibe' : 'Public Vibe'}
              </Text>
              <Text style={styles.privateDesc}>
                {isPrivate ? 'Only people with link can join' : 'Anyone on your campus can join'}
              </Text>
            </View>
            <View style={[styles.togglePill, isPrivate && styles.togglePillOn]}>
              <View style={[styles.toggleThumb, isPrivate && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  createBtn: { backgroundColor: '#8b5cf6', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  createBtnDisabled: { backgroundColor: '#1f2937' },
  createText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  createTextDisabled: { color: '#6b7280' },
  section: { paddingHorizontal: 20, marginTop: 20 },
  label: { color: '#9ca3af', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  typeGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  typeCard: { flex: 1, minWidth: 90, alignItems: 'center', padding: 14, backgroundColor: '#1f2937', borderRadius: 14, borderWidth: 2, borderColor: 'transparent', gap: 6 },
  typeEmoji: { fontSize: 24 },
  typeLabel: { color: '#9ca3af', fontWeight: '600', fontSize: 13 },
  input: { backgroundColor: '#1f2937', color: '#fff', padding: 14, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: '#374151' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  locationPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f2937', borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: '#374151' },
  locationText: { flex: 1, color: '#fff', fontSize: 15 },
  placeholder: { color: '#6b7280' },
  locationList: { backgroundColor: '#1f2937', borderRadius: 12, marginTop: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#374151' },
  locationItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: '#374151' },
  locationItemText: { flex: 1, color: '#fff', fontSize: 14 },
  settingsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  settingItem: { flex: 1, backgroundColor: '#1f2937', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#374151', gap: 8 },
  settingLabel: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterNum: { color: '#fff', fontSize: 18, fontWeight: 'bold', minWidth: 36, textAlign: 'center' },
  privateToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f2937', borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: '#374151' },
  privateToggleOn: { borderColor: '#8b5cf6', backgroundColor: '#8b5cf615' },
  privateLabel: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  privateDesc: { color: '#6b7280', fontSize: 12 },
  togglePill: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#374151', justifyContent: 'center', paddingHorizontal: 2 },
  togglePillOn: { backgroundColor: '#8b5cf6' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleThumbOn: { alignSelf: 'flex-end' },
});
