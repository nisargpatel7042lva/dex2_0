import { useNotifications } from '@/src/context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface NotificationButtonProps {
  onPress: () => void;
  backgroundColor: string;
  iconColor: string;
}

export const NotificationButton: React.FC<NotificationButtonProps> = ({
  onPress,
  backgroundColor,
  iconColor,
}) => {
  const { unreadCount } = useNotifications();

  return (
    <Pressable
      style={[styles.notificationButton, { backgroundColor }]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(99, 102, 241, 0.1)', borderless: true }}
    >
      <Ionicons name="notifications-outline" size={24} color={iconColor} />
      
      {/* Notification indicator */}
      {unreadCount > 0 && (
        <View style={styles.notificationIndicator}>
          <Text style={styles.notificationCount}>
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative', // For absolute positioning of indicator
  },
  notificationIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444', // Red color for notifications
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  notificationCount: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'SpaceGrotesk-Bold',
    textAlign: 'center',
  },
}); 