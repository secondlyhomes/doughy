// src/features/capture/components/CaptureItemCard.tsx
// Card component for displaying a single capture item in the triage queue

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  Mic,
  Phone,
  MessageSquare,
  FileText,
  File,
  Mail,
  StickyNote,
  Camera,
  ChevronRight,
  Sparkles,
  User,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui';
import { getShadowStyle, withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { CaptureItem, CaptureItemType } from '../types';

interface CaptureItemCardProps {
  item: CaptureItem;
  onPress: () => void;
  onPushToLead?: () => void;
}

function getTypeIcon(type: CaptureItemType) {
  switch (type) {
    case 'recording':
      return Mic;
    case 'call':
      return Phone;
    case 'text':
      return MessageSquare;
    case 'transcript':
      return FileText;
    case 'document':
      return File;
    case 'email':
      return Mail;
    case 'note':
      return StickyNote;
    case 'photo':
      return Camera;
    default:
      return File;
  }
}

function getTypeLabel(type: CaptureItemType): string {
  switch (type) {
    case 'recording':
      return 'Recording';
    case 'call':
      return 'Call';
    case 'text':
      return 'Text';
    case 'transcript':
      return 'Transcript';
    case 'document':
      return 'Document';
    case 'email':
      return 'Email';
    case 'note':
      return 'Note';
    case 'photo':
      return 'Photo';
    default:
      return 'Item';
  }
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function CaptureItemCard({ item, onPress, onPushToLead }: CaptureItemCardProps) {
  const colors = useThemeColors();
  const Icon = getTypeIcon(item.type);

  const title = item.title || item.file_name || getTypeLabel(item.type);
  const preview = item.ai_summary || item.transcript?.slice(0, 100) || item.content?.slice(0, 100);
  const hasSuggestion = item.suggested_lead_id || item.suggested_property_id;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        ...getShadowStyle(colors, { size: 'sm' }),
      }}
      accessibilityRole="button"
      accessibilityLabel={`${getTypeLabel(item.type)}: ${title}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md }}>
        {/* Type Icon */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: withOpacity(colors.primary, 'light'),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={22} color={colors.primary} />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {/* Header Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text
              style={{ fontSize: 15, fontWeight: '600', color: colors.foreground, flex: 1 }}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
              {formatTimeAgo(item.created_at)}
            </Text>
          </View>

          {/* Type & Duration */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs }}>
            <Badge variant="secondary" size="sm">
              {getTypeLabel(item.type)}
            </Badge>
            {item.duration_seconds != null && item.duration_seconds > 0 && (
              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                {formatDuration(item.duration_seconds)}
              </Text>
            )}
          </View>

          {/* Preview */}
          {preview && (
            <Text
              style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}
              numberOfLines={2}
            >
              {preview}...
            </Text>
          )}

          {/* AI Suggestion */}
          {hasSuggestion && item.ai_confidence !== undefined && item.ai_confidence > 0.5 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.xs,
                marginTop: SPACING.sm,
                paddingTop: SPACING.sm,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <Sparkles size={14} color={colors.warning} />
              <Text style={{ fontSize: 12, color: colors.warning, flex: 1 }}>
                AI suggests: {item.suggested_lead_id ? 'Matched lead' : 'Matched property'}
                {item.ai_confidence && ` (${Math.round(item.ai_confidence * 100)}% confident)`}
              </Text>
            </View>
          )}
        </View>

        {/* Chevron */}
        <ChevronRight size={20} color={colors.mutedForeground} style={{ marginTop: 12 }} />
      </View>

      {/* Push to Lead Button */}
      {onPushToLead && item.status === 'ready' && (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onPushToLead();
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: SPACING.xs,
            marginTop: SPACING.md,
            paddingVertical: SPACING.sm,
            backgroundColor: withOpacity(colors.primary, 'light'),
            borderRadius: BORDER_RADIUS.md,
          }}
          accessibilityRole="button"
          accessibilityLabel="Push to Lead"
        >
          <User size={16} color={colors.primary} />
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.primary }}>
            Push to Lead
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default CaptureItemCard;
