import { AppNavigationGuard } from '@/components/app-navigation-guard'
import { AppProviders } from '@/components/app-providers'
import { PortalHost } from '@rn-primitives/portal'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
import 'react-native-reanimated'

// Keep the splash screen visible while we fetch our resources
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'SpaceGrotesk-Regular': require('../assets/fonts/SpaceGrotesk-Regular.ttf'),
    'SpaceGrotesk-SemiBold': require('../assets/fonts/SpaceGrotesk-SemiBold.ttf'),
    'SpaceGrotesk-Bold': require('../assets/fonts/SpaceGrotesk-Bold.ttf'),
  })

  const onLayoutRootView = useCallback(async () => {
    if (loaded) {
      await SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <AppProviders>
        <AppNavigationGuard>
          <Stack 
            screenOptions={{ 
              headerShown: false,
              animation: 'fade',
              animationDuration: 200,
            }}
          >
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="send" />
            <Stack.Screen name="receive" />
            <Stack.Screen name="swap" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </AppNavigationGuard>
        <PortalHost />
      </AppProviders>
      <StatusBar style="light" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
