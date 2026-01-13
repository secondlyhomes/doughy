// src/features/layout/components/ErrorBoundary.tsx
// Error boundary component for catching React errors
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

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

// Functional component for the default error UI that can use hooks
interface DefaultErrorUIProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}

function DefaultErrorUI({ error, errorInfo, onReset }: DefaultErrorUIProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <View className="items-center mb-6">
        <AlertTriangle size={48} color={colors.destructive} />
        <Text className="text-xl font-semibold text-foreground mt-4">
          Something went wrong
        </Text>
        <Text className="text-muted-foreground text-center mt-2">
          An unexpected error occurred. Please try again.
        </Text>
      </View>

      <TouchableOpacity
        onPress={onReset}
        className="flex-row items-center bg-primary px-6 py-3 rounded-lg"
      >
        <RefreshCw size={20} color={colors.primaryForeground} />
        <Text className="text-white font-medium ml-2">Try Again</Text>
      </TouchableOpacity>

      {__DEV__ && error && (
        <ScrollView className="mt-6 max-h-48 w-full bg-muted/50 rounded-lg p-4">
          <Text className="text-sm font-mono text-destructive">
            {error.toString()}
          </Text>
          {errorInfo && (
            <Text className="text-xs font-mono text-muted-foreground mt-2">
              {errorInfo.componentStack}
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
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

      // Default error UI using functional component with hooks
      return (
        <DefaultErrorUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
