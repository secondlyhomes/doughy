// src/components/ui/DatePicker.tsx
// Input that opens date picker
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal as RNModal,
  TouchableWithoutFeedback,
  Platform,
  useColorScheme,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar as CalendarIcon, X } from 'lucide-react-native';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PRESS_OPACITY } from '@/constants/design-tokens';
import { Calendar } from './Calendar';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getBackdropColor } from '@/lib/design-utils';

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  dateFormat?: string;
  className?: string;
  mode?: 'native' | 'calendar';
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  label,
  error,
  disabled = false,
  minDate,
  maxDate,
  dateFormat = 'MMM d, yyyy',
  className,
  mode = 'native',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date());
  const colors = useThemeColors();
  const colorScheme = useColorScheme();

  // Format display value
  const displayValue = value ? format(value, dateFormat) : '';

  // Handle native picker change
  const handleNativeChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setIsOpen(false);
      }

      if (event.type === 'set' && selectedDate) {
        onChange?.(selectedDate);
        if (Platform.OS === 'ios') {
          setTempDate(selectedDate);
        }
      }
    },
    [onChange]
  );

  // Handle iOS confirm
  const handleIOSConfirm = useCallback(() => {
    onChange?.(tempDate);
    setIsOpen(false);
  }, [onChange, tempDate]);

  // Handle calendar selection
  const handleCalendarSelect = useCallback(
    (date: Date) => {
      onChange?.(date);
      setIsOpen(false);
    },
    [onChange]
  );

  // Clear value
  const handleClear = useCallback(() => {
    onChange?.(undefined);
  }, [onChange]);

  // Render native picker (iOS shows in modal, Android shows inline)
  const renderNativePicker = () => {
    if (!isOpen) return null;

    if (Platform.OS === 'android') {
      return (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleNativeChange}
          minimumDate={minDate}
          maximumDate={maxDate}
        />
      );
    }

    // iOS: show in modal
    return (
      <RNModal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View className="flex-1 justify-end" style={{ backgroundColor: getBackdropColor(colorScheme === 'dark') }}>
            <TouchableWithoutFeedback>
              <View className="rounded-t-xl pb-8" style={{ backgroundColor: colors.background }}>
                <View
                  className="flex-row items-center justify-between px-4 py-3"
                  style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
                >
                  <TouchableOpacity onPress={() => setIsOpen(false)}>
                    <Text className="text-base" style={{ color: colors.mutedForeground }}>Cancel</Text>
                  </TouchableOpacity>
                  <Text className="text-base font-semibold" style={{ color: colors.foreground }}>Select Date</Text>
                  <TouchableOpacity onPress={handleIOSConfirm}>
                    <Text className="text-base font-semibold" style={{ color: colors.primary }}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) setTempDate(date);
                  }}
                  minimumDate={minDate}
                  maximumDate={maxDate}
                  style={{ height: 200 }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </RNModal>
    );
  };

  // Render calendar picker
  const renderCalendarPicker = () => {
    if (!isOpen || mode !== 'calendar') return null;

    return (
      <RNModal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View className="flex-1 items-center justify-center px-4" style={{ backgroundColor: getBackdropColor(colorScheme === 'dark') }}>
            <TouchableWithoutFeedback>
              <View className="w-full max-w-sm">
                <Calendar
                  value={value}
                  onChange={handleCalendarSelect}
                  minDate={minDate}
                  maxDate={maxDate}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </RNModal>
    );
  };

  return (
    <View className={cn('w-full', className)}>
      {label && (
        <Text className="mb-1.5 text-sm font-medium" style={{ color: colors.foreground }}>{label}</Text>
      )}

      <TouchableOpacity
        className={cn(
          'h-10 flex-row items-center justify-between rounded-md px-3',
          disabled && 'opacity-50'
        )}
        style={{
          borderWidth: 1,
          borderColor: error ? colors.destructive : colors.input,
          backgroundColor: colors.background,
        }}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        activeOpacity={PRESS_OPACITY.DEFAULT}
        accessibilityRole="button"
        accessibilityLabel={displayValue ? `Selected date: ${displayValue}` : placeholder}
      >
        <View className="flex-1 flex-row items-center gap-2">
          <CalendarIcon size={16} color={colors.mutedForeground} />
          <Text
            className="text-sm"
            style={{ color: displayValue ? colors.foreground : colors.mutedForeground }}
          >
            {displayValue || placeholder}
          </Text>
        </View>

        {value && !disabled && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Clear date"
          >
            <X size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {error && (
        <Text className="mt-1 text-sm" style={{ color: colors.destructive }}>{error}</Text>
      )}

      {mode === 'native' && renderNativePicker()}
      {mode === 'calendar' && renderCalendarPicker()}
    </View>
  );
}
