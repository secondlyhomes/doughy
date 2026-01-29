// src/features/skip-tracing/components/ContactInfoCard.tsx
// Component for displaying phone, email, and address results from skip trace

import React from 'react';
import { View, Text, Pressable, Linking, Alert, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  Phone,
  Mail,
  MapPin,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Building,
} from 'lucide-react-native';
import { Card, CardContent, Badge } from '@/components/ui';
import type { PhoneResult, EmailResult, AddressResult } from '../types';

// Helper function for safe clipboard copy
const safeCopy = async (text: string, successMessage: string) => {
  try {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', successMessage);
  } catch (error) {
    console.error('Clipboard copy failed:', error);
    Alert.alert('Copy Failed', 'Could not copy to clipboard. Please try again.');
  }
};

// Helper function for safe URL opening
const safeOpenUrl = async (url: string, errorTitle: string, errorMessage: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(errorTitle, errorMessage);
    }
  } catch (error) {
    console.error('Failed to open URL:', error);
    Alert.alert('Error', 'Could not open the app. Please try again.');
  }
};

// Phone Result Card
interface PhoneCardProps {
  phone: PhoneResult;
}

export const PhoneCard: React.FC<PhoneCardProps> = ({ phone }) => {
  const handleCall = async () => {
    await safeOpenUrl(
      `tel:${phone.number}`,
      'Unable to Call',
      'Your device cannot make phone calls.'
    );
  };

  const handleCopy = async () => {
    await safeCopy(phone.number, 'Phone number copied to clipboard');
  };

  const getPhoneTypeIcon = () => {
    switch (phone.type) {
      case 'mobile':
        return <Smartphone size={14} className="text-muted-foreground mr-1" />;
      case 'landline':
        return <Phone size={14} className="text-muted-foreground mr-1" />;
      case 'voip':
        return <Building size={14} className="text-muted-foreground mr-1" />;
      default:
        return <Phone size={14} className="text-muted-foreground mr-1" />;
    }
  };

  return (
    <Card className="mb-2">
      <CardContent className="p-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Phone size={18} className="text-primary mr-3" />
            <View className="flex-1">
              <Text className="text-base font-medium text-foreground">{phone.number}</Text>
              <View className="flex-row items-center mt-1">
                {getPhoneTypeIcon()}
                <Text className="text-xs text-muted-foreground capitalize">{phone.type}</Text>
                {phone.carrier && (
                  <Text className="text-xs text-muted-foreground ml-2">• {phone.carrier}</Text>
                )}
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            {/* Badges */}
            <View className="flex-row gap-1">
              {phone.verified && (
                <Badge variant="outline" className="px-1 py-0">
                  <CheckCircle size={10} className="text-success mr-1" />
                  <Text className="text-[10px]">Verified</Text>
                </Badge>
              )}
              {phone.dnc && (
                <Badge variant="destructive" className="px-1 py-0">
                  <AlertTriangle size={10} className="mr-1" />
                  <Text className="text-[10px]">DNC</Text>
                </Badge>
              )}
            </View>

            {/* Actions */}
            <Pressable
              onPress={handleCopy}
              className="p-2"
              accessibilityLabel="Copy phone number"
              accessibilityRole="button"
            >
              <Copy size={16} className="text-muted-foreground" />
            </Pressable>
            <Pressable
              onPress={handleCall}
              className="p-2"
              accessibilityLabel={`Call ${phone.number}`}
              accessibilityRole="button"
            >
              <ExternalLink size={16} className="text-primary" />
            </Pressable>
          </View>
        </View>
      </CardContent>
    </Card>
  );
};

// Email Result Card
interface EmailCardProps {
  email: EmailResult;
}

export const EmailCard: React.FC<EmailCardProps> = ({ email }) => {
  const handleEmail = async () => {
    await safeOpenUrl(
      `mailto:${email.address}`,
      'Unable to Send Email',
      'No email client is configured on this device.'
    );
  };

  const handleCopy = async () => {
    await safeCopy(email.address, 'Email address copied to clipboard');
  };

  return (
    <Card className="mb-2">
      <CardContent className="p-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Mail size={18} className="text-primary mr-3" />
            <View className="flex-1">
              <Text className="text-base font-medium text-foreground">{email.address}</Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-xs text-muted-foreground capitalize">{email.type}</Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            {email.verified && (
              <Badge variant="outline" className="px-1 py-0">
                <CheckCircle size={10} className="text-success mr-1" />
                <Text className="text-[10px]">Verified</Text>
              </Badge>
            )}

            <Pressable
              onPress={handleCopy}
              className="p-2"
              accessibilityLabel="Copy email address"
              accessibilityRole="button"
            >
              <Copy size={16} className="text-muted-foreground" />
            </Pressable>
            <Pressable
              onPress={handleEmail}
              className="p-2"
              accessibilityLabel={`Send email to ${email.address}`}
              accessibilityRole="button"
            >
              <ExternalLink size={16} className="text-primary" />
            </Pressable>
          </View>
        </View>
      </CardContent>
    </Card>
  );
};

// Address Result Card
interface AddressCardProps {
  address: AddressResult;
}

export const AddressCard: React.FC<AddressCardProps> = ({ address }) => {
  const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zip}`;

  const handleOpenMaps = async () => {
    const encodedAddress = encodeURIComponent(fullAddress);
    // Use platform-specific maps URL for best UX
    const url = Platform.select({
      ios: `maps://app?q=${encodedAddress}`,
      android: `geo:0,0?q=${encodedAddress}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    });

    if (url) {
      await safeOpenUrl(
        url,
        'Unable to Open Maps',
        'No maps application is available on this device.'
      );
    }
  };

  const handleCopy = async () => {
    await safeCopy(fullAddress, 'Address copied to clipboard');
  };

  const getAddressTypeBadge = () => {
    switch (address.type) {
      case 'current':
        return (
          <Badge variant="default" className="px-1 py-0">
            <Text className="text-[10px]">Current</Text>
          </Badge>
        );
      case 'previous':
        return (
          <Badge variant="secondary" className="px-1 py-0">
            <Text className="text-[10px]">Previous</Text>
          </Badge>
        );
      case 'mailing':
        return (
          <Badge variant="outline" className="px-1 py-0">
            <Text className="text-[10px]">Mailing</Text>
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="mb-2">
      <CardContent className="p-3">
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-start flex-1">
            <MapPin size={18} className="text-primary mr-3 mt-1" />
            <View className="flex-1">
              <Text className="text-base font-medium text-foreground">{address.street}</Text>
              <Text className="text-sm text-muted-foreground">
                {address.city}, {address.state} {address.zip}
              </Text>
              <View className="flex-row items-center mt-1 gap-2">
                {getAddressTypeBadge()}
                {address.yearsAtAddress !== undefined && address.yearsAtAddress > 0 && (
                  <Text className="text-xs text-muted-foreground">
                    {address.yearsAtAddress} year{address.yearsAtAddress !== 1 ? 's' : ''}
                  </Text>
                )}
                {address.isOwner && (
                  <Badge variant="outline" className="px-1 py-0">
                    <Text className="text-[10px]">Owner</Text>
                  </Badge>
                )}
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={handleCopy}
              className="p-2"
              accessibilityLabel="Copy address"
              accessibilityRole="button"
            >
              <Copy size={16} className="text-muted-foreground" />
            </Pressable>
            <Pressable
              onPress={handleOpenMaps}
              className="p-2"
              accessibilityLabel="Open address in maps"
              accessibilityRole="button"
            >
              <ExternalLink size={16} className="text-primary" />
            </Pressable>
          </View>
        </View>
      </CardContent>
    </Card>
  );
};
