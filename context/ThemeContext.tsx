import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme, THEMES, DARK_THEME } from '@/constants/theme';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (themeId: string) => void;
  availableThemes: AppTheme[];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(DARK_THEME);

  useEffect(() => {
    AsyncStorage.getItem('app-theme').then((savedThemeId) => {
      if (savedThemeId) {
        const found = THEMES.find((t) => t.id === savedThemeId);
        if (found) setThemeState(found);
      }
    });
  }, []);

  const setTheme = async (themeId: string) => {
    const found = THEMES.find((t) => t.id === themeId);
    if (found) {
      setThemeState(found);
      await AsyncStorage.setItem('app-theme', themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
