import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

// Inner component so it can read the theme context
function AppShell() {
  const { theme } = useTheme();
  // On dark backgrounds → status bar icons should be light (white)
  // On light backgrounds → status bar icons should be dark (black)
  const statusBarStyle = theme.dark ? 'light' : 'dark';

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch((error) => {
      console.warn('Unable to lock the app to portrait:', error);
    });
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Auth */}
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />

        {/* Main App */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Post Creation */}
        <Stack.Screen
          name="post"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />

        {/* Study Room */}
        <Stack.Screen
          name="study-room"
          options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }}
        />

        {/* Create Vibe */}
        <Stack.Screen
          name="create-vibe"
          options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
        />

        <Stack.Screen
          name="create-event"
          options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
        />

        <Stack.Screen
          name="event-detail"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />

        {/* Create Study Room */}
        <Stack.Screen
          name="create-study-room"
          options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
        />

        {/* Chat */}
        <Stack.Screen
          name="chat"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />

        {/* Notifications */}
        <Stack.Screen
          name="notifications"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />

        {/* Settings */}
        <Stack.Screen
          name="settings"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />

        {/* User Profile */}
        <Stack.Screen
          name="user-profile"
          options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }}
        />

        {/* Followers and Following */}
        <Stack.Screen
          name="follow-list"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />

        {/* Post Detail */}
        <Stack.Screen
          name="post-detail"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />

        <Stack.Screen
          name="post-comments"
          options={{
            headerShown: false,
            presentation: 'transparentModal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: 'transparent' },
            gestureEnabled: false,
          }}
        />

        {/* Edit Profile */}
        <Stack.Screen
          name="edit-profile"
          options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
        />

        {/* Tools */}
        <Stack.Screen
          name="tools/gpa-calculator"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="tools/ai-solver"
          options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />

        {/* Careers */}
        <Stack.Screen
          name="careers/job-detail"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="careers/saved"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </Stack>

      {/* Status bar style adapts to the active theme automatically */}
      <StatusBar style={statusBarStyle} />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});