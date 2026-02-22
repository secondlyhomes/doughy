// src/features/auth/components/MFACodeInput.tsx
// 6-digit code input for MFA verification

import React, { useRef, useEffect } from 'react';
import { View, TextInput, Text } from 'react-native';

interface MFACodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

const CODE_LENGTH = 6;

export function MFACodeInput({
  value,
  onChange,
  disabled = false,
  error = false,
  autoFocus = true,
}: MFACodeInputProps) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleChange = (text: string) => {
    // Only allow digits
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    onChange(digits);
  };

  const digits = value.padEnd(CODE_LENGTH, ' ').split('');

  return (
    <View>
      {/* Hidden input for keyboard */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        autoComplete="one-time-code"
        editable={!disabled}
        style={{ position: 'absolute', opacity: 0, height: 0 }}
      />

      {/* Visual digit boxes */}
      <View
        className="flex-row justify-center gap-2"
        onTouchEnd={() => inputRef.current?.focus()}
      >
        {digits.map((digit, index) => (
          <View
            key={index}
            className={`w-12 h-14 rounded-lg border-2 items-center justify-center ${
              error
                ? 'border-destructive'
                : index < value.length
                ? 'border-primary'
                : 'border-border'
            } ${disabled ? 'opacity-50' : ''}`}
          >
            <Text
              className={`text-2xl font-bold ${
                error ? 'text-destructive' : 'text-foreground'
              }`}
            >
              {digit !== ' ' ? digit : ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
