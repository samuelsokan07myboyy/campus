export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textMuted: string;
  textDim: string;
  primary: string;
  primaryMuted: string;
  secondary: string;
  border: string;
  borderSubtle: string;
  tint: string;
  danger: string;
  success: string;
  warning: string;
  overlay: string;
}

export interface AppTheme {
  id: string;
  name: string;
  dark: boolean;
  colors: ThemeColors;
}

// Main dark theme — pure black with indigo accent
export const DARK_THEME: AppTheme = {
  id: 'dark',
  name: 'Dark',
  dark: true,
  colors: {
    background: '#000000',
    surface: '#0A0A0A',
    card: '#111111',
    text: '#FFFFFF',
    textMuted: '#888888',
    textDim: '#444444',
    primary: '#6366F1',       // indigo
    primaryMuted: '#6366F120',
    secondary: '#22D3EE',     // cyan
    border: '#1A1A1A',
    borderSubtle: '#FFFFFF0A',
    tint: '#6366F1',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    overlay: 'rgba(0,0,0,0.7)',
  },
};

// Light theme
export const LIGHT_THEME: AppTheme = {
  id: 'light',
  name: 'Light',
  dark: false,
  colors: {
    background: '#F8F8F8',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#0A0A0A',
    textMuted: '#666666',
    textDim: '#AAAAAA',
    primary: '#6366F1',
    primaryMuted: '#6366F115',
    secondary: '#0891B2',
    border: '#E5E5E5',
    borderSubtle: '#0000000A',
    tint: '#6366F1',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    overlay: 'rgba(0,0,0,0.5)',
  },
};

export const MIDNIGHT_THEME: AppTheme = {
  id: 'midnight',
  name: 'Midnight',
  dark: true,
  colors: {
    background: '#020817',
    surface: '#0F172A',
    card: '#111827',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    textDim: '#475569',
    primary: '#8B5CF6',
    primaryMuted: '#8B5CF630',
    secondary: '#22D3EE',
    border: '#1E293B',
    borderSubtle: '#FFFFFF0A',
    tint: '#8B5CF6',
    danger: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    overlay: 'rgba(2,6,23,0.72)',
  },
};

export const VIOLET_THEME: AppTheme = {
  id: 'violet',
  name: 'Violet Glow',
  dark: true,
  colors: {
    background: '#12071A',
    surface: '#1E102D',
    card: '#24153A',
    text: '#F5F3FF',
    textMuted: '#C4B5FD',
    textDim: '#7C3AED',
    primary: '#A78BFA',
    primaryMuted: '#A78BFA22',
    secondary: '#F472B6',
    border: '#3B2A5A',
    borderSubtle: '#FFFFFF0A',
    tint: '#A78BFA',
    danger: '#FB7185',
    success: '#4ADE80',
    warning: '#FBBF24',
    overlay: 'rgba(18,7,26,0.74)',
  },
};

export const ROSE_THEME: AppTheme = {
  id: 'rose',
  name: 'Rose',
  dark: true,
  colors: {
    background: '#1A0D12',
    surface: '#2B121C',
    card: '#341720',
    text: '#FFF1F2',
    textMuted: '#F9A8D4',
    textDim: '#BE185D',
    primary: '#FB7185',
    primaryMuted: '#FB718522',
    secondary: '#F9A8D4',
    border: '#5B1F2C',
    borderSubtle: '#FFFFFF0A',
    tint: '#FB7185',
    danger: '#F87171',
    success: '#4ADE80',
    warning: '#FBBF24',
    overlay: 'rgba(26,13,18,0.72)',
  },
};

export const EMERALD_THEME: AppTheme = {
  id: 'emerald',
  name: 'Emerald',
  dark: true,
  colors: {
    background: '#02150F',
    surface: '#052E2B',
    card: '#083A34',
    text: '#ECFDF5',
    textMuted: '#A7F3D0',
    textDim: '#14B8A6',
    primary: '#34D399',
    primaryMuted: '#34D3992A',
    secondary: '#2DD4BF',
    border: '#0F766E',
    borderSubtle: '#FFFFFF0A',
    tint: '#34D399',
    danger: '#F87171',
    success: '#22C55E',
    warning: '#FBBF24',
    overlay: 'rgba(2,21,15,0.72)',
  },
};

export const OCEAN_THEME: AppTheme = {
  id: 'ocean',
  name: 'Ocean Blue',
  dark: true,
  colors: {
    background: '#041A2C',
    surface: '#072C42',
    card: '#0B3758',
    text: '#E0F2FE',
    textMuted: '#7DD3FC',
    textDim: '#0284C7',
    primary: '#38BDF8',
    primaryMuted: '#38BDF830',
    secondary: '#22D3EE',
    border: '#0F4C81',
    borderSubtle: '#FFFFFF0A',
    tint: '#38BDF8',
    danger: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    overlay: 'rgba(4,26,44,0.76)',
  },
};

export const SUNSET_THEME: AppTheme = {
  id: 'sunset',
  name: 'Sunset',
  dark: true,
  colors: {
    background: '#1D0F14',
    surface: '#2B1A1D',
    card: '#3B2328',
    text: '#FFF7ED',
    textMuted: '#FDBA74',
    textDim: '#F97316',
    primary: '#FB923C',
    primaryMuted: '#FB923C2A',
    secondary: '#F59E0B',
    border: '#7C3F2E',
    borderSubtle: '#FFFFFF0A',
    tint: '#FB923C',
    danger: '#F87171',
    success: '#4ADE80',
    warning: '#FBBF24',
    overlay: 'rgba(29,15,20,0.72)',
  },
};

export const GOLD_THEME: AppTheme = {
  id: 'gold',
  name: 'Gold',
  dark: true,
  colors: {
    background: '#1A1206',
    surface: '#2A1D0C',
    card: '#3A2A12',
    text: '#FEF3C7',
    textMuted: '#FCD34D',
    textDim: '#D97706',
    primary: '#FBBF24',
    primaryMuted: '#FBBF2425',
    secondary: '#F59E0B',
    border: '#7C5D1E',
    borderSubtle: '#FFFFFF0A',
    tint: '#FBBF24',
    danger: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    overlay: 'rgba(26,18,6,0.72)',
  },
};

export const FOREST_THEME: AppTheme = {
  id: 'forest',
  name: 'Forest',
  dark: true,
  colors: {
    background: '#07130D',
    surface: '#0F2118',
    card: '#132E22',
    text: '#ECFDF5',
    textMuted: '#86EFAC',
    textDim: '#16A34A',
    primary: '#22C55E',
    primaryMuted: '#22C55E2A',
    secondary: '#4ADE80',
    border: '#1B5E3A',
    borderSubtle: '#FFFFFF0A',
    tint: '#22C55E',
    danger: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    overlay: 'rgba(7,19,13,0.72)',
  },
};

export const LILAC_THEME: AppTheme = {
  id: 'lilac',
  name: 'Lilac',
  dark: false,
  colors: {
    background: '#F5F3FF',
    surface: '#FFFFFF',
    card: '#F8F5FF',
    text: '#1F2937',
    textMuted: '#6D28D9',
    textDim: '#A78BFA',
    primary: '#8B5CF6',
    primaryMuted: '#8B5CF630',
    secondary: '#C084FC',
    border: '#DDD6FE',
    borderSubtle: '#0000000A',
    tint: '#8B5CF6',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    overlay: 'rgba(245,243,255,0.7)',
  },
};

export const SKY_THEME: AppTheme = {
  id: 'sky',
  name: 'Sky',
  dark: false,
  colors: {
    background: '#F0F9FF',
    surface: '#FFFFFF',
    card: '#F8FDFF',
    text: '#0F172A',
    textMuted: '#0369A1',
    textDim: '#38BDF8',
    primary: '#0EA5E9',
    primaryMuted: '#0EA5E920',
    secondary: '#22D3EE',
    border: '#BAE6FD',
    borderSubtle: '#0000000A',
    tint: '#0EA5E9',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    overlay: 'rgba(240,249,255,0.7)',
  },
};

export const SAND_THEME: AppTheme = {
  id: 'sand',
  name: 'Sand',
  dark: false,
  colors: {
    background: '#FFF7ED',
    surface: '#FFFFFF',
    card: '#FFFBEB',
    text: '#1F2937',
    textMuted: '#9A5B00',
    textDim: '#F59E0B',
    primary: '#F59E0B',
    primaryMuted: '#F59E0B20',
    secondary: '#FB923C',
    border: '#FDE68A',
    borderSubtle: '#0000000A',
    tint: '#F59E0B',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#FBBF24',
    overlay: 'rgba(255,247,237,0.72)',
  },
};

export const BLOSSOM_THEME: AppTheme = {
  id: 'blossom',
  name: 'Blossom',
  dark: false,
  colors: {
    background: '#FFF1F2',
    surface: '#FFFFFF',
    card: '#FFF7F8',
    text: '#1F2937',
    textMuted: '#BE185D',
    textDim: '#F9A8D4',
    primary: '#EC4899',
    primaryMuted: '#EC489920',
    secondary: '#F472B6',
    border: '#FBCFE8',
    borderSubtle: '#0000000A',
    tint: '#EC4899',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    overlay: 'rgba(255,241,242,0.72)',
  },
};

export const THEMES: AppTheme[] = [
  DARK_THEME,
  LIGHT_THEME,
  MIDNIGHT_THEME,
  VIOLET_THEME,
  ROSE_THEME,
  EMERALD_THEME,
  OCEAN_THEME,
  SUNSET_THEME,
  GOLD_THEME,
  FOREST_THEME,
  LILAC_THEME,
  SKY_THEME,
  SAND_THEME,
  BLOSSOM_THEME,
];

export type ThemeId = 'dark' | 'light';
