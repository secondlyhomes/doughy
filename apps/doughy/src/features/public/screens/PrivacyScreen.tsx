// src/features/public/screens/PrivacyScreen.tsx
// Privacy policy screen — links to full policy on secondlyhomes.com
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

const PRIVACY_URL = 'https://secondlyhomes.com/privacy-policy';

export function PrivacyScreen() {
  const colors = useThemeColors();

  return (
    <View className="flex-1 py-12" style={{ backgroundColor: colors.background }}>
      <View className="px-4 sm:px-6 lg:px-8">
        <View className="max-w-3xl mx-auto">
          <Text className="text-4xl font-bold text-center mb-4" style={{ color: colors.foreground }}>
            Privacy Policy
          </Text>
          <Text className="text-center mb-8" style={{ color: colors.mutedForeground }}>
            Secondly Homes LLC
          </Text>

          <Text className="mb-6 text-base leading-6" style={{ color: colors.foreground }}>
            Our Privacy Policy covers how we collect, use, and protect your information across all
            Secondly services including this app (Doughy), CallPilot, The Claw AI system, and our
            website.
          </Text>

          <Text className="mb-6 text-base leading-6" style={{ color: colors.foreground }}>
            Key points:
          </Text>

          <View className="mb-6">
            {[
              'We do not sell or rent your personal information',
              'AI processes your data only to provide services — never for model training',
              'All AI-generated outbound messages require your approval before sending',
              'SMS: Reply STOP to opt out, HELP for support. Msg & data rates may apply',
              'We will not share your mobile number with third parties for marketing',
              'Your data is stored with Row Level Security — only you can access it',
              'Call recordings are retained per your configurable settings',
            ].map((point, index) => (
              <View key={index} className="flex-row mb-3">
                <Text style={{ color: colors.mutedForeground }}>{'\u2022  '}</Text>
                <Text className="flex-1 text-base" style={{ color: colors.mutedForeground }}>{point}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-center rounded-lg py-4 px-6 mb-6"
            style={{ backgroundColor: colors.primary }}
            onPress={() => Linking.openURL(PRIVACY_URL)}
          >
            <Text className="font-semibold text-base mr-2" style={{ color: colors.primaryForeground }}>
              Read Full Privacy Policy
            </Text>
            <ExternalLink size={18} color={colors.primaryForeground} />
          </TouchableOpacity>

          <Text className="text-center text-sm" style={{ color: colors.mutedForeground }}>
            Questions? Contact us at contact@secondlyhomes.com
          </Text>
        </View>
      </View>
    </View>
  );
}
