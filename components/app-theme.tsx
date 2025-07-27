import { DarkTheme as AppThemeDark, DefaultTheme as AppThemeLight, ThemeProvider } from '@react-navigation/native'
import { PropsWithChildren } from 'react'
import { useColorScheme } from 'react-native'

// Custom dark theme colors
const CustomDarkTheme = {
  ...AppThemeDark,
  colors: {
    ...AppThemeDark.colors,
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#a855f7',
    background: '#0f0f23',
    surface: '#1a1a2e',
    card: '#16213e',
    text: '#ffffff',
    border: '#2d3748',
    notification: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    muted: '#6b7280',
    mutedBackground: '#1f2937',
  },
}

// Custom light theme (fallback)
const CustomLightTheme = {
  ...AppThemeLight,
  colors: {
    ...AppThemeLight.colors,
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#a855f7',
    background: '#f8fafc',
    surface: '#ffffff',
    card: '#ffffff',
    text: '#1f2937',
    border: '#e5e7eb',
    notification: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    muted: '#6b7280',
    mutedBackground: '#f3f4f6',
  },
}

export function useAppTheme() {
  const colorScheme = useColorScheme()
  // Force dark mode for now
  const isDark = true // colorScheme === 'dark'
  const theme = isDark ? CustomDarkTheme : CustomLightTheme
  return {
    colorScheme,
    isDark,
    theme,
  }
}

export function AppTheme({ children }: PropsWithChildren) {
  const { theme } = useAppTheme()

  return <ThemeProvider value={theme}>{children}</ThemeProvider>
}
