import { useThemeColor } from '@/hooks/use-theme-color'
import { StyleSheet, Text, type TextProps } from 'react-native'

export type AppTextProps = TextProps & {
  lightColor?: string
  darkColor?: string
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link'
}

export function AppText({ style, lightColor, darkColor, type = 'default', ...rest }: AppTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text')

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  )
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40, // Increased from 32 to 40 for better spacing
    paddingVertical: 4, // Added vertical padding to prevent cutting
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28, // Added proper line height
    paddingVertical: 2, // Added vertical padding to prevent cutting
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
})
