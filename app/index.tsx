import { Redirect } from 'expo-router';
import { useApp } from '@/context/AppContext';

// Root entry point — redirects based on auth state.
// This is the expo-router recommended pattern for auth guards.
export default function Index() {
  const { isLoggedIn } = useApp();

  if (!isLoggedIn) {
    return <Redirect href="/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
