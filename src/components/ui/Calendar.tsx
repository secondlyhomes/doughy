// src/components/ui/Calendar.tsx
// Month view calendar for date selection
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ViewProps } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  isBefore,
  isAfter,
} from 'date-fns';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface MarkedDateStyle {
  marked?: boolean;
  dotColor?: string;
  selected?: boolean;
}

export interface CalendarProps extends ViewProps {
  value?: Date;
  onChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  markedDates?: { [dateString: string]: MarkedDateStyle };
  className?: string;
}

export function Calendar({
  value,
  onChange,
  minDate,
  maxDate,
  disabledDates = [],
  markedDates = {},
  className,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const colors = useThemeColors();

  // Generate days for the calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Check if a date is disabled
  const isDateDisabled = useCallback(
    (date: Date) => {
      if (minDate && isBefore(date, minDate)) return true;
      if (maxDate && isAfter(date, maxDate)) return true;
      return disabledDates.some((d) => isSameDay(d, date));
    },
    [minDate, maxDate, disabledDates]
  );

  // Get marked date info
  const getMarkedInfo = useCallback(
    (date: Date) => {
      const dateString = format(date, 'yyyy-MM-dd');
      return markedDates[dateString];
    },
    [markedDates]
  );

  // Handle date selection
  const handleDateSelect = useCallback(
    (date: Date) => {
      if (!isDateDisabled(date)) {
        onChange?.(date);
      }
    },
    [onChange, isDateDisabled]
  );

  // Navigate months
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(subMonths(currentMonth, 1));
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(addMonths(currentMonth, 1));
  }, [currentMonth]);

  const getDateTextColor = (
    isCurrentMonth: boolean,
    isSelected: boolean,
    isTodayDate: boolean
  ) => {
    if (isSelected) return colors.primaryForeground;
    if (isTodayDate) return colors.primary;
    if (!isCurrentMonth) return `${colors.mutedForeground}80`;
    return colors.foreground;
  };

  return (
    <View
      className={cn('w-full rounded-md border p-4', className)}
      style={{ backgroundColor: colors.background, borderColor: colors.border }}
      {...props}
    >
      {/* Header with month/year and navigation */}
      <View className="mb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={goToPreviousMonth}
          className="h-8 w-8 items-center justify-center rounded-md"
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <ChevronLeft size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
        <Text
          className="text-sm font-semibold"
          style={{ color: colors.foreground }}
          accessibilityRole="header"
        >
          {format(currentMonth, 'MMMM yyyy')}
        </Text>
        <TouchableOpacity
          onPress={goToNextMonth}
          className="h-8 w-8 items-center justify-center rounded-md"
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <ChevronRight size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View className="mb-2 flex-row">
        {WEEKDAYS.map((day) => (
          <View key={day} className="flex-1 items-center py-2">
            <Text className="text-xs font-medium" style={{ color: colors.mutedForeground }}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="flex-row flex-wrap">
        {calendarDays.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isSelected = value && isSameDay(date, value);
          const isTodayDate = isToday(date);
          const isDisabled = isDateDisabled(date);
          const markedInfo = getMarkedInfo(date);

          return (
            <View key={index} className="w-[14.28%] items-center py-1">
              <TouchableOpacity
                onPress={() => handleDateSelect(date)}
                disabled={isDisabled}
                className={cn(
                  'h-10 w-10 items-center justify-center rounded-full',
                  isDisabled && 'opacity-30'
                )}
                style={[
                  isSelected && { backgroundColor: colors.primary },
                  !isSelected && isTodayDate && { borderWidth: 1, borderColor: colors.primary },
                ]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={format(date, 'EEEE, MMMM d, yyyy')}
                accessibilityState={{ selected: isSelected, disabled: isDisabled }}
              >
                <Text
                  className="text-sm"
                  style={{
                    color: getDateTextColor(isCurrentMonth, !!isSelected, isTodayDate),
                    fontWeight: (isSelected || isTodayDate) ? '600' : 'normal',
                  }}
                >
                  {format(date, 'd')}
                </Text>
                {/* Dot marker */}
                {markedInfo?.marked && !isSelected && (
                  <View
                    className="absolute bottom-1 h-1 w-1 rounded-full"
                    style={{ backgroundColor: markedInfo.dotColor || colors.info }}
                  />
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}
