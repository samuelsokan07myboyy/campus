import { Tabs } from 'expo-router';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();
  const { unreadMessages } = useApp();
  const c = theme.colors;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textDim,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons: Record<string, { default: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap }> = {
            index:   { default: 'home-outline',       active: 'home' },
            campus:  { default: 'calendar-outline',    active: 'calendar' },
            careers: { default: 'briefcase-outline',   active: 'briefcase' },
            games:   { default: 'game-controller-outline', active: 'game-controller' },
            inbox:   { default: 'chatbubbles-outline', active: 'chatbubbles' },
            profile: { default: 'person-outline',      active: 'person' },
          };
          const iconSet = icons[route.name] ?? { default: 'grid-outline', active: 'grid' };
          const iconName = focused ? iconSet.active : iconSet.default;

          return (
            <View style={[styles.iconWrap, focused && { backgroundColor: c.primary + '18' }]}>
              <Ionicons name={iconName} size={24} color={color} />
              {route.name === 'inbox' && unreadMessages > 0 && (
                <View style={[styles.badge, { backgroundColor: c.danger }]}>
                  <Text style={styles.badgeText}>{unreadMessages > 9 ? '9+' : unreadMessages}</Text>
                </View>
              )}
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="campus" />
      <Tabs.Screen name="careers" />
      <Tabs.Screen name="games" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="study" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});