// src/features/admin/components/IntegrationStatusGrid.tsx
// Sectioned list showing all integrations organized by type

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Badge, BadgeVariant } from '@/components/ui';
import { BORDER_RADIUS } from '@/constants/design-tokens';
import type { IntegrationStatus } from '../types/integrations';

interface IntegrationStatusGridProps {
  /** Array of integration items */
  integrations: IntegrationGridItem[];
  /** Navigate to integrations screen */
  onNavigate?: () => void;
  /** Loading state */
  loading?: boolean;
}

export interface IntegrationGridItem {
  id: string;
  name: string;
  service: string;
  status: IntegrationStatus;
  updatedAt: string | null;
  createdAt: string | null;
  /** Whether this integration uses OAuth */
  requiresOAuth?: boolean;
  /** The group/category from integration data */
  group?: string;
}

/** Section types for organizing integrations */
type SectionType = 'infrastructure' | 'oauth' | 'api';

interface Section {
  type: SectionType;
  title: string;
  items: IntegrationGridItem[];
}

/**
 * Get badge variant based on integration status
 */
function getIntegrationBadgeVariant(status: IntegrationStatus): BadgeVariant {
  switch (status) {
    case 'operational':
    case 'active':
      return 'success';
    case 'configured':
      return 'info';
    case 'error':
      return 'destructive';
    case 'checking':
      return 'info';
    case 'not-configured':
      return 'secondary';
    default:
      return 'secondary';
  }
}

/**
 * Get short status label for display
 */
function getStatusLabel(status: IntegrationStatus): string {
  switch (status) {
    case 'operational':
      return 'OK';
    case 'active':
      return 'Active';
    case 'configured':
      return 'Set';
    case 'error':
      return 'Error';
    case 'checking':
      return '...';
    case 'not-configured':
      return 'None';
    default:
      return 'N/A';
  }
}

/**
 * Format date for display
 */
function formatSetDate(dateString: string | null): string {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return `Set ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

/**
 * Single integration row item
 */
const IntegrationRow = React.memo(function IntegrationRow({
  item,
  onPress,
}: {
  item: IntegrationGridItem;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  const isConfigured = item.status !== 'not-configured';
  const effectiveDate = item.updatedAt || item.createdAt;

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Status badge */}
      <Badge variant={getIntegrationBadgeVariant(item.status)} size="sm" style={styles.statusBadge}>
        {getStatusLabel(item.status)}
      </Badge>

      {/* Name */}
      <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
        {item.name}
      </Text>

      {/* Date info */}
      <Text style={[styles.date, { color: colors.mutedForeground }]}>
        {isConfigured ? formatSetDate(effectiveDate) : 'Not set'}
      </Text>
    </TouchableOpacity>
  );
});

/**
 * Section header
 */
const SectionHeader = React.memo(function SectionHeader({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  const colors = useThemeColors();

  return (
    <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
        {count}
      </Text>
    </View>
  );
});

/**
 * IntegrationStatusGrid - Sectioned list of all integrations
 */
export const IntegrationStatusGrid = React.memo(function IntegrationStatusGrid({
  integrations,
  onNavigate,
  loading = false,
}: IntegrationStatusGridProps) {
  const colors = useThemeColors();

  // Organize integrations into sections
  const sections: Section[] = useMemo(() => {
    const infrastructure: IntegrationGridItem[] = [];
    const oauth: IntegrationGridItem[] = [];
    const api: IntegrationGridItem[] = [];

    for (const item of integrations) {
      // Infrastructure: Hosting group
      if (item.group === 'Hosting') {
        infrastructure.push(item);
      }
      // OAuth: integrations that require OAuth
      else if (item.requiresOAuth) {
        oauth.push(item);
      }
      // API Keys: everything else
      else {
        api.push(item);
      }
    }

    const result: Section[] = [];

    if (infrastructure.length > 0) {
      result.push({ type: 'infrastructure', title: 'Infrastructure', items: infrastructure });
    }
    if (oauth.length > 0) {
      result.push({ type: 'oauth', title: 'OAuth Connections', items: oauth });
    }
    if (api.length > 0) {
      result.push({ type: 'api', title: 'API Keys', items: api });
    }

    return result;
  }, [integrations]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading integrations...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Integrations
      </Text>

      {sections.map((section) => (
        <View key={section.type} style={styles.section}>
          <SectionHeader title={section.title} count={section.items.length} />
          {section.items.map((item) => (
            <IntegrationRow key={item.id} item={item} onPress={onNavigate} />
          ))}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statusBadge: {
    marginRight: 10,
    minWidth: 44,
  },
  name: {
    flex: 1,
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    marginLeft: 8,
  },
});
