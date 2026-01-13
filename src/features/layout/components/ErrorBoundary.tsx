// src/features/layout/components/ErrorBoundary.tsx
// Error boundary component for catching React errors
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  /** Optional fallback component to render on error */
  fallback?: ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary component that catches JavaScript errors in child components.
 * Displays a fallback UI instead of crashing the entire app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to console in development
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View className="flex-1 items-center justify-center bg-background p-6">
          <View className="items-center mb-6">
            <AlertTriangle size={48} color="#ef4444" />
            <Text className="text-xl font-semibold text-foreground mt-4">
              Something went wrong
            </Text>
            <Text className="text-muted-foreground text-center mt-2">
              An unexpected error occurred. Please try again.
            </Text>
          </View>

          <TouchableOpacity
            onPress={this.handleReset}
            className="flex-row items-center bg-primary px-6 py-3 rounded-lg"
          >
            <RefreshCw size={20} color="#ffffff" />
            <Text className="text-white font-medium ml-2">Try Again</Text>
          </TouchableOpacity>

          {__DEV__ && this.state.error && (
            <ScrollView className="mt-6 max-h-48 w-full bg-muted/50 rounded-lg p-4">
              <Text className="text-sm font-mono text-destructive">
                {this.state.error.toString()}
              </Text>
              {this.state.errorInfo && (
                <Text className="text-xs font-mono text-muted-foreground mt-2">
                  {this.state.errorInfo.componentStack}
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
