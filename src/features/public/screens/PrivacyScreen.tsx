// src/features/public/screens/PrivacyScreen.tsx
// Privacy policy page for public website
import { View, Text, ScrollView } from 'react-native';

const sections = [
  {
    title: 'Information We Collect',
    content: `We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This may include:

• Name and contact information
• Account credentials
• Payment information
• Communication preferences
• Any other information you choose to provide`,
  },
  {
    title: 'How We Use Your Information',
    content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Process transactions and send related information
• Send technical notices, updates, and support messages
• Respond to your comments, questions, and requests
• Monitor and analyze trends, usage, and activities
• Detect, investigate, and prevent security incidents`,
  },
  {
    title: 'Information Sharing',
    content: `We do not sell, trade, or otherwise transfer your personal information to outside parties except in the following circumstances:

• With your consent
• To comply with legal obligations
• To protect our rights and safety
• With service providers who assist in our operations
• In connection with a merger, acquisition, or sale of assets`,
  },
  {
    title: 'Data Security',
    content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.`,
  },
  {
    title: 'Your Rights',
    content: `Depending on your location, you may have certain rights regarding your personal information, including:

• Access to your personal data
• Correction of inaccurate data
• Deletion of your data
• Data portability
• Objection to processing
• Withdrawal of consent`,
  },
  {
    title: 'Cookies and Tracking',
    content: `We use cookies and similar tracking technologies to collect and track information about your browsing activity. You can control cookies through your browser settings.`,
  },
  {
    title: 'Changes to This Policy',
    content: `We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.`,
  },
  {
    title: 'Contact Us',
    content: `If you have any questions about this Privacy Policy, please contact us at:

Email: privacy@doughy.com
Address: 123 Dough Street, San Francisco, CA 94107`,
  },
];

export function PrivacyScreen() {
  const lastUpdated = 'January 1, 2025';

  return (
    <View className="flex-1 bg-background py-12">
      <View className="px-4 sm:px-6 lg:px-8">
        <View className="max-w-3xl mx-auto">
          <Text className="text-4xl font-bold text-center text-foreground mb-4">
            Privacy Policy
          </Text>
          <Text className="text-center text-muted-foreground mb-12">
            Last updated: {lastUpdated}
          </Text>

          <Text className="text-foreground mb-8">
            At Doughy, we take your privacy seriously. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use our platform.
          </Text>

          {sections.map((section, index) => (
            <View key={index} className="mb-8">
              <Text className="text-xl font-semibold text-foreground mb-4">{section.title}</Text>
              <Text className="text-muted-foreground whitespace-pre-line">{section.content}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
