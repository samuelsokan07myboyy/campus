import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { createEvent, EVENT_CATEGORIES, fetchEventById, updateEvent, type EventCategory } from '@/services/eventsService';

type PickerTarget = 'start' | 'end';
type PickerMode = 'date' | 'time';
type DatePickerState = { target: PickerTarget; mode: PickerMode } | null;

const EVENT_TYPES = EVENT_CATEGORIES.filter((item) => item.id !== 'All');
const AGE_OPTIONS = ['All Ages', '18+', '21+'];

function makeDefaultDate(hoursFromNow: number) {
  const date = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return date;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function CreateEventScreen() {
  const { eventId: rawEventId } = useLocalSearchParams<{ eventId?: string | string[] }>();
  const eventId = Array.isArray(rawEventId) ? rawEventId[0] : rawEventId;
  const { theme } = useTheme();
  const { currentUser } = useApp();
  const c = theme.colors;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Exclude<EventCategory, 'All'>>('Hangouts');
  const [coverUri, setCoverUri] = useState<string>();
  const [clearCover, setClearCover] = useState(false);
  const [startTime, setStartTime] = useState(() => makeDefaultDate(26));
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [capacity, setCapacity] = useState('');
  const [ageLimit, setAgeLimit] = useState('All Ages');
  const [dressCode, setDressCode] = useState('');
  const [picker, setPicker] = useState<DatePickerState>(null);
  const [saving, setSaving] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    if (!eventId) return;
    let isActive = true;
    void fetchEventById(eventId, currentUser.id).then((event) => {
      if (!isActive || !event || event.host.id !== currentUser.id) return;
      setTitle(event.title);
      setDescription(event.description);
      setCategory(event.category);
      setCoverUri(event.coverUrl);
      setClearCover(false);
      setStartTime(new Date(event.startTime));
      setEndTime(event.endTime ? new Date(event.endTime) : null);
      setLocationName(event.locationName);
      setLocationAddress(event.locationAddress ?? '');
      setIsFree(event.isFree);
      setPrice(event.price ?? '');
      setTicketUrl(event.ticketUrl ?? '');
      setCapacity(event.maxCapacity ? String(event.maxCapacity) : '');
      setAgeLimit(event.ageLimit);
      setDressCode(event.dressCode ?? '');
    });
    return () => { isActive = false; };
  }, [currentUser.id, eventId]);

  const chooseCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access to add an event cover.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.86,
    });
    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
      setClearCover(false);
    }
  };

  const updateDateTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios' || event.type === 'dismissed') setPicker(null);
    if (!selectedDate || !picker) return;

    const targetValue = picker.target === 'start' ? startTime : endTime ?? new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
    const next = new Date(targetValue);
    if (picker.mode === 'date') {
      next.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    } else {
      next.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    }

    if (picker.target === 'start') setStartTime(next);
    else setEndTime(next);
  };

  const handlePublish = async () => {
    const trimmedTitle = title.trim();
    const trimmedLocation = locationName.trim();
    if (!trimmedTitle) return setValidationMessage('Add an event title to continue.');
    if (startTime.getTime() <= Date.now()) return setValidationMessage('Choose a start time in the future.');
    if (endTime && endTime <= startTime) return setValidationMessage('End time must be after the start time.');
    if (!trimmedLocation) return setValidationMessage('Add a location so people know where to go.');
    if (!isFree && !price.trim()) return setValidationMessage('Add a ticket price or switch the event to free.');

    setValidationMessage('');
    setSaving(true);
    try {
      const eventData = {
        title: trimmedTitle,
        description: description.trim(),
        category,
        startTime: startTime.toISOString(),
        endTime: endTime?.toISOString(),
        locationName: trimmedLocation,
        locationAddress: locationAddress.trim() || undefined,
        isFree,
        price: isFree ? undefined : price.trim(),
        ticketUrl: isFree ? undefined : ticketUrl.trim() || undefined,
        maxCapacity: capacity.trim() ? Number(capacity) : undefined,
        ageLimit,
        dressCode: dressCode.trim() || undefined,
      };
      if (eventId) {
        await updateEvent(eventId, eventData, coverUri, clearCover, currentUser.id);
      } else {
        await createEvent(eventData, coverUri, {
          id: currentUser.id,
          username: currentUser.username,
          name: currentUser.displayName,
          avatarUrl: currentUser.avatar,
          isVerified: currentUser.isVerified,
        });
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      setValidationMessage('Could not save this event on this device. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = [styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.border }];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close create event" onPress={() => router.back()} style={styles.headerIconButton}>
            <Ionicons name="close" size={23} color={c.text} />
          </Pressable>
          <View style={styles.headerTitles}>
            <Text style={[styles.headerTitle, { color: c.text }]}>{eventId ? 'Edit event' : 'Create event'}</Text>
            <Text style={[styles.headerSub, { color: c.textMuted }]}>{eventId ? 'Update your event details.' : 'Make a plan worth showing up for.'}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={handlePublish} disabled={saving} style={[styles.publishButton, { backgroundColor: c.primary, opacity: saving ? 0.65 : 1 }]}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.publishLabel}>{eventId ? 'Save' : 'Publish'}</Text>}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Pressable onPress={chooseCover} style={[styles.coverPicker, { backgroundColor: c.card, borderColor: c.border }]}>
            {coverUri ? (
              <>
                <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                <View style={styles.coverShade} />
                <View style={styles.coverActionRow}>
                  <View style={styles.coverAction}>
                    <Ionicons name="image-outline" size={17} color="#fff" />
                    <Text style={styles.coverActionText}>Change cover</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove cover image"
                    onPress={(event) => {
                      event.stopPropagation();
                      setCoverUri(undefined);
                      setClearCover(true);
                    }}
                    style={styles.removeCover}
                  >
                    <Ionicons name="trash-outline" size={17} color="#fff" />
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={styles.coverPlaceholder}>
                <View style={[styles.coverIcon, { backgroundColor: c.primaryMuted }]}>
                  <Ionicons name="image-outline" size={24} color={c.primary} />
                </View>
                <Text style={[styles.coverTitle, { color: c.text }]}>Add a cover photo</Text>
                <Text style={[styles.coverHint, { color: c.textMuted }]}>Landscape photos look best · 16:9</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: c.text }]}>Event title <Text style={{ color: c.danger }}>*</Text></Text>
              <Text style={[styles.counter, { color: c.textMuted }]}>{title.length}/80</Text>
            </View>
            <TextInput value={title} onChangeText={setTitle} maxLength={80} placeholder="Give your event a name" placeholderTextColor={c.textMuted} style={fieldStyle} />
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: c.text }]}>About the event</Text>
              <Text style={[styles.counter, { color: c.textMuted }]}>{description.length}/400</Text>
            </View>
            <TextInput
              value={description}
              onChangeText={setDescription}
              maxLength={400}
              multiline
              textAlignVertical="top"
              placeholder="What should people know before they come?"
              placeholderTextColor={c.textMuted}
              style={[fieldStyle, styles.descriptionInput]}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: c.text }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {EVENT_TYPES.map((item) => {
                const active = category === item.id;
                return (
                  <Pressable key={item.id} onPress={() => setCategory(item.id)} style={[styles.categoryPill, { backgroundColor: active ? c.primaryMuted : c.card, borderColor: active ? c.primary : c.border }]}>
                    <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                    <Text style={[styles.categoryLabel, { color: active ? c.primary : c.textMuted }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: c.text }]}>Date and time <Text style={{ color: c.danger }}>*</Text></Text>
            <View style={styles.dateTimeRow}>
              <Pressable onPress={() => setPicker({ target: 'start', mode: 'date' })} style={[styles.dateTimeButton, { backgroundColor: c.card, borderColor: c.border }]}>
                <Ionicons name="calendar-outline" size={17} color={c.primary} />
                <Text style={[styles.dateTimeValue, { color: c.text }]} numberOfLines={1}>{formatDate(startTime)}</Text>
              </Pressable>
              <Pressable onPress={() => setPicker({ target: 'start', mode: 'time' })} style={[styles.dateTimeButton, { backgroundColor: c.card, borderColor: c.border }]}>
                <Ionicons name="time-outline" size={17} color={c.primary} />
                <Text style={[styles.dateTimeValue, { color: c.text }]}>{formatTime(startTime)}</Text>
              </Pressable>
            </View>
            <View style={styles.endTimeToggle}>
              <Text style={[styles.optionalLabel, { color: c.textMuted }]}>Add an end time</Text>
              <Switch
                value={Boolean(endTime)}
                onValueChange={(enabled) => setEndTime(enabled ? new Date(startTime.getTime() + 2 * 60 * 60 * 1000) : null)}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
              />
            </View>
            {endTime && (
              <View style={styles.dateTimeRow}>
                <Pressable onPress={() => setPicker({ target: 'end', mode: 'date' })} style={[styles.dateTimeButton, { backgroundColor: c.card, borderColor: c.border }]}>
                  <Ionicons name="calendar-outline" size={17} color={c.primary} />
                  <Text style={[styles.dateTimeValue, { color: c.text }]} numberOfLines={1}>{formatDate(endTime)}</Text>
                </Pressable>
                <Pressable onPress={() => setPicker({ target: 'end', mode: 'time' })} style={[styles.dateTimeButton, { backgroundColor: c.card, borderColor: c.border }]}>
                  <Ionicons name="time-outline" size={17} color={c.primary} />
                  <Text style={[styles.dateTimeValue, { color: c.text }]}>{formatTime(endTime)}</Text>
                </Pressable>
              </View>
            )}
            {picker && (
              <View style={[styles.pickerPanel, { backgroundColor: c.card, borderColor: c.border }]}>
                {Platform.OS === 'ios' && (
                  <View style={styles.pickerHeader}>
                    <Text style={[styles.pickerTitle, { color: c.text }]}>{picker.mode === 'date' ? 'Choose date' : 'Choose time'}</Text>
                    <Pressable onPress={() => setPicker(null)}><Text style={[styles.pickerDone, { color: c.primary }]}>Done</Text></Pressable>
                  </View>
                )}
                <DateTimePicker
                  value={picker.target === 'start' ? startTime : endTime ?? new Date(startTime.getTime() + 2 * 60 * 60 * 1000)}
                  mode={picker.mode}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={picker.target === 'end' ? startTime : new Date()}
                  onChange={updateDateTime}
                  themeVariant={theme.dark ? 'dark' : 'light'}
                />
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: c.text }]}>Location <Text style={{ color: c.danger }}>*</Text></Text>
            <View style={[styles.locationInput, { backgroundColor: c.card, borderColor: c.border }]}>
              <Ionicons name="location-outline" size={18} color={c.secondary} />
              <TextInput value={locationName} onChangeText={setLocationName} placeholder="Place or venue name" placeholderTextColor={c.textMuted} style={[styles.inlineInput, { color: c.text }]} />
            </View>
            <TextInput value={locationAddress} onChangeText={setLocationAddress} placeholder="Street address (optional)" placeholderTextColor={c.textMuted} style={[fieldStyle, styles.addressInput]} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: c.text }]}>Tickets</Text>
            <View style={[styles.freePaidRow, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={styles.ticketCopy}>
                <Text style={[styles.ticketTitle, { color: c.text }]}>{isFree ? 'Free event' : 'Paid / ticketed'}</Text>
                <Text style={[styles.ticketHint, { color: c.textMuted }]}>{isFree ? 'Everyone can join for free.' : 'Set the ticket price below.'}</Text>
              </View>
              <Switch value={!isFree} onValueChange={(paid) => setIsFree(!paid)} trackColor={{ false: c.border, true: c.primary }} thumbColor="#fff" />
            </View>
            {!isFree && (
              <>
                <TextInput value={price} onChangeText={setPrice} placeholder="Ticket price, e.g. $8" placeholderTextColor={c.textMuted} keyboardType="decimal-pad" style={[fieldStyle, styles.priceInput]} />
                <TextInput value={ticketUrl} onChangeText={setTicketUrl} placeholder="Ticket link (optional)" placeholderTextColor={c.textMuted} keyboardType="url" autoCapitalize="none" style={[fieldStyle, styles.priceInput]} />
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: c.text }]}>Optional details</Text>
            <TextInput value={capacity} onChangeText={(value) => setCapacity(value.replace(/\D/g, ''))} placeholder="Maximum capacity" placeholderTextColor={c.textMuted} keyboardType="number-pad" style={fieldStyle} />
            <View style={styles.ageRow}>
              {AGE_OPTIONS.map((age) => {
                const active = ageLimit === age;
                return (
                  <Pressable key={age} onPress={() => setAgeLimit(age)} style={[styles.ageChip, { backgroundColor: active ? c.primaryMuted : c.card, borderColor: active ? c.primary : c.border }]}>
                    <Text style={[styles.ageText, { color: active ? c.primary : c.textMuted }]}>{age}</Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput value={dressCode} onChangeText={setDressCode} placeholder="Dress code (optional)" placeholderTextColor={c.textMuted} style={[fieldStyle, styles.priceInput]} />
          </View>

          {validationMessage ? (
            <View style={[styles.validationBox, { backgroundColor: c.danger + '18' }]}>
              <Ionicons name="alert-circle-outline" size={17} color={c.danger} />
              <Text style={[styles.validationText, { color: c.danger }]}>{validationMessage}</Text>
            </View>
          ) : null}
          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: c.background, borderTopColor: c.border }]}>
          <Pressable onPress={handlePublish} disabled={saving} style={[styles.submitButton, { backgroundColor: c.primary, opacity: saving ? 0.7 : 1 }]}>
            {saving ? <ActivityIndicator color="#fff" /> : <>
              <Ionicons name="sparkles" size={17} color="#fff" />
              <Text style={styles.submitLabel}>{eventId ? 'Save event' : 'Publish event'}</Text>
            </>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerIconButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSub: { fontSize: 11, marginTop: 2 },
  publishButton: { minWidth: 72, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  publishLabel: { color: '#fff', fontSize: 12, fontWeight: '800' },
  form: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 24 },
  coverPicker: { width: '100%', aspectRatio: 16 / 9, borderRadius: 14, overflow: 'hidden', borderWidth: 1, marginBottom: 21, alignItems: 'center', justifyContent: 'center' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  coverIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  coverTitle: { fontSize: 14, fontWeight: '800' },
  coverHint: { fontSize: 11 },
  coverShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.18)' },
  coverActionRow: { position: 'absolute', left: 12, right: 12, bottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coverAction: { height: 36, paddingHorizontal: 11, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.62)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  coverActionText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  removeCover: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.62)', alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: 19 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '800', marginBottom: 8 },
  counter: { fontSize: 10, fontWeight: '600' },
  input: { minHeight: 46, borderRadius: 11, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  descriptionInput: { height: 95, paddingTop: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryPill: { height: 37, borderRadius: 19, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryEmoji: { fontSize: 13 },
  categoryLabel: { fontSize: 12, fontWeight: '700' },
  dateTimeRow: { flexDirection: 'row', gap: 9 },
  dateTimeButton: { flex: 1, minWidth: 0, height: 46, borderRadius: 11, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 7 },
  dateTimeValue: { flexShrink: 1, fontSize: 12, fontWeight: '700' },
  endTimeToggle: { minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  optionalLabel: { fontSize: 12, fontWeight: '600' },
  pickerPanel: { borderWidth: 1, borderRadius: 12, marginTop: 8, paddingHorizontal: 8, paddingBottom: 4, overflow: 'hidden' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 9, paddingTop: 10 },
  pickerTitle: { fontSize: 12, fontWeight: '700' },
  pickerDone: { fontSize: 12, fontWeight: '800' },
  locationInput: { minHeight: 46, borderRadius: 11, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  inlineInput: { flex: 1, minHeight: 44, paddingVertical: 0, fontSize: 14 },
  addressInput: { marginTop: 8 },
  freePaidRow: { minHeight: 62, borderRadius: 11, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  ticketCopy: { flex: 1 },
  ticketTitle: { fontSize: 13, fontWeight: '800' },
  ticketHint: { fontSize: 11, marginTop: 3 },
  priceInput: { marginTop: 8 },
  ageRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  ageChip: { minHeight: 34, borderRadius: 17, borderWidth: 1, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  ageText: { fontSize: 11, fontWeight: '700' },
  validationBox: { minHeight: 42, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  validationText: { flex: 1, fontSize: 12, fontWeight: '600' },
  footer: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  submitButton: { height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  submitLabel: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
