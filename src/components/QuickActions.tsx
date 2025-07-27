import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const QuickActions: React.FC = () => {
  const actions = [
    {
      id: 'search',
      title: 'Search Tokens',
      icon: 'search',
      color: '#6366f1',
      bgColor: '#eef2ff',
    },
    {
      id: 'portfolio',
      title: 'My Portfolio',
      icon: 'pie-chart',
      color: '#10b981',
      bgColor: '#f0fdf4',
    },
    {
      id: 'create',
      title: 'Create Token',
      icon: 'add-circle',
      color: '#f59e0b',
      bgColor: '#fffbeb',
    },
    {
      id: 'swap',
      title: 'Quick Swap',
      icon: 'swap-horizontal',
      color: '#ef4444',
      bgColor: '#fef2f2',
    },
  ];

  const handleActionPress = (actionId: string) => {
    // Handle action press - navigate to appropriate screen
    console.log('Action pressed:', actionId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      
      <View style={styles.grid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={() => handleActionPress(action.id)}
          >
            <View style={[styles.iconContainer, { backgroundColor: action.bgColor }]}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
});

export default QuickActions; 