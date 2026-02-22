// src/features/layout/components/ErrorBoundary.tsx
// Error boundary component for catching React errors
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

// Fallback colors for when ThemeProvider is not available
// Must match ThemeContext.tsx light theme colors
const FALLBACK_COLORS = {
  primary: '#4d7c5f',           // Sage green
  primaryForeground: '#ffffff',
  destructive: '#ef4444',
  background: '#fafafa',
  foreground: '#0f172a',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',
};

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
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: FALLBACK_COLORS.background, padding: 24, gap: 16 }}>
      <AlertTriangle size={48} color={FALLBACK_COLORS.destructive} />
      <Text style={{ fontSize: 20, fontWeight: '600', color: FALLBACK_COLORS.foreground }}>
        Something went wrong
      </Text>
      <Text style={{ color: FALLBACK_COLORS.mutedForeground, textAlign: 'center' }}>
        An unexpected error occurred. Please try again.
      </Text>

      <TouchableOpacity
        onPress={onReset}
        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: FALLBACK_COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 8 }}
      >
        <RefreshCw size={20} color={FALLBACK_COLORS.primaryForeground} />
        <Text style={{ color: FALLBACK_COLORS.primaryForeground, fontWeight: '500', marginLeft: 8 }}>Try Again</Text>
      </TouchableOpacity>

      {__DEV__ && error && (
        <ScrollView style={{ marginTop: 8, maxHeight: 192, width: '100%', backgroundColor: FALLBACK_COLORS.muted, borderRadius: 8, padding: 16 }}>
          <Text style={{ fontSize: 12, fontFamily: 'monospace', color: FALLBACK_COLORS.destructive }}>
            {error.toString()}
          </Text>
          {errorInfo && (
            <Text style={{ fontSize: 10, fontFamily: 'monospace', color: FALLBACK_COLORS.mutedForeground, marginTop: 8 }}>
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
