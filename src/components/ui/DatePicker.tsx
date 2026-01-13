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
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar as CalendarIcon, X } from 'lucide-react-native';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from './Calendar';
import { useThemeColors } from '@/context/ThemeContext';

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
          <View className="flex-1 justify-end bg-black/50">
            <TouchableWithoutFeedback>
              <View className="rounded-t-xl bg-background pb-8">
                <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
                  <TouchableOpacity onPress={() => setIsOpen(false)}>
                    <Text className="text-base text-muted-foreground">Cancel</Text>
                  </TouchableOpacity>
                  <Text className="text-base font-semibold text-foreground">Select Date</Text>
                  <TouchableOpacity onPress={handleIOSConfirm}>
                    <Text className="text-base font-semibold text-primary">Done</Text>
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
          <View className="flex-1 items-center justify-center bg-black/50 px-4">
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
        <Text className="mb-1.5 text-sm font-medium text-foreground">{label}</Text>
      )}

      <TouchableOpacity
        className={cn(
          'h-10 flex-row items-center justify-between rounded-md border border-input bg-background px-3',
          disabled && 'opacity-50',
          error && 'border-destructive'
        )}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={displayValue ? `Selected date: ${displayValue}` : placeholder}
      >
        <View className="flex-1 flex-row items-center gap-2">
          <CalendarIcon size={16} color={colors.mutedForeground} />
          <Text
            className={cn(
              'text-sm',
              displayValue ? 'text-foreground' : 'text-muted-foreground'
            )}
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
        <Text className="mt-1 text-sm text-destructive">{error}</Text>
      )}

      {mode === 'native' && renderNativePicker()}
      {mode === 'calendar' && renderCalendarPicker()}
    </View>
  );
}
