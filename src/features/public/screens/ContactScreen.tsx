// src/features/public/screens/ContactScreen.tsx
// Contact page for public website
//
// NOTE: Public marketing page - hardcoded brand colors intentional
import { useState } from 'react';
import { View, Text, TextInput, Pressable, Linking, useWindowDimensions, Alert } from 'react-native';
import { Mail, Phone, MapPin, Send } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function openExternalLink(url: string, fallbackMessage?: string): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.warn('[Contact] Cannot open URL:', url);
      if (fallbackMessage) {
        Alert.alert('Unable to Open', fallbackMessage);
      }
    }
  } catch (error) {
    console.error('[Contact] Error opening link:', error);
    if (fallbackMessage) {
      Alert.alert('Unable to Open', fallbackMessage);
    }
  }
}

const contactInfo = [
  {
    Icon: Mail,
    title: 'Email Us',
    description: 'For general inquiries and support',
    value: 'info@doughy.com',
    action: () => openExternalLink('mailto:info@doughy.com', 'No email app configured. Please email us at info@doughy.com'),
  },
  {
    Icon: Phone,
    title: 'Call Us',
    description: 'Monday-Friday, 9am-5pm EST',
    value: '+1 (555) 123-4567',
    action: () => openExternalLink('tel:+15551234567', 'Unable to make call. Please dial +1 (555) 123-4567'),
  },
  {
    Icon: MapPin,
    title: 'Visit Us',
    description: 'Our headquarters location',
    value: '123 Dough Street\nSan Francisco, CA 94107',
    action: () => openExternalLink('https://maps.google.com/?q=San+Francisco+CA', 'Unable to open maps'),
  },
];

export function ContactScreen() {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  const validateForm = (): boolean => {
    const errors: { name?: string; email?: string; message?: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const mailtoUrl = `mailto:info@doughy.com?subject=${encodeURIComponent(
      formData.subject || 'Contact Form Submission'
    )}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
    )}`;

    await openExternalLink(
      mailtoUrl,
      'No email app configured. Please email us directly at info@doughy.com'
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Hero Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <View className="max-w-[1200px] mx-auto">
          <View className="max-w-3xl mx-auto items-center">
            <Text className="text-4xl md:text-5xl font-bold text-center mb-6" style={{ color: colors.foreground }}>
              Get in Touch With Us
            </Text>
            <Text className="text-lg text-center" style={{ color: colors.mutedForeground }}>
              We'd love to hear from you. Reach out to our team for support, inquiries, or partnerships.
            </Text>
          </View>
        </View>
      </View>

      {/* Contact Options Section */}
      <View className="py-12 md:py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: colors.card }}>
        <View className="max-w-[1200px] mx-auto">
          <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-8`}>
            {contactInfo.map((info, index) => (
              <Pressable key={index} onPress={info.action} className="flex-1">
                <Card className="p-6 items-center">
                  <View className="w-12 h-12 rounded-full items-center justify-center mb-4" style={{ backgroundColor: colors.primary + '33' }}>
                    <info.Icon size={24} color={colors.primary} />
                  </View>
                  <Text className="text-xl font-semibold mb-2" style={{ color: colors.foreground }}>{info.title}</Text>
                  <Text className="mb-4 text-center" style={{ color: colors.mutedForeground }}>{info.description}</Text>
                  <Text className="font-medium text-center" style={{ color: colors.primary }}>{info.value}</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Contact Form Section */}
      <View className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <View className="max-w-3xl mx-auto">
          <Text className="text-3xl font-bold text-center mb-4" style={{ color: colors.foreground }}>
            Send Us a Message
          </Text>
          <Text className="text-center mb-8" style={{ color: colors.mutedForeground }}>
            Fill out the form below and we'll get back to you as soon as possible.
          </Text>

          <View className="gap-4">
            <View className={`${isMobile ? 'flex-col' : 'flex-row'} gap-4`}>
              <View className="flex-1">
                <Text className="mb-2 font-medium" style={{ color: colors.foreground }}>Name</Text>
                <TextInput
                  className="rounded-lg px-4 py-3"
                  style={{ borderWidth: 1, borderColor: formErrors.name ? colors.destructive : colors.border, color: colors.foreground, backgroundColor: colors.background }}
                  placeholder="Your name"
                  placeholderTextColor={colors.mutedForeground}
                  value={formData.name}
                  onChangeText={(text) => {
                    setFormData({ ...formData, name: text });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                  }}
                />
                {formErrors.name && (
                  <Text className="mt-1 text-sm" style={{ color: colors.destructive }}>{formErrors.name}</Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="mb-2 font-medium" style={{ color: colors.foreground }}>Email</Text>
                <TextInput
                  className="rounded-lg px-4 py-3"
                  style={{ borderWidth: 1, borderColor: formErrors.email ? colors.destructive : colors.border, color: colors.foreground, backgroundColor: colors.background }}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData({ ...formData, email: text });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
                  }}
                />
                {formErrors.email && (
                  <Text className="mt-1 text-sm" style={{ color: colors.destructive }}>{formErrors.email}</Text>
                )}
              </View>
            </View>

            <View>
              <Text className="mb-2 font-medium" style={{ color: colors.foreground }}>Subject</Text>
              <TextInput
                className="rounded-lg px-4 py-3"
                style={{ borderWidth: 1, borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }}
                placeholder="What's this about?"
                placeholderTextColor={colors.mutedForeground}
                value={formData.subject}
                onChangeText={(text) => setFormData({ ...formData, subject: text })}
              />
            </View>

            <View>
              <Text className="mb-2 font-medium" style={{ color: colors.foreground }}>Message</Text>
              <TextInput
                className="rounded-lg px-4 py-3 min-h-[150px]"
                style={{ borderWidth: 1, borderColor: formErrors.message ? colors.destructive : colors.border, color: colors.foreground, backgroundColor: colors.background }}
                placeholder="Tell us more..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={formData.message}
                onChangeText={(text) => {
                  setFormData({ ...formData, message: text });
                  if (formErrors.message) setFormErrors({ ...formErrors, message: undefined });
                }}
              />
              {formErrors.message && (
                <Text className="mt-1 text-sm" style={{ color: colors.destructive }}>{formErrors.message}</Text>
              )}
            </View>

            <Button onPress={handleSubmit} className="mt-4">
              <View className="flex-row items-center gap-2">
                <Send size={18} color={colors.primaryForeground} />
                <Text className="font-medium" style={{ color: colors.primaryForeground }}>Send Message</Text>
              </View>
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}
