import { useAppTheme } from '@/components/app-theme';
import { disableVideoMode, enableVideoMode } from '@/src/utils/error-suppression';
import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

export default function VideoModeToggle() {
  const { theme } = useAppTheme();
  const [isVideoMode, setIsVideoMode] = useState(false);

  const toggleVideoMode = (value: boolean) => {
    setIsVideoMode(value);
    if (value) {
      enableVideoMode();
    } else {
      disableVideoMode();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            🎥 Video Mode
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>
            Hide 429 errors for clean recordings
          </Text>
        </View>
        <Switch
          value={isVideoMode}
          onValueChange={toggleVideoMode}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
          thumbColor={isVideoMode ? theme.colors.primary : theme.colors.secondary}
        />
      </View>
      {isVideoMode && (
        <View style={[styles.notice, { backgroundColor: theme.colors.primary + '20' }]}>
          <Text style={[styles.noticeText, { color: theme.colors.primary }]}>
            📹 Video mode active - rate limit errors are hidden
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  notice: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
  },
  noticeText: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Medium',
    textAlign: 'center',
  },
});
