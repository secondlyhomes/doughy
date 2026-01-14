// src/features/public/screens/TermsScreen.tsx
// Terms of service page for public website
//
// NOTE: Public marketing page - hardcoded brand colors intentional
import { View, Text } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing and using Doughy's services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.`,
  },
  {
    title: '2. Description of Service',
    content: `Doughy provides a lead management platform for real estate investors. Our services include lead tracking, analytics, communication tools, and other features as described on our website.`,
  },
  {
    title: '3. User Accounts',
    content: `To use certain features of our service, you must register for an account. You agree to:

• Provide accurate and complete information
• Maintain the security of your account credentials
• Notify us immediately of any unauthorized access
• Accept responsibility for all activities under your account`,
  },
  {
    title: '4. Acceptable Use',
    content: `You agree not to use the service to:

• Violate any applicable laws or regulations
• Infringe on intellectual property rights
• Transmit harmful or malicious content
• Attempt to gain unauthorized access
• Interfere with the service's operation
• Engage in any fraudulent activity`,
  },
  {
    title: '5. Payment Terms',
    content: `Paid subscriptions are billed in advance on a monthly or annual basis. You agree to pay all fees associated with your subscription. Refunds are available within 30 days of purchase for eligible plans.`,
  },
  {
    title: '6. Intellectual Property',
    content: `All content, features, and functionality of the service are owned by Doughy and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or distribute any part of our service without permission.`,
  },
  {
    title: '7. User Content',
    content: `You retain ownership of content you submit to the service. By submitting content, you grant Doughy a license to use, store, and display that content as necessary to provide the service.`,
  },
  {
    title: '8. Disclaimer of Warranties',
    content: `The service is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free.`,
  },
  {
    title: '9. Limitation of Liability',
    content: `To the maximum extent permitted by law, Doughy shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.`,
  },
  {
    title: '10. Termination',
    content: `We may terminate or suspend your account at any time for violations of these terms. Upon termination, your right to use the service will immediately cease.`,
  },
  {
    title: '11. Changes to Terms',
    content: `We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the service. Continued use of the service after changes constitutes acceptance.`,
  },
  {
    title: '12. Contact Information',
    content: `For questions about these Terms of Service, please contact us at:

Email: legal@doughy.com
Address: 123 Dough Street, San Francisco, CA 94107`,
  },
];

export function TermsScreen() {
  const colors = useThemeColors();
  const lastUpdated = 'January 1, 2025';

  return (
    <View className="flex-1 py-12" style={{ backgroundColor: colors.background }}>
      <View className="px-4 sm:px-6 lg:px-8">
        <View className="max-w-3xl mx-auto">
          <Text className="text-4xl font-bold text-center mb-4" style={{ color: colors.foreground }}>
            Terms of Service
          </Text>
          <Text className="text-center mb-12" style={{ color: colors.mutedForeground }}>
            Last updated: {lastUpdated}
          </Text>

          <Text className="mb-8" style={{ color: colors.foreground }}>
            Please read these Terms of Service carefully before using the Doughy platform operated
            by Doughy, Inc.
          </Text>

          {sections.map((section, index) => (
            <View key={index} className="mb-8">
              <Text className="text-xl font-semibold mb-4" style={{ color: colors.foreground }}>{section.title}</Text>
              <Text className="whitespace-pre-line" style={{ color: colors.mutedForeground }}>{section.content}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
