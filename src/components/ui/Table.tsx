// src/components/ui/Table.tsx
// FlatList-based table with sticky header
import React from 'react';
import { View, Text, FlatList, ScrollView, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';

// Simple Table API with columns configuration
export interface TableColumn<T> {
  key: string;
  header: string;
  width?: number;
  minWidth?: number;
  flex?: number;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
}

export interface TableProps<T> extends ViewProps {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  headerClassName?: string;
  rowClassName?: string;
  cellClassName?: string;
  emptyMessage?: string;
  showBorder?: boolean;
}

export function Table<T>({
  data,
  columns,
  keyExtractor,
  className,
  headerClassName,
  rowClassName,
  cellClassName,
  emptyMessage = 'No data available',
  showBorder = true,
  ...props
}: TableProps<T>) {
  const colors = useThemeColors();

  const renderHeader = () => (
    <View
      className={cn('flex-row', headerClassName)}
      style={[
        { backgroundColor: colors.muted },
        showBorder && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      {columns.map((column) => (
        <View
          key={column.key}
          style={{
            width: column.width,
            minWidth: column.minWidth,
            flex: column.flex ?? (column.width ? undefined : 1),
          }}
          className={cn('px-4 py-3', cellClassName)}
        >
          <Text
            className={cn(
              'text-xs font-medium uppercase',
              column.align === 'center' && 'text-center',
              column.align === 'right' && 'text-right'
            )}
            style={{ color: colors.mutedForeground }}
          >
            {column.header}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderRow = ({ item, index }: { item: T; index: number }) => (
    <View
      className={cn('flex-row', rowClassName)}
      style={[
        showBorder && { borderBottomWidth: 1, borderBottomColor: colors.border },
        index % 2 === 1 && { backgroundColor: `${colors.muted}4D` },
      ]}
    >
      {columns.map((column) => (
        <View
          key={column.key}
          style={{
            width: column.width,
            minWidth: column.minWidth,
            flex: column.flex ?? (column.width ? undefined : 1),
          }}
          className={cn('justify-center px-4 py-3', cellClassName)}
        >
          {column.render ? (
            column.render(item, index)
          ) : (
            <Text
              className={cn(
                'text-sm',
                column.align === 'center' && 'text-center',
                column.align === 'right' && 'text-right'
              )}
              style={{ color: colors.foreground }}
            >
              {String((item as Record<string, unknown>)[column.key] ?? '')}
            </Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderEmpty = () => (
    <View className="items-center justify-center py-8">
      <Text className="text-sm" style={{ color: colors.mutedForeground }}>{emptyMessage}</Text>
    </View>
  );

  return (
    <View
      className={cn('rounded-md', className)}
      style={showBorder ? { borderWidth: 1, borderColor: colors.border } : undefined}
      {...props}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="min-w-full">
          <FlatList
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderRow}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            stickyHeaderIndices={[0]}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// Compound components for more flexible usage
export interface TableRootProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export function TableRoot({ children, className, ...props }: TableRootProps) {
  const colors = useThemeColors();
  return (
    <View
      className={cn('rounded-md', className)}
      style={{ borderWidth: 1, borderColor: colors.border }}
      {...props}
    >
      {children}
    </View>
  );
}

export interface TableHeaderProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export function TableHeader({ children, className, ...props }: TableHeaderProps) {
  const colors = useThemeColors();
  return (
    <View
      className={cn('flex-row', className)}
      style={{ backgroundColor: colors.muted }}
      {...props}
    >
      {children}
    </View>
  );
}

export interface TableBodyProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export function TableBody({ children, className, ...props }: TableBodyProps) {
  return (
    <View className={cn(className)} {...props}>
      {children}
    </View>
  );
}

export interface TableRowProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export function TableRow({ children, className, ...props }: TableRowProps) {
  const colors = useThemeColors();
  return (
    <View
      className={cn('flex-row', className)}
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      {...props}
    >
      {children}
    </View>
  );
}

export interface TableHeadProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export function TableHead({ children, className, ...props }: TableHeadProps) {
  const colors = useThemeColors();
  return (
    <View className={cn('px-4 py-3', className)} {...props}>
      {typeof children === 'string' ? (
        <Text className="text-xs font-medium uppercase" style={{ color: colors.mutedForeground }}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

export interface TableCellProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export function TableCell({ children, className, ...props }: TableCellProps) {
  const colors = useThemeColors();
  return (
    <View className={cn('justify-center px-4 py-3', className)} {...props}>
      {typeof children === 'string' ? (
        <Text className="text-sm" style={{ color: colors.foreground }}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
