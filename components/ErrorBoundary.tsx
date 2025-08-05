import React, { Component, ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from './app-text';
import { useAppTheme } from './app-theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error?: Error; onReset: () => void }) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.errorCard, { backgroundColor: theme.colors.card }]}>
        <AppText style={[styles.title, { color: theme.colors.text }]}>
          Something went wrong
        </AppText>
        <AppText style={[styles.message, { color: theme.colors.muted }]}>
          {error?.message || 'An unexpected error occurred'}
        </AppText>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={onReset}
        >
          <AppText style={styles.buttonText}>Try Again</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#000000',
    fontWeight: 'bold',
  },
}); 