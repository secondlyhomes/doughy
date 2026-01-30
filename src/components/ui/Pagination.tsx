// src/components/ui/Pagination.tsx
// Page navigation controls
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ViewProps } from 'react-native';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/contexts/ThemeContext';

// Simple API for pagination
export interface PaginationProps extends ViewProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
  ...props
}: PaginationProps) {
  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    const rangeStart = Math.max(2, currentPage - siblingCount);
    const rangeEnd = Math.min(totalPages - 1, currentPage + siblingCount);

    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      pages.push('ellipsis');
    }

    // Add pages in range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    // Add ellipsis before last page if needed
    if (rangeEnd < totalPages - 1) {
      pages.push('ellipsis');
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages, siblingCount]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <View className={cn('flex-row items-center justify-center gap-1', className)} {...props}>
      <PaginationPrevious
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      />

      {pageNumbers.map((page, index) => (
        page === 'ellipsis' ? (
          <PaginationEllipsis key={`ellipsis-${index}`} />
        ) : (
          <PaginationLink
            key={page}
            page={page}
            isActive={page === currentPage}
            onPress={() => onPageChange(page)}
          />
        )
      ))}

      <PaginationNext
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
    </View>
  );
}

// Individual page link
interface PaginationLinkProps {
  page: number;
  isActive?: boolean;
  onPress: () => void;
}

function PaginationLink({ page, isActive, onPress }: PaginationLinkProps) {
  return (
    <TouchableOpacity
      className={cn(
        'h-10 w-10 items-center justify-center rounded-md',
        isActive ? 'bg-primary' : 'bg-transparent'
      )}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Page ${page}`}
      accessibilityState={{ selected: isActive }}
    >
      <Text
        className={cn(
          'text-sm font-medium',
          isActive ? 'text-primary-foreground' : 'text-foreground'
        )}
      >
        {page}
      </Text>
    </TouchableOpacity>
  );
}

// Previous button
interface PaginationPreviousProps {
  onPress: () => void;
  disabled?: boolean;
}

function PaginationPrevious({ onPress, disabled }: PaginationPreviousProps) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      className={cn(
        'h-10 w-10 items-center justify-center rounded-md',
        disabled && 'opacity-50'
      )}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Previous page"
      accessibilityState={{ disabled }}
    >
      <ChevronLeft size={16} color={disabled ? colors.mutedForeground : colors.foreground} />
    </TouchableOpacity>
  );
}

// Next button
interface PaginationNextProps {
  onPress: () => void;
  disabled?: boolean;
}

function PaginationNext({ onPress, disabled }: PaginationNextProps) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      className={cn(
        'h-10 w-10 items-center justify-center rounded-md',
        disabled && 'opacity-50'
      )}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Next page"
      accessibilityState={{ disabled }}
    >
      <ChevronRight size={16} color={disabled ? colors.mutedForeground : colors.foreground} />
    </TouchableOpacity>
  );
}

// Ellipsis
function PaginationEllipsis() {
  const colors = useThemeColors();
  return (
    <View className="h-10 w-10 items-center justify-center" accessibilityLabel="More pages">
      <MoreHorizontal size={16} color={colors.mutedForeground} />
    </View>
  );
}

// Export compound components for advanced usage
export { PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis };
