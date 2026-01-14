// src/features/deals/components/ShareReportSheet.tsx
// Bottom sheet for sharing seller report

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Link2, MessageSquare, Mail, Download, Copy } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { BottomSheet, BottomSheetSection } from '@/components/ui/BottomSheet';
import { generateShareMessage, generateShareEmail } from '../data/mockSellerReport';

interface ShareReportSheetProps {
  visible: boolean;
  onClose: () => void;
  sellerName: string;
  propertyAddress: string;
  shareToken?: string;
}

export function ShareReportSheet({
  visible,
  onClose,
  sellerName,
  propertyAddress,
  shareToken,
}: ShareReportSheetProps) {
  const colors = useThemeColors();

  // Generate share link (placeholder for now)
  const shareLink = useMemo(() => {
    if (shareToken) {
      return `https://app.dealos.com/report/${shareToken}`;
    }
    return 'Link will be generated after saving';
  }, [shareToken]);

  // Generate SMS message
  const smsMessage = useMemo(() => {
    return generateShareMessage(sellerName, propertyAddress, shareLink);
  }, [sellerName, propertyAddress, shareLink]);

  // Generate email
  const emailMessage = useMemo(() => {
    return generateShareEmail(sellerName, propertyAddress, shareLink);
  }, [sellerName, propertyAddress, shareLink]);

  // Copy to clipboard
  const handleCopy = async (text: string, type: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${type} copied to clipboard`);
  };

  // Share option button
  const ShareOption = ({
    icon: Icon,
    label,
    description,
    onPress,
    disabled = false,
  }: {
    icon: React.ComponentType<{ size: number; color: string }>;
    label: string;
    description: string;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      className="flex-row items-center py-3 border-b"
      style={{ borderColor: colors.border, opacity: disabled ? 0.5 : 1 }}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View
        className="w-10 h-10 rounded-lg items-center justify-center mr-3"
        style={{ backgroundColor: colors.primary + '15' }}
      >
        <Icon size={20} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium" style={{ color: colors.foreground }}>{label}</Text>
        <Text className="text-xs" style={{ color: colors.mutedForeground }}>{description}</Text>
      </View>
      <Copy size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Share Report"
      maxHeight={500}
    >
      <BottomSheetSection title="Share Options">
        {/* Copy Link */}
        <ShareOption
          icon={Link2}
          label="Copy Share Link"
          description="Copy the view-only link"
          onPress={() => handleCopy(shareLink, 'Share link')}
          disabled={!shareToken}
        />

        {/* Copy SMS */}
        <ShareOption
          icon={MessageSquare}
          label="Copy SMS Message"
          description="Ready-to-send text message"
          onPress={() => handleCopy(smsMessage, 'SMS message')}
        />

        {/* Copy Email */}
        <ShareOption
          icon={Mail}
          label="Copy Email"
          description="Professional follow-up email"
          onPress={() => handleCopy(emailMessage, 'Email')}
        />

        {/* Download PDF (placeholder) */}
        <TouchableOpacity
          className="flex-row items-center py-3"
          onPress={() => Alert.alert('Coming Soon', 'PDF download will be available after Supabase integration')}
          accessibilityLabel="Download PDF"
          accessibilityRole="button"
        >
          <View
            className="w-10 h-10 rounded-lg items-center justify-center mr-3"
            style={{ backgroundColor: colors.muted }}
          >
            <Download size={20} color={colors.mutedForeground} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium" style={{ color: colors.mutedForeground }}>Download PDF</Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Coming soon</Text>
          </View>
        </TouchableOpacity>
      </BottomSheetSection>

      {/* Preview link */}
      <View
        className="mt-4 p-3 rounded-lg"
        style={{ backgroundColor: colors.muted }}
      >
        <Text className="text-xs mb-1" style={{ color: colors.mutedForeground }}>Share Link Preview</Text>
        <Text className="text-sm font-mono" style={{ color: colors.foreground }} numberOfLines={1}>
          {shareLink}
        </Text>
      </View>
    </BottomSheet>
  );
}
