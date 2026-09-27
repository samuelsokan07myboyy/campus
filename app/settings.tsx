import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/constants/theme';

type SettingItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  toggle?: boolean;
  danger?: boolean;
  onPress: () => void;
};

export default function SettingsScreen() {
  const { setIsLoggedIn } = useApp();
  const { theme, availableThemes, setTheme } = useTheme();
  const styles = getStyles(theme.colors, theme.dark);
  
  const [notifications, setNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [themeSheetVisible, setThemeSheetVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive', onPress: () => {
          setIsLoggedIn(false);
          router.replace('/welcome');
        }
      },
    ]);
  };

  const sections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Account',
      items: [
        { id: 's1', icon: 'person', label: 'Edit Profile', value: '', onPress: () => router.push('/edit-profile') },
        { id: 's2', icon: 'school', label: 'Verify School Email', value: 'Verified ✓', onPress: () => Alert.alert('Verified', 'Your .edu email is verified!') },
        { id: 's3', icon: 'key', label: 'Change Password', onPress: () => Alert.alert('Password', 'Password change coming soon') },
        { id: 's4', icon: 'link', label: 'Connected Accounts', onPress: () => Alert.alert('Coming Soon', 'Connect LinkedIn, GitHub, etc.') },
      ],
    },
    {
      title: 'Notifications',
      items: [
        { id: 'n1', icon: 'notifications', label: 'Push Notifications', toggle: true, onPress: () => setNotifications(!notifications) },
        { id: 'n2', icon: 'flame', label: 'Study Reminders', toggle: true, onPress: () => setStudyReminders(!studyReminders) },
        { id: 'n3', icon: 'chatbubble', label: 'Message Notifications', toggle: true, onPress: () => setMessageNotifications(!messageNotifications) },
      ],
    },
    {
      title: 'Privacy',
      items: [
        { id: 'p1', icon: 'lock-closed', label: 'Private Account', toggle: true, onPress: () => setPrivateAccount(!privateAccount) },
        { id: 'p2', icon: 'eye-off', label: 'Activity Status', toggle: true, onPress: () => setActivityStatus(!activityStatus) },
        { id: 'p3', icon: 'people', label: 'Blocked Users', value: '0', onPress: () => Alert.alert('Blocked', 'No blocked users') },
      ],
    },
    {
      title: 'App',
      items: [
        { id: 'a2', icon: 'help-circle', label: 'Help & Support', onPress: () => Alert.alert('Support', 'support@campus.app') },
        { id: 'a3', icon: 'shield-checkmark', label: 'Privacy Policy', onPress: () => Alert.alert('Privacy', 'Opening privacy policy...') },
        { id: 'a4', icon: 'document-text', label: 'Terms of Service', onPress: () => Alert.alert('Terms', 'Opening terms...') },
        { id: 'a5', icon: 'information-circle', label: 'App Version', value: '1.0.0', onPress: () => { } },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        { id: 'd1', icon: 'trash', label: 'Delete Account', danger: true, onPress: () => Alert.alert('Delete Account', 'This action cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive' }]) },
      ],
    },
  ];

  const toggleValues: Record<string, boolean> = {
    'n1': notifications,
    'n2': studyReminders,
    'n3': messageNotifications,
    'p1': privateAccount,
    'p2': activityStatus,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Theme</Text>
          <TouchableOpacity
            style={[styles.themePickerButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => setThemeSheetVisible(true)}
          >
            <View style={[styles.themePickerSwatch, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <View style={[styles.themePickerDot, { backgroundColor: theme.colors.primary }]} />
              <View style={[styles.themePickerDotSecondary, { backgroundColor: theme.colors.secondary }]} />
            </View>
            <View style={styles.themePickerTextWrap}>
              <Text style={[styles.themePickerTitle, { color: theme.colors.text }]}>{theme.name}</Text>
              <Text style={[styles.themePickerSubtitle, { color: theme.colors.textMuted }]}>Select a theme</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {sections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.cardGroup}>
              {section.items.map((item, i) => {
                const isLast = i === section.items.length - 1;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.item, !isLast && styles.itemBorder]}
                    onPress={item.onPress}
                    disabled={item.toggle}
                  >
                    <View style={styles.itemLeft}>
                      <View style={[styles.iconBox, item.danger && { backgroundColor: theme.colors.danger + '15' }]}>
                        <Ionicons 
                          name={item.icon} 
                          size={20} 
                          color={item.danger ? theme.colors.danger : theme.colors.textMuted} 
                        />
                      </View>
                      <Text style={[styles.itemLabel, item.danger && { color: theme.colors.danger }]}>
                        {item.label}
                      </Text>
                    </View>
                    <View style={styles.itemRight}>
                      {item.value && (
                        <Text style={styles.itemValue}>{item.value}</Text>
                      )}
                      {item.toggle && (
                        <Switch
                          value={toggleValues[item.id]}
                          onValueChange={item.onPress}
                          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                          thumbColor={theme.dark ? theme.colors.text : '#fff'}
                        />
                      )}
                      {!item.toggle && !item.danger && (
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>CAMPUS v1.0.0</Text>
      </ScrollView>

      <Modal
        transparent
        visible={themeSheetVisible}
        animationType="slide"
        onRequestClose={() => setThemeSheetVisible(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setThemeSheetVisible(false)} />
        <View style={[styles.themeSheet, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>Choose your theme</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetList}>
            {availableThemes.map((t) => {
              const active = theme.id === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.sheetThemeOption,
                    {
                      backgroundColor: active ? t.colors.primaryMuted : theme.colors.background,
                      borderColor: active ? t.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => {
                    setTheme(t.id);
                    setThemeSheetVisible(false);
                  }}
                >
                  <View style={[styles.sheetThemePreview, { backgroundColor: t.colors.background, borderColor: t.colors.border }]}>
                    <View style={[styles.themePickerDot, { backgroundColor: t.colors.primary }]} />
                    <View style={[styles.themePickerDotSecondary, { backgroundColor: t.colors.secondary }]} />
                  </View>
                  <View style={styles.sheetOptionText}>
                    <Text style={[styles.sheetThemeName, { color: active ? t.colors.primary : theme.colors.text }]}>{t.name}</Text>
                    <Text style={[styles.sheetThemeMeta, { color: theme.colors.textMuted }]}> 
                      {t.dark ? 'Dark mode' : 'Light mode'}
                    </Text>
                  </View>
                  {active && <Ionicons name="checkmark" size={20} color={t.colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  themePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  themePickerSwatch: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  themePickerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    position: 'absolute',
    left: 8,
    top: 10,
  },
  themePickerDotSecondary: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    right: 8,
    bottom: 10,
  },
  themePickerTextWrap: {
    flex: 1,
  },
  themePickerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  themePickerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  themeSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  sheetList: {
    paddingBottom: 8,
  },
  sheetThemeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  sheetThemePreview: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sheetOptionText: {
    flex: 1,
  },
  sheetThemeName: {
    fontSize: 15,
    fontWeight: '700',
  },
  sheetThemeMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginLeft: 24,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardGroup: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemValue: {
    fontSize: 15,
    color: colors.textMuted,
  },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 32,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 16,
  },
  versionText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 24,
    marginBottom: 48,
  },
});
