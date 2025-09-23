import { useAppTheme } from '@/components/app-theme';
import { Notification, useNotifications } from '@/src/context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'transaction':
      return 'swap-horizontal';
    case 'trade':
      return 'trending-up';
    case 'airdrop':
      return 'gift';
    case 'price_alert':
      return 'alert-circle';
    case 'system':
    default:
      return 'information-circle';
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'transaction':
      return '#3b82f6'; // Blue
    case 'trade':
      return '#10b981'; // Green
    case 'airdrop':
      return '#f59e0b'; // Yellow
    case 'price_alert':
      return '#ef4444'; // Red
    case 'system':
    default:
      return '#6b7280'; // Gray
  }
};

const formatTimeAgo = (timestamp: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return timestamp.toLocaleDateString();
};

const NotificationItem: React.FC<{
  notification: Notification;
  onPress: () => void;
  onDelete: () => void;
}> = ({ notification, onPress, onDelete }) => {
  const { theme } = useAppTheme();
  const iconName = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { 
          backgroundColor: notification.read ? theme.colors.background : theme.colors.card,
          borderColor: theme.colors.border,
        },
        !notification.read && { borderLeftColor: theme.colors.primary, borderLeftWidth: 3 },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={iconName as any} size={20} color={iconColor} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
            {notification.title}
          </Text>
          <Text style={[styles.notificationMessage, { color: theme.colors.muted }]} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={[styles.notificationTime, { color: theme.colors.muted }]}>
            {formatTimeAgo(notification.timestamp)}
          </Text>
        </View>
        
        {!notification.read && (
          <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
        )}
      </View>
      
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Ionicons name="close" size={16} color={theme.colors.muted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useAppTheme();
  const { notifications, markAsRead, markAllAsRead, clearNotifications, removeNotification } = useNotifications();

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    // You can add navigation logic here based on notification type
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationItem
      notification={item}
      onPress={() => handleNotificationPress(item)}
      onDelete={() => removeNotification(item.id)}
    />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
              Notifications
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.muted }]} numberOfLines={1}>
              {notifications.length} total
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={markAllAsRead}>
              <Text style={[styles.headerButtonText, { color: theme.colors.primary }]} numberOfLines={1}>
                Mark all read
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={clearNotifications}>
              <Text style={[styles.headerButtonText, { color: theme.colors.error }]} numberOfLines={1}>
                Clear all
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: theme.colors.background }]} 
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.colors.card }]}>
              <Ionicons name="notifications-off" size={32} color={theme.colors.muted} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No notifications</Text>
            <Text style={[styles.emptyStateText, { color: theme.colors.muted }]}>
              You&apos;re all caught up! New notifications will appear here.
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  headerButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerButtonText: {
    fontSize: 10,
    fontFamily: 'SpaceGrotesk-SemiBold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Regular',
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'SpaceGrotesk-Regular',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk-Regular',
    lineHeight: 20,
  },
}); 