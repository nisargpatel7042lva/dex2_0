import { DarkTheme as AppThemeDark, DefaultTheme as AppThemeLight, ThemeProvider } from '@react-navigation/native'
import { PropsWithChildren } from 'react'
import { useColorScheme } from 'react-native'

// Custom dark theme colors matching the black bottom nav bar
const CustomDarkTheme = {
  ...AppThemeDark,
  colors: {
    ...AppThemeDark.colors,
    primary: '#ffffff', // White for active elements
    secondary: '#666666', // Gray for inactive elements
    accent: '#6366f1', // Indigo for highlights
    background: '#000000', // Pure black background
    surface: '#111111', // Slightly lighter black for cards
    card: '#1a1a1a', // Dark gray for cards
    text: '#ffffff', // White text
    border: '#333333', // Dark gray borders
    notification: '#ef4444', // Red for notifications
    success: '#10b981', // Green for success
    warning: '#f59e0b', // Orange for warnings
    error: '#ef4444', // Red for errors
    muted: '#666666', // Gray for muted text
    mutedBackground: '#1a1a1a', // Dark gray for muted backgrounds
    // Additional colors for the black theme
    navBackground: '#000000', // Black navigation background
    navActive: '#ffffff', // White for active nav items
    navInactive: '#666666', // Gray for inactive nav items
    cardBorder: 'rgba(255, 255, 255, 0.1)', // Subtle white border
    overlay: 'rgba(0, 0, 0, 0.8)', // Dark overlay
  },
}

// Custom light theme (fallback)
const CustomLightTheme = {
  ...AppThemeLight,
  colors: {
    ...AppThemeLight.colors,
    primary: '#000000',
    secondary: '#666666',
    accent: '#6366f1',
    background: '#ffffff',
    surface: '#f8f9fa',
    card: '#ffffff',
    text: '#000000',
    border: '#e5e7eb',
    notification: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    muted: '#666666',
    mutedBackground: '#f3f4f6',
    navBackground: '#000000',
    navActive: '#ffffff',
    navInactive: '#666666',
    cardBorder: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(255, 255, 255, 0.8)',
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
