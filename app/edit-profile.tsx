import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { getSchoolBrand, SchoolLogo } from '@/constants/schoolBrand';

const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad'] as const;
const MAX_PROFILE_LINKS = 5;

export default function EditProfileScreen() {
  const { currentUser, updateUser } = useApp();
  const { theme } = useTheme();
  const c = theme.colors;
  const isDarkTheme = theme.dark;
  const [displayName, setDisplayName] = useState(currentUser.displayName || '');
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [username, setUsername] = useState(currentUser.username || '');
  const [pronouns, setPronouns] = useState(currentUser.pronouns || '');
  const [college, setCollege] = useState(currentUser.schoolName || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [links, setLinks] = useState<string[]>(() => {
    const existingLinks = currentUser.links?.length ? currentUser.links : currentUser.link ? [currentUser.link] : [''];
    return existingLinks.slice(0, MAX_PROFILE_LINKS);
  });
  const [selectedYear, setSelectedYear] = useState<typeof YEARS[number]>(currentUser.year || 'Junior');
  const [selectedMajor, setSelectedMajor] = useState(currentUser.major || 'Computer Science');

  const handleLinkChange = (index: number, value: string) => {
    setLinks((currentLinks) => currentLinks.map((linkValue, linkIndex) => linkIndex === index ? value : linkValue));
  };

  const handleAddLink = () => {
    setLinks((currentLinks) => currentLinks.length < MAX_PROFILE_LINKS ? [...currentLinks, ''] : currentLinks);
  };

  const handleRemoveLink = (index: number) => {
    setLinks((currentLinks) => currentLinks.length > 1 ? currentLinks.filter((_, linkIndex) => linkIndex !== index) : ['']);
  };

  const handleChoosePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow CAMPUS to select a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Unable to choose photo', 'Please try again.');
    }
  };

  const handleSave = () => {
    const savedLinks = links.map((profileLink) => profileLink.trim()).filter(Boolean);
    updateUser({
      displayName: displayName.trim() || currentUser.displayName,
      username: username.trim() || currentUser.username,
      pronouns: pronouns.trim() || currentUser.pronouns,
      avatar,
      schoolName: college.trim() || currentUser.schoolName,
      bio: bio.trim(),
      links: savedLinks,
      link: savedLinks[0],
      year: selectedYear,
      major: selectedMajor,
    });

    Alert.alert('Saved!', 'Your profile has been updated.', [{ text: 'OK', onPress: () => router.back() }]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}> 
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancel, { color: c.textMuted }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text }]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.save, { color: c.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={styles.avatarSection}
          onPress={handleChoosePhoto}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Choose profile photo"
        >
          <View style={[styles.avatar, { backgroundColor: c.primary }]}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={48} color={isDarkTheme ? '#000' : '#fff'} />
            )}
          </View>
          <Text style={[styles.changePhoto, { color: c.primary }]}>{avatar ? 'Change Profile Photo' : 'Add Profile Photo'}</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: c.textMuted }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.surface, color: c.text, borderColor: c.border }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display name"
              placeholderTextColor={c.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: c.textMuted }]}>Username</Text>
            <View style={styles.inputRow}>
              <Text style={[styles.prefix, { color: c.textMuted }]}>@</Text>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: c.surface, color: c.text, borderColor: c.border }]}
                value={username}
                onChangeText={(t) => setUsername(t.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                autoCapitalize="none"
                placeholder="username"
                placeholderTextColor={c.textMuted}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: c.textMuted }]}>Pronouns</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.surface, color: c.text, borderColor: c.border }]}
              value={pronouns}
              onChangeText={setPronouns}
              placeholder="he/him"
              placeholderTextColor={c.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: c.textMuted }]}>College</Text>
            <View style={[styles.collegeInputWrap, { backgroundColor: c.surface, borderColor: c.border }]}> 
              {college.trim() ? (() => {
                const brand = getSchoolBrand(college);
                return (
                  <View style={[styles.schoolBadge, { backgroundColor: brand.logoBackground ?? brand.color, borderColor: brand.logoBorder ?? brand.accent }]}> 
                    <SchoolLogo logo={brand.logo} short={brand.short} accent={brand.accent} backgroundColor={brand.color} schoolName={college} size={18} />
                  </View>
                );
              })() : null}
              <TextInput
                style={[styles.input, styles.collegeInput, { backgroundColor: 'transparent', color: c.text, borderWidth: 0 }]}
                value={college}
                onChangeText={setCollege}
                placeholder="Your college or university"
                placeholderTextColor={c.textMuted}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: c.textMuted }]}>Major</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.surface, color: c.text, borderColor: c.border }]}
              value={selectedMajor}
              onChangeText={setSelectedMajor}
              placeholder="Your major"
              placeholderTextColor={c.textMuted}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: c.textMuted }]}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput, { backgroundColor: c.surface, color: c.text, borderColor: c.border }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about yourself..."
              placeholderTextColor={c.textMuted}
              multiline
              maxLength={150}
            />
            <Text style={[styles.charCount, { color: c.textMuted }]}>{bio.length}/150</Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: c.textMuted }]}>Links</Text>
            {links.map((profileLink, index) => (
              <View key={`profile-link-${index}`} style={styles.linkInputRow}>
                <TextInput
                  style={[styles.input, styles.linkInput, { backgroundColor: c.surface, color: c.text, borderColor: c.border }]}
                  value={profileLink}
                  onChangeText={(value) => handleLinkChange(index, value)}
                  placeholder={index === 0 ? 'Website or social link' : 'Another link'}
                  placeholderTextColor={c.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                {links.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeLinkButton}
                    onPress={() => handleRemoveLink(index)}
                    accessibilityLabel={`Remove link ${index + 1}`}
                  >
                    <Ionicons name="close-circle-outline" size={22} color={c.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {links.length < MAX_PROFILE_LINKS && (
              <TouchableOpacity style={styles.addLinkButton} onPress={handleAddLink}>
                <Ionicons name="add-circle-outline" size={18} color={c.primary} />
                <Text style={[styles.addLinkText, { color: c.primary }]}>Add link</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Academic Info</Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: c.textMuted }]}>Year</Text>
            <View style={styles.yearRow}>
              {YEARS.map((yr) => (
                <TouchableOpacity
                  key={yr}
                  style={[styles.chip, { backgroundColor: c.surface, borderColor: c.border }, selectedYear === yr && { backgroundColor: c.primary, borderColor: c.primary }]}
                  onPress={() => setSelectedYear(yr)}
                >
                  <Text style={[styles.chipText, selectedYear === yr && { color: isDarkTheme ? '#000' : '#fff' }, { color: c.textMuted }]}>{yr}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: 'bold' },
  cancel: { fontSize: 16 },
  save: { fontSize: 16, fontWeight: 'bold' },
  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  avatar: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  avatarText: { fontSize: 40, fontWeight: 'bold' },
  changePhoto: { fontSize: 15, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 20, marginBottom: 12 },
  field: { paddingHorizontal: 20, marginBottom: 16 },
  label: { fontSize: 13, marginBottom: 8, fontWeight: '600' },
  collegeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  schoolBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  schoolLogo: {
    width: 20,
    height: 20,
    borderRadius: 6,
  },
  schoolBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  input: { padding: 14, borderRadius: 12, fontSize: 15, borderWidth: 1 },
  collegeInput: { flex: 1, paddingVertical: 12, paddingLeft: 0 },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 12, textAlign: 'right', marginTop: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  linkInput: { flex: 1 },
  removeLinkButton: { width: 36, height: 48, alignItems: 'center', justifyContent: 'center' },
  addLinkButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  addLinkText: { fontSize: 14, fontWeight: '700' },
  prefix: { fontSize: 18 },
  yearRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontWeight: '600', fontSize: 13 },
});
